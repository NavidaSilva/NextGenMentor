const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const mentorRouter = require('../routes/ratings'); 
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');

const app = express();
app.use(express.json());
app.use('/rate-mentor', mentorRouter);

// Mock DB models
jest.mock('../models/Mentor');
jest.mock('../models/Session');

describe('POST /rate-mentor', () => {
  let token;

  beforeAll(() => {
    // Ensure both route and test use the same secret
    process.env.JWT_SECRET = 'testsecret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Generate fresh mentee token before each test
    token = jwt.sign({ userId: 'u1', role: 'mentee' }, process.env.JWT_SECRET);
  });

  it('should return 403 if role is not mentee', async () => {
    const invalidToken = jwt.sign(
      { userId: 'u1', role: 'mentor' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({ mentorId: 'm1', rating: 5, sessionId: 's1' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only mentees can rate mentors');
  });

  it('should return 400 if rating is invalid', async () => {
    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${token}`)
      .send({ mentorId: 'm1', rating: 0, sessionId: 's1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid mentor ID or rating');
  });

  it('should return 404 if session not found', async () => {
    Session.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${token}`)
      .send({ mentorId: 'm1', rating: 5, sessionId: 's1' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('should return 400 if session already rated', async () => {
    Session.findById.mockResolvedValue({ menteeRated: true });

    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${token}`)
      .send({ mentorId: 'm1', rating: 5, sessionId: 's1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You have already rated this session');
  });

  it('should successfully rate mentor', async () => {
    const mockSession = { _id: 's1', menteeRated: false, save: jest.fn() };
    const mockMentor = { 
      _id: 'm1', 
      totalRatings: 1, 
      averageRating: 4, 
      save: jest.fn() 
    };

    Session.findById.mockResolvedValue(mockSession);
    Mentor.findById.mockResolvedValue(mockMentor);

    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${token}`)
      .send({ mentorId: 'm1', rating: 5, sessionId: 's1' });

    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBeCloseTo(4.5); // (4*1 + 5)/2
    expect(res.body.totalRatings).toBe(2);
    expect(mockSession.menteeRated).toBe(true);
    expect(mockSession.save).toHaveBeenCalled();
    expect(mockMentor.save).toHaveBeenCalled();
  });

  it('should return 500 on server error', async () => {
    Session.findById.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/rate-mentor')
      .set('Authorization', `Bearer ${token}`)
      .send({ mentorId: 'm1', rating: 5, sessionId: 's1' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server error');
  });
});
