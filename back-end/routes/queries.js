const mime = require('mime-types');
const { uploadQueryFile } = require("../config/multerConfig");
const File = require("../models/File");
const express = require("express");
const router = express.Router();
const MentorshipRequest = require("../models/MentorshipRequest");
const Mentee = require("../models/Mentee");
const Mentor = require("../models/Mentor");
const jwt = require("jsonwebtoken");
const Notification = require('../models/Notification');
const fs = require("fs");
const path = require("path");
const Goal = require("../models/Goal");

// auth middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).send({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
};

// POST: create mentorship request
router.post("/request", auth, async (req, res) => {
  const { mentorId, topic, description, communicationMethod, learningGoal, mentorshipHeading } = req.body;
const mentee = await Mentee.findById(req.userId);

  const request = new MentorshipRequest({
    mentee: req.userId,
    mentor: mentorId,
    topic,
    mentorshipHeading,
    description,
    communicationMethod,
    learningGoal, 
  });

  await request.save();
await new Notification({
  recipient: mentorId,
  message: `New mentorship request from ${mentee.fullName} on topic "${topic}"`,
}).save();

  res.status(201).json({ message: "Request created", request });
});

// GET: mentee's requests
router.get("/mentee", auth, async (req, res) => {
  const requests = await MentorshipRequest.find({ mentee: req.userId,     status: { $in: ["pending", "rejected"] } 
 })

  //const requests = await MentorshipRequest.find({ mentee: req.userId })
    .populate("mentor", "fullName email profilePicture")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET: mentor's requests
router.get("/mentor", auth, async (req, res) => {
  //const requests = await MentorshipRequest.find({ mentor: req.userId })
    const requests = await MentorshipRequest.find({ mentor: req.userId, status: "pending" })

    .populate("mentee", "fullName email profilePicture")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.get("/:id", auth, async (req, res) => {
  const query = await MentorshipRequest.findById(req.params.id)
    .populate("mentee", "fullName email profilePicture")
    .populate("mentor", "fullName email profilePicture");

  if (!query) return res.status(404).send({ error: "Not found" });

  res.json({ query });
});


// PATCH: accept mentorship request
router.patch("/:id/accept", auth, async (req, res) => {
  const request = await MentorshipRequest.findById(req.params.id)
    .populate("mentee", "fullName")
    .populate("mentor", "fullName");

  if (!request) return res.status(404).json({ error: "Request not found" });

  if (request.mentor._id.toString() !== req.userId)
    return res.status(403).json({ error: "Not authorized" });

  request.status = "accepted";
  await request.save();

  await new Notification({
    recipient: request.mentee._id,
    message: `Your mentorship request on "${request.topic}" has been accepted by ${request.mentor.fullName}.`,
  }).save();

  res.json({ message: "Request accepted", request });
});


// PATCH: reject mentorship request
router.patch("/:id/reject", auth, async (req, res) => {
  const request = await MentorshipRequest.findById(req.params.id)
    .populate("mentee", "fullName")
    .populate("mentor", "fullName");

  if (!request) return res.status(404).json({ error: "Request not found" });

  if (request.mentor._id.toString() !== req.userId)
    return res.status(403).json({ error: "Not authorized" });

  request.status = "rejected";
  await request.save();

  await new Notification({
    recipient: request.mentee._id,
    message: `Your mentorship request on "${request.topic}" has been rejected by ${request.mentor.fullName}.`,
  }).save();

  res.json({ message: "Request rejected", request });
});


// GET: active queries for mentee
router.get("/mentee/active", auth, async (req, res) => {
  const requests = await MentorshipRequest.find({ mentee: req.userId, status: "accepted" })
    .populate("mentor", "fullName email profilePicture")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET: active queries for mentor
router.get("/mentor/active", auth, async (req, res) => {
  const requests = await MentorshipRequest.find({ mentor: req.userId, status: "accepted" })
    .populate("mentee", "fullName email profilePicture")
    .sort({ createdAt: -1 });
  res.json({ requests });
});


router.get("/:id/full", auth, async (req, res) => {
  const query = await MentorshipRequest.findById(req.params.id)
    .populate("mentee", "fullName email profilePicture currentStatus fieldOfStudy")
    .populate("mentor", "fullName email profilePicture yearsExperience industry")
    .populate("files")     // or selectively fields: .populate({ path: "files", select: "name url createdAt" })
    .populate("notes")
    .populate("goals")
    .populate({
      path : 'sessions',
      select: 'type date status googleMeetLink menteeRated menteeRating'   
    })



  if (!query) return res.status(404).send({ error: "Query not found" });

  res.json({ query });
});



// POST: Upload file
router.post('/:id/files', auth, uploadQueryFile.single('file'), async (req, res) => {
  try {
    const mentorshipRequestId = req.params.id;

    const userRole = req.headers['role'] || req.body.role; // or fetch from token
    const uploaderModel = userRole === 'mentor' ? 'Mentor' : 'Mentee';

    
  // Check total size of files uploaded to this query
    const existingFiles = await File.find({ mentorshipRequest: req.params.id });
    const totalSize = existingFiles.reduce((sum, f) => sum + f.size, 0) + req.file.size;

    if (totalSize > 1.5 * 1024 * 1024 * 1024) {
      fs.unlinkSync(req.file.path); // delete uploaded file
      return res.status(400).send({ error: "Total file size for this query exceeds 1.5GB" });
    }

    const fileDoc = new File({
      mentorshipRequest: mentorshipRequestId,
      uploader: req.userId,
      uploaderModel,
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    });

    await fileDoc.save();

     // Add file reference to MentorshipRequest
    await MentorshipRequest.findByIdAndUpdate(
      mentorshipRequestId,
      { $push: { files: fileDoc._id } }
    );

  // Correct recipient logic
    const request = await MentorshipRequest.findById(mentorshipRequestId);
    let recipient;
    if (req.userId === String(request.mentee)) {
      recipient = request.mentor;
    } else if (req.userId === String(request.mentor)) {
      recipient = request.mentee;
    } else {
      return res.status(403).json({ error: 'You are not part of this query' });
    }

    // Save notification
    await new Notification({
      recipient,
      message: `New file "${fileDoc.name}" uploaded to query "${request.topic}".`,
    }).save();

    res.status(201).json({ message: "File uploaded", file: fileDoc });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to upload' });
  }
});



router.get('/files/:fileId', async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) return res.status(404).send({ error: 'File not found' });

  const filePath = path.resolve(file.path);

  // set correct headers
  res.setHeader('Content-Disposition', 'inline; filename="' + file.name + '"');
  res.setHeader('Content-Type',mime.contentType(file.name) || 'application/octet-stream'
);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});


// DELETE: file by uploader only
router.delete('/files/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if current user is the uploader
    if (file.uploader.toString() !== req.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this file' });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Remove from DB
    await file.deleteOne();

    // Optional: remove from MentorshipRequest.files array
    await MentorshipRequest.findByIdAndUpdate(file.mentorshipRequest, {
      $pull: { files: file._id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});


// POST: mentee adds a new goal
router.post("/:id/goals", auth, async (req, res) => {
  const { description } = req.body;
  const mentorshipRequestId = req.params.id;

  const request = await MentorshipRequest.findById(mentorshipRequestId);
  if (!request) return res.status(404).json({ error: "Query not found" });
  if (String(request.mentee) !== req.userId) {
    return res.status(403).json({ error: "Only mentee can add goals" });
  }

  const goal = new Goal({ mentorshipRequest: mentorshipRequestId, description });
await goal.save();

  // update mentorshipRequest with the goal
  request.goals.push(goal._id);
  await request.save();

  res.status(201).json({ message: "Goal added", goal });
});



// PATCH: mentor updates goal status/feedback
router.patch("/goals/:goalId", auth, async (req, res) => {
  const { status, feedback } = req.body;

  const goal = await Goal.findById(req.params.goalId).populate("mentorshipRequest");
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const request = goal.mentorshipRequest;

  if (String(request.mentor) !== req.userId) {
    return res.status(403).json({ error: "Only mentor can update goal" });
  }

  if (status) goal.status = status;
  if (feedback) goal.feedback = feedback;
  goal.updatedAt = new Date();

  await goal.save();

  res.json({ message: "Goal updated", goal });
});

module.exports = router;

