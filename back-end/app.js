require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
require('./config/passport'); // Add this line to load the passport config
const app = express();

app.use('/uploads', express.static('uploads'));

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'role'],
}));
app.use(express.json());
app.use(passport.initialize());

// Database connection
mongoose.connect('mongodb://localhost:27017/nextgenmentor')

// Import routes
const authRoutes = require('./routes/auth');
const menteeRoutes = require('./routes/mentee');
const mentorRoutes = require('./routes/mentor');
const adminRoutes = require('./routes/admin');
const queriesRoutes = require('./routes/queries');  // 
const sessionRoutes= require('./routes/sessions');
// Routes
app.use('/auth', authRoutes);
app.use('/mentee', menteeRoutes);
app.use('/mentor', mentorRoutes);
app.use('/admin', adminRoutes);
app.use('/queries', queriesRoutes);
app.use("/notifications", require("./routes/notifications"));
app.use("/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;
module.exports = app;
