const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const deleteAccountRouter = require('../routes/mentorDelete'); 
const Mentor = require('../models/Mentor');

jest.mock('../models/Mentor'); 

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());
app.use(deleteAccountRouter);

describe('DELETE /delete-account (Mentor)', () => {
  const token = jwt.sign({ userId: 'mockMentorId' }, process.env.JWT_SECRET);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deletes mentor account successfully', async () => {
    Mentor.findByIdAndDelete.mockResolvedValue({ _id: 'mockMentorId' });

    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Account deleted successfully' });
    expect(Mentor.findByIdAndDelete).toHaveBeenCalledWith('mockMentorId');
  });

  it('returns 404 if mentor not found', async () => {
    Mentor.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Mentor not found' });

  });

  it('returns 500 on server error', async () => {
    Mentor.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Server error' });

    consoleSpy.mockRestore();

  });

  it('returns 401 if no token provided', async () => {
    const res = await request(app).delete('/delete-account');

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Please authenticate.' });

  });

  it('returns 401 if invalid token provided', async () => {
    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Please authenticate.' });
    
  });
});
