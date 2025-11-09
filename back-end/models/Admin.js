const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  googleId: String,
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, default: 'admin' },
  permissions: [String],
  isGoogleSignup: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.model('Admin', adminSchema);
