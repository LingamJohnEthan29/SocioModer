import React from "react";
import { useChat } from "../socket/useChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import Sidebar from "./Sidebar";
import ConnectionBadge from "./ConnectionBadge";

export default function ChatRoom({ username, roomId }) {
  // 🔥 PASS roomId HERE
  const {
    messages,
    users,
    status,
    typingUsers,
    sendMessage,
    emitTyping,
  } = useChat(username, roomId);

  const isDisabled = status !== "connected";

  return (
    <div className="chatroom">
      {/* ── Header ── */}
      <header className="chatroom-header">
        <div className="header-left">
          <span className="header-logo">💬</span>
          <h2 className="header-title">LiveChat</h2>
        </div>
        <div className="header-right">
          <span className="header-user">@{username}</span>

          {/* 🔥 SHOW CURRENT ROOM */}
          <span style={{ marginLeft: "10px", fontSize: "12px", opacity: 0.7 }}>
            #{roomId}
          </span>

          <ConnectionBadge status={status} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="chatroom-body">
        <Sidebar users={users} currentUsername={username} />

        <div className="chat-main">
          <MessageList
            messages={messages}
            currentUsername={username}
            typingUsers={typingUsers}
          />
          <MessageInput
            onSend={sendMessage}
            onTyping={emitTyping}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}