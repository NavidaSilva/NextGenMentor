const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const { check, validationResult } = require('express-validator');
const upload = require('../config/multerConfig');
const { google } = require('googleapis');
const Session  = require('../models/Session');
const MentorshipRequest = require("../models/MentorshipRequest");
const { uploadProfilePicture } = require("../config/multerConfig");
const Notification = require('../models/Notification');
const Mentee   = require('../models/Mentee');
const path = require('path');
const fs = require('fs');


// Middleware to verify JWT
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

// Complete mentor  profile (for Google signup)
router.put('/complete-profile',
  auth,
  uploadProfilePicture.single('profilePicture'),
 [
  check('currentStatus').not().isEmpty().withMessage('Current status is required'),
  check('industry').isArray({ min: 1 }).withMessage('Select at least one field of study'),
  check('yearsExperience').not().isEmpty().withMessage('years of Experience  is required'),
  check('currentRole').optional().isString().trim().isLength({ max: 50 }).withMessage('Curernt role must be less than 50 characters'),
  check('education').optional().isString().trim().isLength({ max: 50 }).withMessage('education role must be less than 50 characters'),
  check('linkedIn').optional().isURL().withMessage('Invalid LinkedIn URL'),
  check('mentorshipFormat').isIn(['chat', 'video', 'both']).withMessage('Invalid mentorship format'),
  check('menteeLevel').optional().isArray(),
  check('bio').optional().isString().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  check('profilePicture').optional().isString().withMessage('Invalid profile picture URL')  
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
     const allowedUpdates = [
      "currentStatus",
      "industry",
      "yearsExperience",
      "currentRole",
      "education",
      "mentorshipFormat",
      "menteeLevel",
      "bio",
      "linkedIn",
      "profilePicture"
    ];
 const updates = {
        currentStatus: req.body.currentStatus,
        industry: req.body.industry,
        yearsExperience: req.body.yearsExperience,
        currentRole: req.body.currentRole, 
        education: req.body.education,
        menteeLevel: req.body.menteeLevel || [],
        mentorshipFormat: req.body.mentorshipFormat,
        bio: req.body.bio,
        linkedIn: req.body.linkedIn,
      };

      if (req.file) {
        updates.profilePicture = `/uploads/${req.file.filename}`; // Store path to DB
      }

      // Handle removal of profile picture
      if (req.body.removeProfilePicture === "true") {
        // Remove old profile picture from disk if exists
        const mentor = await Mentor.findById(req.userId);
        if (mentor && mentor.profilePicture) {
          const oldPicPath = path.join(__dirname, '..', mentor.profilePicture);
fs.unlink(oldPicPath, (err) => {
  if (err) console.error('Failed to delete old profile picture:', err);
});

        }
        updates.profilePicture = '';
      }



    const mentor = await Mentor.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!mentor) {
      return res.status(404).send({ error: 'Mentor not found' });
    }

    // generate a fresh token 
    const token = jwt.sign({ userId: mentor._id, email: mentor.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // send token to frontend
    res.send({ token });
  } catch (error) {
    res.status(400).send(error);
  }
});



router.get('/me', auth, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.userId).select('-password');
    if (!mentor) {
      return res.status(404).send({ error: 'Mentor not found' });
    }
    res.send(mentor);
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});

// GET /mentor/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).select('-password');
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    res.json(mentor);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/:mentorId/availability', auth, async (req, res) => {
  const { mentorId } = req.params;
  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    if (!mentor.googleAccessToken) {
      return res.status(400).json({ error: 'Mentor has not connected Google Calendar' });
    }

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
    //oauth2Client.setCredentials({ access_token: mentor.googleAccessToken });

    oauth2Client.setCredentials({
  access_token: mentor.googleAccessToken,
  refresh_token: mentor.googleRefreshToken,
});

// OPTIONAL: listen to tokens event and update DB if new tokens arrive
oauth2Client.on('tokens', async (tokens) => {
  if (tokens.access_token) mentor.googleAccessToken = tokens.access_token;
  if (tokens.refresh_token) mentor.googleRefreshToken = tokens.refresh_token;
  await mentor.save();
});
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const end = new Date(now);
    
    end.setDate(end.getDate() + 7); // next 7 days

    const freeSlots = [];

   for (let day = 0; day < 7; day++) {
  const dayStart = new Date(now);
  dayStart.setDate(now.getDate() + day);
  dayStart.setHours(8, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setHours(17, 0, 0, 0);

  let pointer = new Date(dayStart);

  if (day === 0 && now > dayStart) {
    pointer = new Date(now);
    if (pointer.getMinutes() > 0) {
      pointer.setHours(pointer.getHours() + 1, 0, 0, 0);
    } else {
      pointer.setMinutes(0, 0, 0);
    }
    if (pointer < dayStart) pointer = new Date(dayStart);
  }

  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  for (const event of events.data.items) {
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);

    while (pointer.getTime() + 60 * 60 * 1000 <= eventStart.getTime()) {
      freeSlots.push({
        date: pointer.toISOString().split('T')[0],
        time: pointer.toTimeString().substring(0, 5),
      });
      pointer.setHours(pointer.getHours() + 1);
    }

    pointer = eventEnd > pointer ? eventEnd : pointer;
  }

  while (pointer.getTime() + 60 * 60 * 1000 <= dayEnd.getTime()) {
    freeSlots.push({
      date: pointer.toISOString().split('T')[0],
      time: pointer.toTimeString().substring(0, 5),
    });
    pointer.setHours(pointer.getHours() + 1);
  }
}


res.json({ slots: freeSlots.slice(0,6) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});






// POST /mentor/:mentorId/schedule
router.post('/:mentorId/schedule', auth, async (req, res) => {
  const { mentorId } = req.params;
  const { date, time, sessionType, mentorshipRequestId } = req.body;

  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const mentorshipRequest = await MentorshipRequest.findById(mentorshipRequestId);
    if (!mentorshipRequest) return res.status(404).json({ error: 'MentorshipRequest not found' });

    // Fetch mentee for email
    const mentee = await Mentee.findById(mentorshipRequest.mentee);
    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });


    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: mentor.googleAccessToken,
      refresh_token: mentor.googleRefreshToken,
    });

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) mentor.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) mentor.googleRefreshToken = tokens.refresh_token;
      await mentor.save();
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `${sessionType === 'video' ? 'Video' : 'Chat'} Mentorship Session`,
      description: `Mentorship session via ${sessionType}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: [
        { email: mentor.email },
        { email: mentee.email }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };
    

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1
    });

    // save session in DB
    const session = await Session.create({
      mentor: mentorId,
      mentee: req.userId,
      mentorshipRequest: mentorshipRequestId,
      date: startDateTime,
      type: sessionType,
      googleEventId: createdEvent.data.id,
      googleMeetLink: sessionType === 'video' ? createdEvent.data.hangoutLink : undefined,
    });

    // update MentorshipRequest
    await MentorshipRequest.findByIdAndUpdate(mentorshipRequestId, {
      $push: { sessions: session._id },
      status: 'accepted',
    });

    

    const recipientId =
      req.userId === mentorshipRequest.mentee.toString()
        ? mentorshipRequest.mentor
        : mentorshipRequest.mentee;

    await new Notification({
      recipient: recipientId,
      message: `A new ${sessionType} session has been scheduled for ${startDateTime.toLocaleString()}`,
    }).save();

    res.json({ message: 'Session scheduled', session });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule session' });
  }
});

module.exports = router;
