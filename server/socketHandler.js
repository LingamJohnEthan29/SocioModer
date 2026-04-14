// server/socketHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// All Socket.io event logic lives here.
// To add ML moderation: import your moderator and call it inside
// the "send_message" handler before broadcasting.
// ─────────────────────────────────────────────────────────────────────────────

const { formatMessage } = require("./messageFormatter");
const { processMessage } = require("./mlBridge");
const SituationManager = require("./SituationManager");
const { computeRisk, decideAction } = require('./riskEngine');
const situationManager = new SituationManager();
const ClusterManager = require('./ClusterManager');
const clusterManager = new ClusterManager();

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
  socket.on("join_dashboard", () => {
  console.log("🛡 Moderator dashboard connected");
  socket.join("moderators");
});

  // ── send_message ───────────────────────────────────────────────────────────
  socket.on("send_message", async ({ text }) => {
    const username = connectedUsers.get(socket.id);
    if (!username) return; // ignore unauthenticated sockets

    // Guard: reject empty or whitespace-only messages
    if (!text || typeof text !== "string" || text.trim() === "") return;

    const cleanText = text.trim().slice(0,500);
    const message = formatMessage({
      type: "user",
      text: cleanText, // cap message length
      username,
      socketId: socket.id,
    });
    
    const situation = situationManager.update(socket.id, cleanText);

    let mlResult = {};
    try{
      mlResult = await processMessage({
        user:username,
        message:cleanText,
        timestamp: new Date().toISOString()
      });
    }catch(err){
      console.error("ML Error: ", err);
    }
    const finalRisk = computeRisk(mlResult,situation);
    const action = decideAction(finalRisk);
    const cluster = clusterManager.addMessage({
      user:username,
      message:cleanText,
      risk:finalRisk,
      mlResult,
    })
    io.to("moderators").emit("moderation_event", {
  clusterId: cluster.id,
  type: cluster.type,
  users: Array.from(cluster.users),
  messages: cluster.messages,
  count: cluster.count,
  risk: cluster.risk,
  action,
  timestamp: new Date().toISOString(),
});
console.log("📡 CLUSTER EMIT:", {
  clusterId: cluster.id,
  count: cluster.count,
});

    console.log("Situation is now", situation);
    console.log("ML decided", mlResult);
    console.log("Final Risk given : ", finalRisk,"| Action:",action);

    console.log({
    situation,
    mlResult,
    finalRisk,
    action
    });

    if (action === "BLOCK"){
      socket.emit("receive_message", {
      type: "system",
      text: "🚫 Message blocked (high risk)",
    });
    return;
    }
    if (action === "WARN") {
      socket.emit("receive_message", {
      type: "system",
      text: "⚠️ Warning: your message may violate guidelines",
    });
  }
  messageStore.add({ ...message, risk: finalRisk });
  io.emit("receive_message", { ...message, risk: finalRisk });
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
