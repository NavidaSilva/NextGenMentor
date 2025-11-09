const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../models/Note");
jest.mock("../models/MentorshipRequest");

const Note = require("../models/Note");
const MentorshipRequest = require("../models/MentorshipRequest");

const notesRouter = require("../routes/notes"); // adjust path if needed

// mock express app
const app = express();
app.use(express.json());
app.use("/", notesRouter);

// mock jwt
jest.spyOn(jwt, "verify").mockImplementation(() => ({ userId: "testUserId" }));

describe("Notes API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /:id/notes", () => {
    it("should create a new note", async () => {
      const mockQuery = { _id: "q1", notes: [], save: jest.fn() };
      MentorshipRequest.findById.mockResolvedValue(mockQuery);

      const mockNote = { _id: "n1", save: jest.fn() };
      Note.mockImplementation(() => mockNote);

      const res = await request(app)
        .post("/123/notes")
        .set("Authorization", "Bearer faketoken")
        .send({ content: "Hello", role: "mentee" });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Note added");
      expect(mockQuery.save).toHaveBeenCalled();
      expect(mockNote.save).toHaveBeenCalled();
    });

    it("should return 404 if query not found", async () => {
      MentorshipRequest.findById.mockResolvedValue(null);

      const res = await request(app)
        .post("/123/notes")
        .set("Authorization", "Bearer faketoken")
        .send({ content: "Hello", role: "mentee" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Query not found");
    });
  });

  describe("GET /:id/notes", () => {
    it("should return notes", async () => {
      const mockQuery = { notes: [{ _id: "n1", content: "Test" }] };
      MentorshipRequest.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuery),
      });

      const res = await request(app)
        .get("/123/notes")
        .set("Authorization", "Bearer faketoken");

      expect(res.status).toBe(200);
      expect(res.body.notes).toEqual(mockQuery.notes);
    });

    it("should return 404 if query not found", async () => {
      MentorshipRequest.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get("/123/notes")
        .set("Authorization", "Bearer faketoken");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /notes/:noteId", () => {
    it("should update a note", async () => {
      const mockNote = {
        _id: "n1",
        content: "Old",
        createdBy: "testUserId",
        save: jest.fn(),
      };
      Note.findById.mockResolvedValue(mockNote);

      const res = await request(app)
        .put("/notes/n1")
        .set("Authorization", "Bearer faketoken")
        .send({ content: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Note updated");
      expect(mockNote.save).toHaveBeenCalled();
    });

    it("should return 403 if not owner", async () => {
      const mockNote = { createdBy: "otherUser" };
      Note.findById.mockResolvedValue(mockNote);

      const res = await request(app)
        .put("/notes/n1")
        .set("Authorization", "Bearer faketoken")
        .send({ content: "Updated" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /notes/:noteId", () => {
    it("should delete a note", async () => {
      const mockNote = {
        _id: "n1",
        createdBy: "testUserId",
        deleteOne: jest.fn(),
      };
      Note.findById.mockResolvedValue(mockNote);
      MentorshipRequest.updateOne = jest.fn();

      const res = await request(app)
        .delete("/notes/n1")
        .set("Authorization", "Bearer faketoken");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Note deleted");
      expect(mockNote.deleteOne).toHaveBeenCalled();
    });

    it("should return 403 if not owner", async () => {
      const mockNote = { createdBy: "otherUser" };
      Note.findById.mockResolvedValue(mockNote);

      const res = await request(app)
        .delete("/notes/n1")
        .set("Authorization", "Bearer faketoken");

      expect(res.status).toBe(403);
    });
  });
});
