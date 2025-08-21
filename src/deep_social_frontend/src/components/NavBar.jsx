import React from "react";

export default function Navbar({ currentPage, setPage }) {
  const buttons = ["Posts", "Create Post", "My Posts", "Transactions", "History", "Profile"];

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-around",
      padding: "12px",
      backgroundColor: "#111",
      borderBottom: "1px solid #444"
    }}>
      {buttons.map((b) => (
        <button
          key={b}
          onClick={() => setPage(b)}
          style={{
            color: currentPage === b ? "#0ff" : "#aaa",
            background: "none",
            border: "none",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            textShadow: currentPage === b ? "0 0 6px #0ff" : "none"
          }}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
