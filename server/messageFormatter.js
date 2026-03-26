// server/messageFormatter.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralises message shape. Extend this to add moderation fields,
// message IDs for edit/delete, reactions, etc.
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require("crypto").webcrypto
  ? (() => {
      try {
        return require("crypto");
      } catch {
        return null;
      }
    })()
  : require("crypto");

let counter = 0;

/**
 * @param {object} opts
 * @param {'user'|'system'} opts.type
 * @param {string} opts.text
 * @param {string} [opts.username]
 * @param {string} [opts.socketId]
 * @returns {Message}
 */
function formatMessage({ type, text, username = null, socketId = null }) {
  return {
    id: `msg_${Date.now()}_${++counter}`,
    type,          // 'user' | 'system'
    text,
    username,
    socketId,
    timestamp: new Date().toISOString(),
    // moderation fields (to be populated by ML layer later)
    moderation: {
      checked: false,
      flagged: false,
      score: null,
      label: null,
    },
  };
}

module.exports = { formatMessage };
