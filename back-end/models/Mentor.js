const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  googleId: String,
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: String,
  currentStatus: String,
  industry: [String],
  yearsExperience: String,
  currentRole: String,
  education: String,
  linkedIn: String,
  mentorshipFormat: { type: String, default: 'both' },
  menteeLevel: [String],
  bio: String,
  profilePicture: String,
  isGoogleSignup: { type: Boolean, default: false },
  completedSessions: { type: Number, default: 0 },
  menteesCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  menteeHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mentee' }],

  googleAccessToken: String,
  googleRefreshToken: String,

  emailVisibility: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Mentor', mentorSchema);

