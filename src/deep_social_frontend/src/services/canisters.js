import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as user_idl } from "../deep_social_backend/src/user_canister/user_canister.did.js";
import { idlFactory as post_idl } from "../deep_social_backend/src/post_canister/post_canister.did.js";
import { idlFactory as token_idl } from "../deep_social_backend/src/token_canister/token_canister.did.js";

const localHost = "http://localhost:8000";

const agent = new HttpAgent({ host: localHost });
agent.fetchRootKey();

export const user_canister = Actor.createActor(user_idl, {
  agent,
  canisterId: "YOUR_USER_CANISTER_ID",
});

export const post_canister = Actor.createActor(post_idl, {
  agent,
  canisterId: "YOUR_POST_CANISTER_ID",
});

export const token_canister = Actor.createActor(token_idl, {
  agent,
  canisterId: "YOUR_TOKEN_CANISTER_ID",
});
