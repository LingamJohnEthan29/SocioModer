// client/src/components/MessageList.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, currentUsername, typingUsers }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const otherTypers = typingUsers.filter((u) => u !== currentUsername);

  return (
    <div className="msg-list">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.username === currentUsername}
        />
      ))}

      {otherTypers.length > 0 && (
        <div className="typing-indicator">
          <span className="typing-dots">
            <span /><span /><span />
          </span>
          <span className="typing-label">
            {otherTypers.join(", ")} {otherTypers.length === 1 ? "is" : "are"} typing…
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
