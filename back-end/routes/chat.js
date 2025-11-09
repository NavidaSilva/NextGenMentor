const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Session = require('../models/Session');
const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');

// Middleware to authenticate and extract user
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

// GET /messages/:sessionId
router.get('/:sessionId', auth, async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isAuthorized = [session.mentee.toString(), session.mentor.toString()].includes(req.userId);
    if (!isAuthorized) return res.status(403).json({ error: 'Forbidden' });

    // Populate user field with fullName from Mentor or Mentee
    const messages = await ChatMessage.find({ sessionId })
      .populate('user', 'fullName') // gets fullName from either model
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /messages/:sessionId
router.post('/:sessionId', auth, async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Only mentee or mentor of this session can post
    let userModel = null;
    if (session.mentor.toString() === req.userId) userModel = 'Mentor';
    else if (session.mentee.toString() === req.userId) userModel = 'Mentee';
    else return res.status(403).json({ error: 'Forbidden' });

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session has ended' });
    }

    const chatMessage = new ChatMessage({
      sessionId,
      user: req.userId,
      userModel,
      message,
    });

    await chatMessage.save();
    const populatedMessage = await chatMessage.populate('user', 'fullName');
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
