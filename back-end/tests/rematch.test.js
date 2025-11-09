const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../models/MentorshipRequest");
jest.mock("../models/Notification");
jest.mock("../models/Mentee");

const MentorshipRequest = require("../models/MentorshipRequest");
const Notification = require("../models/Notification");
const Mentee = require("../models/Mentee");

const rematchRouter = require("../routes/rematch"); // adjust path if needed

const app = express();
app.use(express.json());
app.use("/rematch", rematchRouter);

// ✅ Suppress console.error logs during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe("POST /rematch", () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock jwt.verify to always return a fake user
    token = "valid.token";
    jest.spyOn(jwt, "verify").mockReturnValue({ userId: "mentee123", role: "mentee" });
  });

  it("should return 400 if mentorshipRequestId or reason missing", async () => {
    const res = await request(app)
      .post("/rematch")
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Not a good fit" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MentorshipRequest ID and reason are required");
  });

  it("should return 404 if mentorship request not found", async () => {
    MentorshipRequest.findById.mockResolvedValue(null);

    const res = await request(app)
      .post("/rematch")
      .set("Authorization", `Bearer ${token}`)
      .send({ mentorshipRequestId: "req1", reason: "Not a good fit" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Mentorship request not found");
  });

  it("should create a notification and return 201 on success", async () => {
    const fakeRequest = {
      _id: "req1",
      topic: "JavaScript",
      mentorshipHeading: "Learn JS",
      description: "Need help with async",
      communicationMethod: "Zoom",
      learningGoal: "Master promises",
      mentor: "mentor123",
    };

    MentorshipRequest.findById.mockResolvedValue(fakeRequest);
    Mentee.findById.mockResolvedValue({ _id: "mentee123", fullName: "John Doe" });

    Notification.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));

    const res = await request(app)
      .post("/rematch")
      .set("Authorization", `Bearer ${token}`)
      .send({ mentorshipRequestId: "req1", reason: "Not a good fit" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Rematch submitted, mentor notified");
    expect(res.body.request.topic).toBe("JavaScript");

    expect(Notification).toHaveBeenCalledWith({
      recipient: "mentor123",
      message: 'John Doe has requested a rematch. Reason: "Not a good fit"',
    });
  });

  it("should return 401 if no token provided", async () => {
    const res = await request(app)
      .post("/rematch")
      .send({ mentorshipRequestId: "req1", reason: "Not a good fit" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token provided");
  });

  it("should return 500 if something goes wrong", async () => {
    MentorshipRequest.findById.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/rematch")
      .set("Authorization", `Bearer ${token}`)
      .send({ mentorshipRequestId: "req1", reason: "Something" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
