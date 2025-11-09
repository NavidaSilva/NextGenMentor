const request = require('supertest');
const axios = require('axios');

// Mock models
const mockMentorshipRequest = {
  _id: '507f1f77bcf86cd799439014',
  topic: 'Computer Science / IT',
  status: 'accepted',
  createdAt: new Date('2024-01-10T00:00:00.000Z')
};

const mockMentorshipRequestCustom = {
  _id: '507f1f77bcf86cd799439015',
  topic: 'Web Development',
  status: 'pending',
  createdAt: new Date('2024-01-12T00:00:00.000Z')
};

const mockMentorshipRequestRecent = {
  _id: '507f1f77bcf86cd799439016',
  topic: 'Data Science / AI',
  status: 'accepted',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
};

// Mock the models
jest.mock('../models/MentorshipRequest', () => ({
  find: jest.fn()
}));

jest.mock('axios');

// Import the mocked models
const MentorshipRequest = require('../models/MentorshipRequest');

// Import the real app
const app = require('../app');

describe('Admin Most Active Departments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/department-stats', () => {
    test('should return department statistics with dropdown topics', async () => {
      // Mock mentorship requests with dropdown topics
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '2', topic: 'Business Administration' },
        { ...mockMentorshipRequest, _id: '3', topic: 'Engineering' },
        { ...mockMentorshipRequest, _id: '4', topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '5', topic: 'Data Science / AI' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests) // All requests
        .mockResolvedValueOnce(mockRequests.slice(0, 3)); // Weekly requests

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of department data
      const department = response.body[0];
      expect(department).toHaveProperty('department');
      expect(department).toHaveProperty('totalRequests');
      expect(department).toHaveProperty('weeklySessions');
      expect(department).toHaveProperty('topics');
      expect(Array.isArray(department.topics)).toBe(true);
    });

    test('should handle AI topic matching for custom topics', async () => {
      // Mock mentorship requests with custom topics
      const mockRequests = [
        { ...mockMentorshipRequestCustom, topic: 'Web Development' },
        { ...mockMentorshipRequestCustom, _id: '2', topic: 'Machine Learning' },
        { ...mockMentorshipRequestCustom, _id: '3', topic: 'Computer Science / IT' }
      ];

      // Mock AI service response
      axios.post.mockResolvedValue({
        data: {
          is_matched: true,
          matched_topic: 'Computer Science / IT',
          similarity_score: 0.85
        }
      });

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests) // All requests
        .mockResolvedValueOnce(mockRequests); // Weekly requests

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(axios.post).toHaveBeenCalled();
    });

    test('should handle AI service failure gracefully', async () => {
      const mockRequests = [
        { ...mockMentorshipRequestCustom, topic: 'Custom Topic' }
      ];

      // Mock AI service failure
      axios.post.mockRejectedValue(new Error('AI service unavailable'));

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should still return data even if AI fails
    });

    test('should group topics by correct departments', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '2', topic: 'Data Science / AI' },
        { ...mockMentorshipRequest, _id: '3', topic: 'Business Administration' },
        { ...mockMentorshipRequest, _id: '4', topic: 'Engineering' },
        { ...mockMentorshipRequest, _id: '5', topic: 'Medicine / Health Sciences' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Check that we have departments
      const departments = response.body.map(d => d.department);
      expect(departments).toContain('Technology & Engineering');
      expect(departments).toContain('Business & Management');
      expect(departments).toContain('Health & Life Sciences');
    });

    test('should handle empty mentorship requests', async () => {
      MentorshipRequest.find
        .mockResolvedValueOnce([]) // No requests
        .mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should still return department structure even with no data
    });

    test('should handle requests with empty or null topics', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: '' },
        { ...mockMentorshipRequest, _id: '2', topic: null },
        { ...mockMentorshipRequest, _id: '3', topic: 'Computer Science / IT' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should handle empty topics gracefully
    });

    test('should sort departments by weekly sessions', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '2', topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '3', topic: 'Business Administration' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Check that departments are sorted by weekly sessions (descending)
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].weeklySessions).toBeGreaterThanOrEqual(
          response.body[i + 1].weeklySessions
        );
      }
    });

    test('should handle database errors gracefully', async () => {
      MentorshipRequest.find.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to fetch department statistics');
    });

    test('should use all requests as fallback when no weekly requests', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '2', topic: 'Business Administration' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests) // All requests
        .mockResolvedValueOnce([]); // No weekly requests

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should use all requests as fallback
    });

    test('should include all 6 departments in response', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Computer Science / IT' },
        { ...mockMentorshipRequest, _id: '2', topic: 'Business Administration' },
        { ...mockMentorshipRequest, _id: '3', topic: 'Medicine / Health Sciences' },
        { ...mockMentorshipRequest, _id: '4', topic: 'Design / Fine Arts' },
        { ...mockMentorshipRequest, _id: '5', topic: 'Education' },
        { ...mockMentorshipRequest, _id: '6', topic: 'Biotechnology' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(6);

      const departments = response.body.map(d => d.department);
      expect(departments).toContain('Technology & Engineering');
      expect(departments).toContain('Business & Management');
      expect(departments).toContain('Health & Life Sciences');
      expect(departments).toContain('Creative & Design');
      expect(departments).toContain('Education & Social Sciences');
      expect(departments).toContain('Applied Sciences & Services');
    });

    test('should handle topics that do not match any department', async () => {
      const mockRequests = [
        { ...mockMentorshipRequest, topic: 'Unknown Topic' }
      ];

      MentorshipRequest.find
        .mockResolvedValueOnce(mockRequests)
        .mockResolvedValueOnce(mockRequests);

      const response = await request(app)
        .get('/admin/department-stats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should handle unknown topics gracefully
    });
  });
});
