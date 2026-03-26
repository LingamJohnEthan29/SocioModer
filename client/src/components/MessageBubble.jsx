// client/src/components/MessageBubble.jsx
import React from "react";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message, isMine }) {
  if (message.type === "system") {
    return (
      <div className="msg-system">
        <span>{message.text}</span>
      </div>
    );
  }

  return (
    <div className={`msg-row ${isMine ? "msg-row--mine" : "msg-row--theirs"}`}>
      {!isMine && (
        <div className="msg-avatar">
          {message.username?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className="msg-bubble-wrap">
        {!isMine && (
          <span className="msg-username">{message.username}</span>
        )}
        <div className="msg-bubble">
          <p className="msg-text">{message.text}</p>
          <span className="msg-time">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
