const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');


process.env.JWT_SECRET = 'test-jwt-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';

// Create test app
const app = express();
app.use(express.json());

// Import admin routes
const adminRoutes = require('../routes/admin');
app.use('/admin', adminRoutes);

// Mock nodemailer to prevent actual email sending during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

describe('Admin Password Reset', () => {
  let testAdmin;
  let testToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/nextgenmentor_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clear admin collection
    await Admin.deleteMany({});
    
    // Create test admin
    testAdmin = new Admin({
      fullName: 'Test Admin',
      email: 'test@admin.com',
      password: 'admin123',
      role: 'admin',
      permissions: ['all'],
      isGoogleSignup: false
    });
    await testAdmin.save();
  });

  afterAll(async () => {
    // Clean up
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /admin/forgot-password', () => {
    it('should send password reset email for valid admin email', async () => {
      const response = await request(app)
        .post('/admin/forgot-password')
        .send({ email: 'test@admin.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset link has been sent');

      // Verify admin has reset token
      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.resetPasswordToken).toBeDefined();
      expect(updatedAdmin.resetPasswordExpires).toBeDefined();
      expect(updatedAdmin.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return same message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/admin/forgot-password')
        .send({ email: 'nonexistent@admin.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should return error for missing email', async () => {
      const response = await request(app)
        .post('/admin/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
    });

    it('should generate unique reset tokens', async () => {
      // Send two reset requests
      await request(app)
        .post('/admin/forgot-password')
        .send({ email: 'test@admin.com' });

      const admin1 = await Admin.findById(testAdmin._id);
      const token1 = admin1.resetPasswordToken;

      await request(app)
        .post('/admin/forgot-password')
        .send({ email: 'test@admin.com' });

      const admin2 = await Admin.findById(testAdmin._id);
      const token2 = admin2.resetPasswordToken;

      expect(token1).not.toBe(token2);
    });
  });

  describe('GET /admin/verify-reset-token/:token', () => {
    beforeEach(async () => {
      // Generate reset token for test admin
      const crypto = require('crypto');
      testToken = crypto.randomBytes(32).toString('hex');
      
      testAdmin.resetPasswordToken = testToken;
      testAdmin.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await testAdmin.save();
    });

    it('should verify valid reset token', async () => {
      const response = await request(app)
        .get(`/admin/verify-reset-token/${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token is valid');
      expect(response.body.email).toBe('test@admin.com');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/admin/verify-reset-token/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject expired token', async () => {
      // Set token as expired
      testAdmin.resetPasswordExpires = new Date(Date.now() - 1000);
      await testAdmin.save();

      const response = await request(app)
        .get(`/admin/verify-reset-token/${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });
  });

  describe('POST /admin/reset-password', () => {
    beforeEach(async () => {
      // Generate reset token for test admin
      const crypto = require('crypto');
      testToken = crypto.randomBytes(32).toString('hex');
      
      testAdmin.resetPasswordToken = testToken;
      testAdmin.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await testAdmin.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken,
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully');

      // Verify password was updated
      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.password).toBe(newPassword);
      expect(updatedAdmin.resetPasswordToken).toBeUndefined();
      expect(updatedAdmin.resetPasswordExpires).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/admin/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject expired token', async () => {
      // Set token as expired
      testAdmin.resetPasswordExpires = new Date(Date.now() - 1000);
      await testAdmin.save();

      const response = await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject password shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken,
          newPassword: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });

    it('should reject missing token or password', async () => {
      const response = await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken
          // missing newPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required');
    });
  });

  describe('Admin Login with Password Reset', () => {
    it('should allow login with new password after reset', async () => {
      // First, reset the password
      const crypto = require('crypto');
      testToken = crypto.randomBytes(32).toString('hex');
      
      testAdmin.resetPasswordToken = testToken;
      testAdmin.resetPasswordExpires = new Date(Date.now() + 3600000);
      await testAdmin.save();

      const newPassword = 'newpassword123';
      
      await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken,
          newPassword: newPassword
        });

      // Now try to login with new password
      const loginResponse = await request(app)
        .post('/admin/login')
        .send({
          email: 'test@admin.com',
          password: newPassword
        });

      // Debug: Log the response if it's not 200
      if (loginResponse.status !== 200) {
        console.log('Login response status:', loginResponse.status);
        console.log('Login response body:', loginResponse.body);
      }

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.admin.email).toBe('test@admin.com');
    });

    it('should reject login with old password after reset', async () => {
      // Reset password
      const crypto = require('crypto');
      testToken = crypto.randomBytes(32).toString('hex');
      
      testAdmin.resetPasswordToken = testToken;
      testAdmin.resetPasswordExpires = new Date(Date.now() + 3600000);
      await testAdmin.save();

      const newPassword = 'newpassword123';
      
      await request(app)
        .post('/admin/reset-password')
        .send({
          token: testToken,
          newPassword: newPassword
        });

      // Try to login with old password
      const loginResponse = await request(app)
        .post('/admin/login')
        .send({
          email: 'test@admin.com',
          password: 'admin123' // old password
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.error).toBe('Invalid password');
    });
  });
});
