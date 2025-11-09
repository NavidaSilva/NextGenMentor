// __tests__/NotesSection.test.js
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotesSection from "../Components/query/NotesSection"; // adjust import path
import React from "react";

// mock Button since it's a custom component
jest.mock("../Components/Common/Button", () => (props) => (
  <button {...props}>{props.children}</button>
));

describe("NotesSection Component", () => {
  let mockReload;

  beforeEach(() => {
    mockReload = jest.fn();
    global.fetch = jest.fn();
    localStorage.setItem("token", "mock-token");
    localStorage.setItem("role", "mentee");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockNotes = [
    {
      _id: "1",
      content: "First Note",
      createdByModel: "mentee",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      content: "Second Note (other role)",
      createdByModel: "mentor",
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders notes for the current role only", () => {
    render(<NotesSection notes={mockNotes} queryId="q1" reload={mockReload} />);

    // should render only mentee note
    expect(screen.getByText("First Note")).toBeInTheDocument();
    expect(screen.queryByText("Second Note (other role)")).not.toBeInTheDocument();
  });

  it("adds a new note", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<NotesSection notes={[]} queryId="q1" reload={mockReload} />);

    const input = screen.getByPlaceholderText("Add a new note...");
    fireEvent.change(input, { target: { value: "New note content" } });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/note/q1/notes",
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Object),
          body: JSON.stringify({ content: "New note content", role: "mentee" }),
        })
      );
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it("edits a note", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<NotesSection notes={mockNotes} queryId="q1" reload={mockReload} />);

    fireEvent.click(screen.getByText("Edit"));

    const editBox = screen.getByDisplayValue("First Note");
    fireEvent.change(editBox, { target: { value: "Updated Note" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/note/notes/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ content: "Updated Note" }),
        })
      );
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it("deletes a note", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<NotesSection notes={mockNotes} queryId="q1" reload={mockReload} />);

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/note/notes/1",
        expect.objectContaining({ method: "DELETE" })
      );
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
