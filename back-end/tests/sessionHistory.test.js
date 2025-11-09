const request = require('supertest');
const app = require('../app');
const Session = require('../models/Session');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const { awardBadges } = require('../controllers/sessionController');

// Mock the models
jest.mock('../models/Session');
jest.mock('../models/Mentor');
jest.mock('../models/Mentee');

// Mock the session controller
jest.mock('../controllers/sessionController', () => ({
  awardBadges: jest.fn().mockResolvedValue()
}));

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'mockUserId' }, process.env.JWT_SECRET);

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe('Session History Routes - Simple Tests', () => {
  const mockUserId = 'mockUserId';
  const mockMentorId = 'mockMentorId';
  const mockMenteeId = 'mockMenteeId';
  const mockSessionId = 'mockSessionId';
  const authHeader = `Bearer ${token}`;

  beforeEach(() => {
    jest.clearAllMocks();
    awardBadges.mockResolvedValue();
  });

  describe('GET /sessions/upcoming', () => {
    it('should return upcoming sessions for mentee', async () => {
      const mockSessions = [
        {
          _id: 'session1',
          mentor: { _id: mockMentorId, fullName: 'John Mentor' },
          mentee: { _id: mockMenteeId, fullName: 'Jane Mentee' },
          date: new Date('2025-12-25T10:00:00Z'),
          type: 'video',
          status: 'upcoming'
        }
      ];

      // Mock the chain of methods properly
      Session.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockSessions)
          })
        })
      });

      const res = await request(app)
        .get('/sessions/upcoming')
        .set('Authorization', authHeader)
        .set('Role', 'mentee');

      // Log the response for debugging
      if (res.statusCode !== 200) {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', res.body);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body.sessions).toHaveLength(1);
      expect(res.body.sessions[0]._id).toBe('session1');
      expect(res.body.sessions[0].type).toBe('video');
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .get('/sessions/upcoming')
        .set('Authorization', authHeader)
        .set('Role', 'invalid');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid role');
    });
  });

  describe('GET /sessions/:id', () => {
    it('should return session details', async () => {
      const mockSession = {
        _id: mockSessionId,
        mentor: { _id: mockMentorId, fullName: 'John Mentor' },
        mentee: { _id: mockMenteeId, fullName: 'Jane Mentee' },
        date: new Date('2025-12-25T10:00:00Z'),
        type: 'video',
        status: 'completed',
        actualDuration: 55
      };

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockSession)
        })
      });

      const res = await request(app)
        .get(`/sessions/${mockSessionId}`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(mockSessionId);
      expect(res.body.type).toBe('video');
      expect(res.body.status).toBe('completed');
    });

    it('should return 404 if session not found', async () => {
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const res = await request(app)
        .get(`/sessions/${mockSessionId}`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Session not found');
    });
  });

  describe('POST /sessions/:id/start', () => {
    it('should start session successfully', async () => {
      const mentorToken = jwt.sign({ userId: mockMentorId }, process.env.JWT_SECRET);
      const mentorAuthHeader = `Bearer ${mentorToken}`;

      const mockSession = {
        _id: mockSessionId,
        mentor: mockMentorId,
        mentee: mockMenteeId,
        status: 'upcoming',
        save: jest.fn().mockResolvedValue()
      };

      Session.findById.mockResolvedValue(mockSession);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/start`)
        .set('Authorization', mentorAuthHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Session started');
      expect(mockSession.status).toBe('in-progress');
      expect(mockSession.actualStartTime).toBeInstanceOf(Date);
    });

    it('should return 404 if session not found', async () => {
      Session.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/start`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Session not found');
    });
  });

  describe('POST /sessions/:id/complete', () => {
    it('should complete session successfully', async () => {
      const mentorToken = jwt.sign({ userId: mockMentorId }, process.env.JWT_SECRET);
      const mentorAuthHeader = `Bearer ${mentorToken}`;

      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      
      const mockSession = {
        _id: mockSessionId,
        mentor: mockMentorId,
        mentee: mockMenteeId,
        status: 'in-progress',
        actualStartTime: startTime,
        date: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        save: jest.fn().mockResolvedValue()
      };

      const mockMentee = {
        _id: mockMenteeId,
        completedSessions: 0,
        save: jest.fn().mockResolvedValue()
      };

      const mockMentor = {
        _id: mockMentorId,
        completedSessions: 0,
        menteeHistory: [],
        menteesCount: 0,
        save: jest.fn().mockResolvedValue()
      };

      Session.findById.mockResolvedValue(mockSession);
      Mentee.findById.mockResolvedValue(mockMentee);
      Mentor.findById.mockResolvedValue(mockMentor);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/complete`)
        .set('Authorization', mentorAuthHeader);

      // Log the response for debugging
      if (res.statusCode !== 200) {
        console.log('Complete session response status:', res.statusCode);
        console.log('Complete session response body:', res.body);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Session marked as completed');
      expect(res.body.session.status).toBe('completed');
      expect(res.body.session.actualEndTime).toBeDefined();
      expect(res.body.session.actualDuration).toBeGreaterThan(0);
    });

    it('should return 404 if session not found', async () => {
      Session.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/complete`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Session not found');
    });
  });

  describe('POST /sessions/:sessionId/recap/mentor', () => {
    it('should save mentor recap successfully', async () => {
      const mockSession = {
        _id: mockSessionId,
        recapMentor: '',
        save: jest.fn().mockResolvedValue()
      };

      Session.findById.mockResolvedValue(mockSession);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/recap/mentor`)
        .set('Authorization', authHeader)
        .send({ recap: 'Great session with the mentee' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Mentor recap saved');
      expect(mockSession.recapMentor).toBe('Great session with the mentee');
    });

    it('should return 404 if session not found', async () => {
      Session.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/sessions/${mockSessionId}/recap/mentor`)
        .set('Authorization', authHeader)
        .send({ recap: 'Great session' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Session not found');
    });
  });

  describe('Error handling', () => {
    it('should handle missing authorization header', async () => {
      const res = await request(app)
        .get(`/sessions/${mockSessionId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Please authenticate.');
    });

    it('should handle invalid JWT token', async () => {
      const res = await request(app)
        .get(`/sessions/${mockSessionId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Please authenticate.');
    });
  });
});