import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as user_idl } from '../../../declarations/user_canister/user_canister.did.js';

const agent = new HttpAgent({ host: 'http://localhost:8000' });
export const user_canister = Actor.createActor(user_idl, {
  agent,
  canisterId: 'uxrrr-q7777-77774-qaaaq-cai',
});
