// server/index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { handleSocketEvents } = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── In-memory message store ─────────────────────────────────────────────────
// Replace this with a database adapter later (e.g. MongoDB, PostgreSQL)
const messageStore = {
  messages: [],

  add(message) {
    this.messages.push(message);
    // Keep last 200 messages in memory
    if (this.messages.length > 200) this.messages.shift();
    return message;
  },

  getAll() {
    return this.messages;
  },
};

// ─── REST endpoints ───────────────────────────────────────────────────────────
// Useful for seeding chat history on page load
app.get("/api/messages", (req, res) => {
  res.json({ messages: messageStore.getAll() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Socket events ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  handleSocketEvents(io, socket, messageStore);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
});
