const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');


const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role; 
    next();
  } catch {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};


router.post('/', auth, async (req, res) => {
  try {
    if (req.role !== 'mentee') {
      return res.status(403).send({ error: 'Only mentees can rate mentors' });
    }

    const { mentorId, rating, sessionId } = req.body;

    if (!mentorId || !rating || rating < 1 || rating > 5) {
      return res.status(400).send({ error: 'Invalid mentor ID or rating' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).send({ error: 'Session not found' });
    if (session.menteeRated) return res.status(400).send({ error: 'You have already rated this session' });

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).send({ error: 'Mentor not found' });

    mentor.totalRatings = (mentor.totalRatings || 0) + 1;
    mentor.averageRating =
      ((mentor.averageRating || 0) * (mentor.totalRatings - 1) + rating) /
      mentor.totalRatings;
    await mentor.save();

    session.menteeRated = true;
    session.menteeRating = rating;
    await session.save();

    res.send({ averageRating: mentor.averageRating, totalRatings: mentor.totalRatings });
  } catch (error) {
    console.error('Error rating mentor:', error);
    res.status(500).send({ error: 'Server error' });
  }
});


module.exports = router;
