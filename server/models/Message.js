const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  roomId: String,
  risk: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);