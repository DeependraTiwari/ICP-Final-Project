import React, { useEffect, useState, createContext, useContext } from "react";
import CreatePost from "./pages/CreatePost";
import Posts from "./pages/Posts";
import MyPosts from "./pages/MyPosts";
import Transactions from "./pages/Transactions";
import TransactionHistory from "./pages/TransactionHistory";
import Profile from "./pages/Profile";
import { user_canister } from "../../declarations/user_canister";

// ----- Auth Context -----
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);

  const login = async () => {
    // Ensure user exists and trigger airdrop if first time
    const prof = await user_canister.ensure_user({});
    setProfile(prof);
  };

  const logout = () => {
    setProfile(null);
  };

  useEffect(() => {
    login();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ----- Main App -----
const App = () => {
  const [page, setPage] = useState("posts");
  const { profile } = useAuth();

  if (!profile) return <div>Loading user...</div>;

  const renderPage = () => {
    switch (page) {
      case "create": return <CreatePost />;
      case "posts": return <Posts />;
      case "myposts": return <MyPosts />;
      case "transactions": return <Transactions />;
      case "history": return <TransactionHistory />;
      case "profile": return <Profile />;
      default: return <Posts />;
    }
  };

  return (
    <div>
      <header className="app-header">
        <h1>DeepToken Social</h1>
        <nav>
          <button className="nav-btn" onClick={() => setPage("create")}>Create Post</button>
          <button className="nav-btn" onClick={() => setPage("posts")}>Posts</button>
          <button className="nav-btn" onClick={() => setPage("myposts")}>My Posts</button>
          <button className="nav-btn" onClick={() => setPage("transactions")}>Transactions</button>
          <button className="nav-btn" onClick={() => setPage("history")}>History</button>
          <button className="nav-btn" onClick={() => setPage("profile")}>Profile</button>
        </nav>
      </header>

      <main className="app-main">
        {renderPage()}
      </main>

      <footer className="app-footer">
        <span>Logged in as: {profile.name}</span>
      </footer>
    </div>
  );
};

// ----- Export wrapped in AuthProvider -----
export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);
