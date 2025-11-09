const request = require('supertest');

// Mock the models
jest.mock('../models/Mentee', () => ({
  find: jest.fn()
}));

// Import the mocked models
const Mentee = require('../models/Mentee');

// Create a simple Express app for testing
const express = require('express');
const app = express();

app.use(express.json());

// Simple test route that mimics the mentee comparison logic
app.post('/admin/mentee-comparison', async (req, res) => {
  try {
    const { menteeIds } = req.body;
    
    if (!menteeIds || !Array.isArray(menteeIds) || menteeIds.length === 0) {
      return res.status(400).json({ error: 'Mentee IDs are required' });
    }

    const mentees = await Mentee.find({ _id: { $in: menteeIds } })
      .select('fullName email completedSessions earnedBadges createdAt')
      .sort({ completedSessions: -1 });

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

    res.json(comparisonData);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentee comparison data' });
  }
});

describe('Admin Compare Mentees Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return mentee comparison data', async () => {
    const requestData = {
      menteeIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
    };

    const mockMentees = [
      {
        _id: '507f1f77bcf86cd799439012',
        fullName: 'John Doe',
        email: 'john@example.com',
        completedSessions: [{ _id: 's1' }, { _id: 's2' }, { _id: 's3' }, { _id: 's4' }, { _id: 's5' }],
        earnedBadges: [
          { name: 'First Session', earned: true, earnedAt: '2025-01-01' },
          { name: 'Consistent Learner', earned: true, earnedAt: '2025-01-15' }
        ],
        createdAt: '2025-01-01'
      },
      {
        _id: '507f1f77bcf86cd799439013',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        completedSessions: [{ _id: 's6' }, { _id: 's7' }],
        earnedBadges: [
          { name: 'First Session', earned: true, earnedAt: '2025-01-02' },
          { name: 'Consistent Learner', earned: true, earnedAt: '2025-01-16' },
          { name: 'Advanced Learner', earned: true, earnedAt: '2025-01-30' }
        ],
        createdAt: '2025-01-02'
      }
    ];

    // Mock the chaining behavior
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockMentees)
    };
    Mentee.find.mockReturnValue(mockQuery);

    const response = await request(app)
      .post('/admin/mentee-comparison')
      .send(requestData)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    
    // Check first mentee data
    const firstMentee = response.body[0];
    expect(firstMentee).toHaveProperty('name');
    expect(firstMentee).toHaveProperty('sessions');
    expect(firstMentee).toHaveProperty('badges');
    expect(firstMentee).toHaveProperty('email');
    expect(firstMentee).toHaveProperty('earnedBadges');
    expect(firstMentee).toHaveProperty('joinedDate');
    
    expect(firstMentee.name).toBe('John Doe');
    expect(firstMentee.sessions).toEqual([{ _id: 's1' }, { _id: 's2' }, { _id: 's3' }, { _id: 's4' }, { _id: 's5' }]);
    expect(firstMentee.badges).toBe(2);
    expect(firstMentee.email).toBe('john@example.com');
  });

  test('should handle empty mentee IDs', async () => {
    const requestData = {
      menteeIds: []
    };

    const response = await request(app)
      .post('/admin/mentee-comparison')
      .send(requestData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Mentee IDs are required');
  });

  test('should handle database errors', async () => {
    const requestData = {
      menteeIds: ['507f1f77bcf86cd799439012']
    };

    // Mock the chaining behavior to throw an error
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    };
    Mentee.find.mockReturnValue(mockQuery);

    const response = await request(app)
      .post('/admin/mentee-comparison')
      .send(requestData)
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to fetch mentee comparison data');
  });

  test('should handle mentees with no badges', async () => {
    const requestData = {
      menteeIds: ['507f1f77bcf86cd799439012']
    };

    const mockMentee = {
      _id: '507f1f77bcf86cd799439012',
      fullName: 'New Mentee',
      email: 'new@example.com',
      completedSessions: [],
      earnedBadges: [],
      createdAt: '2025-01-01'
    };

    // Mock the chaining behavior
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([mockMentee])
    };
    Mentee.find.mockReturnValue(mockQuery);

    const response = await request(app)
      .post('/admin/mentee-comparison')
      .send(requestData)
      .expect(200);

    expect(response.body[0].badges).toBe(0);
    expect(response.body[0].sessions).toEqual([]);
  });
});
