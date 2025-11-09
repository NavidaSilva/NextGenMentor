import { useEffect, useState } from "react";
import { useFormik } from "formik";
import React from "react";
import * as Yup from "yup";
import {
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Avatar,
  Box,
  Typography,
} from "@mui/material";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import InputField from "../../../Components/Common/InputField";
import MultiSelectInput from "../../../Components/Common/MultiSelectInput";
import MentorshipFormatSelector from "../../../Components/auth/MentorshipFormatSelector";
import Button from "../../../Components/Common/Button";

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
];

const MentorAccount = () => {
  const [initialValues, setInitialValues] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/mentor/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setInitialValues({
        fullName: data.fullName || "",
        email: data.email || "",
        currentStatus: data.currentStatus || "",
        industry: data.industry || [],
        yearsExperience: data.yearsExperience || "",
        currentRole: data.currentRole || "",
        education: data.education || "",
        linkedIn: data.linkedIn || "",
        mentorshipFormat: data.mentorshipFormat || "both",
        menteeLevel: data.menteeLevel || [],
        bio: data.bio || "",
        profilePicture: data.profilePicture || "",
      });

      if (data.profilePicture) {
        setAvatarPreview(`http://localhost:5000${data.profilePicture}`);
      } else {
        setAvatarPreview(null);
      }
      setAvatarRemoved(false); // reset removal status on fetch
    } catch (error) {
      console.error("Failed to load mentor profile", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validationSchema = Yup.object({
  currentStatus: Yup.string().required("Required"),
  industry: Yup.array().min(1, "Select at least one"),
  yearsExperience: Yup.string().required("Required"),
  menteeLevel: Yup.array().min(1, "Select at least one"),
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
});


  const onSubmit = async (values) => {
    try {
      const formData = new FormData();

      for (const key in values) {
        if (Array.isArray(values[key])) {
          values[key].forEach((item) => formData.append(`${key}[]`, item));
        } else {
          formData.append(key, values[key]);
        }
      }

      if (avatarRemoved) {
      formData.append("removeProfilePicture", "true");
    }

      if (values.profilePicture instanceof File) {
      formData.set("profilePicture", values.profilePicture);
    }

      const res = await fetch("http://localhost:5000/mentor/complete-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account updated successfully!");
        fetchProfile(); // Re-fetch updated data for sync
      } else {
        console.error("Update failed:", data);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues || {
      fullName: "",
      email: "",
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
    validationSchema,
    onSubmit,
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      formik.setFieldValue("profilePicture", file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarRemoved(false);
    }
  };

  const handleRemoveAvatar = () => {
    formik.setFieldValue("profilePicture", "");
    setAvatarPreview(null);
    setAvatarRemoved(true);
  };

  // Cancel button handler: resets form and avatar preview to initial values
  const handleCancel = () => {
    formik.resetForm();
    if (initialValues?.profilePicture) {
      setAvatarPreview(initialValues.profilePicture ? `http://localhost:5000${initialValues.profilePicture}` : null);
    } else {
      setAvatarPreview(null);
    }
    setAvatarRemoved(false);
  };

  if (!initialValues) return <p>Loading...</p>;

  return (
    <div className="auth-container mentor-account">
      <Typography variant="h4" gutterBottom>
        Update Mentor Account
      </Typography>

      {/* Avatar section like mentee */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        mb={3}
      >
        <label htmlFor="avatar-upload">
          <input
            accept="image/*"
            id="avatar-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <Avatar
            src={avatarPreview}
            sx={{
              width: 100,
              height: 100,
              cursor: "pointer",
              mb: 1,
            }}
          >
            {!avatarPreview && <AccountCircleRoundedIcon sx={{ fontSize: 50 }} />}
          </Avatar>
        </label>
        <Typography variant="body2" color="textSecondary">
          Click avatar to upload
        </Typography>

        {/* Remove Avatar button */}
        {avatarPreview && (
          <Button
    variant="outlined"
    color="error"
    onClick={handleRemoveAvatar}
  >
    Remove Avatar
  </Button>
        )}
      </Box>

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
          error={formik.touched.currentStatus && Boolean(formik.errors.currentStatus)}
          helperText={formik.touched.currentStatus && formik.errors.currentStatus}
        >
          {["Professional", "Academic", "Freelancer", "Industry Expert"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
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
          error={formik.touched.yearsExperience && Boolean(formik.errors.yearsExperience)}
          helperText={formik.touched.yearsExperience && formik.errors.yearsExperience}
        >
          {["0-2", "3-5", "6-10", "10+"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <InputField label="Current Role / Job Title" name="currentRole" formik={formik} />
        <InputField label="Educational Qualifications" name="education" formik={formik} />
        <InputField label="LinkedIn Profile URL" name="linkedIn" formik={formik} />

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
                      formik.setFieldValue("menteeLevel", [...formik.values.menteeLevel, level]);
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
            <div style={{ color: "red", fontSize: "0.875rem" }}>{formik.errors.menteeLevel}</div>
          )}
        </div>

        <InputField label="Short Bio" name="bio" multiline rows={4} formik={formik} />

        <Box
          mt={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>

          <Button type="submit">Update Account</Button>
        </Box>
      </form>
    </div>
  );
};

export default MentorAccount;
