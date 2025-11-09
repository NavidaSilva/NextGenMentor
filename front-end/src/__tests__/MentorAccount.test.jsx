import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MentorAccount from "../Pages/settings/mentor/account";

jest.mock("../components/common/InputField", () => (props) => (
  <div>
    <input
      data-testid={props.name}
      name={props.name}
      value={props.formik.values[props.name] || ""}
      onChange={props.formik.handleChange}
      onBlur={props.formik.handleBlur}
    />
    {props.formik.errors[props.name] && props.formik.touched[props.name] && (
      <span>{props.formik.errors[props.name]}</span>
    )}
  </div>
));

jest.mock("../components/common/MultiSelectInput", () => (props) => (
  <select
    multiple
    data-testid={props.name}
    name={props.name}
    value={props.formik.values[props.name]}
    onChange={(e) => {
      const options = Array.from(e.target.selectedOptions, (opt) => opt.value);
      props.formik.setFieldValue(props.name, options);
    }}
  >
    {props.options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
));

jest.mock("../components/auth/MentorshipFormatSelector", () => (props) => (
  <select
    data-testid="mentorshipFormat"
    name="mentorshipFormat"
    value={props.value}
    onChange={props.onChange}
  >
    <option value="online">Online</option>
    <option value="offline">Offline</option>
    <option value="both">Both</option>
  </select>
));

jest.mock("../components/common/Button", () => (props) => (
  <button onClick={props.onClick} type={props.type || "button"}>
    {props.children}
  </button>
));

describe("MentorAccount Component", () => {
  beforeAll(() => {
    window.alert = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-token");

    global.fetch = jest.fn((url) => {
      if (url.includes("/mentor/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            fullName: "John Doe",
            email: "john@example.com",
            currentStatus: "Professional",
            industry: ["Engineering"],
            yearsExperience: "6-10",
            currentRole: "Software Engineer",
            education: "BSc Computer Science",
            linkedIn: "http://linkedin.com/in/johndoe",
            mentorshipFormat: "online",
            menteeLevel: ["Graduate"],
            bio: "Experienced mentor",
            profilePicture: "/uploads/avatar.png",
          }),
        });
      }
      if (url.includes("/mentor/complete-profile")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
  });

  test("renders loading initially", () => {
    render(<MentorAccount />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("fetches and populates data", async () => {
    render(<MentorAccount />);

    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes("Update Mentor Account"))
      ).toBeInTheDocument()
    );

    expect(screen.getByDisplayValue("Professional")).toBeInTheDocument();
    expect(screen.getByTestId("currentRole").value).toBe("Software Engineer");
    expect(screen.getByTestId("education").value).toBe("BSc Computer Science");
  });

  test("shows validation errors", async () => {
    render(<MentorAccount />);

    await waitFor(() =>
      expect(screen.getByText(/Update Mentor Account/i)).toBeInTheDocument()
    );

    const educationInput = screen.getByTestId("education");

    fireEvent.change(educationInput, { target: { value: "Invalid Degree" } });
    fireEvent.blur(educationInput);

    fireEvent.click(screen.getByText(/Update Account/i));

    const errorMessage = await screen.findByText(
      /Degree must start with a valid type/i
    );
    expect(errorMessage).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    render(<MentorAccount />);

    await waitFor(() =>
      screen.getByText((content) => content.includes("Update Mentor Account"))
    );

    fireEvent.click(screen.getByText(/Update Account/i));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/mentor/complete-profile"),
        expect.objectContaining({
          method: "PUT",
          headers: expect.any(Object),
        })
      )
    );
  });

  test("handles avatar upload and remove", async () => {
    render(<MentorAccount />);

    await waitFor(() =>
      screen.getByText((content) => content.includes("Update Mentor Account"))
    );

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const input = document.getElementById("avatar-upload");

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("img")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Remove Avatar/i));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

  });

  test("cancel button resets form", async () => {
    render(<MentorAccount />);

    await waitFor(() =>
      screen.getByText((content) => content.includes("Update Mentor Account"))
    );

    const roleInput = screen.getByTestId("currentRole");

    fireEvent.change(roleInput, { target: { value: "Changed Role" } });
    expect(roleInput.value).toBe("Changed Role");

    fireEvent.click(screen.getByText(/Cancel/i));

    await waitFor(() =>
      expect(screen.getByTestId("currentRole").value).toBe("Software Engineer")
    );
    
  });
});
