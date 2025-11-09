const request = require('supertest');
const app = require('../app');  
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const MentorshipRequest = require('../models/MentorshipRequest');
const Mentee = require('../models/Mentee');
const Notification = require('../models/Notification');

const { google } = require('googleapis');

jest.mock('../models/Mentor');
jest.mock('../models/Mentee');
jest.mock('../models/Session');
jest.mock('../models/MentorshipRequest');
jest.mock('../models/Notification'); 

const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'mockUserId' }, process.env.JWT_SECRET);

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

// Mock googleapis OAuth2 and calendar
jest.mock('googleapis', () => {
  const eventsListMock = jest.fn();
  const eventsInsertMock = jest.fn();

  const calendarMock = {
    events: {
      list: eventsListMock,
      insert: eventsInsertMock,
    },
  };

  const OAuth2Mock = jest.fn().mockImplementation(() => ({
    setCredentials: jest.fn(),
    on: jest.fn(),
  }));

  return {
    google: {
      auth: {
        OAuth2: OAuth2Mock,
      },
      calendar: jest.fn(() => calendarMock),
    },
  };
});

describe('Mentor Routes', () => {
  const mockMentorId = 'mockMentorId';
  const mockUserId = 'mockUserId';
  const authHeader = `Bearer ${token}`;

  beforeEach(() => {
    jest.clearAllMocks();
    Notification.prototype.save = jest.fn().mockResolvedValue(true);
  });

  // GET availability tests
  describe('GET /mentor/:mentorId/availability', () => {
    it('returns 404 if mentor not found', async () => {
      Mentor.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/mentor/${mockMentorId}/availability`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'Mentor not found' });
    });

    it('returns 400 if mentor has no googleAccessToken', async () => {
      Mentor.findById.mockResolvedValue({ googleAccessToken: null });

      const res = await request(app)
        .get(`/mentor/${mockMentorId}/availability`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'Mentor has not connected Google Calendar' });
    });

    it('returns free slots on success', async () => {
      Mentor.findById.mockResolvedValue({
        googleAccessToken: 'access-token',
        googleRefreshToken: 'refresh-token',
        save: jest.fn(),
      });

      const eventsListMock = google.calendar().events.list;
      eventsListMock.mockResolvedValue({
        data: { items: [] },
      });

      const res = await request(app)
        .get(`/mentor/${mockMentorId}/availability`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.slots).toBeDefined();
      expect(Array.isArray(res.body.slots)).toBe(true);
      expect(res.body.slots.length).toBeLessThanOrEqual(6);

      expect(Mentor.findById).toHaveBeenCalledWith(mockMentorId);
      expect(eventsListMock).toHaveBeenCalled();
    });
  });

  // POST schedule tests
  describe('POST /mentor/:mentorId/schedule', () => {
    it('returns 404 if mentor not found', async () => {
      Mentor.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/mentor/${mockMentorId}/schedule`)
        .set('Authorization', authHeader)
        .send({
          date: '2025-08-20',
          time: '10:00',
          sessionType: 'video',
          mentorshipRequestId: 'req123',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'Mentor not found' });
    });

    it('schedules a session successfully', async () => {
      const mockMentor = {
        _id: mockMentorId,
        email: 'mentor@example.com',
        googleAccessToken: 'access-token',
        googleRefreshToken: 'refresh-token',
        save: jest.fn(),
      };

      const mockMentorshipRequest = {
        _id: 'req123',
        mentee: mockUserId,
        mentor: mockMentorId,
        sessions: [],
      };

      const mockMentee = {
        _id: mockUserId,
        email: 'mentee@example.com',
      };

      Mentor.findById.mockResolvedValue(mockMentor);
      MentorshipRequest.findById.mockResolvedValue(mockMentorshipRequest);
      Mentee.findById.mockResolvedValue(mockMentee);
      Session.create.mockResolvedValue({
        _id: 'session123',
        mentor: mockMentorId,
        mentee: mockUserId,
        mentorshipRequest: 'req123',
        date: new Date('2025-08-20T10:00:00'),
        type: 'video',
        googleEventId: 'google-event-id-123',
        googleMeetLink: 'https://meet.link',
      });
      MentorshipRequest.findByIdAndUpdate.mockResolvedValue(true);

      const eventsInsertMock = google.calendar().events.insert;
      eventsInsertMock.mockResolvedValue({
        data: { id: 'google-event-id-123', hangoutLink: 'https://meet.link' },
      });

      const res = await request(app)
        .post(`/mentor/${mockMentorId}/schedule`)
        .set('Authorization', authHeader)
        .send({
          date: '2025-08-20',
          time: '10:00',
          sessionType: 'video',
          mentorshipRequestId: 'req123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Session scheduled');
      expect(res.body.session).toHaveProperty('googleEventId', 'google-event-id-123');

      expect(Mentor.findById).toHaveBeenCalledWith(mockMentorId);
      expect(eventsInsertMock).toHaveBeenCalled();
      expect(Session.create).toHaveBeenCalled();
      expect(MentorshipRequest.findByIdAndUpdate).toHaveBeenCalledWith(
        'req123',
        expect.objectContaining({ status: 'accepted' })
      );
      expect(Notification.prototype.save).toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      const mockMentor = {
        _id: mockMentorId,
        email: 'mentor@example.com',
        googleAccessToken: 'access-token',
        googleRefreshToken: 'refresh-token',
        save: jest.fn(),
      };

      const mockMentorshipRequest = {
        _id: 'req123',
        mentee: mockUserId,
        mentor: mockMentorId,
        sessions: [],
      };

      const mockMentee = {
        _id: mockUserId,
        email: 'mentee@example.com',
      };

      Mentor.findById.mockResolvedValue(mockMentor);
      MentorshipRequest.findById.mockResolvedValue(mockMentorshipRequest);
      Mentee.findById.mockResolvedValue(mockMentee);

      const eventsInsertMock = google.calendar().events.insert;
      eventsInsertMock.mockRejectedValue(new Error('Google API error'));

      const res = await request(app)
        .post(`/mentor/${mockMentorId}/schedule`)
        .set('Authorization', authHeader)
        .send({
          date: '2025-08-20',
          time: '10:00',
          sessionType: 'video',
          mentorshipRequestId: 'req123',
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to schedule session');
    });
  });
});
