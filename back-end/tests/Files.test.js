// __tests__/queries.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mime = require('mime-types');

jest.mock('multer', () => {
  const m = () => ({
    single: () => (req, res, next) => {
      req.file = {
        originalname: 'testfile.txt',
        filename: 'mocked-file.txt',
        path: '/tmp/mocked-file.txt',
        size: 1024, // important for totalSize calculation
      };
      next();
    }
  });
  m.diskStorage = () => ({});
  return m;
});


// Mock models
jest.mock('../models/File');
jest.mock('../models/MentorshipRequest');
jest.mock('../models/Notification');

const File = require('../models/File');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

jest.mock('jsonwebtoken');
jest.mock('fs');

// Load router
const queriesRouter = require('../routes/queries');

const app = express();
app.use(express.json());
app.use('/', queriesRouter);


describe('POST /:id/files', () => {
  it('should upload file and create DB entries', async () => {
    jwt.verify.mockReturnValue({ userId: 'user123', role: 'mentor' });
    
    // Mock existing files
    File.find.mockResolvedValue([]);
    
    // Mock File constructor
    File.mockImplementation(function (data) {
      this.save = jest.fn().mockResolvedValue(this);
      Object.assign(this, data);
    });

    MentorshipRequest.findById.mockResolvedValue({
      _id: '123',
      mentor: 'user123',
      mentee: 'mentee456',
      topic: 'Test Query',
    });
    MentorshipRequest.findByIdAndUpdate.mockResolvedValue({});
    Notification.prototype.save = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/123/files')
      .set('Authorization', 'Bearer faketoken')
      .set('role', 'mentor')
      .attach('file', Buffer.from('mock content'), 'testfile.txt');

    expect(res.status).toBe(201);
    // Check that File constructor was called
    expect(File).toHaveBeenCalledWith(expect.objectContaining({
      uploader: 'user123',
      uploaderModel: 'Mentor',
      name: 'testfile.txt',
      path: '/tmp/mocked-file.txt',
      size: 1024,
    }));
  }, 15000);


  
it('should reject if size > 1.5GB', async () => {
  jwt.verify.mockReturnValue({ userId: 'user123', role: 'mentor' });
  File.find.mockResolvedValue([{ size: 1.5 * 1024 * 1024 * 1024 }]);
  fs.unlinkSync.mockImplementation(() => {});

  const res = await request(app)
    .post('/123/files')
    .set('Authorization', 'Bearer faketoken')
    .set('role', 'mentor')         
    .attach('file', Buffer.from('mock'), 'bigfile.pdf');

  expect(res.statusCode).toBe(400);
  expect(res.body.error).toMatch(/exceeds 1.5GB/);
});

  });
describe('GET /files/:fileId', () => {
  it('should stream file with correct headers', async () => {
    const mockFile = { name: 'test.pdf', path: 'uploads/test.pdf' };
    File.findById.mockResolvedValue(mockFile);

    const { Readable } = require('stream');
    fs.createReadStream.mockImplementation(() => {
      const stream = new Readable();
      stream._read = () => {};
      process.nextTick(() => stream.emit('end'));
      stream.pipe = jest.fn().mockImplementation((res) => {
        process.nextTick(() => res.end());
        return res;
      });
      return stream;
    });

    const res = await request(app).get('/files/file123');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe(mime.contentType(mockFile.name));
    expect(res.headers['content-disposition']).toContain(mockFile.name);
  }, 10000); // increase timeout
});



  describe('DELETE /files/:fileId', () => {
  it('should delete file if user is uploader', async () => {
    jwt.verify.mockReturnValue({ userId: 'user123', role: 'mentor' });
    const mockFile = { 
      uploader: 'user123', 
      path: 'uploads/test.pdf', 
      mentorshipRequest: 'req123', 
      deleteOne: jest.fn().mockResolvedValue({}) // <-- add this
    };
    File.findById.mockResolvedValue(mockFile);
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
    MentorshipRequest.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .delete('/files/file123')
      .set('Authorization', 'Bearer testtoken');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/);
    expect(mockFile.deleteOne).toHaveBeenCalled();
  });

  it('should forbid if user is not uploader', async () => {
    jwt.verify.mockReturnValue({ userId: 'otherUser', role: 'mentor' });
    const mockFile = { 
      uploader: 'user123', 
      deleteOne: jest.fn() // <-- still needed even if not uploader
    };
    File.findById.mockResolvedValue(mockFile);

    const res = await request(app)
      .delete('/files/file123')
      .set('Authorization', 'Bearer testtoken');

    expect(res.statusCode).toBe(403);
    expect(mockFile.deleteOne).not.toHaveBeenCalled();
  });
});
