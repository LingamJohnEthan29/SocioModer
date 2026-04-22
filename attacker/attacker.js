const { io } = require("socket.io-client");
const axios = require("axios");

const SERVER_URL = "http://127.0.0.1:4000";
const LOGIN_URL = `${SERVER_URL}/api/auth/login`;
const SIGNUP_URL = `${SERVER_URL}/api/auth/signup`;

// 🔥 CONFIG
const NUM_BOTS = 3;
const ROOMS = ["general", "gaming", "study"];
const MESSAGE_INTERVAL = 1500;

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

// 🔥 HELPERS
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMessage() {
  const rand = Math.random();
  if (rand < 0.6) return random(spamMessages);
  if (rand < 0.85) return random(toxicMessages);
  return random(normalMessages);
}

// 🔥 WAIT FOR SERVER
async function waitForServer() {
  while (true) {
    try {
      await axios.get(`${SERVER_URL}/api/health`);
      console.log("✅ Server is ready");
      break;
    } catch (err) {
      console.log("⏳ Waiting for server...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// 🔥 BOT CLASS
class Bot {
  constructor(id) {
    this.username = `bot_${id}`;
    this.password = "123456";
    this.token = null;
    this.socket = null;
    this.currentRoom = random(ROOMS);
  }

  // 🔐 LOGIN / SIGNUP
  async login() {
  while (true) {
    try {
      // 🔐 Try login
      const res = await axios.post(LOGIN_URL, {
        username: this.username,
        password: this.password,
      });

      this.token = res.data.token;
      console.log(`🔐 ${this.username} logged in`);
      return;

    } catch (err) {
      // 🔥 Server not reachable → retry
      if (err.code === "ECONNREFUSED") {
        console.log(`⏳ Server not reachable for ${this.username}, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      console.log(`⚠️ ${this.username} login failed → trying signup`);

      try {
        await axios.post(SIGNUP_URL, {
          username: this.username,
          password: this.password,
        });

        console.log(`✅ ${this.username} created`);

      } catch (signupErr) {
        // 🔥 Retry if server not reachable
        if (signupErr.code === "ECONNREFUSED") {
          console.log(`⏳ Signup retry (server not reachable)...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (signupErr.response) {
          console.log("❌ Signup error:", signupErr.response.data);
        } else {
          console.log("❌ Signup error:", signupErr.message);
        }
      }

      // retry login again
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

  start() {
    this.socket = io(SERVER_URL, {
      autoConnect: false,
      auth: {
        token: this.token,
      },
      transports: ["websocket"],
    });

    this.socket.connect();

    this.socket.on("connect", () => {
      console.log(`🤖 ${this.username} connected`);

      this.socket.emit("join_room", {
        username: this.username,
        roomId: this.currentRoom,
      });

      this.loop();
    });

    this.socket.on("disconnect", () => {
      console.log(`❌ ${this.username} disconnected`);
    });

    this.socket.on("banned", (data) => {
      console.log(`🚫 ${this.username} banned: ${data.message}`);
      this.socket.disconnect();
    });
  }

  loop() {
    setInterval(() => {
      // 🔁 CROSS-ROOM SWITCH
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

// 🔥 MAIN
async function startBots() {
  await waitForServer(); // 🔥 ensure backend ready

  const bots = [];

  for (let i = 1; i <= NUM_BOTS; i++) {
    const bot = new Bot(i);
    await bot.login();
    bot.start();
    bots.push(bot);
  }
}

startBots();