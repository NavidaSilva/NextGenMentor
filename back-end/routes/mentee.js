const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const { check, validationResult } = require('express-validator');
const axios = require('axios');
const { uploadProfilePicture } = require("../config/multerConfig");

const fs = require('fs');
const path = require('path');

// Middleware to verify JWT
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};


// Complete mentee profile (for Google signup)
router.put('/complete-profile',
  auth,
  uploadProfilePicture.single('profilePicture'),
 [
  check('currentStatus').not().isEmpty().withMessage('Current status is required'),
  check('fieldOfStudy').isArray({ min: 1 }).withMessage('Select at least one field of study'),
  check('mentorType').optional().isArray(),
  check('topics').optional().isArray(),
  check('mentorshipFormat').isIn(['chat', 'video', 'both']).withMessage('Invalid mentorship format'),
  check('goals').optional().isString().trim().isLength({ max: 1000 }).withMessage('Goals must be less than 1000 characters'),
  check('bio').optional().isString().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  check('linkedIn').optional().isURL().withMessage('Invalid LinkedIn URL'),
  check('profilePicture').optional().isString().withMessage('Invalid profile picture URL')  
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const mentee = await Mentee.findById(req.userId);
  if (!mentee) {
    return res.status(404).send({ error: 'Mentee not found' });
  }
     const allowedUpdates = [
      "currentStatus",
      "fieldOfStudy",
      "mentorType",
      "topics",
      "mentorshipFormat",
      "goals",
      "bio",
      "linkedIn",
      "profilePicture"
    ];
 const updates = {
        currentStatus: req.body.currentStatus,
        fieldOfStudy: req.body.fieldOfStudy,
        mentorType: req.body.mentorType || [],
        topics: req.body.topics || [],
        mentorshipFormat: req.body.mentorshipFormat,
        goals: req.body.goals,
        bio: req.body.bio,
        linkedIn: req.body.linkedIn,
      };

      if (req.body.removeProfilePicture === 'true') {
    if (mentee.profilePicture) {
      const oldPicPath = path.join(__dirname, '..', mentee.profilePicture);
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }
    updates.profilePicture = null;
  }

  if (req.file) {
    if (mentee.profilePicture) {
      const oldPicPath = path.join(__dirname, '..', mentee.profilePicture);
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }
    updates.profilePicture = `/uploads/${req.file.filename}`;
  }

  const updatedMentee = await Mentee.findByIdAndUpdate(req.userId, updates, { new: true });
    // generate a fresh token 
const token = jwt.sign(
  { userId: updatedMentee._id, email: updatedMentee.email, role: 'mentee' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

    // send token to frontend
    res.send({ token });

  } catch (error) {
    console.error("Profile update error:", error);
  res.status(400).send({ error: "Failed to update profile" });
  }
});


// GET current mentee
router.get('/me', auth, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.userId).select('-password');
    if (!mentee) {
      return res.status(404).send({ error: 'Mentee not found' });
    }
    res.send(mentee);
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.params.id).select('-password');
    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });
    res.json({ mentee });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post("/suggest-mentors", auth, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.userId);
    if (!mentee) return res.status(404).json({ error: "Mentee not found" });

    const input = {
      topics: req.body.topics || req.body.customTopic || mentee.topics || [],
      mentorshipFormat: req.body.communicationMethod || "both",
      menteeLevel: mentee.currentStatus,
      preferredExperience: req.body.experience,
    };

    // Use the ai-backend service name in Docker
    const fastApiUrl = process.env.AI_BACKEND_URL || "http://ai-backend:8000";
    const response = await axios.post(`${fastApiUrl}/suggest-mentors/`, input);

    // Return the FastAPI response to the frontend
    res.json(response.data);
  } catch (err) {
    console.error("Error suggesting mentors:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;


