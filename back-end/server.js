require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const ChatMessage = require("./models/ChatMessage");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

require('./config/passport'); 

const app = express();

app.use('/uploads', express.static('uploads'));

// Middleware
app.use(cors({
  origin:  process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'role'],
}));
app.use(express.json());
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGO_URI ) //'mongodb://localhost:27017/nextgenmentor');

// Import routes
const authRoutes = require('./routes/auth');
const menteeRoutes = require('./routes/mentee');
const mentorRoutes = require('./routes/mentor');
const adminRoutes = require('./routes/admin');
const queriesRoutes = require('./routes/queries');
const sessionRoutes= require('./routes/sessions');  
const chatRoutes = require('./routes/chat');
const supportRoutes = require('./routes/support');
const rematchRoutes = require("./routes/rematch");
const declineRoutes = require("./routes/decline");
const noteRoutes =  require('./routes/notes');


const privacyRoutes = require('./routes/privacyRoutes');
const supportRouter = require('./routes/support');
const menteeDeleteAccountRoutes = require('./routes/menteeDeleteAccount');
const mentorDeleteRouter = require('./routes/mentorDelete');

const ratingsRoutes = require('./routes/ratings');

// Routes
app.use('/auth', authRoutes);
app.use('/mentee', menteeRoutes);
app.use('/mentor', mentorRoutes);
app.use('/admin', adminRoutes);
app.use('/queries', queriesRoutes);
app.use("/notifications", require("./routes/notifications"));
app.use("/sessions", sessionRoutes);
app.use('/messages', chatRoutes);
app.use('/support', supportRoutes);
app.use("/rematch", rematchRoutes);
app.use("/rematch", require("./routes/rematch"));
app.use("/decline", declineRoutes);
app.use("/note", noteRoutes);
app.use('/security', privacyRoutes);
app.use('/support', supportRouter);
app.use('/mentee', menteeDeleteAccountRoutes);
app.use('/mentor', mentorDeleteRouter);

app.use('/ratings', ratingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
