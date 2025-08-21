import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { user_canister, token_canister } from "./canisters";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [user, setUser] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const auth = await AuthClient.create();
      setAuthClient(auth);

      if (await auth.isAuthenticated()) {
        const identity = auth.getIdentity();
        const principalId = identity.getPrincipal();
        setPrincipal(principalId);

        const prof = await user_canister.ensure_user();
        setUser(prof);

        const bal = await token_canister.balance_of(principalId);
        setBalance(Number(bal));
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async () => {
    await authClient.login({
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const principalId = identity.getPrincipal();
        setPrincipal(principalId);

        const prof = await user_canister.ensure_user();
        setUser(prof);

        const bal = await token_canister.balance_of(principalId);
        setBalance(Number(bal));
      },
    });
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    setPrincipal(null);
    setBalance(0);
  };

  const refreshBalance = async () => {
    if (principal) {
      const bal = await token_canister.balance_of(principal);
      setBalance(Number(bal));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, principal, balance, refreshBalance, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
