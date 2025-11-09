const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Session = require('../models/Session');
const MentorshipRequest = require('../models/MentorshipRequest');
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');

// Email configuration for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// Department mapping for topics
const topicDepartments = {
  "Technology & Engineering": [
    "Computer Science / IT",
    "Data Science / AI", 
    "Cybersecurity",
    "Engineering",
    "Telecommunications",
    "Aerospace & Aviation",
    "Automotive",
    "Manufacturing & Industrial",
    "Mining & Metals",
    "Space Exploration & Research"
  ],
  
  "Business & Management": [
    "Business Administration",
    "Finance",
    "Marketing", 
    "Entrepreneurship",
    "Consulting",
    "Human Resources",
    "Product Management",
    "Supply Chain & Logistics",
    "Retail & E-commerce",
    "Insurance"
  ],
  
  "Health & Life Sciences": [
    "Medicine / Health Sciences",
    "Biomedical Research",
    "Pharmaceuticals",
    "Veterinary Medicine & Animal Sciences",
    "Psychology",
    "Environmental & Sustainability",
    "Oceanography & Marine Industries"
  ],
  
  "Creative & Design": [
    "Design / Fine Arts",
    "UX/UI Design",
    "Media & Entertainment",
    "Publishing & Journalism",
    "Performing Arts & Music",
    "Cultural Heritage & Museums",
    "Architecture",
    "Food & Beverage / Culinary Arts"
  ],
  
  "Education & Social Sciences": [
    "Education",
    "Law",
    "Social Impact / Non-profit",
    "Public Policy & Government",
    "Military & Defense",
    "Real Estate & Urban Development",
    "Transportation (Rail, Shipping, Public Transit)"
  ],
  
  "Applied Sciences & Services": [
    "Biotechnology",
    "Agriculture & Agribusiness",
    "Energy (Oil, Gas, Renewables)",
    "Hospitality & Tourism",
    "Sports & Recreation"
  ]
};

// Function to get department for a topic
function getDepartmentForTopic(topic) {
  for (const [department, topics] of Object.entries(topicDepartments)) {
    if (topics.includes(topic)) {
      return department;
    }
  }
  return "Other";
}

// Middleware to verify admin JWT
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).send({ error: 'Admin access required' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Complete admin profile (for new admins)
router.put('/complete-profile', async (req, res) => {
  try {
    const { token, permissions } = req.body;
    
    if (!token) {
      return res.status(400).send({ error: 'Token is required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).send({ error: 'Admin access required' });
    }

    const updates = {
      permissions: permissions || [],
    };

    const admin = await Admin.findByIdAndUpdate(decoded.userId, updates, { new: true });
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }

    // Generate new token with permissions
    const newToken = jwt.sign({ 
      userId: admin._id, 
      email: admin.email, 
      role: 'admin',
      permissions: admin.permissions 
    }, process.env.JWT_SECRET);
    
    res.send({ token: newToken, admin });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin login (for existing admins)
router.post('/login', async (req, res) => {
  console.log('[ADMIN] /login hit', req.body);
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).send({ error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }

    // Check password (simple comparison)
    if (admin.password !== password) {
      return res.status(401).send({ error: 'Invalid password' });
    }

    // Generate token for existing admin
    const token = jwt.sign({ 
      userId: admin._id, 
      email: admin.email, 
      role: 'admin',
      permissions: admin.permissions 
    }, process.env.JWT_SECRET);
    
    res.send({ token, admin });
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});

// Get admin profile
router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.userId).select('-password');
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }
    res.send(admin);
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});

// Check if email is admin
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const admin = await Admin.findOne({ email });
    
    if (admin) {
      res.send({ isAdmin: true, admin });
    } else {
      res.send({ isAdmin: false });
    }
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});
// Get dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Count total mentors (active status)
    const totalMentors = await Mentor.countDocuments();
    
    // Count total mentees (active status)
    const totalMentees = await Mentee.countDocuments();
    
    // Count all completed sessions (same logic as the graph)
    const sessionsThisMonth = await Session.countDocuments({
      status: 'completed'
    });
    
    // Count all support requests (total count)
    const unresolvedReports = await SupportRequest.countDocuments();
    
    res.json({
      totalMentors,
      totalMentees,
      sessionsThisMonth,
      unresolvedReports
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get session data for different time periods
router.get('/session-data/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const currentDate = new Date();
    let startDate;
    let groupBy;
    
    switch (period) {
      case 'week':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      case 'month':
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      case '3months':
        startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      default:
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
    }
    
    // Use a more flexible approach - get sessions from the last year instead of strict periods
    let actualStartDate;
    if (period === 'week') {
      actualStartDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      actualStartDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '3months') {
      actualStartDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      actualStartDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get all completed sessions and filter in JavaScript
    const allSessions = await Session.find({ 
      status: 'completed',
      date: { $exists: true, $ne: null, $ne: "" }
    });

    // Filter sessions by time period and group by date
    const dateCounts = {};

    allSessions.forEach(session => {
      try {
        // Parse the date string to Date object
        const sessionDate = new Date(session.date);
        
        // Check if date is valid and within the selected period
        if (sessionDate && sessionDate >= actualStartDate) {
          // Format date as YYYY-MM-DD
          const dateKey = sessionDate.toISOString().split('T')[0];
          
          if (dateCounts[dateKey]) {
            dateCounts[dateKey]++;
          } else {
            dateCounts[dateKey] = 1;
          }
        }
      } catch (error) {
        // Skip sessions with invalid dates
      }
    });

    // Generate complete date range with 0 sessions for missing dates
    const sessionData = [];
    const endDate = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000); // Yesterday
    
    // Generate all dates in the range
    for (let d = new Date(actualStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const sessionCount = dateCounts[dateKey] || 0;
      
      sessionData.push({
        date: dateKey,
        sessions: sessionCount
      });
    }
    
    // Format the data for the frontend
    const formattedData = sessionData.map(item => ({
      date: item.date,
      sessions: item.sessions
    }));
    
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

// Get top 5 mentorship topics for pie chart
router.get('/mentorship-topics', async (req, res) => {
  try {
    // First, let's see what we have in the database
    const totalRequests = await MentorshipRequest.countDocuments();
    
    if (totalRequests === 0) {
      return res.json([]);
    }
    
    // Fetch all mentorship requests and extract topics
    const allRequests = await MentorshipRequest.find({}, 'topic');
    
    // Define the dropdown topics from the frontend
    const dropdownTopics = [
      "Computer Science / IT",
      "Business Administration", 
      "Psychology",
      "Engineering",
      "Medicine / Health Sciences",
      "Law",
      "Education",
      "Design / Fine Arts",
      "Data Science / AI",
      "Product Management",
      "UX/UI Design",
      "Finance",
      "Marketing",
      "Entrepreneurship",
      "Consulting",
      "Human Resources",
      "Cybersecurity",
      "Biomedical Research",
      "Architecture",
      "Social Impact / Non-profit",
      "Agriculture & Agribusiness",
      "Aerospace & Aviation",
      "Automotive",
      "Energy (Oil, Gas, Renewables)",
      "Environmental & Sustainability",
      "Biotechnology",
      "Supply Chain & Logistics",
      "Manufacturing & Industrial",
      "Telecommunications",
      "Hospitality & Tourism",
      "Sports & Recreation",
      "Media & Entertainment",
      "Publishing & Journalism",
      "Real Estate & Urban Development",
      "Food & Beverage / Culinary Arts",
      "Public Policy & Government",
      "Military & Defense",
      "Oceanography & Marine Industries",
      "Mining & Metals",
      "Transportation (Rail, Shipping, Public Transit)",
      "Retail & E-commerce",
      "Pharmaceuticals",
      "Veterinary Medicine & Animal Sciences",
      "Insurance",
      "Cultural Heritage & Museums",
      "Performing Arts & Music",
      "Space Exploration & Research"
    ];
    
    // Count topic frequencies with AI matching
    const topicCounts = {};
    let aiMatches = 0;
    let dropdownMatches = 0;
    let customTopics = 0;
    
    //console.log(`Processing ${allRequests.length} mentorship requests for topic matching...`);
    
    for (const request of allRequests) {
      if (request.topic && request.topic.trim() !== '') {
        const originalTopic = request.topic.trim();
        
        // Check if topic is already in dropdown topics
        const isDropdownTopic = dropdownTopics.includes(originalTopic);
        
        if (isDropdownTopic) {
          // Use the topic as-is if it's already in dropdown
          topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
          dropdownMatches++;
        } else {
          // Use AI to match custom topic to dropdown topic
          try {
            //console.log(`🤖 AI matching custom topic: "${originalTopic}"`);
            const aiResponse = await axios.post('http://localhost:8000/match-topic/', {
              custom_topic: originalTopic,
              dropdown_topics: dropdownTopics
            });
            
            if (aiResponse.data && aiResponse.data.is_matched) {
              // Use the AI-matched topic
              const matchedTopic = aiResponse.data.matched_topic;
              const similarity = aiResponse.data.similarity_score;
              //console.log(`✅ Matched "${originalTopic}" → "${matchedTopic}" (similarity: ${similarity.toFixed(3)})`);
              topicCounts[matchedTopic] = (topicCounts[matchedTopic] || 0) + 1;
              aiMatches++;
            } else {
              // If no good match, keep original topic
              //console.log(`❌ No good match for "${originalTopic}", keeping original`);
              topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
              customTopics++;
            }
          } catch (aiError) {
            //console.error('AI topic matching failed for:', originalTopic, aiError.message);
            // Fallback to original topic if AI fails
            topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
            customTopics++;
          }
        }
      }
    }
    
    //console.log(`📊 Topic matching summary: ${dropdownMatches} dropdown matches, ${aiMatches} AI matches, ${customTopics} custom topics kept`);
    
    // Convert to array and sort by frequency (descending), then alphabetically for ties
    const sortedTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ name: topic, value: count }))
      .sort((a, b) => {
        // First sort by frequency (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        // If frequencies are equal, sort alphabetically
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5); // Take top 5
    
    res.json(sortedTopics);
  } catch (error) {
    console.error('Error in mentorship topics route:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship topics' });
  }
});

// Get department statistics for the week
router.get('/department-stats', async (req, res) => {
  try {
    //console.log('📊 Fetching department statistics for the week...');
    
    // Calculate date range for the last week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    //console.log('📅 Date range:', oneWeekAgo.toISOString(), 'to', now.toISOString());
    
    // Get all mentorship requests with AI-matched topics
    const allRequests = await MentorshipRequest.find({}, 'topic');
    
    // Get mentorship requests from the last week (regardless of status)
    const weeklyRequests = await MentorshipRequest.find({
      createdAt: { $gte: oneWeekAgo }
    }, 'topic status createdAt');
    
    //console.log('🔍 Weekly mentorship requests query result:', weeklyRequests.length);
    //if (weeklyRequests.length > 0) {
      /*console.log('📅 Sample request:', {
        id: weeklyRequests[0]._id,
        status: weeklyRequests[0].status,
        createdAt: weeklyRequests[0].createdAt,
        topic: weeklyRequests[0].topic
      });
    }*/
    
    //console.log(`Found ${allRequests.length} total mentorship requests and ${weeklyRequests.length} weekly requests`);
    
    // Define the dropdown topics from the frontend
    const dropdownTopics = [
      "Computer Science / IT",
      "Business Administration", 
      "Psychology",
      "Engineering",
      "Medicine / Health Sciences",
      "Law",
      "Education",
      "Design / Fine Arts",
      "Data Science / AI",
      "Product Management",
      "UX/UI Design",
      "Finance",
      "Marketing",
      "Entrepreneurship",
      "Consulting",
      "Human Resources",
      "Cybersecurity",
      "Biomedical Research",
      "Architecture",
      "Social Impact / Non-profit",
      "Agriculture & Agribusiness",
      "Aerospace & Aviation",
      "Automotive",
      "Energy (Oil, Gas, Renewables)",
      "Environmental & Sustainability",
      "Biotechnology",
      "Supply Chain & Logistics",
      "Manufacturing & Industrial",
      "Telecommunications",
      "Hospitality & Tourism",
      "Sports & Recreation",
      "Media & Entertainment",
      "Publishing & Journalism",
      "Real Estate & Urban Development",
      "Food & Beverage / Culinary Arts",
      "Public Policy & Government",
      "Military & Defense",
      "Oceanography & Marine Industries",
      "Mining & Metals",
      "Transportation (Rail, Shipping, Public Transit)",
      "Retail & E-commerce",
      "Pharmaceuticals",
      "Veterinary Medicine & Animal Sciences",
      "Insurance",
      "Cultural Heritage & Museums",
      "Performing Arts & Music",
      "Space Exploration & Research"
    ];
    
    // Process mentorship requests with AI matching
    const topicCounts = {};
    
    for (const request of allRequests) {
      if (request.topic && request.topic.trim() !== '') {
        const originalTopic = request.topic.trim();
        const isDropdownTopic = dropdownTopics.includes(originalTopic);
        
        if (isDropdownTopic) {
          topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
        } else {
          // Use AI to match custom topic to dropdown topic
          try {
            const aiResponse = await axios.post('http://localhost:8000/match-topic/', {
              custom_topic: originalTopic,
              dropdown_topics: dropdownTopics
            });
            
            if (aiResponse.data && aiResponse.data.is_matched) {
              const matchedTopic = aiResponse.data.matched_topic;
              topicCounts[matchedTopic] = (topicCounts[matchedTopic] || 0) + 1;
            } else {
              topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
            }
          } catch (aiError) {
            console.error('AI topic matching failed for:', originalTopic, aiError.message);
            topicCounts[originalTopic] = (topicCounts[originalTopic] || 0) + 1;
          }
        }
      }
    }
    
    // Process weekly mentorship requests with AI matching
    const weeklyTopicCounts = {};
    
    // If no weekly requests, use all requests as fallback
    let requestsToProcess = weeklyRequests;
    
    if (requestsToProcess.length === 0) {
      //console.log('📊 No weekly requests found, using all requests as fallback');
      requestsToProcess = allRequests;
    }
    
    console.log(`📊 Processing ${requestsToProcess.length} mentorship requests for department stats`);
    
    for (const request of requestsToProcess) {
      if (!request.topic || request.topic.trim() === '') {
        //console.log('⚠️ Request has no topic, skipping:', request._id);
        continue;
      }
      
      const originalTopic = request.topic.trim();
      const isDropdownTopic = dropdownTopics.includes(originalTopic);
      
      if (isDropdownTopic) {
        weeklyTopicCounts[originalTopic] = (weeklyTopicCounts[originalTopic] || 0) + 1;
        //console.log(`✅ Direct match: ${originalTopic}`);
      } else {
        // Use AI to match custom topic to dropdown topic
        try {
          const aiResponse = await axios.post('http://localhost:8000/match-topic/', {
            custom_topic: originalTopic,
            dropdown_topics: dropdownTopics
          });
          
          if (aiResponse.data && aiResponse.data.is_matched) {
            const matchedTopic = aiResponse.data.matched_topic;
            weeklyTopicCounts[matchedTopic] = (weeklyTopicCounts[matchedTopic] || 0) + 1;
            //console.log(`🤖 AI match: ${originalTopic} → ${matchedTopic}`);
          } else {
            weeklyTopicCounts[originalTopic] = (weeklyTopicCounts[originalTopic] || 0) + 1;
            console.log(`❌ No AI match: ${originalTopic}`);
          }
        } catch (aiError) {
          console.error('AI topic matching failed for request:', originalTopic, aiError.message);
          weeklyTopicCounts[originalTopic] = (weeklyTopicCounts[originalTopic] || 0) + 1;
        }
      }
    }
    
    // Aggregate by department
    const departmentStats = {};
    
    // Initialize all departments
    for (const department of Object.keys(topicDepartments)) {
      departmentStats[department] = {
        totalRequests: 0,
        weeklySessions: 0,
        topics: []
      };
    }
    
    // Count total requests by department
    for (const [topic, count] of Object.entries(topicCounts)) {
      const department = getDepartmentForTopic(topic);
      if (departmentStats[department]) {
        departmentStats[department].totalRequests += count;
        departmentStats[department].topics.push({ topic, count });
      }
    }
    
    // Count weekly sessions by department
    //console.log('📊 Weekly topic counts:', weeklyTopicCounts);
    for (const [topic, count] of Object.entries(weeklyTopicCounts)) {
      const department = getDepartmentForTopic(topic);
      //console.log(`📊 Topic "${topic}" -> Department "${department}" (count: ${count})`);
      if (departmentStats[department]) {
        departmentStats[department].weeklySessions += count;
      } else {
        console.log(`⚠️ Department "${department}" not found in departmentStats`);
      }
    }
    
    //console.log('📊 Department stats after processing:', departmentStats);
    
    // Check if any departments have sessions
    const departmentsWithSessions = Object.entries(departmentStats).filter(([dept, stats]) => stats.weeklySessions > 0);
    //console.log('📊 Departments with sessions:', departmentsWithSessions);
    
    // Convert to array format for frontend
    const departmentArray = Object.entries(departmentStats)
      .map(([department, stats]) => ({
        department,
        totalRequests: stats.totalRequests,
        weeklySessions: stats.weeklySessions,
        topics: stats.topics
      }))
      .sort((a, b) => b.weeklySessions - a.weeklySessions); // Sort by weekly sessions
    
    //console.log('📊 Department statistics calculated:', departmentArray);
    
    res.json(departmentArray);
    
  } catch (error) {
    console.error('Error in department stats route:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

// Search mentors by name
router.get('/search-mentors', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Create a case-insensitive regex pattern for search
    const searchRegex = new RegExp(q, 'i');
    
    // Search in fullName field
    const mentors = await Mentor.find({
      fullName: { $regex: searchRegex }
    })
    .select('fullName currentRole industry')
    .limit(10)
    .sort({ fullName: 1 });

    res.json(mentors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search mentors' });
  }
});

// Simple test route for mentor session frequency
router.get('/mentor-session-frequency-simple', async (req, res) => {
  try {
    const { mentorIds } = req.query;
    
    if (!mentorIds) {
      return res.json([]);
    }

    const mentorIdArray = mentorIds.split(',');
    
    // Get sessions for each mentor and count them manually
    const results = [];
    
    for (const mentorId of mentorIdArray) {
      
      // Try different ways to find the mentor
      let mentor = await Mentor.findById(mentorId);
      
      if (!mentor) {
        // Try with ObjectId conversion
        try {
          const objectId = new mongoose.Types.ObjectId(mentorId);
          mentor = await Mentor.findById(objectId);
        } catch (error) {
          // Skip invalid ObjectId
        }
      }
      
      if (!mentor) {
        // Try with string comparison
        mentor = await Mentor.findOne({ _id: mentorId.toString() });
      }
      
      if (!mentor) {
        continue;
      }
      
      // Convert to ObjectId and check if it's valid
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(mentorId);
      } catch (error) {
        continue;
      }
      
      // Count sessions for this mentor
      const sessionCount = await Session.countDocuments({
        mentor: objectId,
        status: 'completed'
      });
      
      // Let's also check what sessions we actually found
      const sampleSessions = await Session.find({
        mentor: objectId,
        status: 'completed'
      }).limit(3);
      
      results.push({
        mentorId: mentorId,
        fullName: mentor.fullName,
        sessionCount: sessionCount
      });
    }
    
    res.json(results);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor session frequency' });
  }
});

// Get session frequency data for selected mentors
router.get('/mentor-session-frequency', async (req, res) => {
  try {
    const { mentorIds } = req.query;
    
    if (!mentorIds) {
      return res.json([]);
    }

    const mentorIdArray = mentorIds.split(',');
    
    // Aggregate sessions for each mentor
    const sessionFrequency = await Session.aggregate([
      {
        $match: {
          mentor: { $in: mentorIdArray.map(id => new mongoose.Types.ObjectId(id)) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$mentor',
          sessionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'mentors',
          localField: '_id',
          foreignField: '_id',
          as: 'mentorInfo'
        }
      },
      {
        $unwind: '$mentorInfo'
      },
      {
        $project: {
          mentorId: '$_id',
          fullName: '$mentorInfo.fullName',
          sessionCount: '$sessionCount'
        }
      },
      {
        $sort: { sessionCount: -1 }
      }
    ]);

    res.json(sessionFrequency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor session frequency' });
  }
});

// Debug route to check mentors collection
router.get('/debug-mentors', async (req, res) => {
  try {
    
    // Check total mentors
    const totalMentors = await Mentor.countDocuments();
    
    // Get first 5 mentors
    const sampleMentors = await Mentor.find({}).limit(5);
    
    // Try to find the specific mentor we're looking for
    const mentorId = '507f1f77bcf86cd799439012';
    const specificMentor = await Mentor.findById(mentorId);
    
    // Try with ObjectId
    try {
      const objectId = new mongoose.Types.ObjectId(mentorId);
      const mentorWithObjectId = await Mentor.findById(objectId);
    } catch (error) {
      // Skip invalid ObjectId
    }
    
    // Check if we're connected to the right database
    const dbName = mongoose.connection.db.databaseName;
    
    // Check collection name
    const collectionName = Mentor.collection.name;
    
    // Try direct database query
    const directQuery = await mongoose.connection.db.collection(collectionName).findOne({ _id: new mongoose.Types.ObjectId(mentorId) });
    
    // Try with findOne instead of findById
    const mentorWithFindOne = await Mentor.findOne({ _id: mentorId });
    
    res.json({
      totalMentors,
      sampleMentors: sampleMentors.map(m => ({
        id: m._id,
        fullName: m.fullName,
        currentRole: m.currentRole
      })),
      specificMentorFound: !!specificMentor,
      databaseName: dbName,
      collectionName: collectionName,
      directQueryFound: !!directQuery,
      findOneFound: !!mentorWithFindOne
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to see what's in the database
router.get('/debug-sessions', async (req, res) => {
  try {
    
    // Check total sessions
    const totalSessions = await Session.countDocuments();
    
    // Get first 5 sessions
    const sampleSessions = await Session.find({}).limit(5);
    
    // Check specific mentor
    const mentorId = '507f1f77bcf86cd799439012';
    const sessionsForMentor = await Session.find({
      mentor: new mongoose.Types.ObjectId(mentorId),
      status: 'completed'
    });
    
    res.json({
      totalSessions,
      sampleSessions: sampleSessions.map(s => ({
        id: s._id,
        mentor: s.mentor,
        status: s.status,
        date: s.date
      })),
      sessionsForSpecificMentor: sessionsForMentor.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup route to fix sessions with undefined dates
router.get('/cleanup-sessions', async (req, res) => {
  try {
    const invalidSessions = await Session.find({
      $or: [
        { date: { $exists: false } },
        { date: null },
        { date: undefined }
      ]
    });

    if (invalidSessions.length > 0) {
      const result = await Session.updateMany(
        {
          $or: [
            { date: { $exists: false } },
            { date: null },
            { date: undefined }
          ]
        },
        {
          $set: { date: new Date().toISOString() }
        }
      );

      res.json({
        message: `Fixed ${result.modifiedCount} sessions with invalid dates`,
        invalidSessionsFound: invalidSessions.length,
        sessionsFixed: result.modifiedCount
      });
    } else {
      res.json({
        message: 'No sessions with invalid dates found',
        invalidSessionsFound: 0,
        sessionsFixed: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all mentors for dropdown
router.get('/all-mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find({})
      .select('fullName email currentRole industry yearsExperience education')
      .sort({ fullName: 1 });
    
    res.json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// Get all unique topics for dropdown
router.get('/all-topics', async (req, res) => {
  try {
    // Get all unique topics from mentorship requests
    const topics = await MentorshipRequest.distinct('topic');
    
    // Filter out empty/null topics and sort alphabetically
    const validTopics = topics
      .filter(topic => topic && topic.trim() !== '')
      .sort();
    
    res.json(validTopics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get session report with filters
router.get('/session-report', async (req, res) => {
  try {
    const { startDate, endDate, topic, mentorName } = req.query;
    
    // Build query object
    let query = {};
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Add topic filter if provided
    if (topic) {
      // Find mentorship requests with the specified topic
      const mentorshipRequests = await MentorshipRequest.find({ topic: topic }).select('_id');
      const requestIds = mentorshipRequests.map(req => req._id);
      if (requestIds.length > 0) {
        query.mentorshipRequest = { $in: requestIds };
      } else {
        // If no mentorship requests found with this topic, return empty result
        return res.json({
          sessions: [],
          total: 0,
          filters: { startDate, endDate, topic, mentorName }
        });
      }
    }
    
    // Add mentor filter if provided
    if (mentorName) {
      // First find the mentor by name
      const mentor = await Mentor.findOne({ fullName: mentorName });
      if (mentor) {
        query.mentor = mentor._id;
      } else {
        // If mentor not found, return empty result
        return res.json({
          sessions: [],
          total: 0,
          filters: { startDate, endDate, topic, mentorName }
        });
      }
    }
    
    // Fetch sessions with populated mentor and mentee data
    const sessions = await Session.find(query)
      .populate('mentor', 'fullName currentRole industry')
      .populate('mentee', 'fullName department')
      .populate('mentorshipRequest', 'topic')
      .sort({ date: -1 });
    
    // Transform the data for the frontend
    const transformedSessions = sessions.map(session => ({
      id: session._id,
      date: session.date,
      mentor: session.mentor?.fullName || 'Unknown',
      mentorRole: session.mentor?.currentRole || 'Unknown',
      mentee: session.mentee?.fullName || 'Unknown',
      menteeDepartment: session.mentee?.department || 'Unknown',
      topic: session.mentorshipRequest?.topic || 'Unknown',
      type: session.type || 'Unknown',
      status: session.status || 'Unknown'
    }));
    
    res.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
      filters: { startDate, endDate, topic, mentorName }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session report' });
  }
});

// TEMPORARY: Create admin user for testing (REMOVE IN PRODUCTION)
router.post('/create-test-admin', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).send({ error: 'Email, password, and fullName are required' });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).send({ error: 'Admin with this email already exists' });
    }
    
    // Create new admin
    const admin = new Admin({
      email,
      password, // Store password as plain text
      fullName,
      role: 'admin',
      permissions: ['all'],
      isGoogleSignup: false
    });
    
    await admin.save();
    
    // Generate token
    const token = jwt.sign({ 
      userId: admin._id, 
      email: admin.email, 
      role: 'admin',
      permissions: admin.permissions 
    }, process.env.JWT_SECRET);
    
    res.status(201).send({ token, admin: { ...admin.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).send({ error: 'Failed to create admin user' });
  }
});

// Get all mentees for manual pairing
router.get('/all-mentees', async (req, res) => {
  try {
    const mentees = await Mentee.find({})
      .select('fullName email currentStatus fieldOfStudy completedSessions earnedBadges createdAt')
      .sort({ fullName: 1 });
    
    res.json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    res.status(500).json({ error: 'Failed to fetch mentees' });
  }
});

// Get mentorship requests for a specific mentee
router.get('/mentee-requests/:menteeId', async (req, res) => {
  try {
    const { menteeId } = req.params;
    
    const requests = await MentorshipRequest.find({ 
      mentee: menteeId,
      status: 'accepted'
    })
    .populate('mentor', 'fullName email industry')
    .populate('mentee', 'fullName email')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching mentee requests:', error);
    res.status(500).json({ error: 'Failed to fetch mentee requests' });
  }
});

// Replace mentor in a mentorship request
router.post('/replace-mentor', async (req, res) => {
  try {
    const { mentorshipRequestId, newMentorId, previousMentorId, menteeId } = req.body;
    
    // Update the mentorship request with new mentor
    const updatedRequest = await MentorshipRequest.findByIdAndUpdate(
      mentorshipRequestId,
      { mentor: newMentorId },
      { new: true }
    ).populate('mentor', 'fullName email')
     .populate('mentee', 'fullName email');
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Mentorship request not found' });
    }
    
    // Get mentor details for notifications
    const previousMentor = await Mentor.findById(previousMentorId);
    const newMentor = await Mentor.findById(newMentorId);
    const mentee = await Mentee.findById(menteeId);
    
    // Create notifications
    const notifications = [
      {
        recipient: previousMentorId,
        type: 'mentor_removed',
        title: 'Mentorship Session Removed',
        message: `Your mentorship session with ${mentee.fullName} has been removed.`,
        relatedRequest: mentorshipRequestId
      },
      {
        recipient: newMentorId,
        type: 'mentor_assigned',
        title: 'New Mentorship Request',
        message: `You have been assigned as a mentor for ${mentee.fullName} - ${updatedRequest.topic}`,
        relatedRequest: mentorshipRequestId
      },
      {
        recipient: menteeId,
        type: 'mentor_changed',
        title: 'Mentor Changed',
        message: `${previousMentor.fullName} was replaced with ${newMentor.fullName}`,
        relatedRequest: mentorshipRequestId
      }
    ];
    
    // Save notifications
    await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: 'Mentor replaced successfully',
      updatedRequest,
      notifications: notifications.length
    });
    
  } catch (error) {
    console.error('Error replacing mentor:', error);
    res.status(500).json({ error: 'Failed to replace mentor' });
  }
});

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working!' });
});

// POST mentor report
router.post('/mentor-report', async (req, res) => {
  try {
    //console.log('🔍 [BACKEND] Mentor report request received:', req.body);
    const { mentorIds, filters } = req.body;
    
    // Build filter query
    let query = {};
    
    // If mentorIds are provided, filter by them, otherwise get all mentors
    if (mentorIds && Array.isArray(mentorIds) && mentorIds.length > 0) {
      query._id = { $in: mentorIds };
      //console.log('📋 [BACKEND] Filtering by specific mentor IDs:', mentorIds);
    } /*else {
      console.log('📋 [BACKEND] No mentor IDs provided, getting all mentors');
    }*/
    
    if (filters) {
      //console.log('🔧 [BACKEND] Applying filters:', filters);
      if (filters.minSessions || filters.maxSessions) {
        query.completedSessions = {};
        if (filters.minSessions) query.completedSessions.$gte = parseInt(filters.minSessions);
        if (filters.maxSessions) query.completedSessions.$lte = parseInt(filters.maxSessions);
      }
      
      if (filters.minRating || filters.maxRating) {
        query.averageRating = {};
        if (filters.minRating) query.averageRating.$gte = parseFloat(filters.minRating);
        if (filters.maxRating) query.averageRating.$lte = parseFloat(filters.maxRating);
      }
      
      if (filters.minMentees || filters.maxMentees) {
        query.menteesCount = {};
        if (filters.minMentees) query.menteesCount.$gte = parseInt(filters.minMentees);
        if (filters.maxMentees) query.menteesCount.$lte = parseInt(filters.maxMentees);
      }
    }

    //console.log('🔍 [BACKEND] Final query:', JSON.stringify(query, null, 2));

    const mentors = await Mentor.find(query)
      .select('fullName email industry completedSessions averageRating totalRatings menteesCount yearsExperience currentRole education')
      .sort({ averageRating: -1, completedSessions: -1 });

    //console.log('✅ [BACKEND] Found mentors:', mentors.length);
    res.json(mentors);
    
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching mentor report:', error);
    res.status(500).json({ error: 'Failed to fetch mentor report' });
  }
});

// Get mentee comparison data
router.post('/mentee-comparison', async (req, res) => {
  try {
    console.log('🔍 [BACKEND] Mentee comparison request received:', req.body);
    const { menteeIds } = req.body;
    
    if (!menteeIds || !Array.isArray(menteeIds) || menteeIds.length === 0) {
      return res.status(400).json({ error: 'Mentee IDs are required' });
    }

    //console.log('📋 [BACKEND] Fetching mentees:', menteeIds);

    const mentees = await Mentee.find({ _id: { $in: menteeIds } })
      .select('fullName email completedSessions earnedBadges createdAt')
      .sort({ completedSessions: -1 });

   // console.log('✅ [BACKEND] Found mentees:', mentees.length);

    // Transform data for chart
    const comparisonData = mentees.map(mentee => {
      const earnedBadgesCount = mentee.earnedBadges?.filter(badge => badge.earned).length || 0;
      
      return {
        name: mentee.fullName,
        sessions: mentee.completedSessions || 0,
        badges: earnedBadgesCount,
        email: mentee.email,
        earnedBadges: mentee.earnedBadges || [],
        joinedDate: mentee.createdAt
      };
    });

    //console.log('📊 [BACKEND] Comparison data:', comparisonData);
    res.json(comparisonData);
    
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching mentee comparison data:', error);
    res.status(500).json({ error: 'Failed to fetch mentee comparison data' });
  }
});

// Create mentorship request (admin endpoint)
router.post('/create-mentorship-request', async (req, res) => {
  try {
    //console.log('🔍 [BACKEND] Create mentorship request received:', req.body);
    const { menteeId, mentorId, topic, description, communicationMethod, learningGoal, mentorshipHeading } = req.body;
    
    if (!menteeId || !mentorId || !topic) {
      return res.status(400).json({ error: 'Mentee ID, Mentor ID, and topic are required' });
    }

    // Verify mentee exists
    const mentee = await Mentee.findById(menteeId);
    if (!mentee) {
      return res.status(404).json({ error: 'Mentee not found' });
    }

    // Verify mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Create mentorship request
    const request = new MentorshipRequest({
      mentee: menteeId,
      mentor: mentorId,
      topic: topic,
      mentorshipHeading: mentorshipHeading || `Mentorship in ${topic}`,
      description: description || `Mentorship request for ${topic}`,
      communicationMethod: communicationMethod || 'both',
      learningGoal: learningGoal || 'Professional development and guidance',
      status: 'pending'
    });

    await request.save();
    //console.log('✅ [BACKEND] Mentorship request created:', request._id);

    // Create notification for mentor
    await new Notification({
      recipient: mentorId,
      message: `New mentorship request from ${mentee.fullName} on topic "${topic}"`,
      type: 'mentorship_request',
      relatedRequest: request._id
    }).save();

    //console.log('✅ [BACKEND] Notification created for mentor');

    res.status(201).json({ 
      message: 'Mentorship request created successfully', 
      request: {
        _id: request._id,
        mentee: mentee.fullName,
        mentor: mentor.fullName,
        topic: request.topic,
        status: request.status
      }
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Error creating mentorship request:', error);
    res.status(500).json({ error: 'Failed to create mentorship request' });
  }
});

// Password reset request endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).send({ error: 'Email is required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if admin exists or not for security
      return res.status(200).send({ 
        message: 'If an admin account with this email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to admin
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = resetExpires;
    await admin.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: admin.email,
      subject: 'Admin Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${admin.fullName},</p>
          <p>You have requested to reset your admin password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetUrl}
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).send({ 
      message: 'If an admin account with this email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).send({ error: 'Failed to process password reset request' });
  }
});

// Password reset verification and update endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).send({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({ error: 'Password must be at least 6 characters long' });
    }

    // Find admin with valid reset token
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).send({ error: 'Invalid or expired reset token' });
    }

    // Update admin password and clear reset token
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.status(200).send({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).send({ error: 'Failed to reset password' });
  }
});

// Verify reset token endpoint (for frontend to check if token is valid)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).send({ error: 'Invalid or expired reset token' });
    }

    res.status(200).send({ message: 'Token is valid', email: admin.email });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).send({ error: 'Failed to verify token' });
  }
});

module.exports = router;
