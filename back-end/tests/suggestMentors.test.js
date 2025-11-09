const app = require('../app');
const axios = require("axios");
const Mentee = require("../models/Mentee");
const request = require("supertest");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const token = jwt.sign({ userId: "mockMenteeId" }, process.env.JWT_SECRET);

jest.mock("axios");
jest.mock("../models/Mentee");

describe("POST /mentee/suggest-mentors", () => {
  it("returns suggested mentors from FastAPI", async () => {
    // Mock DB mentee
    const mockMentee = {
      _id: "mockMenteeId",
      // currentStatus: "Undergraduate",
      // topics: ["AI", "Machine Learning"],
      // fieldOfStudy: ["Computer Science"],  

      topics:  ["AI", "Machine Learning"],
            mentorshipFormat: "both",
  currentStatus: "undergraduate",   // 
            preferredExperience :"0-2",
    };
    Mentee.findById.mockResolvedValue(mockMentee);

    // Mock FastAPI response
    const mockMentors = {
      mentors: [
        { fullName: "John Doe", matchScore: 91.3 },
        { fullName: "Jane Smith", matchScore: 88.9 }
      ]
    };
    axios.post.mockResolvedValue({ data: mockMentors });

    const res = await request(app)
  .post("/mentee/suggest-mentors")
  .set("Authorization", `Bearer ${token}`)
  .send({
    customTopic: "Data Science",
    communicationMethod: "online",
    experience: "0-2"
  });


    expect(res.statusCode).toBe(200);
    expect(res.body.mentors).toHaveLength(2);
    expect(res.body.mentors[0]).toHaveProperty("fullName", "John Doe");

    // Adjust this expectation to your actual route payload
expect(axios.post).toHaveBeenCalledWith("http://localhost:8000/suggest-mentors/", {
  topics: "Data Science",            // because req.body.customTopic overwrites
  mentorshipFormat: "online",        // from req.body.communicationMethod
  menteeLevel: "undergraduate",      // from mockMentee.currentStatus
  preferredExperience: "0-2"         // from req.body.experience
});

  });

  it("handles FastAPI/internal error", async () => {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  Mentee.findById.mockResolvedValue({
    _id: "mockMenteeId",
    currentStatus: "Graduate",
    topics: ["Web Development"]
  });

  axios.post.mockRejectedValue(new Error("FastAPI is down"));

  const res = await request(app)
    .post("/mentee/suggest-mentors")
    .set("Authorization", `Bearer ${token}`)

    .send({});

  expect(res.statusCode).toBe(500);
  expect(res.body.error).toBe("Server error");

  consoleSpy.mockRestore();
});

});