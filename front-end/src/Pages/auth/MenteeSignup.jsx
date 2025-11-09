import { useFormik } from "formik";
import * as Yup from "yup";
import {
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import InputField from "../../Components/Common/InputField";
import MultiSelectInput from "../../Components/Common/MultiSelectInput";
import FileUpload from "../../Components/Common/FileUpload";
import GoogleAuthButton from "../../Components/auth/GoogleAuthButton";
import Button from "../../Components/Common/Button";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MentorshipFormatSelector from "../../Components/auth/MentorshipFormatSelector";

const topics = [
  "Career Advice",
  "Technical Skills",
  "Interview Prep",
  "Academic Guidance",
  "Networking",
];
const fieldsOfStudyOrCareer = [
  "Computer Science / IT",
  "Business Administration",
  "Psychology",
  "Engineering",
  "Medicine / Health Sciences",
  "Law",
  "Education",
  "Design / Fine Arts",
  "Data Science / AI",
  "Product Management",
  "UX/UI Design",
  "Finance",
  "Marketing",
  "Entrepreneurship",
  "Consulting",
  "Human Resources",
  "Cybersecurity",
  "Biomedical Research",
  "Architecture",
  "Social Impact / Non-profit",
  "  Agriculture & Agribusiness",
"Aerospace & Aviation",
"Automotive",
"Energy (Oil, Gas, Renewables)",
"Environmental & Sustainability",
"Biotechnology",
"Supply Chain & Logistics",
"Manufacturing & Industrial",
"Telecommunications",
"Hospitality & Tourism",
"Sports & Recreation",
"Media & Entertainment",
"Publishing & Journalism",
"Real Estate & Urban Development",
"Food & Beverage / Culinary Arts",
"Public Policy & Government",
"Military & Defense",
"Oceanography & Marine Industries",
"Mining & Metals",
"Transportation (Rail, Shipping, Public Transit)",
"Retail & E-commerce",
"Pharmaceuticals",
"Veterinary Medicine & Animal Sciences",
"Insurance",
"Cultural Heritage & Museums",
"Performing Arts & Music",
"Space Exploration & Research"
];

const MenteeSignup = () => {
  const [isGoogleSignup, setIsGoogleSignup] = useState(false); //google sign up
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  // Update form submission
  const onSubmitFunction = async (values) => {
    try {
      const formData = new FormData();

      // Append all values to formData
      for (const key in values) {
        if (Array.isArray(values[key])) {
          values[key].forEach((item) => formData.append(`${key}[]`, item));
        } else if (values[key]) {
          formData.append(key, values[key]);
        }
      }

      let response;
      if (isGoogleSignup) {
        response = await fetch(
          "http://localhost:5000/mentee/complete-profile",
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
      } else {
        const formData = new FormData();
        for (const key in values) {
          if (Array.isArray(values[key])) {
            values[key].forEach((item) => formData.append(`${key}[]`, item));
          } else {
            formData.append(key, values[key]);
          }
        }

        if (values.profilePicture instanceof File) {
          formData.set("profilePicture", values.profilePicture);
        }
      }

      const data = await response.json();

      if (response.ok) {
        console.log("Token in :", data.token);
        localStorage.setItem("token", data.token); // Save token
        navigate("/mentee");
      } else {
        console.error("Signup error:", data.errors || data);
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      currentStatus: "",
      fieldOfStudy: [],
      linkedIn: "",
      mentorType: [],
      topics: [],
      mentorshipFormat: "both",
      goals: "",
      bio: "",
      profilePicture: "",
    },
    validationSchema: Yup.object({
      currentStatus: Yup.string().required("Required"),
      fieldOfStudy: Yup.array()
        .of(Yup.string())
        .min(1, "Select at least one field")
        .required("Required"),
      mentorType: Yup.array()
        .of(Yup.string())
        .min(1, "Select at least one mentor type")
        .required("Required"),
      topics: Yup.array()
        .of(Yup.string())
        .min(1, "Select at least one topic")
        .required("Required"),
    }),

    onSubmit: onSubmitFunction,
  });

  // Update handleGoogleSignup
  const handleGoogleSignup = () => {
    window.location.href = "http://localhost:5000/auth/google?role=mentee";
  };

  // Add useEffect to check for token in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get("token");
    const googleSignup = queryParams.get("isGoogleSignup");

    const error = queryParams.get("error");

    if (error) {
      let message = "";
      switch (error) {
        case "already_registered_as_mentor":
          message =
            "This email is already registered as a Mentor. You cannot sign up as a Mentee.";
          break;
        case "already_registered_as_mentee":
          message =
            "This email is already registered as a Mentee. You cannot sign up as a Mentor.";
          break;
        case "auth_failed":
          message = "Authentication failed. Please try again.";
          break;
        default:
          message = "Something went wrong. Please try again.";
      }
      alert(message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (urlToken && googleSignup) {
      setToken(urlToken);
      setIsGoogleSignup(true);
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="auth-container mentee-signup">
      <h1>Join as a Mentee</h1>
      <GoogleAuthButton
        text="Sign up with Google"
        onClick={handleGoogleSignup}
      />
      {!isGoogleSignup ? (
        <></>
      ) : (
        <p className="form-heading">Fill out the rest of the form</p>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          select
          fullWidth
          label="Current Status"
          name="currentStatus"
          value={formik.values.currentStatus}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur} 
          margin="normal"
          error={
            formik.touched.currentStatus && Boolean(formik.errors.currentStatus)
          }
          helperText={
            formik.touched.currentStatus && formik.errors.currentStatus
          }
        >
          {["Undergraduate", "Postgraduate", "Early-career"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <MultiSelectInput
          label="Field of Study / Career Interest"
          name="fieldOfStudy"
          options={fieldsOfStudyOrCareer}
          formik={formik}
        />

        <InputField
          label="LinkedIn Profile (optional)"
          name="linkedIn"
          formik={formik}
        />

        <div className="form-section">
          <h3>Preferred Mentor Type</h3>
          {["Industry Expert", "Academic Guide", "Career Coach"].map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  name="mentorType"
                  value={type}
                  checked={formik.values.mentorType.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      formik.setFieldValue("mentorType", [
                        ...formik.values.mentorType,
                        type,
                      ]);
                    } else {
                      formik.setFieldValue(
                        "mentorType",
                        formik.values.mentorType.filter((t) => t !== type)
                      );
                    }
                  }}
                />
              }
              label={type}
            />
          ))}
        </div>

        <MultiSelectInput
          label="Topics you need help with"
          name="topics"
          options={topics}
          formik={formik}
        />

        <MentorshipFormatSelector
          value={formik.values.mentorshipFormat}
          onChange={formik.handleChange}
        />

        <InputField
          label="Your Learning Goals"
          name="goals"
          multiline
          rows={4}
          formik={formik}
        />

        <InputField
          label="Short Bio"
          name="bio"
          multiline
          rows={4}
          formik={formik}
        />

        <FileUpload
          label="Profile Picture"
          name="profilePicture"
          formik={formik}
        />

        <Button type="submit">Complete Mentee Signup</Button>
      </form>
    </div>
  );
};

export default MenteeSignup;
