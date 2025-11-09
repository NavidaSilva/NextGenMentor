// __tests__/GoalsSection.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GoalsSection from "../Components/query/GoalsSection";

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  Storage.prototype.getItem = jest.fn(() => "mock-token");
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

const mockReload = jest.fn();

const sampleGoals = [
  { _id: "1", description: "First goal", status: "not-started", feedback: "" },
  { _id: "2", description: "Second goal", status: "in-progress", feedback: "Good job!" }
];

describe("GoalsSection component", () => {
  test("renders goals list", () => {
    render(<GoalsSection goals={sampleGoals} userRole="mentee" queryId="q1" reload={mockReload} />);
    expect(screen.getByText("First goal")).toBeInTheDocument();
    expect(screen.getByText("Second goal")).toBeInTheDocument();
  });

  test("mentee can add a new goal", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<GoalsSection goals={sampleGoals} userRole="mentee" queryId="q1" reload={mockReload} />);

    fireEvent.change(screen.getByPlaceholderText("Add new goal..."), {
      target: { value: "New test goal" }
    });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/queries/q1/goals"),
      expect.objectContaining({ method: "POST" })
    ));

    expect(mockReload).toHaveBeenCalled();
  });

  
test("mentor can update goal status", async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  render(<GoalsSection goals={sampleGoals} userRole="mentor" queryId="q1" reload={mockReload} />);

  // Instead of getAllByLabelText("Status"), find the combobox elements directly
  const statusDropdowns = screen.getAllByRole("combobox"); // MUI Select has role="combobox"
  
  fireEvent.mouseDown(statusDropdowns[0]); // open first dropdown
  fireEvent.click(screen.getByText("Completed"));

  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/queries/goals/1"),
      expect.objectContaining({ method: "PATCH" })
    )
  );

  expect(mockReload).toHaveBeenCalled();
});


  test("mentor can submit feedback", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<GoalsSection goals={sampleGoals} userRole="mentor" queryId="q1" reload={mockReload} />);

    fireEvent.click(screen.getAllByText("Provide Feedback")[0]);

    const textarea = screen.getByPlaceholderText("Write your feedback...");
    fireEvent.change(textarea, { target: { value: "Nice work!" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/queries/goals/1"),
      expect.objectContaining({ method: "PATCH" })
    ));

    expect(mockReload).toHaveBeenCalled();
  });

  test("mentee can view feedback", () => {
    render(<GoalsSection goals={sampleGoals} userRole="mentee" queryId="q1" reload={mockReload} />);

    fireEvent.click(screen.getAllByText("View Feedback")[1]);

    expect(screen.getByText("Good job!")).toBeInTheDocument();
  });
});
