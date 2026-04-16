import React, { useState } from "react";
import UsernameGate from "./components/UsernameGate";
import ChatRoom from "./components/ChatRoom";
import "./styles.css";

export default function App() {
  const [username, setUsername] = useState(null);
  const [roomId, setRoomId] = useState("general"); // 🔥 NEW

  if (!username) {
    return <UsernameGate onJoin={setUsername} />;
  }

  return (
    <div>
      {/* 🔥 Room Selector */}
      <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <label>Room: </label>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="general">General</option>
          <option value="gaming">Gaming</option>
          <option value="study">Study</option>
        </select>
      </div>

      {/* 🔥 Pass roomId to ChatRoom */}
      <ChatRoom username={username} roomId={roomId} />
    </div>
  );
}