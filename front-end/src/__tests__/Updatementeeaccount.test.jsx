import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import '@testing-library/jest-dom';
import UpdateAccount from "../Pages/settings/mentee/account";


global.fetch = jest.fn();

const mockUserData = {
  currentStatus: "Undergraduate",
  fieldOfStudy: ["Computer Science / IT"],
  linkedIn: "https://linkedin.com/in/test",
  mentorType: ["Industry Expert"],
  topics: ["Career Advice"],
  mentorshipFormat: "online",
  goals: "Learn new skills",
  bio: "Short bio",
  profilePicture: "/uploads/avatar.jpg",
};

beforeEach(() => {
  fetch.mockClear();
  localStorage.setItem("token", "fake-token");
});

test("renders loading state initially", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUserData,
  });

  render(<UpdateAccount />);
  expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText(/Update Your Account/i)).toBeInTheDocument();
  });
});

test("fetches and displays user profile", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUserData,
  });

  await act(async () => {
    render(<UpdateAccount />);
  });

  await waitFor(() => {
    expect(screen.getByDisplayValue("Undergraduate")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://linkedin.com/in/test")).toBeInTheDocument();
    expect(screen.getByText("Industry Expert")).toBeInTheDocument();
    expect(screen.getByText("Career Advice")).toBeInTheDocument();
  });

  // Check avatar is shown
  const avatar = screen.getByAltText("Avatar Preview");
  expect(avatar).toHaveAttribute("src", "http://localhost:5000/uploads/avatar.jpg");
});

test("handles avatar upload", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUserData,
  });

  render(<UpdateAccount />);
  await waitFor(() => screen.getByText(/Update Your Account/i));

  const file = new File(["avatar"], "avatar.png", { type: "image/png" });
  const input = screen.getByLabelText(/file/i) || screen.getByRole("textbox", { hidden: true });
  
  Object.defineProperty(input, "files", {
    value: [file],
  });

  fireEvent.change(input);

  await waitFor(() => {
    const preview = screen.getByAltText("Avatar Preview");
    expect(preview).toBeInTheDocument();
  });
});

test("removes avatar when remove button clicked", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUserData,
  });

  render(<UpdateAccount />);
  await waitFor(() => screen.getByText(/Remove Picture/i));

  const removeBtn = screen.getByText(/Remove Picture/i);
  fireEvent.click(removeBtn);

  expect(screen.queryByAltText("Avatar Preview")).not.toBeInTheDocument();
});

test("submits form successfully", async () => {
  fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Profile updated" }),
    });

  render(<UpdateAccount />);
  await waitFor(() => screen.getByText(/Update Your Account/i));

  const submitBtn = screen.getByRole("button", { name: /update profile/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(2); // initial fetch + submit
  });
});

test("cancel button resets form", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUserData,
  });

  render(<UpdateAccount />);
  await waitFor(() => screen.getByText(/Update Your Account/i));

  const linkedInInput = screen.getByDisplayValue("https://linkedin.com/in/test");
  fireEvent.change(linkedInInput, { target: { value: "https://linkedin.com/in/changed" } });

  const cancelBtn = screen.getByRole("button", { name: /cancel/i });
  fireEvent.click(cancelBtn);

  await waitFor(() => {
    expect(screen.getByDisplayValue("https://linkedin.com/in/test")).toBeInTheDocument();
  });
});
