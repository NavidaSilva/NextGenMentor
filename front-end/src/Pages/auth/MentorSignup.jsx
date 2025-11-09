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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MentorshipFormatSelector from "../../Components/auth/MentorshipFormatSelector";
import React from 'react';

const industries = [
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
  "Space Exploration & Research",
];

const MentorSignup = () => {
  const [isGoogleSignup, setIsGoogleSignup] = useState(false); //google sign up
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

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
          "http://localhost:5000/mentor/complete-profile",
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
        localStorage.setItem("token", data.token); // Save token
        navigate("/mentor");
      } else {
        console.error("Signup error:", data.errors || data);
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      currentStatus: "",
      industry: [],
      yearsExperience: "",
      currentRole: "",
      education: "",
      linkedIn: "",
      mentorshipFormat: "both",
      menteeLevel: [],
      bio: "",
      profilePicture: "",
    },
    validationSchema: Yup.object({
      currentStatus: Yup.string().required("Required"),
      industry: Yup.array().min(1, "Select at least one"),
      yearsExperience: Yup.string().required("Required"),
      menteeLevel: Yup.array().min(1, "Select at least one"),
      linkedIn: Yup.string().required("Required"),
    
education: Yup.string()
  .test(
    "is-valid-degree",
    "Degree must start with a valid type like BSc, MSc, PhD, etc.",
    (value) => {
      if (!value) return false;
      const validPrefixes = [
        "High School", "Diploma", "Associate Degree", "BSc", "BA", "BCom", "BBA",
        "LLB", "BEng", "MBBS", "MSc", "MA", "MBA", "MCom", "MPhil", "MTech",
        "LLM", "PhD", "EdD", "DSc", "MD", "Bachelor"
      ];
      return validPrefixes.some((prefix) =>
        value.trim().toLowerCase().startsWith(prefix.toLowerCase())
      );
    }
  )
  .required("Required"),      
    }),

    onSubmit: onSubmitFunction,
  });

  const handleGoogleSignup = () => {
    window.location.href = "http://localhost:5000/auth/google?role=mentor";
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
    <div className="auth-container mentor-signup">
      <h1>Become a Mentor</h1>

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
          {["Professional", "Academic", "Freelancer", "Industry Expert"].map(
            (option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            )
          )}
        </TextField>

        <MultiSelectInput
          label="Industry / Field of Expertise"
          name="industry"
          options={industries}
          formik={formik}
        />

        <TextField
          select
          fullWidth
          label="Years of Experience"
          name="yearsExperience"
          value={formik.values.yearsExperience}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          margin="normal"
          error={
            formik.touched.yearsExperience &&
            Boolean(formik.errors.yearsExperience)
          }
          helperText={
            formik.touched.yearsExperience && formik.errors.yearsExperience
          }
        >
          {["0-2", "3-5", "6-10", "10+"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <InputField
          label="Current Role / Job Title"
          name="currentRole"
          formik={formik}
        />
        <InputField
          label="Educational Qualifications"
          name="education"
          formik={formik}
        />
        <InputField
          label="LinkedIn Profile URL"
          name="linkedIn"
          formik={formik}
        />

        <MentorshipFormatSelector
          value={formik.values.mentorshipFormat}
          onChange={formik.handleChange}
        />

        <div className="form-section">
          <h3>Preferred Mentee Level</h3>
          {["Undergraduate", "Graduate", "Early-career"].map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  name="menteeLevel"
                  value={level}
                  checked={formik.values.menteeLevel.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      formik.setFieldValue("menteeLevel", [
                        ...formik.values.menteeLevel,
                        level,
                      ]);
                    } else {
                      formik.setFieldValue(
                        "menteeLevel",
                        formik.values.menteeLevel.filter((l) => l !== level)
                      );
                    }
                  }}
                />
              }
              label={level}
            />
          ))}
          {formik.touched.menteeLevel && formik.errors.menteeLevel && (
            <div style={{ color: "red", fontSize: "0.875rem" }}>
              {formik.errors.menteeLevel}
            </div>
          )}
        </div>

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

        <Button type="submit">Complete Mentor Signup</Button>
      </form>
    </div>
  );
};

export default MentorSignup;
