import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as token_idl } from '../../../declarations/token_canister/token_canister.did.js';

const agent = new HttpAgent({ host: 'http://localhost:8000' });
export const token_canister = Actor.createActor(token_idl, {
  agent,
  canisterId: 'uzt4z-lp777-77774-qaabq-cai',
});