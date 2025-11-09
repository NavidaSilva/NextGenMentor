// __tests__/mentorRoutes.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const mentorRoutes = require("../routes/mentor");

// Mock models
jest.mock("../models/Mentor");
jest.mock("../models/Mentee");
jest.mock("../models/Session");
jest.mock("../models/MentorshipRequest");
jest.mock("../models/Notification");

// Mock googleapis
jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        on: jest.fn(),
      })),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: jest.fn().mockResolvedValue({
          data: { id: "event123", hangoutLink: "https://meet.google.com/abc" },
        }),
      },
    }),
  },
}));

// Mock JWT
const mockUserId = "mentor123";
jest.spyOn(jwt, "verify").mockImplementation(() => ({ userId: mockUserId }));
jest.spyOn(jwt, "sign").mockImplementation(() => "mockToken");

const Mentor = require("../models/Mentor");
const Mentee = require("../models/Mentee");
const Session = require("../models/Session");
const MentorshipRequest = require("../models/MentorshipRequest");
const Notification = require("../models/Notification");

// Setup Express test app
const app = express();
app.use(express.json());
app.use("/api/mentor", mentorRoutes);

describe("Mentor Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for Mentor methods
    Mentor.findById.mockImplementation((id) => ({
      select: jest.fn().mockResolvedValue(
        id === "notfound" ? null : { _id: id, name: "Default Mentor" }
      ),
    }));

    Mentor.findByIdAndUpdate.mockResolvedValue({
      _id: mockUserId,
      email: "test@mentor.com",
    });
  });

  describe("PUT /api/mentor/complete-profile", () => {
    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .put("/api/mentor/complete-profile")
        .set("Authorization", "Bearer mockToken")
        .send({}); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should update mentor profile successfully", async () => {
      const res = await request(app)
        .put("/api/mentor/complete-profile")
        .set("Authorization", "Bearer mockToken")
        .send({
          currentStatus: "Active",
          industry: ["Tech"],
          yearsExperience: 5,
          mentorshipFormat: "chat",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("mockToken");
    });
  });

  describe("GET /api/mentor/me", () => {
    it("should return mentor profile", async () => {
      Mentor.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ _id: mockUserId, name: "John Doe" }),
      }));

      const res = await request(app)
        .get("/api/mentor/me")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("John Doe");
    });

    it("should return 404 if mentor not found", async () => {
      Mentor.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      const res = await request(app)
        .get("/api/mentor/me")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mentor/:id", () => {
    it("should return mentor by id", async () => {
      Mentor.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ _id: "abc", name: "Jane" }),
      }));

      const res = await request(app)
        .get("/api/mentor/abc")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Jane");
    });
  });

  describe("GET /api/mentor/:mentorId/availability", () => {
    it("should return free slots", async () => {
      Mentor.findById.mockResolvedValue({
        _id: "abc",
        googleAccessToken: "token",
        googleRefreshToken: "refresh",
        save: jest.fn(),
      });

      const res = await request(app)
        .get("/api/mentor/abc/availability")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body.slots).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/mentor/:mentorId/schedule", () => {
    it("should schedule a session successfully", async () => {
      Mentor.findById.mockResolvedValue({
        _id: "abc",
        email: "mentor@test.com",
        googleAccessToken: "token",
        googleRefreshToken: "refresh",
        save: jest.fn(),
      });

      MentorshipRequest.findById.mockResolvedValue({
        _id: "req1",
        mentee: "mentee123",
        mentor: "abc",
      });

      Mentee.findById.mockResolvedValue({ _id: "mentee123", email: "mentee@test.com" });
      Session.create.mockResolvedValue({ _id: "session1" });
      MentorshipRequest.findByIdAndUpdate.mockResolvedValue({});
      Notification.mockImplementation(() => ({ save: jest.fn() }));

      const res = await request(app)
        .post("/api/mentor/abc/schedule")
        .set("Authorization", "Bearer mockToken")
        .send({
          date: "2025-09-15",
          time: "10:00",
          sessionType: "video",
          mentorshipRequestId: "req1",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Session scheduled");
      expect(res.body.session._id).toBe("session1");
    });
  });
});
