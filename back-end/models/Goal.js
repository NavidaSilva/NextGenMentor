const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  mentorshipRequest: { type: mongoose.Schema.Types.ObjectId, ref: "MentorshipRequest", required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["not-started", "in-progress", "completed"], default: "not-started" },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Goal", goalSchema);
