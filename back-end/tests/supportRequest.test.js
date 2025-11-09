const request = require('supertest');
const express = require('express');
const supportRouter = require('../routes/support'); 
const SupportRequest = require('../models/SupportRequest');

jest.mock('../models/SupportRequest'); 

const app = express();
app.use(express.json());
app.use('/support', supportRouter);

describe('Support Request Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits a support request successfully', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    SupportRequest.mockImplementation(() => ({ save: saveMock }));

    const res = await request(app)
      .post('/support/submit')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I need help!',
        role: 'mentor'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Support request submitted successfully');
    expect(saveMock).toHaveBeenCalled();
  });

  it('returns 400 if any field is missing', async () => {
    const res = await request(app)
      .post('/support/submit')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
        // message and role missing
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });

  it('returns 500 if save fails', async () => {
    const saveMock = jest.fn().mockRejectedValue(new Error('DB error'));
    SupportRequest.mockImplementation(() => ({ save: saveMock }));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/support/submit')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Help!',
        role: 'mentee'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to submit support request');
    expect(saveMock).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
