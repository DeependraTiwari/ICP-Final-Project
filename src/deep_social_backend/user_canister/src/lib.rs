use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api;
use ic_cdk_macros::{init, query, update, pre_upgrade, post_upgrade};
use std::collections::HashMap;
use std::cell::RefCell;

// ----- Cross-canister interface to token_canister -----
#[candid::candid_method(update)]
async fn airdrop_for_caller_remote(canister_id: Principal) -> Option<()> {
    use ic_cdk::api::call::call;
    let _: () = call(canister_id, "airdrop_for_caller", ()).await.unwrap_or(());
    Some(())
}

// ----- Types -----
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Profile {
    pub user_principal: Principal,
    pub name: String,
    pub email: String,
    pub avatar_key: Option<String>,
    pub created_at_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SeedUser {
    pub user_principal: Principal,
    pub avatar_key: Option<String>,
    pub name: String,
    pub email: String,    
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct InitArg {
    pub seed_users: Option<Vec<SeedUser>>,
    pub token_canister_id: Option<Principal>,
}

// ----- Thread-local storage -----
thread_local! {
    static TOKEN_CANISTER_ID: RefCell<Principal> = RefCell::new(Principal::anonymous());
    static PROFILES: RefCell<HashMap<Principal, Profile>> = RefCell::new(HashMap::new());
}

// ----- Init with test users -----
#[init]
fn init(arg: Option<InitArg>) {
    let now = ic_cdk::api::time();

    // Default token canister
    let default_token = Principal::from_text("uzt4z-lp777-77774-qaabq-cai").unwrap();

    // Default test users
    let default_users = vec![
        SeedUser {
            user_principal: Principal::from_text("aaaaa-aa").unwrap(),
            name: "Alice".to_string(),
            email: "alice@example.com".to_string(),
            avatar_key: Some("alice_avatar.png".to_string()),
        },
        SeedUser {
            user_principal: Principal::from_text("bbbbb-bb").unwrap(),
            name: "Bob".to_string(),
            email: "bob@example.com".to_string(),
            avatar_key: None,
        },
        SeedUser {
            user_principal: Principal::from_text("ccccc-cc").unwrap(),
            name: "Charlie".to_string(),
            email: "charlie@example.com".to_string(),
            avatar_key: Some("charlie.png".to_string()),
        },
    ];

    // Use InitArg if provided, else default
    let (seed_users, token) = if let Some(arg) = arg {
        let token = arg.token_canister_id.unwrap_or(default_token);
        (arg.seed_users.unwrap_or(default_users), token)
    } else {
        (default_users, default_token)
    };

    // Set token canister
    TOKEN_CANISTER_ID.with(|t| *t.borrow_mut() = token);

    // Insert seed users
    for s in seed_users.iter() {
        PROFILES.with(|p| {
            p.borrow_mut().insert(s.user_principal, Profile {
                user_principal: s.user_principal,
                name: s.name.clone(),
                email: s.email.clone(),
                avatar_key: s.avatar_key.clone(),
                created_at_ns: now,
            });
        });
    }
}

// ----- Pre/Post Upgrade -----
#[pre_upgrade]
fn pre_upgrade() {
    let token = TOKEN_CANISTER_ID.with(|t| *t.borrow());
    let profiles = PROFILES.with(|p| p.borrow().clone());
    ic_cdk::storage::stable_save((token, profiles)).unwrap();
}

#[post_upgrade]
fn post_upgrade() {
    if let Ok((token, profiles)) = ic_cdk::storage::stable_restore::<(Principal, HashMap<Principal, Profile>)>() {
        TOKEN_CANISTER_ID.with(|t| *t.borrow_mut() = token);
        PROFILES.with(|p| *p.borrow_mut() = profiles);
    }
}

// ----- Public API -----
#[update]
async fn ensure_user(default_name: Option<String>, default_email: Option<String>, default_avatar_key: Option<String>) -> Profile {
    let me = ic_cdk::caller();
    let mut exists = false;
    let profile = PROFILES.with(|p| {
        let mut map = p.borrow_mut();
        if let Some(prof) = map.get(&me) {
            exists = true;
            prof.clone()
        } else {
            let prof = Profile {
                user_principal: me,
                name: default_name.unwrap_or_else(|| "New User".into()),
                email: default_email.unwrap_or_else(|| "".into()),
                avatar_key: default_avatar_key,
                created_at_ns: api::time(),
            };
            map.insert(me, prof.clone());
            prof
        }
    });

    if !exists {
        let token = TOKEN_CANISTER_ID.with(|t| *t.borrow());
        let _ = airdrop_for_caller_remote(token).await;
    }

    profile
}

#[update]
fn update_profile(name: Option<String>, email: Option<String>, avatar_key: Option<String>) -> Result<Profile, String> {
    let me = ic_cdk::caller();
    PROFILES.with(|p| {
        let mut map = p.borrow_mut();
        let prof = map.get_mut(&me).ok_or("profile not found")?;
        if let Some(n) = name { prof.name = n; }
        if let Some(e) = email { prof.email = e; }
        if let Some(a) = avatar_key { prof.avatar_key = Some(a); }
        Ok(prof.clone())
    })
}

#[query]
fn get_my_profile() -> Option<Profile> {
    let me = ic_cdk::caller();
    PROFILES.with(|p| p.borrow().get(&me).cloned())
}

#[query]
fn get_profile(principal: Principal) -> Option<Profile> {
    PROFILES.with(|p| p.borrow().get(&principal).cloned())
}

#[query]
fn search_profiles_by_name(q: String, offset: u64, limit: u64) -> Vec<Profile> {
    let mut res: Vec<Profile> = PROFILES.with(|p| {
        p.borrow().values()
            .filter(|prof| prof.name.to_lowercase().contains(&q.to_lowercase()))
            .cloned()
            .collect()
    });
    res.sort_by_key(|p| p.name.clone());
    let start = offset as usize;
    res.into_iter().skip(start).take(limit as usize).collect()
}

// ----- Candid Export -----
ic_cdk::export_candid!();
