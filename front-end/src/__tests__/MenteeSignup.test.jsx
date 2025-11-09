// src/__tests__/MenteeSignup.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import MenteeSignup from "../Pages/auth/MenteeSignup";

// Helper for rendering with router
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe("MenteeSignup Component", () => {
  test("renders heading and Google signup button", () => {
    renderWithRouter(<MenteeSignup />);
    expect(screen.getByText(/Join as a Mentee/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up with Google/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete Mentee Signup/i })
    ).toBeInTheDocument();
  });

  test("shows validation errors when submitting empty form", async () => {
    renderWithRouter(<MenteeSignup />);

    const submitBtn = screen.getByRole("button", {
      name: /Complete Mentee Signup/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Required/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  test("accepts user input for Current Status and LinkedIn field", async () => {
    renderWithRouter(<MenteeSignup />);

    // Open select for Current Status
    const statusSelect = screen.getByLabelText(/Current Status/i);
    fireEvent.mouseDown(statusSelect);

    // Select "Undergraduate"
    const option = await screen.findByText("Undergraduate");
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByText("Undergraduate")).toBeInTheDocument();
    });

    // LinkedIn input
    const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
    fireEvent.change(linkedInInput, {
      target: { value: "https://linkedin.com/in/test" },
    });

    await waitFor(() => {
      expect(linkedInInput.value).toBe("https://linkedin.com/in/test");
    });
  });

  test("checks Preferred Mentor Type checkboxes", async () => {
    renderWithRouter(<MenteeSignup />);

    const industryCheckbox = screen.getByLabelText(/Industry Expert/i);
    fireEvent.click(industryCheckbox);

    await waitFor(() => {
      expect(industryCheckbox.checked).toBe(true);
    });
  });

  


});
