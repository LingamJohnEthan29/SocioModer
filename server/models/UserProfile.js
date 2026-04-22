const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: String,
  username: String,

  messageCount: { type: Number, default: 0 },
  spamCount: { type: Number, default: 0 },
  toxicCount: { type: Number, default: 0 },

  riskScore: { type: Number, default: 0 },

  roomsUsed: [String],

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserProfile", profileSchema);