const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = "supersecret"; // later move to env

// ── SIGNUP ─────────────────────────
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
    });

    res.json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// ── LOGIN ──────────────────────────
router.post("/login", async (req, res) => {
  console.log("BODY:", req.body);
  const { username, password } = req.body;

  if (!username ||  !password){
    return res.status(400).json({error:"Missing fields"});
  }
  const user = await User.findOne({ username });

  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  if (user.isBanned){
    return res.status(403).json({error:"You are banned"});
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

module.exports = router;