const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:4000";

// 🔥 CONFIG
const NUM_BOTS = 5;
const ROOMS = ["general", "gaming", "study"];
const MESSAGE_INTERVAL = 1000; // ms

// 🔥 MESSAGE POOLS
const spamMessages = [
  "buy now",
  "limited offer",
  "click this link",
  "free money",
  "earn fast $$$",
];

const toxicMessages = [
  "i hate you",
  "you are stupid",
  "idiot",
  "loser",
];

const normalMessages = [
  "hello everyone",
  "nice chat",
  "how are you",
  "good morning",
];

// 🔥 RANDOM HELPERS
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMessage() {
  const rand = Math.random();

  if (rand < 0.6) return random(spamMessages);   // 60% spam
  if (rand < 0.85) return random(toxicMessages); // 25% toxic
  return random(normalMessages);                 // 15% normal
}

// 🔥 BOT CLASS
class Bot {
  constructor(id) {
    this.username = `bot_${id}`;
    this.socket = io(SERVER_URL, { autoConnect: false });
    this.currentRoom = random(ROOMS);
  }

  start() {
    this.socket.connect();

    this.socket.on("connect", () => {
      console.log(`🤖 ${this.username} connected`);

      // Join initial room
      this.socket.emit("join_room", {
        username: this.username,
        roomId: this.currentRoom,
      });

      this.loop();
    });
  }

  loop() {
    setInterval(() => {
      // 🔥 RANDOMLY SWITCH ROOMS (CROSS-ROOM ATTACK)
      if (Math.random() < 0.3) {
        this.currentRoom = random(ROOMS);

        this.socket.emit("join_room", {
          username: this.username,
          roomId: this.currentRoom,
        });

        console.log(`🔁 ${this.username} switched to ${this.currentRoom}`);
      }

      const msg = getMessage();

      this.socket.emit("send_message", {
        text: msg,
      });

      console.log(`💬 ${this.username} [${this.currentRoom}]: ${msg}`);
    }, MESSAGE_INTERVAL);
  }
}

// 🔥 START ALL BOTS
for (let i = 1; i <= NUM_BOTS; i++) {
  const bot = new Bot(i);
  bot.start();
}