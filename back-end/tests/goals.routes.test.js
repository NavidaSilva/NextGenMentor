// __tests__/goals.routes.test.js
const request = require("supertest");
const express = require("express");
const router = require("../routes/queries");
const MentorshipRequest = require("../models/MentorshipRequest");
const Goal = require("../models/Goal");

jest.mock("../models/MentorshipRequest");
jest.mock("../models/Goal");

// add this at the top, before using it
const mockAuth = (req, res, next) => {
  req.userId = "mockUserId"; // simulate authenticated user
  next();
};

jest.mock("jsonwebtoken");
const jwt = require("jsonwebtoken");
jwt.verify.mockReturnValue({ userId: "mockUserId" });

jest.mock('../routes/queries', () => {
  const originalModule = jest.requireActual('../routes/queries');

  // override only auth
  originalModule.__esModule = true;
  originalModule.auth = (req, res, next) => {
    req.userId = 'mockUserId';
    next();
  };

  return originalModule;
});


const app = express();
app.use(express.json());
app.use("/", (req, res, next) => mockAuth(req, res, next), router);

describe("Goals Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /:id/goals", () => {

     it("should add a new goal when mentee is authorized", async () => {
      const mockRequest = {
        _id: "req1",
        mentee: "mockUserId",
        goals: [],
        save: jest.fn(),
      };

      MentorshipRequest.findById.mockResolvedValue(mockRequest);

      const mockGoal = {
        _id: "goal1",
        save: jest.fn(),
      };

      Goal.mockImplementation(() => mockGoal);

      const res = await request(app)
        .post("/req1/goals")
          .set("Authorization", "Bearer faketoken") 
        .send({ description: "New Goal" });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Goal added");
      expect(mockGoal.save).toHaveBeenCalled();
      expect(mockRequest.save).toHaveBeenCalled();
    });

    

    it("should return 403 if user is not the mentee", async () => {
      MentorshipRequest.findById.mockResolvedValue({
        _id: "req1",
        mentee: "otherUserId",
      });

      const res = await request(app)
        .post("/req1/goals")
          .set("Authorization", "Bearer faketoken") 
        .send({ description: "Goal" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only mentee can add goals");
    });


    it("should return 404 if mentorship request not found", async () => {
      MentorshipRequest.findById.mockResolvedValue(null);

      const res = await request(app)
  .post("/req1/goals")
  .set("Authorization", "Bearer faketoken")
  .send({ description: "Goal" });


      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Query not found");
    });


   
  });

  describe("PATCH /goals/:goalId", () => {
    it("should update goal status and feedback when mentor is authorized", async () => {
      const mockRequest = {
        mentor: "mockUserId",
      };

      const mockGoal = {
        _id: "goal1",
        mentorshipRequest: mockRequest,
        save: jest.fn(),
      };

      Goal.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGoal),
      });

      const res = await request(app)
        .patch("/goals/goal1")
          .set("Authorization", "Bearer faketoken") 
        .send({ status: "completed", feedback: "Well done!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Goal updated");
      expect(mockGoal.save).toHaveBeenCalled();
    });

    it("should return 404 if goal not found", async () => {
      Goal.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .patch("/goals/goal1")
          .set("Authorization", "Bearer faketoken") 
        .send({ status: "completed" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Goal not found");
    });

    it("should return 403 if user is not the mentor", async () => {
      const mockRequest = {
        mentor: "otherUserId",
      };

      const mockGoal = {
        mentorshipRequest: mockRequest,
      };

      Goal.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGoal),
      });

      const res = await request(app)
        .patch("/goals/goal1")
          .set("Authorization", "Bearer faketoken") 
        .send({ status: "completed" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only mentor can update goal");
    });
  });
});
