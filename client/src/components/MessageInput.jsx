// client/src/components/MessageInput.jsx
import React, { useState } from "react";

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState("");

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <textarea
        className="input-field"
        placeholder="Type a message… (Enter to send)"
        value={text}
        rows={1}
        maxLength={500}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button
        className="send-btn"
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
