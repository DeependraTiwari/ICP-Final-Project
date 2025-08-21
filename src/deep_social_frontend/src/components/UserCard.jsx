import React from "react";

export default function UserCard({ user }) {
  return (
    <div style={{
      backgroundColor: "#222",
      borderRadius: "12px",
      padding: "12px",
      margin: "8px",
      boxShadow: "0 0 12px #0ff",
      textAlign: "center",
      width: "200px"
    }}>
      <img
        src={`/assets/${user.avatar}`}
        alt={user.name}
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          marginBottom: "8px",
          border: "2px solid #0ff"
        }}
      />
      <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0ff" }}>{user.name}</h3>
      <p style={{ fontSize: "12px", color: "#ccc" }}>{user.email}</p>
      <p style={{ fontSize: "10px", color: "#666" }}>{user.principal}</p>
    </div>
  );
}
