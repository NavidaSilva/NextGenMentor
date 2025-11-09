const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema({
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: "Mentee", required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
  topic: String,
  subject: String, 
  description: String,
  mentorshipHeading: String, 
  communicationMethod: { type: String, enum: ["chat", "video", "both"] },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  learningGoal:String,

  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  goals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Goal" }],
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],   
});

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);