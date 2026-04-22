// server/index.js
const authRoutes = require("./routes/auth");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { handleSocketEvents } = require("./socketHandler");
const connectDB = require("./db");

const app = express();
const server = http.createServer(app);



// ─── Middleware ─────────────────────────────────────────
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST","PUT","DELETE"],
    credentials:true,
  })
);

app.options("*",cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
// ─── Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── TEMP: In-memory message store (can remove later) ───
const messageStore = {
  messages: [],

  add(message) {
    this.messages.push(message);
    if (this.messages.length > 200) this.messages.shift();
    return message;
  },

  getAll() {
    return this.messages;
  },
};

// ─── REST endpoints ─────────────────────────────────────
app.get("/api/messages", (req, res) => {
  res.json({ messages: messageStore.getAll() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const jwt = require("jsonwebtoken");
const JWT_SECRET = "supersecret";

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  if (token === "admin-secret"){
    console.log("Admin connected");

    socket.user = {
      userId: "admin",
      username: "moderator",
      role: "moderator",
    };
    return next()
;  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // 🔥 attach user to socket
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
// ─── Socket events ──────────────────────────────────────
io.on("connection", (socket) => {
  handleSocketEvents(io, socket, messageStore);
});

// ─── Start Server AFTER DB CONNECTS ─────────────────────
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");

    server.listen(PORT,"127.0.0.1", () => {
      console.log(`🚀 Chat server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to DB error:", err);
  });