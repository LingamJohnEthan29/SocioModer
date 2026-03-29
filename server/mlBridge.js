const axios = require("axios");

async function processMessage(message) {
  try {
    payload = {
        user : message.username,
        message : message.text,
        timestamp : message.timestamp,
    };

    const res = await axios.post("http://localhost:8000/analyze", payload);

    console.log("ML Result:", res.data);

    return res.data;
  } catch (err) {
    console.error("ML error:", err.message);
  }
}

module.exports = { processMessage };