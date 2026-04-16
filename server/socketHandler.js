const { formatMessage } = require("./messageFormatter");
const { processMessage } = require("./mlBridge");
const SituationManager = require("./SituationManager");
const { computeRisk, decideAction } = require("./riskEngine");
const ClusterManager = require("./ClusterManager");
const roomSituations = new Map();
const roomClusters = new Map();
const userProfiles = new Map(); // userId → profile
// Track connected users
const connectedUsers = new Map();
const userRoomActivity = new Map();

function handleSocketEvents(io, socket, messageStore) {
  console.log(`🔌 New connection: ${socket.id}`);

  // ── JOIN ROOM ─────────────────────────────────────────
  socket.on("join_room", ({ username, roomId }) => {
    if (!username || !roomId) return;

    const sanitizedUsername = username.trim().slice(0, 30);

    socket.join(roomId);

    connectedUsers.set(socket.id, {
      userId: socket.id,
      username: sanitizedUsername,
      roomId,
    });

    console.log(`👤 ${sanitizedUsername} joined room ${roomId}`);

    // Send only this room's history
    const roomMessages = messageStore
      .getAll()
      .filter((m) => m.roomId === roomId);

    socket.emit("message_history", roomMessages);

    // Send user list for this room
    io.to(roomId).emit("user_list", getUsersInRoom(roomId));

    const joinMessage = formatMessage({
      type: "system",
      text: `${sanitizedUsername} joined ${roomId}`,
    });

    messageStore.add({ ...joinMessage, roomId });

    io.to(roomId).emit("receive_message", joinMessage);
  });

  // ── DASHBOARD CONNECT ─────────────────────────────────
  socket.on("join_dashboard", () => {
    console.log("🛡 Moderator dashboard connected");
    socket.join("moderators");
  });

  // ── SEND MESSAGE ──────────────────────────────────────
  socket.on("send_message", async ({ text }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, roomId } = user;

    if (!userRoomActivity.has(socket.id)) {
  userRoomActivity.set(socket.id, new Set());
}

userRoomActivity.get(socket.id).add(roomId);


    if (!userProfiles.has(socket.id)) {
  userProfiles.set(socket.id, {
    userId: socket.id,
    username,
    messageCount: 0,
    toxicCount: 0,
    spamCount: 0,
    lastMessages: [],
    riskScore: 0,
  });
}

const profile = userProfiles.get(socket.id);

    if (!text || typeof text !== "string" || text.trim() === "") return;

    const cleanText = text.trim().slice(0, 500);

    const message = formatMessage({
      type: "user",
      text: cleanText,
      username,
      socketId: socket.id,
    });

    if (!roomSituations.has(roomId)){
      roomSituations.set(roomId,new SituationManager());
    }
    if(!roomClusters.has(roomId)){
      roomClusters.set(roomId,new ClusterManager());
    }

    const situationManager = roomSituations.get(roomId);
    const clusterManager = roomClusters.get(roomId);

    const situation = situationManager.update(socket.id, cleanText);


    let mlResult = {};
    try {
      mlResult = await processMessage({
        user: username,
        message: cleanText,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("ML Error:", err);
    }
    profile.messageCount++;

profile.toxicCount += mlResult.toxic || 0;
profile.spamCount += mlResult.spam || 0;

profile.lastMessages.push(cleanText);
if (profile.lastMessages.length > 5) {
  profile.lastMessages.shift();
}
const spamRate = profile.spamCount / profile.messageCount;
const toxicRate = profile.toxicCount / profile.messageCount;

profile.riskScore =
  0.4 * spamRate +
  0.4 * toxicRate +
  0.2 * (situation.repetitionScore || 0);
  let userFlag = "NORMAL";

const roomsUsed = userRoomActivity.get(socket.id);
const roomCount = roomsUsed.size;

let crossRoomFlag = null;

if (roomCount >= 3 && profile.riskScore > 0.5) {
  crossRoomFlag = "🚨 CROSS-ROOM ATTACKER";
} else if (roomCount >= 2 && profile.riskScore > 0.4) {
  crossRoomFlag = "⚠️ MULTI-ROOM SPAMMER";
}

if (profile.riskScore > 0.7) {
  userFlag = "🚨 HIGH RISK USER";
} else if (profile.riskScore > 0.4) {
  userFlag = "⚠️ SUSPICIOUS USER";
}

    const finalRisk = computeRisk(mlResult, situation);
    const action = decideAction(finalRisk);

    const cluster = clusterManager.addMessage({
      user: username,
      message: cleanText,
      risk: finalRisk,
      mlResult,
    });

    // Send to dashboard
    io.to("moderators").emit("moderation_event", {
      roomId, // 🔥 ADD THIS
  clusterId: cluster.id,
  type: cluster.type,
  users: Array.from(cluster.users),
  messages: cluster.messages,
  count: cluster.count,
  risk: cluster.risk,
  action,
  isAttack: cluster.isAttack,
  coordinationScore: cluster.coordinationScore,
  userProfile: {
    username: profile.username,
    messageCount: profile.messageCount,
    spamRate,
    toxicRate,
    riskScore: profile.riskScore,
    flag: userFlag,
    roomsUsed: Array.from(roomsUsed), // 🔥 NEW
    crossRoomFlag, // 🔥 NEW
  },
  timestamp: new Date().toISOString(),
    });

    console.log("📡 CLUSTER EMIT:", {
      roomId,
      clusterId: cluster.id,
      count: cluster.count,
    });

    if (action === "BLOCK") {
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

    // Save message WITH roomId
    messageStore.add({ ...message, risk: finalRisk, roomId });

    // Send ONLY to that room
    io.to(roomId).emit("receive_message", {
      ...message,
      risk: finalRisk,
    });
  });

  // ── TYPING START ──────────────────────────────────────
  socket.on("typing_start", () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, roomId } = user;

    socket.to(roomId).emit("user_typing", { username });
  });

  // ── TYPING STOP ───────────────────────────────────────
  socket.on("typing_stop", () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, roomId } = user;

    socket.to(roomId).emit("user_stop_typing", { username });
  });

  // ── DISCONNECT ────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, roomId } = user;

    connectedUsers.delete(socket.id);

    console.log(`👋 ${username} disconnected`);

    io.to(roomId).emit("user_list", getUsersInRoom(roomId));

    const leaveMessage = formatMessage({
      type: "system",
      text: `${username} left the chat`,
    });

    messageStore.add({ ...leaveMessage, roomId });

    io.to(roomId).emit("receive_message", leaveMessage);
  });
}

// ── HELPERS ─────────────────────────────────────────────
function getUsersInRoom(roomId) {
  return Array.from(connectedUsers.values())
    .filter((u) => u.roomId === roomId)
    .map((u) => u.username);
}

module.exports = { handleSocketEvents };