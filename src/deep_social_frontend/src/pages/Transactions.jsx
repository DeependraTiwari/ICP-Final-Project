import React, { useState } from 'react';
import { token_canister } from '../canisters/token_canister';
import { user_canister } from '../canisters/user_canister';

const Transactions = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [amount, setAmount] = useState('');

  const handleSearch = async () => {
    const res = await user_canister.search_profiles_by_name(search, 0, 10);
    setResults(res);
  };

  const handleTransfer = async (to) => {
    if (!amount) return;
    await token_canister.transfer(to, Number(amount));
    alert('Sent DTX!');
  };

  return (
    <div>
      <h2>Send DeepToken (DTX)</h2>
      <input placeholder="Search user" value={search} onChange={e => setSearch(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
      <div>
        {results.map(u => (
          <div key={u.user_principal.toText()}>
            {u.name} ({u.email})
            <button onClick={() => handleTransfer(u.user_principal)}>Send</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
