const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/socioModer");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;