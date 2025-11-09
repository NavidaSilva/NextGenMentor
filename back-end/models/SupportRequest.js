const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  message:  { type: String, required: true },
  role:     { type: String, required: true, enum: ['mentor', 'mentee'] },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
