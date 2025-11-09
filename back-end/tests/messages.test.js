const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const messagesRouter = require('../routes/chat'); 
const ChatMessage = require('../models/ChatMessage');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');

jest.mock('../models/ChatMessage');
jest.mock('../models/Session');

jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/messages', messagesRouter);

const fakeToken = 'Bearer faketoken';
const userId = '64e0f5c7c123456789abcdef';
const sessionId = new mongoose.Types.ObjectId().toHexString();

jwt.verify.mockImplementation(() => ({ userId }));

const sessionMock = {
  _id: sessionId,
  mentor: userId,
  mentee: 'anotherUserId',
  status: 'active',
};

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return messages if authorized', async () => {
  Session.findById.mockResolvedValue(sessionMock);

  const chatMessages = [
    { _id: 'msg1', message: 'Hello', user: { fullName: 'Test User' }, timestamp: new Date().toISOString() },
  ];

  ChatMessage.find.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(chatMessages),
    }),
  });

  const res = await request(app)
    .get(`/messages/${sessionId}`)
    .set('Authorization', fakeToken);

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual(chatMessages); 
});


  it('should return 400 for invalid session ID', async () => {
    const res = await request(app)
      .get('/messages/invalid-id')
      .set('Authorization', fakeToken);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid session ID');
  });

  it('should return 403 if not authorized', async () => {
    Session.findById.mockResolvedValue({ ...sessionMock, mentor: 'otherId', mentee: 'otherId' });

    const res = await request(app)
      .get(`/messages/${sessionId}`)
      .set('Authorization', fakeToken);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should create a new message', async () => {
    Session.findById.mockResolvedValue(sessionMock);

    ChatMessage.prototype.save = jest.fn().mockResolvedValue({});
    ChatMessage.prototype.populate = jest.fn().mockResolvedValue({
      _id: 'msg1',
      message: 'Hi there',
      user: { fullName: 'Test User' },
    });

    const res = await request(app)
      .post(`/messages/${sessionId}`)
      .set('Authorization', fakeToken)
      .send({ message: 'Hi there' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Hi there');
    expect(res.body.user.fullName).toBe('Test User');
  });

  it('should return 400 if message is empty', async () => {
    const res = await request(app)
      .post(`/messages/${sessionId}`)
      .set('Authorization', fakeToken)
      .send({ message: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Message is required');
  });

  it('should return 400 if session completed', async () => {
    Session.findById.mockResolvedValue({ ...sessionMock, status: 'completed' });

    const res = await request(app)
      .post(`/messages/${sessionId}`)
      .set('Authorization', fakeToken)
      .send({ message: 'Hello' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Session has ended');
  });

  it('should return 403 if user not mentor/mentee', async () => {
    Session.findById.mockResolvedValue({ ...sessionMock, mentor: 'other', mentee: 'other' });

    const res = await request(app)
      .post(`/messages/${sessionId}`)
      .set('Authorization', fakeToken)
      .send({ message: 'Hello' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
