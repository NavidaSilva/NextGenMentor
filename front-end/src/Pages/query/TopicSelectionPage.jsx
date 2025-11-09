import React from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";

import Button from "../../Components/Common/Button";
import MultiSelectInput from "../../Components/Common/MultiSelectInput";
import InputField from "../../Components/Common/InputField";
import MentorshipFormatSelector from "../../Components/auth/MentorshipFormatSelector";

const TopicSelectionPage = () => {
  const [suggestedMentors, setSuggestedMentors] = useState([]);
  const navigate = useNavigate();

  const commonTopics = [
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

  // Yup schema for fields other than topics/customTopic combination
  const validationSchema = Yup.object({
    mentorshipHeading: Yup.string().required("Mentorship heading is required"),
    description: Yup.string().required("Description is required"),
    experience: Yup.string().required("Experience is required"),
    communicationMethod: Yup.string().required(
      "Communication method is required"
    ),
    learningGoal: Yup.string().required("Learning goal is required"),
  });

  // Manual validate function to check topics or customTopic
  const validate = (values) => {
    const errors = {};

    if (
      (!values.topics || values.topics.length === 0) &&
      !values.customTopic.trim()
    ) {
      errors.topics = "Please select at least one topic or type a custom topic";
    }

    return errors;
  };

 const formik = useFormik({
  initialValues: {
    topics: [],
    customTopic: "",
    mentorshipHeading: "",
    description: "",
    experience: "",
    communicationMethod: "",
    learningGoal: "",
  },
  validationSchema,
  validate,
  onSubmit: async (values) => {
    try {
      let combinedTopics = [...values.topics];
      if (values.customTopic.trim() !== "") {
        combinedTopics.push(values.customTopic.trim());
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/mentee/suggest-mentors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...values,
            topics: combinedTopics,
            customTopic: "", // Clear customTopic since merged
          }),
        }
      );

      const data = await response.json();
      console.log("Suggest mentors response:", data);

      if (response.ok) {
        setSuggestedMentors(data.mentors || []);
        if (data.mentors && data.mentors.length > 0) {
          navigate("/recomend-mentors", {
            state: {
              mentors: data.mentors, // Pass mentors directly
              selectedTopic: combinedTopics[0] || "N/A",
              mentorshipHeading: values.mentorshipHeading,
              description: values.description,
              communicationMethod: values.communicationMethod,
              learningGoal: values.learningGoal,
            },
          });
        } else {
          console.warn("No mentors returned:", data);
          alert("No mentors found matching your criteria.");
        }
      } else {
        console.error("Failed to fetch mentors:", data.error);
        alert(`Failed to fetch mentors: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error in suggest-mentors request:", err);
      alert("An error occurred while fetching mentors.");
    }
  },
});

  return (
    <div className="topicSelection">
      <h1>Create a New Mentorship Query</h1>
      <form onSubmit={formik.handleSubmit}>
        {/* Topic Selection */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mb: 1 }}>
          <Typography variant="subtitle1">Topic of Interest</Typography>
        </Box>
        <MultiSelectInput
          label="Select Topic(s)"
          name="topics"
          options={commonTopics}
          formik={formik}
        />

        {/* Custom topic text field */}
        <TextField
          fullWidth
          label="Or type your own topic"
          name="customTopic"
          value={formik.values.customTopic}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          margin="normal"
          placeholder="Type a custom topic here"
        />

        {/* Show error if no topic chosen or typed */}
        {formik.touched.topics && formik.errors.topics && (
          <div style={{ color: "red", marginTop: 4 }}>
            {formik.errors.topics}
          </div>
        )}

        {/* Mentorship Heading */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mt: 3 }}>
          <Typography variant="subtitle1">Mentorship Heading</Typography>
        </Box>
        <InputField
          label="Subject of your Query"
          name="mentorshipHeading"
          formik={formik}
        />
        {formik.touched.mentorshipHeading &&
          formik.errors.mentorshipHeading && (
            <div style={{ color: "red" }}>
              {formik.errors.mentorshipHeading}
            </div>
          )}

        {/* Description */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mt: 3 }}>
          <Typography variant="subtitle1">
            Detailed Question or Description
          </Typography>
        </Box>
        <InputField
          label="Describe your problem or what you want help with..."
          name="description"
          formik={formik}
        />
        {formik.touched.description && formik.errors.description && (
          <div style={{ color: "red" }}>{formik.errors.description}</div>
        )}

        {/* Experience */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mt: 3 }}>
          <Typography variant="subtitle1">Years of Experience</Typography>
        </Box>
        <TextField
          select
          fullWidth
          label="Years of Experience"
          name="experience"
          value={formik.values.experience}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          margin="normal"
        >
          {["0-2", "3-5", "6-10", "10+"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        {formik.touched.experience && formik.errors.experience && (
          <div style={{ color: "red" }}>{formik.errors.experience}</div>
        )}

        {/* Preferred Communication Method */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mt: 3 }}>
          <Typography variant="subtitle1">
            Preferred Communication Method
          </Typography>
        </Box>
        <MentorshipFormatSelector
          value={formik.values.communicationMethod}
          onChange={(e) =>
            formik.setFieldValue("communicationMethod", e.target.value)
          }
        />
        {formik.touched.communicationMethod &&
          formik.errors.communicationMethod && (
            <div style={{ color: "red" }}>
              {formik.errors.communicationMethod}
            </div>
          )}

        {/* Learning Goal */}
        <Box sx={{ bgcolor: "#5fcf80", borderRadius: 2, p: 1, mt: 3 }}>
          <Typography variant="subtitle1">
            Learning Goal / Expected Outcome
          </Typography>
        </Box>
        <InputField
          label="By the end of this, I hope to..."
          name="learningGoal"
          formik={formik}
        />
        {formik.touched.learningGoal && formik.errors.learningGoal && (
          <div style={{ color: "red" }}>{formik.errors.learningGoal}</div>
        )}

        {/* Form Actions */}
        <div style={{ marginTop: 20 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            CANCEL
          </Button>

          <Button type="submit" variant="primary" style={{ marginLeft: 10 }}>
            SUBMIT QUERY
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TopicSelectionPage;
