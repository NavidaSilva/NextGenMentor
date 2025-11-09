const mongoose = require('mongoose');

const menteeSchema = new mongoose.Schema({
  googleId: String,
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String, // Only for email signup
  currentStatus: String,
  fieldOfStudy: [String],
  linkedIn: String,
  mentorType: [String],
  topics: [String],
  mentorshipFormat: { type: String, default: 'both' },
  goals: String,
  bio: String,
  profilePicture: String,
  profilePictureHidden: { type: Boolean, default: false },
  isGoogleSignup: { type: Boolean, default: false },
  completedSessions: { type: Number, default: 0 },
  earnedBadges: [
    {
      id: String,
      title: String,
      earned: { type: Boolean, default: false },
    }
  ],

  emailVisibility: { type: Boolean, default: true },

  googleAccessToken: String, 
  googleRefreshToken: String,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mentee', menteeSchema);