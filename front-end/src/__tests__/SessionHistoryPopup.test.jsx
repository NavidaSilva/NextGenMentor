import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionHistory from "../Components/query/SessionHistory";
import { BrowserRouter } from "react-router-dom";

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
});

describe("SessionHistory Component - Session History Popup", () => {
  const mockSessions = [
    {
      _id: "session1",
      type: "video",
      date: new Date("2025-12-25T10:00:00Z").toISOString(),
      status: "completed",
      duration: "1h",
      googleMeetLink: "https://meet.google.com/test",
      mentor: { _id: "mentor1", fullName: "John Mentor" },
      mentee: { _id: "mentee1", fullName: "Jane Mentee" },
      menteeRated: false,
      menteeRating: null,
      recapMentor: "",
      recapMentee: "",
      actualStartTime: new Date("2025-12-25T10:05:00Z").toISOString(),
      actualEndTime: new Date("2025-12-25T11:00:00Z").toISOString(),
      actualDuration: 55,
    },
    {
      _id: "session2",
      type: "chat",
      date: new Date("2025-12-20T14:00:00Z").toISOString(),
      status: "completed",
      duration: "1h",
      mentor: { _id: "mentor2", fullName: "Alice Mentor" },
      mentee: { _id: "mentee2", fullName: "Bob Mentee" },
      menteeRated: true,
      menteeRating: 5,
      recapMentor: "Great session!",
      recapMentee: "Learned a lot!",
      actualStartTime: new Date("2025-12-20T14:02:00Z").toISOString(),
      actualEndTime: new Date("2025-12-20T14:45:00Z").toISOString(),
      actualDuration: 43,
    },
    {
      _id: "session3",
      type: "video",
      date: new Date("2025-12-30T09:00:00Z").toISOString(),
      status: "upcoming",
      duration: "1h",
      googleMeetLink: "https://meet.google.com/upcoming",
      mentor: { _id: "mentor3", fullName: "Charlie Mentor" },
      mentee: { _id: "mentee3", fullName: "Diana Mentee" },
    },
    {
      _id: "session4",
      type: "chat",
      date: new Date("2025-12-28T15:00:00Z").toISOString(),
      status: "in-progress",
      duration: "1h",
      mentor: { _id: "mentor4", fullName: "Eve Mentor" },
      mentee: { _id: "mentee4", fullName: "Frank Mentee" },
      actualStartTime: new Date("2025-12-28T15:01:00Z").toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "token") return "fake-token";
      if (key === "role") return "mentee";
      return null;
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ sessions: mockSessions })),
    });
  });

  describe("Session List Display", () => {
    it("renders sessions with correct status chips", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      expect(screen.getAllByText("Completed")[0]).toBeInTheDocument();
      expect(screen.getByText("Upcoming")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("displays actual duration when available", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      // Check that actual durations are displayed
      expect(screen.getByText("Duration: 55 min")).toBeInTheDocument();
      expect(screen.getByText("Duration: 43 min")).toBeInTheDocument();
    });

    it("displays scheduled duration when actual duration not available", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      expect(screen.getAllByText("Duration: 1h")[0]).toBeInTheDocument();
    });
  });

  describe("Session Actions", () => {
    it("shows Start Session button for upcoming sessions", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const startButtons = screen.getAllByText("Start Session");
      expect(startButtons).toHaveLength(1); // Only upcoming session
    });

    it("shows Join Call button for video sessions", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const joinCallButtons = screen.getAllByText("Join Call");
      expect(joinCallButtons).toHaveLength(1); // Only upcoming video sessions show Join Call
    });

    it("shows Open Chat button for chat sessions", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const openChatButtons = screen.getAllByText("Open Chat");
      expect(openChatButtons).toHaveLength(1); // Only in-progress chat sessions show Open Chat
    });

    it("shows End Session button for in-progress sessions (mentor only)", () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === "token") return "fake-token";
        if (key === "role") return "mentor";
        return null;
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentor" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const endSessionButtons = screen.getAllByText("End Session");
      expect(endSessionButtons).toHaveLength(1); // Only in-progress session
    });

    it("shows Session History button for completed sessions", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButtons = screen.getAllByText("Session History");
      expect(historyButtons).toHaveLength(2); // Two completed sessions
    });
  });

  describe("Session Start Functionality", () => {
    it("calls start session API when Start Session is clicked", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: "Session started" })),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={true} />
        </BrowserRouter>
      );

      const startButton = screen.getByText("Start Session");
      await user.click(startButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:5000/sessions/session3/start",
          expect.objectContaining({
            method: "POST",
            headers: { Authorization: "Bearer fake-token" },
          })
        );
      });
    });

    it("handles start session API errors gracefully", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: "Failed to start" })),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={true} />
        </BrowserRouter>
      );

      const startButton = screen.getByText("Start Session");
      await user.click(startButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("fetchSessions failed with status", undefined);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Session Complete Functionality", () => {
    it("calls complete session API when End Session is clicked", async () => {
      const user = userEvent.setup();
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === "token") return "fake-token";
        if (key === "role") return "mentor";
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: "Session completed" })),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentor" fetchFromAPI={true} />
        </BrowserRouter>
      );

      const endButton = screen.getByText("End Session");
      await user.click(endButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:5000/sessions/session4/complete",
          expect.objectContaining({
            method: "POST",
            headers: { Authorization: "Bearer fake-token" },
          })
        );
      });
    });
  });

  describe("Session History Popup", () => {
    it("opens session history popup when Session History button is clicked", async () => {
      const user = userEvent.setup();
      
      const mockDetailedSession = {
        _id: "session1",
        type: "video",
        date: new Date("2025-12-25T10:00:00Z").toISOString(),
        status: "completed",
        mentor: { fullName: "John Mentor" },
        mentee: { fullName: "Jane Mentee" },
        actualStartTime: new Date("2025-12-25T10:05:00Z").toISOString(),
        actualEndTime: new Date("2025-12-25T11:00:00Z").toISOString(),
        actualDuration: 55,
        recapMentor: "Great session!",
        recapMentee: "Learned a lot!",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDetailedSession)),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(screen.getAllByRole("heading", { name: "Session History" })[0]).toBeInTheDocument();
        expect(screen.getByText("Session Overview")).toBeInTheDocument();
      });
    });

    it("displays scheduled vs actual timing information", async () => {
      const user = userEvent.setup();
      
      const mockDetailedSession = {
        _id: "session1",
        type: "video",
        date: new Date("2025-12-25T10:00:00Z").toISOString(),
        status: "completed",
        mentor: { fullName: "John Mentor" },
        mentee: { fullName: "Jane Mentee" },
        actualStartTime: new Date("2025-12-25T10:05:00Z").toISOString(),
        actualEndTime: new Date("2025-12-25T11:00:00Z").toISOString(),
        actualDuration: 55,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDetailedSession)),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText("Scheduled:")).toBeInTheDocument();
        expect(screen.getByText("Actual Start:")).toBeInTheDocument();
        expect(screen.getByText("Actual End:")).toBeInTheDocument();
        expect(screen.getByText("Scheduled Duration:")).toBeInTheDocument();
        expect(screen.getByText("Actual Duration:")).toBeInTheDocument();
        expect(screen.getByText("55 minutes")).toBeInTheDocument();
      });
    });

    it("shows only scheduled information when actual timing not available", async () => {
      const user = userEvent.setup();
      
      const mockDetailedSession = {
        _id: "session1",
        type: "video",
        date: new Date("2025-12-25T10:00:00Z").toISOString(),
        status: "completed",
        mentor: { fullName: "John Mentor" },
        mentee: { fullName: "Jane Mentee" },
        // No actual timing data
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDetailedSession)),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText("Scheduled:")).toBeInTheDocument();
        expect(screen.queryByText("Actual Start:")).not.toBeInTheDocument();
        expect(screen.queryByText("Actual End:")).not.toBeInTheDocument();
        expect(screen.queryByText("Actual Duration:")).not.toBeInTheDocument();
      });
    });

    it("displays participants information correctly", async () => {
      const user = userEvent.setup();
      
      const mockDetailedSession = {
        _id: "session1",
        type: "video",
        date: new Date("2025-12-25T10:00:00Z").toISOString(),
        status: "completed",
        mentor: { fullName: "John Mentor" },
        mentee: { fullName: "Jane Mentee" },
        actualStartTime: new Date("2025-12-25T10:05:00Z").toISOString(),
        actualEndTime: new Date("2025-12-25T11:00:00Z").toISOString(),
        actualDuration: 55,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDetailedSession)),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText("Participants")).toBeInTheDocument();
        expect(screen.getByText("John Mentor")).toBeInTheDocument();
        expect(screen.getByText("Jane Mentee")).toBeInTheDocument();
      });
    });

    it("closes popup when close button is clicked", async () => {
      const user = userEvent.setup();
      
      const mockDetailedSession = {
        _id: "session1",
        type: "video",
        date: new Date("2025-12-25T10:00:00Z").toISOString(),
        status: "completed",
        mentor: { fullName: "John Mentor" },
        mentee: { fullName: "Jane Mentee" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDetailedSession)),
      });

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(screen.getAllByRole("heading", { name: "Session History" })[0]).toBeInTheDocument();
      });

      // Click outside the dialog to close it
      const dialog = screen.getByRole("dialog");
      await user.click(dialog.parentElement);

      await waitFor(() => {
        expect(screen.queryByText("Session Overview")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles fetch session details errors gracefully", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: "Session not found" })),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch session details:", undefined);
      });

      consoleSpy.mockRestore();
    });

    it("opens dialog and displays session details", async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const historyButton = screen.getAllByText("Session History")[0];
      await user.click(historyButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Verify dialog content
      expect(screen.getByText("Session Overview")).toBeInTheDocument();
    });
  });

  describe("Recap Functionality", () => {
    it("shows Add Recap button for completed sessions without recap", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const addRecapButtons = screen.getAllByText("Add Recap");
      expect(addRecapButtons).toHaveLength(1); // Only session1 has no recap
    });

    it("shows View / Edit Recap button for completed sessions with recap", () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const editRecapButtons = screen.getAllByText("View / Edit Recap");
      expect(editRecapButtons).toHaveLength(1); // Only session2 has recap
    });

    it("opens recap dialog when Add Recap is clicked", async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      const addRecapButtons = screen.getAllByText("Add Recap");
      const addRecapButton = addRecapButtons[0]; // Get the first button (not the dialog title)
      await user.click(addRecapButton);

      expect(screen.getByRole("heading", { name: "Add Recap" })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Write your mentee recap here/i)).toBeInTheDocument();
    });
  });

  describe("Rating Functionality", () => {
    it("opens rating modal for completed sessions without rating (mentee)", async () => {
      render(
        <BrowserRouter>
          <SessionHistory initialSessions={mockSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Rate Your Mentor")).toBeInTheDocument();
      });
    });

    it("does not open rating modal for already rated sessions", () => {
      const ratedSessions = [
        {
          _id: "session1",
          type: "video",
          date: new Date().toISOString(),
          status: "completed",
          menteeRated: true,
          menteeRating: 5,
        },
      ];

      render(
        <BrowserRouter>
          <SessionHistory initialSessions={ratedSessions} userRole="mentee" fetchFromAPI={false} />
        </BrowserRouter>
      );

      expect(screen.queryByText("Rate Your Mentor")).not.toBeInTheDocument();
    });
  });
});
