const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const MentorshipRequest = require("../models/MentorshipRequest");
const Notification = require("../models/Notification");
const Mentor = require("../models/Mentor");
const Mentee = require("../models/Mentee");

// Inline auth middleware
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

// POST /decline
router.post("/", auth, async (req, res) => {
  try {
    const { mentorshipRequestId, reason } = req.body;
    if (!mentorshipRequestId || !reason) {
      return res.status(400).json({ error: "MentorshipRequest ID and reason are required" });
    }

    // 1. Find mentorship request
    const request = await MentorshipRequest.findById(mentorshipRequestId);
    if (!request) {
      return res.status(404).json({ error: "Mentorship request not found" });
    }

    // 2. Find the mentor (from auth)
    const mentor = await Mentor.findById(req.userId);

    // 3. Notify the mentee
    await new Notification({
      recipient: request.mentee,
      message: `${mentor.fullName} has declined your mentorship request. Reason: "${reason}"`,
    }).save();

    res.status(201).json({
      message: "Decline submitted, mentee notified",
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
    console.error("Error in decline:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
