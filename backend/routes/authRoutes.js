const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { ROLES } = require("../config/permissions");

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, initials: user.initials() },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

// POST /api/auth/login  { email, password, role }
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });

    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${mins} minute(s).` });
    }

    const match = await user.comparePassword(password);
    const roleMatches = !role || role === user.role;

    if (!match || !roleMatches) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.failedAttempts = 0;
        await user.save();
        return res.status(423).json({ message: "Invalid credentials. Account locked after 5 failed attempts." });
      }
      await user.save();
      return res.status(401).json({
        message: `Invalid credentials. ${MAX_ATTEMPTS - user.failedAttempts} attempt(s) remaining before lockout.`,
      });
    }

    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, initials: user.initials() },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: { ...req.user.toObject(), initials: req.user.initials() } });
});

module.exports = router;
