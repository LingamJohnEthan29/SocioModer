// client/src/socket/socket.js
// ─────────────────────────────────────────────────────────────────────────────
// Single socket instance shared across the entire app.
// Import this wherever you need socket access — never create multiple instances.
// ─────────────────────────────────────────────────────────────────────────────

import { io } from "socket.io-client";

const SOCKET_URL =
 "http://172.20.9.66:4000";

const socket = io(SOCKET_URL, {
  autoConnect: false,   // we connect manually after username is set
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
