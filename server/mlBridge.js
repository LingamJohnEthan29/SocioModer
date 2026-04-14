const axios = require("axios");

async function processMessage(message) {
  try {
    const payload = {
      user: message.user || message.username || "unknown",
      message: message.message || message.text || "",
      timestamp: message.timestamp || new Date().toISOString(),
    };

    console.log("SENDING TO ML:", payload); // 🧪 debug

    const res = await axios.post("http://localhost:8000/analyze", payload);

    console.log("ML Result:", res.data);
    return res.data;

  } catch (err) {
    console.error("ML error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { processMessage };