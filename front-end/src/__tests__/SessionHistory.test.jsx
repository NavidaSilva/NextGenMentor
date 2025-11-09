// src/__tests__/SessionHistory.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SessionHistory from "../Components/query/SessionHistory";
import { BrowserRouter } from "react-router-dom";

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(JSON.stringify({ sessions: [] })),
  })
);

// Mock localStorage
beforeEach(() => {
  jest.clearAllMocks();
  Storage.prototype.getItem = jest.fn((key) => {
    if (key === "token") return "fake-token";
    if (key === "role") return "mentee";
    return null;
  });
  Storage.prototype.setItem = jest.fn();
});

describe("SessionHistory Component", () => {
  it("renders no sessions when list is empty", () => {
    render(
      <BrowserRouter>
        <SessionHistory initialSessions={[]} userRole="mentee" />
      </BrowserRouter>
    );

    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument();
  });

  it("renders upcoming chat session and navigates on button click", () => {
    const sessions = [
      {
        _id: "1",
        type: "chat",
        date: new Date().toISOString(),
        status: "upcoming",
      },
    ];

    render(
      <BrowserRouter>
        <SessionHistory initialSessions={sessions} userRole="mentee" />
      </BrowserRouter>
    );

    const openChatBtn = screen.getByRole("button", { name: /Open Chat/i });
    expect(openChatBtn).toBeInTheDocument();

    fireEvent.click(openChatBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/chat/1");
  });

  it("renders completed session with Add Recap button", () => {
    const sessions = [
      {
        _id: "2",
        type: "video",
        date: new Date().toISOString(),
        status: "completed",
        duration: "1h",
      },
    ];

    render(
      <BrowserRouter>
        <SessionHistory initialSessions={sessions} userRole="mentor" />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", { name: /Add Recap/i })
    ).toBeInTheDocument();
  });

  it("opens recap dialog when Add Recap is clicked", () => {
    const sessions = [
      {
        _id: "3",
        type: "video",
        date: new Date().toISOString(),
        status: "completed",
      },
    ];

    render(
      <BrowserRouter>
        <SessionHistory initialSessions={sessions} userRole="mentor" />
      </BrowserRouter>
    );

    // Click the Add Recap button
    fireEvent.click(screen.getByRole("button", { name: /Add Recap/i }));

    // Check that the dialog heading exists
    expect(
      screen.getByRole("heading", { name: /Add Recap/i })
    ).toBeInTheDocument();

    // Check that the textarea/input inside the dialog exists
    expect(
      screen.getByPlaceholderText(/Write your mentor recap here/i)
    ).toBeInTheDocument();
  });

  it("opens rating modal for completed sessions (mentee)", async () => {
    const sessions = [
      {
        _id: "4",
        type: "video",
        date: new Date().toISOString(),
        status: "completed",
        mentor: "mentor123",
      },
    ];

    render(
      <BrowserRouter>
        <SessionHistory initialSessions={sessions} userRole="mentee" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Rate Your Mentor/i)).toBeInTheDocument();
    });

    // Query lucide-react stars by class instead of testid
    const stars = document.querySelectorAll("svg.lucide-star");
    expect(stars.length).toBeGreaterThan(0);

    fireEvent.click(stars[2]); // click 3rd star
    expect(stars[2].className.baseVal).toMatch(/starFilled/);

    fireEvent.click(screen.getByText(/Cancel/i));
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      "ratingModalDismissed_4",
      "true"
    );
  });
});
