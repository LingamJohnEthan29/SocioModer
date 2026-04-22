// test.js
const axios = require("axios");

axios.get("http://localhost:4000/api/health")
  .then(res => console.log("✅ WORKS:", res.data))
  .catch(err => console.log("❌ FAIL:", err.message));