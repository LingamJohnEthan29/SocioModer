// server/socketHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// All Socket.io event logic lives here.
// To add ML moderation: import your moderator and call it inside
// the "send_message" handler before broadcasting.
// ─────────────────────────────────────────────────────────────────────────────

const { formatMessage } = require("./messageFormatter");
const { processMessage } = require("./mlBridge");
let recentMessages = [];

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
  socket.on("send_message", async ({ text }) => {
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
    recentMessages.push(message);
    
    if (recentMessages.length > 10){
      recentMessages.shift();
    }
    const similarMessages = recentMessages.filter(
      (m) => m.text === message.text
    );
    if(similarMessages.length >= 3){
      io.emit("receive_message",{
        type:"system",
        text:"Possible spam campaign detected"
      });
    }
    // ── ML moderation hook ──────────────────────────────────────────────────
    let result = null;
    try{
      result = await processMessage(message);
      console.log("ML Result:", result);

      if (result && result.type === "spam"){
      io.emit("receive_message",{
        type:"system",
        text:`Spam detected from ${username}`,
      });
      return;
    }
    }
    catch(err){
      console.error("ML failed: ",err.message);
    }
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
