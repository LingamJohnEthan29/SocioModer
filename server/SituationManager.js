const { performance } = require("perf_hooks");

class SituationManager {
  constructor() {
    this.userStates = new Map(); // userId → state
    this.globalMessages = []; // cross-user tracking
  }

  // ── Get or create user state ───────────────────────────────────────────
  getUserState(userId) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        messages: [],
        timestamps: [],
      });
    }
    return this.userStates.get(userId);
  }

  // ── Main update function ───────────────────────────────────────────────
  update(userId, text) {
    const now = performance.now();
    const state = this.getUserState(userId);

    // Store message
    state.messages.push(text);
    state.timestamps.push(now);

    if (state.messages.length > 20) {
      state.messages.shift();
      state.timestamps.shift();
    }

    // Global tracking
    this.globalMessages.push({ userId, text, time: now });
    if (this.globalMessages.length > 200) {
      this.globalMessages.shift();
    }

    // Run detections
    const repetition = this.detectRepetition(state, text);
    const burst = this.detectBurst(state, now);
    const coordination = this.detectCoordination(text);

    return {
      repetitionScore: repetition,
      burstScore: burst,
      coordinationScore: coordination,
    };
  }

  // ── Repetition Detection ───────────────────────────────────────────────
  detectRepetition(state, text) {
    let count = 0;

    for (let msg of state.messages) {
      if (msg === text) count++;
    }

    if (count >= 3) return 1;
    if (count === 2) return 0.5;
    return 0;
  }

  // ── Burst Detection (spam flood) ───────────────────────────────────────
  detectBurst(state, now) {
    const recent = state.timestamps.filter((t) => now - t < 5000); // 5 sec

    if (recent.length >= 6) return 1;
    if (recent.length >= 4) return 0.5;
    return 0;
  }

  // ── Cross-user Coordination Detection ──────────────────────────────────
  detectCoordination(text) {
    let count = 0;

    for (let msg of this.globalMessages) {
      if (msg.text === text) count++;
    }

    if (count >= 5) return 1;
    if (count >= 3) return 0.5;
    return 0;
  }
}

module.exports = SituationManager;