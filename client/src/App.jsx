// client/src/App.jsx
import React, { useState } from "react";
import UsernameGate from "./components/UsernameGate";
import ChatRoom from "./components/ChatRoom";
import "./styles.css";

export default function App() {
  const [username, setUsername] = useState(null);

  return username ? (
    <ChatRoom username={username} />
  ) : (
    <UsernameGate onJoin={setUsername} />
  );
}
