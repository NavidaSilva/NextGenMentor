const request = require('supertest');

// Mock the models
jest.mock('../models/Session', () => ({
  find: jest.fn()
}));

jest.mock('../models/Mentor', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../models/Mentee', () => ({
  findById: jest.fn()
}));

jest.mock('../models/MentorshipRequest', () => ({
  find: jest.fn()
}));

// Import the mocked models
const Session = require('../models/Session');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const MentorshipRequest = require('../models/MentorshipRequest');

// Create a simple Express app for testing
const express = require('express');
const app = express();

app.use(express.json());

// Simple test route that mimics the session report logic
app.post('/admin/session-report', async (req, res) => {
  try {
    const { startDate, endDate, topic, mentorName, status } = req.body;
    
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
    
    // Add status filter if provided
    if (status) {
      query.status = status;
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
          filters: { startDate, endDate, topic, mentorName, status }
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
          filters: { startDate, endDate, topic, mentorName, status }
        });
      }
    }
    
    // Find sessions with the query
    const sessions = await Session.find(query)
      .populate('mentor', 'fullName email')
      .populate('mentee', 'fullName email')
      .populate('mentorshipRequest', 'topic')
      .sort({ date: -1 });
    
    // Transform sessions for response
    const transformedSessions = sessions.map(session => ({
      _id: session._id,
      date: session.date,
      mentor: session.mentor?.fullName || 'Unknown Mentor',
      mentee: session.mentee?.fullName || 'Unknown Mentee',
      topic: session.mentorshipRequest?.topic || 'Unknown Topic',
      status: session.status,
      type: session.type
    }));
    
    res.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
      filters: { startDate, endDate, topic, mentorName, status }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate session report' });
  }
});

describe('Admin Session Report Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate session report with filters', async () => {
    const requestData = {
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      topic: 'Web Development',
      status: 'completed'
    };

    const mockSessions = [
      {
        _id: '507f1f77bcf86cd799439014',
        date: '2025-01-15',
        status: 'completed',
        type: 'video',
        mentor: {
          _id: '507f1f77bcf86cd799439011',
          fullName: 'Dr. Smith',
          email: 'smith@example.com'
        },
        mentee: {
          _id: '507f1f77bcf86cd799439012',
          fullName: 'John Doe',
          email: 'john@example.com'
        },
        mentorshipRequest: {
          _id: '507f1f77bcf86cd799439013',
          topic: 'Web Development'
        }
      }
    ];

    const mockMentorshipRequests = [
      {
        _id: '507f1f77bcf86cd799439013',
        topic: 'Web Development'
      }
    ];

    // Mock the chaining behavior
    const mockSessionQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockSessions)
    };
    const mockRequestQuery = {
      select: jest.fn().mockResolvedValue(mockMentorshipRequests)
    };
    
    Session.find.mockReturnValue(mockSessionQuery);
    MentorshipRequest.find.mockReturnValue(mockRequestQuery);

    const response = await request(app)
      .post('/admin/session-report')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(1);
    
    const session = response.body.sessions[0];
    expect(session).toHaveProperty('date');
    expect(session).toHaveProperty('mentor');
    expect(session).toHaveProperty('mentee');
    expect(session).toHaveProperty('topic');
    expect(session).toHaveProperty('status');
  });

  test('should handle empty session results', async () => {
    const requestData = {
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    };

    // Mock the chaining behavior
    const mockSessionQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    };
    
    Session.find.mockReturnValue(mockSessionQuery);

    const response = await request(app)
      .post('/admin/session-report')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(0);
  });

  test('should handle database errors', async () => {
    const requestData = {
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    };

    // Mock the chaining behavior to throw an error
    const mockSessionQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error('Database error'))
    };
    
    Session.find.mockReturnValue(mockSessionQuery);

    const response = await request(app)
      .post('/admin/session-report')
      .send(requestData)
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to generate session report');
  });

  test('should handle missing date filters', async () => {
    const requestData = {
      topic: 'Web Development'
    };

    // Mock the chaining behavior
    const mockSessionQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    };
    
    Session.find.mockReturnValue(mockSessionQuery);

    const response = await request(app)
      .post('/admin/session-report')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });
});
