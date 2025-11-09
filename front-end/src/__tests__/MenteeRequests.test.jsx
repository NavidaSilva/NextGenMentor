import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MenteeRequests from "../Pages/query/MenteeRequests";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mocks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ id: "123" }),
  useLocation: () => ({
    search: "?role=mentor",
  }),
}));

beforeEach(() => {
  // Clear mocks before each test
  global.fetch = jest.fn();
  localStorage.setItem("token", "mockToken");
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

const mockQuery = {
  _id: "123",
  topic: "React Testing",
  description: "Learn to write tests",
  mentorshipHeading: "React Unit Testing",
  status: "pending",
  communicationMethod: "Video Call",
  learningGoal: "Understand RTL and Jest",
  mentee: { fullName: "Mentee User" },
  mentor: { fullName: "Mentor User" },
};

test("renders loading state initially", () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: mockQuery }),
  });

  render(
    <MemoryRouter initialEntries={["/queries/123?role=mentor"]}>
      <Routes>
        <Route path="/queries/:id" element={<MenteeRequests />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("renders query details after fetch", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: mockQuery }),
  });

  render(
    <MemoryRouter initialEntries={["/queries/123?role=mentor"]}>
      <Routes>
        <Route path="/queries/:id" element={<MenteeRequests />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Mentorship Query Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Topic:/)).toBeInTheDocument();
    expect(screen.getByText("React Testing")).toBeInTheDocument();
    expect(screen.getByText("Accept")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });
});

test("clicking Accept triggers fetch and alert", async () => {
  global.alert = jest.fn();
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: mockQuery }),
  });

  render(
    <MemoryRouter initialEntries={["/queries/123?role=mentor"]}>
      <Routes>
        <Route path="/queries/:id" element={<MenteeRequests />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Accept"));

  fetch.mockResolvedValueOnce({ ok: true });

  fireEvent.click(screen.getByText("Accept"));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/queries/123/accept",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer mockToken",
        }),
      })
    );
    expect(global.alert).toHaveBeenCalledWith("Accepted!");
  });
});

test("clicking Reject with failed response shows error", async () => {
  global.alert = jest.fn();

  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: mockQuery }),
  });

  render(
    <MemoryRouter initialEntries={["/queries/123?role=mentor"]}>
      <Routes>
        <Route path="/queries/:id" element={<MenteeRequests />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Reject"));

  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Something went wrong" }),
  });

  fireEvent.click(screen.getByText("Reject"));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/queries/123/reject",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer mockToken",
        }),
      })
    );
    expect(global.alert).toHaveBeenCalledWith(
      "Failed to reject: Something went wrong"
    );
  });
});
