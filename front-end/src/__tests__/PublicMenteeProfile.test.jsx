import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicMenteeProfile from "../Pages/profile/PublicMenteeProfile";

// Mock mentee data
const mockMentee = {
  fullName: "John Doe",
  email: "john@example.com",
  emailVisibility: true,
  completedSessions: 6,
  earnedBadges: [{ id: "1", earned: true }],
  profilePicture: "/uploads/john.png",
  profilePictureHidden: false,
  currentStatus: "Student",
  fieldOfStudy: ["Computer Science"],
  linkedIn: "https://linkedin.com/in/johndoe",
  mentorType: ["Career Guidance"],
  topics: ["React", "Node.js"],
  mentorshipFormat: "Online",
  goals: "Become a full-stack developer",
  bio: "Passionate learner",
};

beforeEach(() => {
  // Mock localStorage
  Storage.prototype.getItem = jest.fn(() => "mockToken");

  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ mentee: mockMentee }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={["/mentee/123"]}>
      <Routes>
        <Route path="/mentee/:menteeId" element={<PublicMenteeProfile />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("PublicMenteeProfile", () => {
  it("fetches mentee and displays profile info", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(mockMentee.fullName)).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText(/Sessions Completed/i)).toBeInTheDocument();
    });
  });

  it("renders avatar if profilePicture exists", async () => {
    renderComponent();

    await waitFor(() => {
      const avatar = screen.getByAltText(`${mockMentee.fullName}'s avatar`);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute(
        "src",
        `http://localhost:5000${mockMentee.profilePicture}`
      );
    });
  });

  it("renders default avatar if no profile picture", async () => {
    const menteeWithoutPic = { ...mockMentee, profilePicture: null };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ mentee: menteeWithoutPic }),
    });

    renderComponent();

    await waitFor(() => {
      // Use MUI's built-in test id for the default icon
      expect(
        screen.getByTestId("AccountCircleRoundedIcon")
      ).toBeInTheDocument();
    });
  });

  it("renders badges with correct progress", async () => {
    renderComponent();

    // Wait for profile to load first
    await waitFor(() => {
      expect(screen.getByText(mockMentee.fullName)).toBeInTheDocument();
    });

    // Click Achievements tab (it's a <button>, not role="tab")
    userEvent.click(screen.getByRole("button", { name: /Achievements/i }));

    await waitFor(() => {
      expect(screen.getByText("Starter")).toBeInTheDocument();
      expect(screen.getByText("5 Sessions")).toBeInTheDocument();
    });
  });

  it("handles fetch failure gracefully", async () => {
    // mock failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to fetch" }),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch/i)).toBeInTheDocument();
    });
  });
});
