import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
} from "@mui/material";
import MultiSelectInput from "../../../Components/Common/MultiSelectInput";
import InputField from "../../../Components/Common/InputField";
import MentorshipFormatSelector from "../../../Components/auth/MentorshipFormatSelector";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import Button from "../../../Components/Common/Button";

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
];

const UpdateAccount = () => {
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removeProfilePic, setRemoveProfilePic] = useState(false); 
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchMentee() {
      if (!token) {
        alert("Not authenticated, please log in.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/mentee/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        const loadedValues = {
          currentStatus: data.currentStatus || "",
          fieldOfStudy: data.fieldOfStudy || [],
          linkedIn: data.linkedIn || "",
          mentorType: data.mentorType || [],
          topics: data.topics || [],
          mentorshipFormat: data.mentorshipFormat || "both",
          goals: data.goals || "",
          bio: data.bio || "",
          profilePicture: null, // file input blank initially
        };

        setInitialValues(loadedValues);

        formik.setValues(loadedValues);

        if (data.profilePicture) {
  const resolvedUrl = data.profilePicture.startsWith("http")
    ? data.profilePicture
    : `http://localhost:5000${data.profilePicture}`;
  setAvatarPreview(resolvedUrl);
  loadedValues.profilePicture = resolvedUrl;
} else {
  setAvatarPreview(null);
  loadedValues.profilePicture = null;

        }
      } catch (err) {
        console.error(err);
        alert("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }
    fetchMentee();
  }, [token]);

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
      profilePicture: null,
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
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();

        // Add/remove picture logic
        if (removeProfilePic) {
  formData.append("removeProfilePicture", "true");
} else if (values.profilePicture instanceof File) {
  formData.append("profilePicture", values.profilePicture);
}

        for (const key in values) {
  if (key === "profilePicture") continue; 
  else if (Array.isArray(values[key])) {
    values[key].forEach((item) => formData.append(`${key}[]`, item));
  } else if (values[key]) {
    formData.append(key, values[key]);
  }
}

        const response = await fetch(
          "http://localhost:5000/mentee/complete-profile",
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (response.ok) {
          alert("Profile updated successfully!");
          window.location.reload();
        } else {
          alert(
            "Failed to update profile: " +
              JSON.stringify(data.errors || data.message || data)
          );
        }
      } catch (err) {
        console.error(err);
        alert("Error updating profile.");
      }
    },
  });

  // Handle avatar upload and preview
  const handleProfilePicChange = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      setRemoveProfilePic(false); 
      formik.setFieldValue("profilePicture", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePic = () => {                                     
    setAvatarPreview(null);
    setRemoveProfilePic(true);
    formik.setFieldValue("profilePicture", null);
  };


  // Cancel button handler: reset form and avatar preview to initial loaded values
  const handleCancel = () => {
    if (initialValues) {
      formik.resetForm();
      formik.setValues(initialValues);
      setAvatarPreview(
        initialValues.profilePicture
          ? initialValues.profilePicture.startsWith("http")
            ? initialValues.profilePicture
            : `http://localhost:5000${initialValues.profilePicture}`
          : null
      );
      setRemoveProfilePic(false);
    }
    setRemoveProfilePic(false);
  };

  if (loading) return <div>Loading your profile...</div>;

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "auto",
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Typography variant="h4" textAlign="center" mb={3}>
        Update Your Account
      </Typography>

      {/* Avatar preview & click to upload */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          overflow: "hidden",
          bgcolor: "#e3e7eb",
          mx: "auto",
          mb: 3,
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          color: "#999",
          "&:hover": {
            boxShadow: "0 0 8px rgba(0,0,0,0.3)",
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Avatar Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ) : (
          <AccountCircleRoundedIcon sx={{ fontSize: 80, color: "#9e9e9e" }} />
        )}
        <Box
          sx={{
            position: "absolute",
            bottom: 6,
            right: 6,
            bgcolor: "primary.main",
            color: "white",
            borderRadius: "50%",
            p: "4px",
            boxShadow: "0 0 6px rgba(0, 119, 255, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          
        </Box>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/jpg,image/png"
          style={{ display: "none" }}
          onChange={handleProfilePicChange}
        />
      </Box>

      {/* Remove‑picture button (only visible if a pic exists) */}             
      {avatarPreview && (
        <Button
          color="error"
          variant="text"
          fullWidth
          startIcon={<DeleteForeverRoundedIcon />}
          onClick={handleRemoveProfilePic}
          sx={{ mb: 2 }}
        >
          Remove Picture
        </Button>
      )}


      <form onSubmit={formik.handleSubmit} noValidate>
        <TextField
          select
          fullWidth
          label="Current Status"
          name="currentStatus"
          value={formik.values.currentStatus}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          margin="normal"
          error={formik.touched.currentStatus && Boolean(formik.errors.currentStatus)}
          helperText={formik.touched.currentStatus && formik.errors.currentStatus}
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

        <InputField label="LinkedIn Profile (optional)" name="linkedIn" formik={formik} />

        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography variant="h6">Preferred Mentor Type</Typography>
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
                      formik.setFieldValue("mentorType", [...formik.values.mentorType, type]);
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
        </Box>

        <MultiSelectInput
          label="Topics you need help with"
          name="topics"
          options={topics}
          formik={formik}
        />

        <MentorshipFormatSelector
          value={formik.values.mentorshipFormat}
          onChange={(e) => formik.setFieldValue("mentorshipFormat", e.target.value)}
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

        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            sx={{ width: "48%" }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ width: "48%" }}
          >
            Update Profile
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default UpdateAccount;
