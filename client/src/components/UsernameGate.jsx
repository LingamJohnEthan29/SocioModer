// client/src/components/UsernameGate.jsx
import React, { useState } from "react";

export default function UsernameGate({ onJoin }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onJoin(value.trim());
  };

  return (
    <div className="gate-overlay">
      <div className={`gate-card ${shake ? "shake" : ""}`}>
        <div className="gate-icon">💬</div>
        <h1 className="gate-title">Join the Chat</h1>
        <p className="gate-subtitle">Pick a username to get started</p>
        <form onSubmit={handleSubmit} className="gate-form">
          <input
            className="gate-input"
            type="text"
            placeholder="Your username…"
            value={value}
            maxLength={30}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="gate-btn" type="submit">
            Enter Room →
          </button>
        </form>
      </div>
    </div>
  );
}
