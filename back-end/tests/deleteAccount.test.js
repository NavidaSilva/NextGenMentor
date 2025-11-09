const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const deleteAccountRouter = require('../routes/menteeDeleteAccount'); 
const Mentee = require('../models/Mentee');

jest.mock('../models/Mentee'); 

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());
app.use(deleteAccountRouter);

describe('DELETE /delete-account', () => {
  const token = jwt.sign({ userId: 'mockMenteeId' }, process.env.JWT_SECRET);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deletes mentee account successfully', async () => {
    Mentee.findByIdAndDelete.mockResolvedValue({ _id: 'mockMenteeId' });

    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Account deleted successfully' });
    expect(Mentee.findByIdAndDelete).toHaveBeenCalledWith('mockMenteeId');
  });

  it('returns 404 if mentee not found', async () => {
    Mentee.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete('/delete-account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Mentee not found' });
  });

  it('returns 500 on server error', async () => {
    Mentee.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
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
