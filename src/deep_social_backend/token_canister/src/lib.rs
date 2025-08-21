use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api;
use ic_cdk_macros::{init, query, update, pre_upgrade, post_upgrade};
use std::collections::{HashMap, HashSet};

type Amount = u128;

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Tx {
    id: u64,
    from: Option<Principal>, // mint/airdrop has None
    to: Principal,
    amount: Amount,
    timestamp_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct HistoryEntry {
    id: u64,
    direction: String, // "in" | "out" | "mint"
    counterparty: Option<Principal>,
    amount: Amount,
    timestamp_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct InitAccount {
    owner: Principal,
    amount: Amount,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct InitArg {
    initial_accounts: Vec<InitAccount>,
    airdrop_amount: Amount,
}

thread_local! {
    static NAME: std::cell::RefCell<String> = std::cell::RefCell::new("DeepToken".to_string());
    static SYMBOL: std::cell::RefCell<String> = std::cell::RefCell::new("DTX".to_string());
    static BALANCES: std::cell::RefCell<HashMap<Principal, Amount>> = std::cell::RefCell::new(HashMap::new());
    static TXS: std::cell::RefCell<Vec<Tx>> = std::cell::RefCell::new(Vec::new());
    static AIRDROPPED: std::cell::RefCell<HashSet<Principal>> = std::cell::RefCell::new(HashSet::new());
    static AIRDROP_AMOUNT: std::cell::RefCell<Amount> = std::cell::RefCell::new(1000);
}

#[init]
fn init(arg: Option<InitArg>) {
    if let Some(cfg) = arg {
        AIRDROP_AMOUNT.with(|a| *a.borrow_mut() = cfg.airdrop_amount);
        for acc in cfg.initial_accounts.iter() {
            internal_mint(None, acc.owner, acc.amount);
        }
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    let name = NAME.with(|x| x.borrow().clone());
    let symbol = SYMBOL.with(|x| x.borrow().clone());
    let balances = BALANCES.with(|m| m.borrow().clone());
    let txs = TXS.with(|v| v.borrow().clone());
    let airdropped = AIRDROPPED.with(|s| s.borrow().clone());
    let airdrop_amount = AIRDROP_AMOUNT.with(|a| *a.borrow());
    ic_cdk::storage::stable_save((name, symbol, balances, txs, airdropped, airdrop_amount)).unwrap();
}

#[post_upgrade]
fn post_upgrade() {
    if let Ok((name, symbol, balances, txs, airdropped, airdrop_amount)) = ic_cdk::storage::stable_restore::<(String, String, HashMap<Principal, Amount>, Vec<Tx>, HashSet<Principal>, Amount)>() {
        NAME.with(|x| *x.borrow_mut() = name);
        SYMBOL.with(|x| *x.borrow_mut() = symbol);
        BALANCES.with(|m| *m.borrow_mut() = balances);
        TXS.with(|v| *v.borrow_mut() = txs);
        AIRDROPPED.with(|s| *s.borrow_mut() = airdropped);
        AIRDROP_AMOUNT.with(|a| *a.borrow_mut() = airdrop_amount);
    }
}

fn internal_mint(from: Option<Principal>, to: Principal, amount: Amount) {
    BALANCES.with(|b| {
        let mut m = b.borrow_mut();
        *m.entry(to).or_insert(0) += amount;
    });
    TXS.with(|v| {
        let mut vec = v.borrow_mut();
        let id = vec.len() as u64 + 1;
        vec.push(Tx { id, from, to, amount, timestamp_ns: api::time() });
    });
}

// --- Public API ---

#[query]
fn name() -> String { NAME.with(|x| x.borrow().clone()) }

#[query]
fn symbol() -> String { SYMBOL.with(|x| x.borrow().clone()) }

#[query]
fn balance_of(owner: Principal) -> Amount {
    BALANCES.with(|b| *b.borrow().get(&owner).unwrap_or(&0))
}

#[update]
fn transfer(to: Principal, amount: Amount) -> Result<Tx, String> {
    let from = ic_cdk::caller();
    if amount == 0 {
        return Err("amount must be > 0".into());
    }
    BALANCES.with(|b| {
        let mut m = b.borrow_mut();
        let from_bal = m.get(&from).copied().unwrap_or(0);
        if from_bal < amount { return Err::<(), String>("insufficient balance".to_string());  }
        m.insert(from, from_bal - amount);
        *m.entry(to).or_insert(0) += amount;
        Ok(())
    })?;

    let tx = TXS.with(|v| {
        let mut vec = v.borrow_mut();
        let id = vec.len() as u64 + 1;
        let tx = Tx { id, from: Some(from), to, amount, timestamp_ns: api::time() };
        vec.push(tx.clone());
        tx
    });
    Ok(tx)
}

/// First-time caller gets an airdrop (once).
#[update]
fn airdrop_for_caller() -> Option<Tx> {
    let who = ic_cdk::caller();
    let already = AIRDROPPED.with(|s| s.borrow().contains(&who));
    if already { return None; }
    AIRDROPPED.with(|s| { s.borrow_mut().insert(who); });
    let amt = AIRDROP_AMOUNT.with(|a| *a.borrow());
    internal_mint(None, who, amt);
    Some(TXS.with(|v| v.borrow().last().cloned().unwrap()))
}

#[query]
fn get_history(owner: Principal, offset: u64, limit: u64) -> Vec<HistoryEntry> {
    TXS.with(|v| {
        let mut res: Vec<HistoryEntry> = v.borrow().iter().filter_map(|tx| {
            if tx.to == owner {
                Some(HistoryEntry {
                    id: tx.id,
                    direction: if tx.from.is_none() { "mint".into() } else { "in".into() },
                    counterparty: tx.from,
                    amount: tx.amount,
                    timestamp_ns: tx.timestamp_ns,
                })
            } else if tx.from == Some(owner) {
                Some(HistoryEntry {
                    id: tx.id,
                    direction: "out".into(),
                    counterparty: Some(tx.to),
                    amount: tx.amount,
                    timestamp_ns: tx.timestamp_ns,
                })
            } else { None }
        }).collect();
        res.sort_by_key(|e| std::cmp::Reverse(e.timestamp_ns));
        let start = offset as usize;
        res.into_iter().skip(start).take(limit as usize).collect()
    })
}

ic_cdk::export_candid!();
