const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const privacyRouter = require('../routes/privacyRoutes'); 
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');

jest.mock('../models/Mentee');
jest.mock('../models/Mentor');

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());
app.use(privacyRouter);

describe('Privacy Settings Routes', () => {
  const menteeToken = jwt.sign({ userId: 'mockMenteeId' }, process.env.JWT_SECRET);
  const mentorToken = jwt.sign({ userId: 'mockMentorId' }, process.env.JWT_SECRET);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /mentee/privacy - success', async () => {
  Mentee.findById.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue({ emailVisibility: true })
  }));

  const res = await request(app)
    .get('/mentee/privacy')
    .set('Authorization', `Bearer ${menteeToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.emailVisibility).toBe(true);
});

  it('GET /mentee/privacy - 404 mentee not found', async () => {
  Mentee.findById.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(null)
  }));

  const res = await request(app)
    .get('/mentee/privacy')
    .set('Authorization', `Bearer ${menteeToken}`);

  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe('Mentee not found');
});

  it('PUT /mentee/privacy - update success', async () => {
    Mentee.findByIdAndUpdate.mockResolvedValue({ emailVisibility: false });

    const res = await request(app)
      .put('/mentee/privacy')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({ emailVisibility: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Privacy settings updated');
    expect(res.body.emailVisibility).toBe(false);
  });

  it('PUT /mentee/privacy - 404 mentee not found', async () => {
    Mentee.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/mentee/privacy')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({ emailVisibility: false });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Mentee not found');
  });

  it('GET /mentor/privacy - success', async () => {
  Mentor.findById.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue({ emailVisibility: true })
  }));

  const res = await request(app)
    .get('/mentor/privacy')
    .set('Authorization', `Bearer ${mentorToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.emailVisibility).toBe(true);
});

  it('GET /mentor/privacy - 404 mentor not found', async () => {
  Mentor.findById.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(null)
  }));

  const res = await request(app)
    .get('/mentor/privacy')
    .set('Authorization', `Bearer ${mentorToken}`);

  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe('Mentor not found');
});

  it('PUT /mentor/privacy - update success', async () => {
    Mentor.findByIdAndUpdate.mockResolvedValue({ emailVisibility: false });

    const res = await request(app)
      .put('/mentor/privacy')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ emailVisibility: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Privacy settings updated');
    expect(res.body.emailVisibility).toBe(false);
  });

  it('PUT /mentor/privacy - 404 mentor not found', async () => {
    Mentor.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/mentor/privacy')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ emailVisibility: false });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Mentor not found');
  });

  it('returns 401 if no token provided', async () => {
    const res = await request(app).get('/mentee/privacy');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Please authenticate.');
  });

  it('returns 401 if invalid token provided', async () => {
    const res = await request(app)
      .get('/mentor/privacy')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Please authenticate.');
  });
});
