import { useState, useEffect, useCallback, useRef } from "react";
import socket from "./socket";

export function useChat(username, roomId) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!username || !roomId) return;

    setStatus("connecting");
    socket.connect();

    socket.on("connect", () => {
      setStatus("connected");

      // 🔥 JOIN ROOM AFTER CONNECT
      socket.emit("join_room", { username, roomId });
    });

    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socket.on("message_history", (history) => setMessages(history));

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_list", (list) => setUsers(list));

    socket.on("user_typing", ({ username: u }) => {
      setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));
    });

    socket.on("user_stop_typing", ({ username: u }) => {
      setTypingUsers((prev) => prev.filter((x) => x !== u));
    });

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
  }, [username, roomId]);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;

      // 🔥 SEND MESSAGE WITH ROOM CONTEXT
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