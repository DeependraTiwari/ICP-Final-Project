import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { user_canister } from '../canisters/user_canister';
import { token_canister } from '../canisters/token_canister';

const Profile = () => {
  const { profile } = useAuth();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatar, setAvatar] = useState(profile.avatar_key);
  const [balance, setBalance] = useState(0);

  const updateProfile = async () => {
    await user_canister.update_profile(name, email, avatar);
    alert('Profile updated!');
  };

  const loadBalance = async () => {
    const bal = await token_canister.balance_of(profile.user_principal);
    setBalance(bal);
  };

  useEffect(() => { loadBalance(); }, []);

  return (
    <div>
      <h2>My Profile</h2>
      <img src={avatar ? `/assets/${avatar}` : '/assets/profile1.png'} alt="" width="100" />
      <div>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <input value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <input type="file" onChange={e => setAvatar(e.target.files[0].name)} />
      </div>
      <button onClick={updateProfile}>Save</button>
      <div>DTX Balance: {balance}</div>
    </div>
  );
};

export default Profile;
