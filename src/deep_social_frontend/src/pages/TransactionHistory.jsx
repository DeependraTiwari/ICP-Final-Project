import React, { useEffect, useState } from 'react';
import { token_canister } from '../canisters/token_canister';
import { useAuth } from '../App';

const TransactionHistory = () => {
  const { profile } = useAuth();
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const res = await token_canister.get_history(profile.user_principal, 0, 50);
    setHistory(res);
  };

  useEffect(() => { loadHistory(); }, []);

  return (
    <div>
      <h2>Transaction History</h2>
      {history.map(tx => (
        <div key={tx.id} style={{ border: '1px solid #ccc', padding: '5px', margin: '5px 0' }}>
          <span>{tx.direction.toUpperCase()}: </span>
          <span>Amount: {tx.amount}</span>
          {tx.counterparty && <span> | With: {tx.counterparty.toText()}</span>}
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
