const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  mentorshipRequest: { type: mongoose.Schema.Types.ObjectId, ref: "MentorshipRequest", required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploaderModel', required: true },
  uploaderModel: { type: String, enum: ["Mentor", "Mentee"], required: true },
  name: String,
  path: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
