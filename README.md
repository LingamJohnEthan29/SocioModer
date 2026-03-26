# LiveChat — Real-Time Chat App

A full-stack real-time chat application built with **React**, **Node.js + Express**, and **Socket.io**. Structured cleanly for future ML moderation integration.

---

## Folder Structure

```
chat-app/
├── server/                        # Backend (Node.js + Express + Socket.io)
│   ├── index.js                   # Entry point — HTTP server, Express, Socket.io init
│   ├── socketHandler.js           # All socket event logic (join, message, disconnect)
│   ├── messageFormatter.js        # Message shape factory (extend for ML fields)
│   └── package.json
│
├── client/                        # Frontend (React)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── socket/
│   │   │   ├── socket.js          # Socket.io client singleton
│   │   │   └── useChat.js         # Custom hook — all socket logic
│   │   ├── components/
│   │   │   ├── UsernameGate.jsx   # Login screen
│   │   │   ├── ChatRoom.jsx       # Main layout
│   │   │   ├── MessageList.jsx    # Scrollable message feed
│   │   │   ├── MessageBubble.jsx  # Individual message (user + system)
│   │   │   ├── MessageInput.jsx   # Textarea + send button
│   │   │   ├── Sidebar.jsx        # Online users panel
│   │   │   └── ConnectionBadge.jsx# Socket status indicator
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
│
└── README.md
```

---

## Quick Start

### 1. Start the backend
```bash
cd server
npm install
npm run dev        # uses nodemon for hot-reload
# Server runs on http://localhost:4000
```

### 2. Start the frontend
```bash
cd client
npm install
npm start
# React app runs on http://localhost:3000
```

Open multiple browser tabs and chat between them in real-time.

---

## Features

| Feature | Details |
|---|---|
| Real-time messaging | Socket.io bidirectional events |
| Message history | Sent to new users on join |
| Typing indicators | Debounced, shown to other users |
| System messages | Join / leave notifications |
| Online users list | Live sidebar with user count |
| Connection status | Badge: connected / connecting / error |
| Auto-scroll | Scrolls to latest message automatically |
| Empty message guard | Frontend + backend validation |
| Message timestamps | ISO format, displayed as HH:MM |
| Responsive layout | Sidebar hidden on mobile |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages` | Fetch all stored messages |
| GET | `/api/health` | Server health check |

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `user_join` | `{ username }` | Authenticate and join the room |
| `send_message` | `{ text }` | Send a chat message |
| `typing_start` | — | User started typing |
| `typing_stop` | — | User stopped typing |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `message_history` | `Message[]` | Sent once on join |
| `receive_message` | `Message` | Broadcast to all clients |
| `user_list` | `string[]` | Updated list of usernames |
| `user_typing` | `{ username }` | Someone is typing |
| `user_stop_typing` | `{ username }` | Someone stopped typing |

---

## Message Shape

```js
{
  id:        "msg_1710000000000_1",
  type:      "user" | "system",
  text:      "Hello world",
  username:  "alice",
  socketId:  "abc123",
  timestamp: "2024-03-26T10:00:00.000Z",
  moderation: {           // ← ML hook: populate this in socketHandler.js
    checked: false,
    flagged: false,
    score:   null,
    label:   null,
  }
}
```

---

## Adding ML Moderation (Future)

The code is pre-wired for this. In `server/socketHandler.js`, find:

```js
// ── ML moderation hook ──────────────────────────────────────────────────
// Future: await moderator.classify(message) here.
// If flagged, emit a warning instead of broadcasting.
```

Replace with your classifier, e.g.:

```js
const result = await moderator.classify(message.text);
message.moderation = { checked: true, flagged: result.flagged, score: result.score, label: result.label };
if (result.flagged) {
  socket.emit("message_flagged", { id: message.id, reason: result.label });
  return; // don't broadcast
}
```

---

## Environment Variables

Create `server/.env` for overrides:

```
PORT=4000
```

Create `client/.env` for overrides:

```
REACT_APP_SOCKET_URL=http://localhost:4000
```
