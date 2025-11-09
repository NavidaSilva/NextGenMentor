const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const MentorshipRequest = require("../models/MentorshipRequest");
const Notification = require("../models/Notification");
const Mentee = require("../models/Mentee");

// Auth middleware (inline)
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: "Please authenticate." });
  }
};

// POST /rematch
router.post("/", auth, async (req, res) => {
  try {
    const { mentorshipRequestId, reason } = req.body;

    if (!mentorshipRequestId || !reason) {
      return res.status(400).json({ error: "MentorshipRequest ID and reason are required" });
    }

    // 1. Find the mentorship request
    const request = await MentorshipRequest.findById(mentorshipRequestId);
    if (!request) {
      return res.status(404).json({ error: "Mentorship request not found" });
    }

    // 2. Find the mentee (from auth)
    const mentee = await Mentee.findById(req.userId);

    // 3. Notify the old mentor
    await new Notification({
      recipient: request.mentor,
      message: `${mentee.fullName} has requested a rematch. Reason: "${reason}"`,
    }).save();

    // ✅ return the request data back so frontend can use it
    res.status(201).json({
      message: "Rematch submitted, mentor notified",
      request: {
        _id: request._id,
        topic: request.topic,
        mentorshipHeading: request.mentorshipHeading,
        description: request.description,
        communicationMethod: request.communicationMethod,
        learningGoal: request.learningGoal,
      },
    });
  } catch (err) {
    console.error("Error in rematch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
