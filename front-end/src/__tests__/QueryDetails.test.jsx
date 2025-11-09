import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QueryDetails from "../Pages/query/QueryDetails";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";
import axios from "axios";

jest.mock("axios");

// 🔧 Suppress console logs and errors during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

// 🔧 Setup localStorage mocks
beforeEach(() => {
  Storage.prototype.getItem = jest.fn((key) => {
    switch (key) {
      case "token":
        return "fake-jwt";
      case "role":
        return "mentor"; // default is mentor
      default:
        return null;
    }
  });
});

// 🔧 Setup fetch mocks
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          query: {
            _id: "q1",
            topic: "React Testing",
            description: "Testing QueryDetails component",
            createdAt: "2025-08-01T12:00:00Z",
            mentee: {
              _id: "me1",
              fullName: "John Doe",
              email: "john@example.com",
              currentStatus: "Student",
              fieldOfStudy: ["Computer Science"],
            },
            mentor: {
              _id: "m1",
              fullName: "Jane Smith",
              email: "jane@example.com",
              yearsExperience: 5,
              industry: ["Software Development"],
            },
          },
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("QueryDetails Page", () => {
  test("renders QueryDetails and shows query info", async () => {
    render(
      <MemoryRouter initialEntries={["/queries/q1"]}>
        <Routes>
          <Route path="/queries/:queryId" element={<QueryDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Query Description")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Testing QueryDetails component")
    ).toBeInTheDocument();
    expect(screen.getByText(/Mentee Details/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
  });

  test("can switch to Sessions tab and render sessions", async () => {
    render(
      <MemoryRouter initialEntries={["/queries/q1"]}>
        <Routes>
          <Route path="/queries/:queryId" element={<QueryDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Query Description")).toBeInTheDocument();
    });

    // Click the Sessions tab
    fireEvent.click(screen.getByRole("tab", { name: /Sessions/i }));

    // ✅ Check that the tab button exists
    expect(screen.getByRole("tab", { name: /Sessions/i })).toBeInTheDocument();

    // ✅ Check that the tab content renders correctly
    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument();
  });

  test("mentor can decline mentorship", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={["/queries/q1"]}>
        <Routes>
          <Route path="/queries/:queryId" element={<QueryDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Query Description")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Decline Mentorship/i }));

    expect(
      await screen.findByText(/Why are you declining this mentorship/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Query not in my expertise/i));

    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/decline",
        {
          mentorshipRequestId: "q1",
          reason: "This query does not match my area of expertise.",
        },
        { headers: { Authorization: "Bearer fake-jwt" } }
      );
    });
  });

  test("mentee can request rematch", async () => {
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "token") return "fake-jwt";
      if (key === "role") return "mentee";
      return null;
    });

    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={["/queries/q1"]}>
        <Routes>
          <Route path="/queries/:queryId" element={<QueryDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Query Description")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Rematch/i }));

    expect(
      await screen.findByText(/Why do you want a rematch/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(
        /Mentor’s skills\/experience don’t align with my needs/i
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/rematch",
        {
          mentorshipRequestId: "q1",
          reason:
            "Mentee felt their goals may be better supported by a mentor with a different set of skills or experience.",
        },
        { headers: { Authorization: "Bearer fake-jwt" } }
      );
    });
  });

  test("hides decline/rematch buttons if no role is set", async () => {
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "token") return "fake-jwt";
      return null;
    });

    render(
      <MemoryRouter initialEntries={["/queries/q1"]}>
        <Routes>
          <Route path="/queries/:queryId" element={<QueryDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Query Description")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /Decline Mentorship/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Rematch/i })
    ).not.toBeInTheDocument();
  });
});
