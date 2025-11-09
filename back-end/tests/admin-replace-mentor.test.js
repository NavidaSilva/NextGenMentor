const request = require('supertest');

// Mock the models
jest.mock('../models/Mentor', () => ({
  findById: jest.fn()
}));

jest.mock('../models/Mentee', () => ({
  findById: jest.fn()
}));

jest.mock('../models/MentorshipRequest', () => {
  const mockPopulate = jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue({})
  });
  
  return {
    findByIdAndUpdate: jest.fn().mockReturnValue({
      populate: mockPopulate
    })
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

describe('Admin Replace Mentor Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully replace mentor', async () => {
    const requestData = {
      mentorshipRequestId: '507f1f77bcf86cd799439014',
      newMentorId: '507f1f77bcf86cd799439011',
      previousMentorId: '507f1f77bcf86cd799439013',
      menteeId: '507f1f77bcf86cd799439012'
    };

    // Mock successful responses
    const mockUpdatedRequest = {
      _id: '507f1f77bcf86cd799439014',
      mentor: { fullName: 'New Mentor', email: 'new@example.com' },
      mentee: { fullName: 'Test Mentee', email: 'mentee@example.com' }
    };

    const mockPreviousMentor = { fullName: 'Previous Mentor' };
    const mockNewMentor = { fullName: 'New Mentor' };
    const mockMentee = { fullName: 'Test Mentee' };

    MentorshipRequest.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedRequest)
      })
    });

    Mentor.findById
      .mockResolvedValueOnce(mockPreviousMentor)
      .mockResolvedValueOnce(mockNewMentor);
    
    Mentee.findById.mockResolvedValue(mockMentee);
    Notification.insertMany.mockResolvedValue([]);

    const response = await request(app)
      .post('/admin/replace-mentor')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('message');
  });

  test('should handle mentorship request not found', async () => {
    const requestData = {
      mentorshipRequestId: 'invalid-id',
      newMentorId: '507f1f77bcf86cd799439011',
      previousMentorId: '507f1f77bcf86cd799439013',
      menteeId: '507f1f77bcf86cd799439012'
    };

    // Mock null response for not found
    MentorshipRequest.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      })
    });

    const response = await request(app)
      .post('/admin/replace-mentor')
      .send(requestData)
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Mentorship request not found');
  });

  test('should handle database errors', async () => {
    const requestData = {
      mentorshipRequestId: '507f1f77bcf86cd799439014',
      newMentorId: '507f1f77bcf86cd799439011',
      previousMentorId: '507f1f77bcf86cd799439013',
      menteeId: '507f1f77bcf86cd799439012'
    };

    // Mock database error
    MentorshipRequest.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      })
    });

    const response = await request(app)
      .post('/admin/replace-mentor')
      .send(requestData)
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to replace mentor');
  });
});
