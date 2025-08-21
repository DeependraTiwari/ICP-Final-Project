import React, { useEffect, useState } from "react";
import { getMyPosts } from "../api/postCanister";
import { getTransactions } from "../api/tokenCanister";

export default function History() {
  const [posts, setPosts] = useState([]);
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const myPosts = await getMyPosts();
        const myTxs = await getTransactions();
        setPosts(myPosts);
        setTxs(myTxs);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ color: "#0ff", textShadow: "0 0 8px #0ff", marginBottom: "12px" }}>History</h2>

      <div style={{ width: "350px", marginBottom: "24px" }}>
        <h3 style={{ color: "#0ff", textShadow: "0 0 6px #0ff" }}>Your Posts</h3>
        {posts.length === 0 && <p style={{ color: "#aaa" }}>No posts yet.</p>}
        {posts.map((p, idx) => (
          <div key={idx} style={{
            backgroundColor: "#222",
            borderRadius: "12px",
            padding: "10px",
            margin: "6px 0",
            boxShadow: "0 0 10px #0ff"
          }}>
            <p style={{ color: "#0ff", fontWeight: "bold" }}>{p.content}</p>
            {p.image_key && <img src={`/assets/${p.image_key}`} alt="" style={{ width: "100%", marginTop: "6px", borderRadius: "8px" }} />}
            <p style={{ color: "#666", fontSize: "12px" }}>{new Date(p.timestamp / 1e6).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{ width: "350px" }}>
        <h3 style={{ color: "#0ff", textShadow: "0 0 6px #0ff" }}>Your Transactions</h3>
        {txs.length === 0 && <p style={{ color: "#aaa" }}>No transactions yet.</p>}
        {txs.map((tx, idx) => (
          <div key={idx} style={{
            backgroundColor: "#222",
            borderRadius: "12px",
            padding: "10px",
            margin: "6px 0",
            boxShadow: "0 0 10px #0ff"
          }}>
            <p style={{ color: "#0ff", fontWeight: "bold" }}>From: {tx.from}</p>
            <p style={{ color: "#0ff", fontWeight: "bold" }}>To: {tx.to}</p>
            <p style={{ color: "#ccc" }}>Amount: {tx.amount}</p>
            <p style={{ color: "#666", fontSize: "12px" }}>{new Date(tx.timestamp / 1e6).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
