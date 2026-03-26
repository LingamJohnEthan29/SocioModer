// server/socketHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// All Socket.io event logic lives here.
// To add ML moderation: import your moderator and call it inside
// the "send_message" handler before broadcasting.
// ─────────────────────────────────────────────────────────────────────────────

const { formatMessage } = require("./messageFormatter");

// Track connected users: socketId → username
const connectedUsers = new Map();

function handleSocketEvents(io, socket, messageStore) {
  console.log(`🔌 New connection: ${socket.id}`);

  // ── user_join ──────────────────────────────────────────────────────────────
  socket.on("user_join", ({ username }) => {
    if (!username || typeof username !== "string") return;

    const sanitizedUsername = username.trim().slice(0, 30);
    connectedUsers.set(socket.id, sanitizedUsername);

    console.log(`👤 ${sanitizedUsername} joined`);

    // Send message history to the joining user
    socket.emit("message_history", messageStore.getAll());

    // Notify everyone of the updated user list
    io.emit("user_list", getUserList());

    // Broadcast a system join message
    const joinMessage = formatMessage({
      type: "system",
      text: `${sanitizedUsername} joined the chat`,
    });
    messageStore.add(joinMessage);
    io.emit("receive_message", joinMessage);
  });

  // ── send_message ───────────────────────────────────────────────────────────
  socket.on("send_message", ({ text }) => {
    const username = connectedUsers.get(socket.id);
    if (!username) return; // ignore unauthenticated sockets

    // Guard: reject empty or whitespace-only messages
    if (!text || typeof text !== "string" || text.trim() === "") return;

    const message = formatMessage({
      type: "user",
      text: text.trim().slice(0, 500), // cap message length
      username,
      socketId: socket.id,
    });

    // ── ML moderation hook ──────────────────────────────────────────────────
    // Future: await moderator.classify(message) here.
    // If flagged, emit a warning instead of broadcasting.
    // ────────────────────────────────────────────────────────────────────────

    messageStore.add(message);
    io.emit("receive_message", message); // broadcast to ALL clients
    console.log(`💬 [${username}]: ${message.text}`);
  });

  // ── typing indicator ───────────────────────────────────────────────────────
  socket.on("typing_start", () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      socket.broadcast.emit("user_typing", { username });
    }
  });

  socket.on("typing_stop", () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      socket.broadcast.emit("user_stop_typing", { username });
    }
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const username = connectedUsers.get(socket.id);
    if (!username) return;

    connectedUsers.delete(socket.id);
    console.log(`👋 ${username} disconnected`);

    io.emit("user_list", getUserList());

    const leaveMessage = formatMessage({
      type: "system",
      text: `${username} left the chat`,
    });
    messageStore.add(leaveMessage);
    io.emit("receive_message", leaveMessage);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getUserList() {
  return Array.from(connectedUsers.values());
}

module.exports = { handleSocketEvents };
