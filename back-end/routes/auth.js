const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');


const SCOPES = [
  'profile',
  'email',
//  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',

];

// GET /auth/google?role=mentee or /auth/google?role=mentor
router.get('/google', (req, res, next) => {
  const { role } = req.query;
  if (!role || !['mentor', 'mentee'].includes(role)) {
    return res.status(400).send('Invalid role');
  }
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');
  passport.authenticate('google', {
    scope: SCOPES,
    session: false,
    state,
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);  
});



router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      let role = null;

// Support both login and signup
if (req.query.state === 'login') {
  role = 'login';
} else {
  const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
  role = decodedState.role;
}   
  const { email, id, displayName } = req.user;
  // Prevent dual-role signup
  const Mentor = require('../models/Mentor');
  const Mentee = require('../models/Mentee');

  if (role === 'login') {
  const mentee = await Mentee.findOne({ email });
  if (mentee) {
    const token = jwt.sign({ userId: mentee._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.redirect(`${process.env.FRONTEND_URL}/mentee?token=${token}`);
  }

  const mentor = await Mentor.findOne({ email });
  if (mentor) {
    const token = jwt.sign({ userId: mentor._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.redirect(`${process.env.FRONTEND_URL}/mentor?token=${token}`);
  }

  // Not found as mentor or mentee
  return res.redirect(`${process.env.FRONTEND_URL}/?error=not_registered`);
}

      if (role === 'mentee') {
        const existingMentor = await Mentor.findOne({ email });
        if (existingMentor) {
          return res.redirect(`${process.env.FRONTEND_URL}/signup/mentee?error=already_registered_as_mentor`);
        }

        let mentee = await Mentee.findOne({ email });
        if (!mentee) {
          mentee = new Mentee({
            googleId: id,
            fullName: displayName,
            email,
            isGoogleSignup: true,
          });
          await mentee.save();
        }

        const token = jwt.sign({ userId: mentee._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.redirect(`${process.env.FRONTEND_URL}/signup/mentee?token=${token}&isGoogleSignup=true`);

      } else if (role === 'mentor') {
        const existingMentee = await Mentee.findOne({ email });
        if (existingMentee) {
          return res.redirect(`${process.env.FRONTEND_URL}/signup/mentor?error=already_registered_as_mentee`);
        }

        let mentor = await Mentor.findOne({ email });
        if (!mentor) {
          mentor = new Mentor({
            googleId: id,
            fullName: displayName,
            email,
            isGoogleSignup: true,
            
    googleAccessToken: req.user.accessToken,   // save token here
    googleRefreshToken: req.user.refreshToken, // save

          });
          await mentor.save();
        } else {
          // Update existing mentor with new tokens
          mentor.googleAccessToken = req.user.accessToken;
          mentor.googleRefreshToken = req.user.refreshToken;
          await mentor.save();
        }


        const token = jwt.sign({ userId: mentor._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.redirect(`${process.env.FRONTEND_URL}/signup/mentor?token=${token}&isGoogleSignup=true`);
      }else if (role === 'admin') {
        const existingUser = await Mentee.findOne({ email }) || await Mentor.findOne({ email });
        if (existingUser) {
          return res.redirect(`${process.env.FRONTEND_URL}/signup/admin?error=already_registered`);
        }
      
        const Admin = require('../models/Admin');
        let admin = await Admin.findOne({ email });
        if (!admin) {
          admin = new Admin({
            googleId: id,
            fullName: displayName,
            email,
            isGoogleSignup: true,
          });
          await admin.save();
        }
      
        const token = jwt.sign({ userId: admin._id, email, role: 'admin' }, process.env.JWT_SECRET);
        return res.redirect(`${process.env.FRONTEND_URL}/signup/admin?token=${token}&isGoogleSignup=true`);
      }

      return res.status(400).send('Invalid role');
    } catch (err) {
      console.error('Google OAuth Error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/signup/${role}?error=auth_failed`);
    }
  }
);




// GET /auth/google-login
router.get('/google-login', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: 'login' // tells callback this is a login
  })(req, res, next);
});

module.exports = router;




