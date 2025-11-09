// tests/mentee.routes.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const menteeRoutes = require("../routes/mentee");

// Mock models and libs
jest.mock("../models/Mentee");
jest.mock("axios", () => ({
  post: jest.fn().mockResolvedValue({ data: { mentors: ["m1", "m2"] } }),
}));

const Mentee = require("../models/Mentee");
const axios = require("axios");

// Mock JWT
const mockUserId = "mentee123";
jest.spyOn(jwt, "verify").mockImplementation(() => ({ userId: mockUserId, role: "mentee" }));
jest.spyOn(jwt, "sign").mockImplementation(() => "mockToken");

// Setup Express app
const app = express();
app.use(express.json());
app.use("/api/mentee", menteeRoutes);

describe("Mentee Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PUT /api/mentee/complete-profile", () => {
    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .put("/api/mentee/complete-profile")
        .set("Authorization", "Bearer mockToken")
        .send({}); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should update profile successfully", async () => {
      const mockMentee = { _id: mockUserId, email: "mentee@test.com" };

      Mentee.findById.mockResolvedValue(mockMentee);
      Mentee.findByIdAndUpdate.mockResolvedValue(mockMentee);

      const res = await request(app)
        .put("/api/mentee/complete-profile")
        .set("Authorization", "Bearer mockToken")
        .send({
          currentStatus: "Student",
          fieldOfStudy: ["CS"],
          mentorshipFormat: "chat",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("mockToken");
    });

    it("should return 404 if mentee not found", async () => {
      Mentee.findById.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/mentee/complete-profile")
        .set("Authorization", "Bearer mockToken")
        .send({
          currentStatus: "Student",
          fieldOfStudy: ["CS"],
          mentorshipFormat: "chat",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mentee/me", () => {
    it("should return mentee profile", async () => {
      Mentee.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ _id: mockUserId, name: "Alice" }),
      }));

      const res = await request(app)
        .get("/api/mentee/me")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alice");
    });

    it("should return 404 if not found", async () => {
      Mentee.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      const res = await request(app)
        .get("/api/mentee/me")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mentee/:id", () => {
    it("should return mentee by id", async () => {
      Mentee.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ _id: "abc", name: "Bob" }),
      }));

      const res = await request(app)
        .get("/api/mentee/abc")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body.mentee.name).toBe("Bob");
    });
  });

  describe("POST /api/mentee/suggest-mentors", () => {
    it("should suggest mentors", async () => {
      Mentee.findById.mockResolvedValue({
        _id: mockUserId,
        topics: ["AI"],
        currentStatus: "Student",
      });

      const res = await request(app)
        .post("/api/mentee/suggest-mentors")
        .set("Authorization", "Bearer mockToken")
        .send({ topics: ["AI"], communicationMethod: "video" });

      expect(res.status).toBe(200);
      expect(res.body.mentors).toEqual(["m1", "m2"]);
      expect(axios.post).toHaveBeenCalled();
    });

    it("should return 404 if mentee not found", async () => {
      Mentee.findById.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/mentee/suggest-mentors")
        .set("Authorization", "Bearer mockToken")
        .send({ topics: ["AI"] });

      expect(res.status).toBe(404);
    });
  });
});
