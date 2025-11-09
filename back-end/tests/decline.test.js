// tests/decline.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Import the router
const declineRouter = require("../routes/decline"); // adjust path if needed

// Mock models
jest.mock("../models/MentorshipRequest");
jest.mock("../models/Notification");
jest.mock("../models/Mentor");

const MentorshipRequest = require("../models/MentorshipRequest");
const Notification = require("../models/Notification");
const Mentor = require("../models/Mentor");

// Fake app for testing
const app = express();
app.use(express.json());
app.use("/decline", declineRouter);

// Mock jwt.verify
jest.spyOn(jwt, "verify").mockImplementation(() => ({
  userId: "mentor123",
  role: "mentor",
}));

// Silence console.error during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe("POST /decline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if mentorshipRequestId or reason is missing", async () => {
    const res = await request(app)
      .post("/decline")
      .set("Authorization", "Bearer faketoken")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MentorshipRequest ID and reason are required");
  });

  it("should return 404 if mentorship request not found", async () => {
    MentorshipRequest.findById.mockResolvedValue(null);

    const res = await request(app)
      .post("/decline")
      .set("Authorization", "Bearer faketoken")
      .send({ mentorshipRequestId: "req123", reason: "Not available" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Mentorship request not found");
  });

  it("should create a notification and return 201 on success", async () => {
    // Mock DB calls
    const fakeRequest = {
      _id: "req123",
      mentee: "mentee123",
      topic: "React",
      mentorshipHeading: "Learn React Basics",
      description: "Need help with React components",
      communicationMethod: "Zoom",
      learningGoal: "Build a project",
    };
    MentorshipRequest.findById.mockResolvedValue(fakeRequest);

    const fakeMentor = { _id: "mentor123", fullName: "John Doe" };
    Mentor.findById.mockResolvedValue(fakeMentor);

    Notification.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));

    const res = await request(app)
      .post("/decline")
      .set("Authorization", "Bearer faketoken")
      .send({ mentorshipRequestId: "req123", reason: "Not available" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Decline submitted, mentee notified");
    expect(res.body.request.topic).toBe("React");
    expect(Notification).toHaveBeenCalledWith({
      recipient: "mentee123",
      message: `John Doe has declined your mentorship request. Reason: "Not available"`,
    });
  });

  it("should return 401 if no token provided", async () => {
    const res = await request(app)
      .post("/decline")
      .send({ mentorshipRequestId: "req123", reason: "Not available" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token provided");
  });

  it("should handle server errors", async () => {
    MentorshipRequest.findById.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/decline")
      .set("Authorization", "Bearer faketoken")
      .send({ mentorshipRequestId: "req123", reason: "Not available" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
