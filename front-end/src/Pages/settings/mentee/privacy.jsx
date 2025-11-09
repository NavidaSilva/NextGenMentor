import React, { useState, useEffect } from "react";
import { Checkbox, FormControlLabel, Typography, Box } from "@mui/material";
import CustomButton from "../../../Components/Common/Button";

function MenteePrivacy({ onBack }) {
  const [settings, setSettings] = useState({
    emailVisibility: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/security/mentee/privacy", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch settings");

        const data = await res.json();
        setSettings({ emailVisibility: data.emailVisibility });
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/security/mentee/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailVisibility: settings.emailVisibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      alert("Settings saved!");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 5,
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Privacy Settings
      </Typography>

      <Box my={3}>
        <Typography variant="h6">Email Visibility</Typography>
        <FormControlLabel
          control={
            <Checkbox
              name="emailVisibility"
              checked={settings.emailVisibility}
              onChange={handleChange}
            />
          }
          label="Allow others to view my email address"
        />
      </Box>

      <Box mt={4} display="flex" justifyContent="space-between">
        <CustomButton
          onClick={onBack}
          sx={{
            backgroundColor: "#ccc",
            color: "#333",
            "&:hover": { backgroundColor: "#bbb" },
          }}
        >
          Cancel
        </CustomButton>
        <CustomButton onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </CustomButton>
      </Box>
    </Box>
  );
}

export default MenteePrivacy;
