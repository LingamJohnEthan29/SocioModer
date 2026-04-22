import React, { useState } from "react";
import socket from "../socket/socket";

export default function UsernameGate({ onJoin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username.trim() || !password.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    return true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "http://localhost:4000/api/auth/login"
          : "http://localhost:4000/api/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Signup success → switch to login
      if (mode === "signup") {
        alert("Signup successful! Now login.");
        setMode("login");
        setLoading(false);
        return;
      }

      // Login success
      localStorage.setItem("token", data.token);

      socket.auth = { token: data.token };
      socket.connect();

      onJoin(username.trim());
    } catch (err) {
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="gate-overlay">
      <div className={`gate-card ${shake ? "shake" : ""}`}>
        <div className="gate-icon">💬</div>

        <h1 className="gate-title">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>

        <p className="gate-subtitle">
          {mode === "login"
            ? "Login to continue"
            : "Signup to get started"}
        </p>

        <form onSubmit={handleAuth} className="gate-form">
          <input
            className="gate-input"
            type="text"
            placeholder="Username…"
            value={username}
            maxLength={30}
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="gate-input"
            type="password"
            placeholder="Password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="gate-btn" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login →"
              : "Signup →"}
          </button>
        </form>

        {/* 🔥 Toggle */}
        <p
          style={{
            marginTop: "12px",
            fontSize: "13px",
            color: "#888",
            cursor: "pointer",
          }}
          onClick={() =>
            setMode(mode === "login" ? "signup" : "login")
          }
        >
          {mode === "login"
            ? "New user? Signup"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}