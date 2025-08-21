import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as post_idl } from '../../../declarations/post_canister/post_canister.did.js';

const agent = new HttpAgent({ host: 'http://localhost:8000' });
export const post_canister = Actor.createActor(post_idl, {
  agent,
  canisterId: 'umunu-kh777-77774-qaaca-cai',
});
