const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};



// GET mentee privacy settings
router.get('/mentee/privacy', auth, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.userId).select('emailVisibility');
    if (!mentee) return res.status(404).json({ error: "Mentee not found" });
    res.json({
      emailVisibility: mentee.emailVisibility,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update mentee privacy settings
router.put('/mentee/privacy', auth, async (req, res) => {
  try {
    const { emailVisibility } = req.body;

    const updateFields = {
      ...(emailVisibility !== undefined && { emailVisibility }),
    };

    const mentee = await Mentee.findByIdAndUpdate(req.userId, updateFields, { new: true });

    if (!mentee) return res.status(404).json({ error: "Mentee not found" });

    res.json({ message: "Privacy settings updated", emailVisibility: mentee.emailVisibility });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});



router.get('/mentor/privacy', auth, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.userId).select('emailVisibility');

    if (!mentor) return res.status(404).json({ error: "Mentor not found" });
    res.json({
      emailVisibility: mentor.emailVisibility,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update mentor privacy settings
router.put('/mentor/privacy', auth, async (req, res) => {
  try {
    const { emailVisibility } = req.body;

    const updateFields = {
      ...(emailVisibility !== undefined && { emailVisibility }),
    };

    const mentor = await Mentor.findByIdAndUpdate(req.userId, updateFields, { new: true });

    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    res.json({ message: "Privacy settings updated", emailVisibility: mentor.emailVisibility });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
