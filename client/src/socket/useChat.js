// client/src/socket/useChat.js
// ─────────────────────────────────────────────────────────────────────────────
// All socket logic is encapsulated here so components stay pure UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import socket from "./socket";

export function useChat(username) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected | error
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);

  // ── Connect / disconnect lifecycle ────────────────────────────────────────
  useEffect(() => {
    if (!username) return;

    setStatus("connecting");
    socket.connect();
    socket.emit("user_join", { username });

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socket.on("message_history", (history) => setMessages(history));
    socket.on("receive_message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on("user_list", (list) => setUsers(list));
    socket.on("user_typing", ({ username: u }) =>
      setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]))
    );
    socket.on("user_stop_typing", ({ username: u }) =>
      setTypingUsers((prev) => prev.filter((x) => x !== u))
    );

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_list");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.disconnect();
    };
  }, [username]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;
      socket.emit("send_message", { text });
      socket.emit("typing_stop");
    },
    []
  );

  const emitTyping = useCallback(() => {
    socket.emit("typing_start");
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket.emit("typing_stop"),
      2000
    );
  }, []);

  return { messages, users, status, typingUsers, sendMessage, emitTyping };
}
