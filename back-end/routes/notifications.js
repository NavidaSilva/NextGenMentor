// in a new file routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// auth middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).send({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
};

// GET notifications
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.userId })
    .sort({ createdAt: -1 });

  res.json({ notifications });
});

// optionally mark all as seen
router.post("/mark-seen", auth, async (req, res) => {
  await Notification.updateMany({ recipient: req.userId, seen: false }, { seen: true });
  res.json({ message: "Notifications marked as seen" });
});

module.exports = router;
