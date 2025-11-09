const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');

// Auth middleware
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

// DELETE /mentor/delete-account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const deleted = await Mentor.findByIdAndDelete(req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentor account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
