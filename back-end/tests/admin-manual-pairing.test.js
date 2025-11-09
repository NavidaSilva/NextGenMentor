const request = require('supertest');

// Mock the models with very simple mocks
jest.mock('../models/Mentor', () => ({
  findById: jest.fn(),
  find: jest.fn()
}));

jest.mock('../models/Mentee', () => ({
  findById: jest.fn(),
  find: jest.fn()
}));

jest.mock('../models/MentorshipRequest', () => {
  const mockPopulate = jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue({})
  });
  
  return {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      populate: mockPopulate
    }),
    findOne: jest.fn(),
    distinct: jest.fn()
  };
});

jest.mock('../models/Notification', () => ({
  insertMany: jest.fn()
}));

// Import the mocked models
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

// Import the real app
const app = require('../app');

describe('Admin Manual Pairing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/all-topics', () => {
    test('should return all unique topics', async () => {
      const mockTopics = ['Web Development', 'Data Science', 'Machine Learning'];

      MentorshipRequest.distinct.mockResolvedValue(mockTopics);

      const response = await request(app)
        .get('/admin/all-topics')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body).toContain('Web Development');
      expect(response.body).toContain('Data Science');
      expect(response.body).toContain('Machine Learning');
    });

    test('should filter out empty topics', async () => {
      const mockTopics = ['Web Development', '', 'Data Science', null, 'Machine Learning'];

      MentorshipRequest.distinct.mockResolvedValue(mockTopics);

      const response = await request(app)
        .get('/admin/all-topics')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body).not.toContain('');
      expect(response.body).not.toContain(null);
    });

    test('should handle database errors gracefully', async () => {
      MentorshipRequest.distinct.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/admin/all-topics')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to fetch topics');
    });
  });

  describe('POST /admin/create-mentorship-request', () => {
    test('should validate required fields', async () => {
      const invalidRequestData = {
        menteeId: '507f1f77bcf86cd799439012',
        // Missing mentorId and topic
        description: 'Learn modern web development'
      };

      const response = await request(app)
        .post('/admin/create-mentorship-request')
        .send(invalidRequestData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Mentee ID, Mentor ID, and topic are required');
    });

    test('should handle mentee not found', async () => {
      const requestData = {
        menteeId: 'invalid-mentee-id',
        mentorId: '507f1f77bcf86cd799439011',
        topic: 'Web Development'
      };

      Mentee.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/admin/create-mentorship-request')
        .send(requestData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Mentee not found');
    });

    test('should handle mentor not found', async () => {
      const requestData = {
        menteeId: '507f1f77bcf86cd799439012',
        mentorId: 'invalid-mentor-id',
        topic: 'Web Development'
      };

      Mentee.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
      Mentor.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/admin/create-mentorship-request')
        .send(requestData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Mentor not found');
    });
  });

  describe('POST /admin/replace-mentor', () => {
    test('should handle missing mentorship request ID', async () => {
      const requestData = {
        mentorshipRequestId: '',
        newMentorId: '507f1f77bcf86cd799439011',
        previousMentorId: '507f1f77bcf86cd799439013',
        menteeId: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/admin/replace-mentor')
        .send(requestData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to replace mentor');
    });

    test('should handle missing mentee ID', async () => {
      const requestData = {
        mentorshipRequestId: '507f1f77bcf86cd799439014',
        newMentorId: '507f1f77bcf86cd799439011',
        previousMentorId: '507f1f77bcf86cd799439013',
        menteeId: ''
      };

      const response = await request(app)
        .post('/admin/replace-mentor')
        .send(requestData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to replace mentor');
    });
  });
});
