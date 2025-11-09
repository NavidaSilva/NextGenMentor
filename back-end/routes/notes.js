const mime = require('mime-types');
const File = require("../models/File");
const Note = require("../models/Note");
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
//note taking

router.post("/:id/notes", auth, async (req, res) => {
  const { content } = req.body;
  const query = await MentorshipRequest.findById(req.params.id);
  if (!query) return res.status(404).json({ error: "Query not found" });

  const userRole = req.body.role; // you may need to set this from token/DB

  const note = new Note({
    content,
    createdBy: req.userId,
    createdByModel: userRole,
  });
  await note.save();

  query.notes.push(note._id);
  await query.save();

  res.status(201).json({ message: "Note added", note });
})

router.get("/:id/notes", auth, async (req, res) => {
  const query = await MentorshipRequest.findById(req.params.id).populate({
    path: "notes",
    options: { sort: { createdAt: -1 } },
  });
  if (!query) return res.status(404).json({ error: "Query not found" });

  res.json({ notes: query.notes });
});

router.put("/notes/:noteId", auth, async (req, res) => {
  const { content } = req.body;

  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ error: "Note not found" });

  if (note.createdBy.toString() !== req.userId)
    return res.status(403).json({ error: "Not authorized" });

  note.content = content;
  note.updatedAt = new Date();
  await note.save();

  res.json({ message: "Note updated", note });
});

router.delete("/notes/:noteId", auth, async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ error: "Note not found" });

  if (note.createdBy.toString() !== req.userId)
    return res.status(403).json({ error: "Not authorized" });

  await note.deleteOne();

  // Optional: remove from MentorshipRequest.notes
  await MentorshipRequest.updateOne(
    { notes: note._id },
    { $pull: { notes: note._id } }
  );

  res.json({ message: "Note deleted" });
});


module.exports = router;
