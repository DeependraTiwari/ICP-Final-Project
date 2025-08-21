import React from "react";
import { useAuth } from "../AuthProvider";

const Header = ({ page, setPage }) => {
  const { user, balance, logout, login } = useAuth();

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800">
      <div className="text-2xl font-bold text-yellow-400 cursor-pointer" onClick={() => setPage("posts")}>
        DeepSocial
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="text-white">Hi, {user.name}</div>
            <div className="text-green-400">Balance: {balance} DTX</div>
            <button
              className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-yellow-500"
              onClick={logout}
            >
              Logout
            </button>
          </>
        )}
        {!user && (
          <button
            className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-yellow-500"
            onClick={login}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
