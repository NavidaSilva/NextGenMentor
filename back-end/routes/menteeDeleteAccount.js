const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');

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

router.delete('/delete-account', auth, async (req, res) => {
  try {
    const deleted = await Mentee.findByIdAndDelete(req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Mentee not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentee account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
