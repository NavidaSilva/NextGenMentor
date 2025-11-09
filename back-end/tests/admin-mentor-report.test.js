const request = require('supertest');

// Mock the models
jest.mock('../models/Mentor', () => ({
  find: jest.fn()
}));

jest.mock('../models/Session', () => ({
  find: jest.fn()
}));

jest.mock('../models/MentorshipRequest', () => ({
  find: jest.fn()
}));

// Import the mocked models
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const MentorshipRequest = require('../models/MentorshipRequest');

// Create a simple Express app for testing
const express = require('express');
const app = express();

app.use(express.json());

// Simple test route that mimics the mentor report logic
app.post('/admin/mentor-report', async (req, res) => {
  try {
    const { mentorIds, filters = {} } = req.body;
    
    // Build filter query
    let query = {};
    if (mentorIds && mentorIds.length > 0) {
      query._id = { $in: mentorIds };
    }

    const mentors = await Mentor.find(query)
      .select('fullName email currentRole industry yearsExperience education')
      .sort({ fullName: 1 });

    // Get sessions for each mentor
    const sessions = await Session.find({ mentor: { $in: mentors.map(m => m._id) } })
      .select('mentor status rating');

    // Get mentorship requests for each mentor
    const requests = await MentorshipRequest.find({ mentor: { $in: mentors.map(m => m._id) } })
      .select('mentor status');

    // Process mentor data
    const mentorReports = mentors.map(mentor => {
      const mentorSessions = sessions.filter(s => s.mentor.toString() === mentor._id.toString());
      const mentorRequests = requests.filter(r => r.mentor.toString() === mentor._id.toString());
      
      const completedSessions = mentorSessions.filter(s => s.status === 'completed');
      const totalSessions = completedSessions.length;
      const averageRating = completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / completedSessions.length 
        : 0;
      const menteesCount = mentorRequests.filter(r => r.status === 'accepted').length;

      return {
        ...mentor.toObject(),
        totalSessions,
        averageRating: Math.round(averageRating * 100) / 100,
        menteesCount
      };
    });

    // Apply filters
    let filteredMentors = mentorReports;
    
    if (filters.minSessions) {
      filteredMentors = filteredMentors.filter(m => m.totalSessions >= filters.minSessions);
    }
    
    if (filters.minRating) {
      filteredMentors = filteredMentors.filter(m => m.averageRating >= filters.minRating);
    }
    
    if (filters.minMentees) {
      filteredMentors = filteredMentors.filter(m => m.menteesCount >= filters.minMentees);
    }

    res.json({ mentors: filteredMentors });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor report' });
  }
});

describe('Admin Mentor Report Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate mentor report with filters', async () => {
    const requestData = {
      mentorIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      filters: {
        minSessions: 5,
        minRating: 4.0,
        minMentees: 2
      }
    };

    const mockMentors = [
      {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Dr. Smith',
        email: 'smith@example.com',
        currentRole: 'Senior Developer',
        industry: 'Technology',
        yearsExperience: 10,
        education: 'PhD Computer Science',
        toObject: function() { return this; }
      },
      {
        _id: '507f1f77bcf86cd799439012',
        fullName: 'Prof. Johnson',
        email: 'johnson@example.com',
        currentRole: 'Professor',
        industry: 'Education',
        yearsExperience: 15,
        education: 'PhD Mathematics',
        toObject: function() { return this; }
      }
    ];

    const mockSessions = [
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.5 },
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.8 },
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.6 },
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.7 },
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.9 },
      { mentor: '507f1f77bcf86cd799439012', status: 'completed', rating: 4.2 },
      { mentor: '507f1f77bcf86cd799439012', status: 'completed', rating: 4.3 },
      { mentor: '507f1f77bcf86cd799439012', status: 'completed', rating: 4.4 },
      { mentor: '507f1f77bcf86cd799439012', status: 'completed', rating: 4.5 },
      { mentor: '507f1f77bcf86cd799439012', status: 'completed', rating: 4.6 }
    ];

    const mockRequests = [
      { mentor: '507f1f77bcf86cd799439011', status: 'accepted' },
      { mentor: '507f1f77bcf86cd799439011', status: 'accepted' },
      { mentor: '507f1f77bcf86cd799439012', status: 'accepted' },
      { mentor: '507f1f77bcf86cd799439012', status: 'accepted' }
    ];

    // Mock the chaining behavior
    const mockMentorQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockMentors)
    };
    const mockSessionQuery = {
      select: jest.fn().mockResolvedValue(mockSessions)
    };
    const mockRequestQuery = {
      select: jest.fn().mockResolvedValue(mockRequests)
    };
    
    Mentor.find.mockReturnValue(mockMentorQuery);
    Session.find.mockReturnValue(mockSessionQuery);
    MentorshipRequest.find.mockReturnValue(mockRequestQuery);

    const response = await request(app)
      .post('/admin/mentor-report')
      .send(requestData)
      .expect(200);
    expect(response.body).toHaveProperty('mentors');
    expect(Array.isArray(response.body.mentors)).toBe(true);
    expect(response.body.mentors.length).toBe(2);
    
    const mentor = response.body.mentors[0];
    expect(mentor).toHaveProperty('fullName');
    expect(mentor).toHaveProperty('email');
    expect(mentor).toHaveProperty('currentRole');
    expect(mentor).toHaveProperty('industry');
    expect(mentor).toHaveProperty('yearsExperience');
    expect(mentor).toHaveProperty('education');
    expect(mentor).toHaveProperty('totalSessions');
    expect(mentor).toHaveProperty('averageRating');
    expect(mentor).toHaveProperty('menteesCount');
  });

  test('should handle empty mentor IDs (all mentors)', async () => {
    const requestData = {
      mentorIds: []
    };

    const mockMentors = [
      {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Dr. Smith',
        email: 'smith@example.com',
        currentRole: 'Senior Developer',
        industry: 'Technology',
        yearsExperience: 10,
        education: 'PhD Computer Science',
        toObject: function() { return this; }
      }
    ];

    // Mock the chaining behavior
    const mockMentorQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockMentors)
    };
    const mockSessionQuery = {
      select: jest.fn().mockResolvedValue([])
    };
    const mockRequestQuery = {
      select: jest.fn().mockResolvedValue([])
    };
    
    Mentor.find.mockReturnValue(mockMentorQuery);
    Session.find.mockReturnValue(mockSessionQuery);
    MentorshipRequest.find.mockReturnValue(mockRequestQuery);

    const response = await request(app)
      .post('/admin/mentor-report')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('mentors');
    expect(Array.isArray(response.body.mentors)).toBe(true);
    expect(response.body.mentors.length).toBe(1);
  });

  test('should handle database errors', async () => {
    const requestData = {
      mentorIds: ['507f1f77bcf86cd799439011']
    };

    // Mock the chaining behavior to throw an error
    const mockMentorQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    };
    Mentor.find.mockReturnValue(mockMentorQuery);

    const response = await request(app)
      .post('/admin/mentor-report')
      .send(requestData)
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to fetch mentor report');
  });

  test('should filter mentors by minimum sessions', async () => {
    const requestData = {
      mentorIds: ['507f1f77bcf86cd799439011'],
      filters: {
        minSessions: 10
      }
    };

    const mockMentors = [
      {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Dr. Smith',
        email: 'smith@example.com',
        currentRole: 'Senior Developer',
        industry: 'Technology',
        yearsExperience: 10,
        education: 'PhD Computer Science',
        toObject: function() { return this; }
      }
    ];

    const mockSessions = [
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.5 },
      { mentor: '507f1f77bcf86cd799439011', status: 'completed', rating: 4.8 }
    ];

    // Mock the chaining behavior
    const mockMentorQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockMentors)
    };
    const mockSessionQuery = {
      select: jest.fn().mockResolvedValue(mockSessions)
    };
    const mockRequestQuery = {
      select: jest.fn().mockResolvedValue([])
    };
    
    Mentor.find.mockReturnValue(mockMentorQuery);
    Session.find.mockReturnValue(mockSessionQuery);
    MentorshipRequest.find.mockReturnValue(mockRequestQuery);

    const response = await request(app)
      .post('/admin/mentor-report')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('mentors');
    // Should filter out mentors with less than 10 sessions
    expect(response.body.mentors.length).toBe(0);
  });
});
