// src/__tests__/RecommendedMentors.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecommendedMentors from "../Pages/query/RecommendMentors.jsx";
import { MemoryRouter, useNavigate } from "react-router-dom";

// Mock useNavigate and useLocation
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("RecommendedMentors Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "mock-token");
    useNavigate.mockReturnValue(mockNavigate);
  });

  const mockMentor = {
    _id: "mentor123",
    fullName: "Jane Doe",
    profilePicture: "/images/jane.jpg",
    industry: ["Tech", "Education"],
  };

  const mockState = {
    state: {
      selectedTopic: "React Testing",
      mentorshipHeading: "Learn Frontend",
      communicationMethod: "video",
      learningGoal: "Understand hooks",
      description: "Want to understand useEffect",
      mentors: {
        mentors: [mockMentor],
      },
    },
  };

  it("renders mentor info and buttons", () => {
    const { useLocation } = require("react-router-dom");
    useLocation.mockReturnValue(mockState);

    render(
      <MemoryRouter>
        <RecommendedMentors />
      </MemoryRouter>
    );

    expect(screen.getByText(/Topic Selected/i)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Tech, Education")).toBeInTheDocument();
    expect(screen.getByText("View Profile")).toBeInTheDocument();
    expect(screen.getByText("Select Mentor")).toBeInTheDocument();
  });

  it("navigates to mentor profile when 'View Profile' is clicked", () => {
    const { useLocation } = require("react-router-dom");
    useLocation.mockReturnValue(mockState);

    render(
      <MemoryRouter>
        <RecommendedMentors />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("View Profile"));
    expect(mockNavigate).toHaveBeenCalledWith(`/mentor-profile-view/${mockMentor._id}`);
  });

  it("sends POST request and navigates to /mentee on 'Select Mentor'", async () => {
    const { useLocation } = require("react-router-dom");
    useLocation.mockReturnValue(mockState);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    render(
      <MemoryRouter>
        <RecommendedMentors />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Select Mentor"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/queries/request",
        expect.anything()
      );
      expect(mockNavigate).toHaveBeenCalledWith("/mentee");
    });
  });

  it("shows error alert if request fails", async () => {
    const { useLocation } = require("react-router-dom");
    useLocation.mockReturnValue(mockState);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      })
    );

    window.alert = jest.fn();

    render(
      <MemoryRouter>
        <RecommendedMentors />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Select Mentor"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to send request: Unauthorized");
    });
  });
});
