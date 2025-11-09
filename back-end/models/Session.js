const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentee', required: true },
  mentorshipRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest' },
  date: { type: Date, required: true }, // Scheduled start time
  type: { type: String, enum: ['chat', 'video'], required: true },
  googleEventId: String,
  googleMeetLink: String,
  status: { type: String, enum: ['upcoming', 'in-progress', 'completed'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }, 

  // Actual session timing
  actualStartTime: { type: Date }, // When session actually started
  actualEndTime: { type: Date },   // When session actually ended
  actualDuration: { type: Number }, // Duration in minutes

  menteeRated: { type: Boolean, default: false },
  menteeRating: { type: Number, min: 1, max: 5 }, // Store the actual rating value

  recapMentor: { type: String, default: "" },   // mentor's recap
  recapMentee: { type: String, default: "" },   // mentee's recap
});

module.exports = mongoose.model('Session', sessionSchema);
