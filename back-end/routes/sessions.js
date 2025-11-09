const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const { awardBadges } = require('../controllers/sessionController');

// Middleware to verify JWT
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Please authenticate.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

router.get('/upcoming', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const role = (req.headers['role'] || '').toLowerCase();

    if (!['mentee', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const now = new Date();
    const query = { date: { $gte: now } };

    if (role === 'mentee') query.mentee = userId;
    if (role === 'mentor') query.mentor = userId;

    const sessions = await Session.find(query)
      .sort({ date: 1 })
      .populate('mentor', 'fullName')
      .populate('mentee', 'fullName');

    res.json({ sessions });
  } catch (err) {
    console.error('GET /sessions/upcoming error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'fullName')
      .populate('mentee', 'fullName');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('GET /sessions/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get session history (completed sessions)
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const role = (req.headers['role'] || '').toLowerCase();

    if (!['mentee', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const query = { status: 'completed' };
    if (role === 'mentee') query.mentee = userId;
    if (role === 'mentor') query.mentor = userId;

    const sessions = await Session.find(query)
      .sort({ actualEndTime: -1, date: -1 })
      .populate('mentor', 'fullName')
      .populate('mentee', 'fullName');

    res.json({ sessions });
  } catch (err) {
    console.error('GET /sessions/history/:userId error:', err);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});


// Start session tracking
router.post('/:id/start', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check if user is either mentor or mentee for this session
    const isMentor = String(session.mentor) === String(req.userId);
    const isMentee = String(session.mentee) === String(req.userId);
    
    if (!isMentor && !isMentee) {
      return res.status(403).json({ error: 'Only session participants can start this session' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Cannot start a completed session' });
    }

    if (session.status === 'in-progress') {
      return res.json({ message: 'Session already started', session });
    }

    // Mark session as in-progress and record actual start time
    session.status = 'in-progress';
    session.actualStartTime = new Date();
    await session.save();

    res.json({ message: 'Session started', session });
  } catch (error) {
    console.error('POST /sessions/:id/start error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/complete', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (String(session.mentor) !== String(req.userId)) {
      return res.status(403).json({ error: 'Only the assigned mentor can complete this session' });
    }

    if (session.status === 'completed') {
      return res.json({ message: 'Session already completed', session });
    }

    // Record actual end time and calculate duration
    const actualEndTime = new Date();
    session.actualEndTime = actualEndTime;
    
    // Calculate duration in minutes
    if (session.actualStartTime) {
      session.actualDuration = Math.round((actualEndTime - session.actualStartTime) / (1000 * 60));
    } else {
      // If session was never manually started, use scheduled time as start
      session.actualStartTime = session.date;
      session.actualDuration = Math.round((actualEndTime - session.date) / (1000 * 60));
    }

    session.status = 'completed';
    await session.save();

    const mentee = await Mentee.findById(session.mentee);
    if (mentee) {
      mentee.completedSessions = (mentee.completedSessions || 0) + 1;
      await mentee.save();
      await awardBadges(mentee._id);
    }

    // Update mentor stats
    const mentor = await Mentor.findById(session.mentor);
    if (mentor) {
      mentor.completedSessions = (mentor.completedSessions || 0) + 1;
      mentor.menteeHistory = mentor.menteeHistory || [];
      if (!mentor.menteeHistory.some(id => String(id) === String(mentee?._id))) {
        mentor.menteeHistory.push(mentee._id);
        mentor.menteesCount = (mentor.menteesCount || 0) + 1;
      }
      await mentor.save();
    }

    res.json({ message: 'Session marked as completed', session });
  } catch (error) {
    console.error('POST /sessions/:id/complete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save mentor recap
router.post("/:sessionId/recap/mentor", auth, async (req, res) => {
  try {
    const { recap } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.recapMentor = recap;
    await session.save();

    res.json({ message: "Mentor recap saved", session });
  } catch (err) {
    console.error("POST /:sessionId/recap/mentor error:", err);
    res.status(500).json({ error: "Failed to save mentor recap" });
  }
});

// Save mentee recap
router.post("/:sessionId/recap/mentee", auth, async (req, res) => {
  try {
    const { recap } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.recapMentee = recap;
    await session.save();

    res.json({ message: "Mentee recap saved", session });
  } catch (err) {
    console.error("POST /:sessionId/recap/mentee error:", err);
    res.status(500).json({ error: "Failed to save mentee recap" });
  }
});

const autoCompleteExpiredSessions = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sessions = await Session.find({ status: { $in: ['upcoming', 'in-progress'] }, date: { $lte: oneHourAgo } });

    for (const session of sessions) {
      try {
        // Record actual end time and calculate duration
        const actualEndTime = new Date();
        session.actualEndTime = actualEndTime;
        
        // Calculate duration in minutes
        if (session.actualStartTime) {
          session.actualDuration = Math.round((actualEndTime - session.actualStartTime) / (1000 * 60));
        } else {
          // If session was never manually started, use scheduled time as start
          session.actualStartTime = session.date;
          session.actualDuration = Math.round((actualEndTime - session.date) / (1000 * 60));
        }

        session.status = 'completed';
        await session.save();

        const mentee = await Mentee.findById(session.mentee);
        if (mentee) {
          mentee.completedSessions = (mentee.completedSessions || 0) + 1;
          await mentee.save();
          await awardBadges(mentee._id);
        }

        const mentor = await Mentor.findById(session.mentor);
        if (mentor) {
          mentor.completedSessions = (mentor.completedSessions || 0) + 1;
          mentor.menteeHistory = mentor.menteeHistory || [];
          if (!mentor.menteeHistory.some(id => String(id) === String(mentee?._id))) {
            mentor.menteeHistory.push(mentee._id);
            mentor.menteesCount = (mentor.menteesCount || 0) + 1;
          }
          await mentor.save();
        }

        console.log(`[CRON] Auto-completed session ${session._id} @ ${new Date().toISOString()}`);
      } catch (err) {
        console.error(`[CRON] Failed to complete session ${session._id}:`, err);
      }
    }
  } catch (err) {
    console.error('[CRON] Error running autoCompleteExpiredSessions:', err);
  }
};

module.exports = router;
module.exports.autoCompleteExpiredSessions = autoCompleteExpiredSessions;
