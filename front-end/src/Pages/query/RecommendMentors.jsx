import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../Components/Common/Button";
import { Box, Typography, Card, CardContent, Avatar } from "@mui/material";

const RecommendedMentors = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mentors = Array.isArray(state?.mentors) ? state.mentors : [];
  const selectedTopic = state?.selectedTopic || "N/A";
  const mentorshipHeading = state?.mentorshipHeading || "";
  const communicationMethod = state?.communicationMethod || "chat";
  const learningGoal = state?.learningGoal || "";
  const description = state?.description || "";

  console.log("RecommendedMentors state:", state); // Debug state

  const handleSelectMentor = async (mentorId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/queries/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId,
          topic: selectedTopic,
          description,
          communicationMethod,
          learningGoal,
          mentorshipHeading,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Request sent!");
        navigate("/mentee");
      } else {
        console.error("Error:", data.error);
        alert("Failed to send request: " + data.error);
      }
    } catch (err) {
      console.error("Error sending request:", err);
      alert("An error occurred while sending the request.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Topic Selected: <strong>{selectedTopic}</strong>
      </Typography>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Recommended Mentors:
      </Typography>

      {mentors.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No mentors found for your criteria.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", overflowX: "auto", gap: 2 }}>
          {mentors.map((mentor) => (
            <Card
              key={mentor._id}
              sx={{
                minWidth: 220,
                flexShrink: 0,
                boxShadow: 3,
                borderRadius: 3,
                p: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar
                src={
                  mentor.profilePicture
                    ? `http://localhost:5000${mentor.profilePicture}`
                    : ""
                }
                alt={mentor.fullName}
                sx={{
                  width: 64,
                  height: 64,
                  mb: 2,
                  border: "2px solid #ccc",
                }}
              />
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {mentor.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mentor.industry?.join(", ") || "No industry provided"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Match Score: {mentor.matchScore}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/mentor-profile-view/${mentor._id}`)}
                  >
                    View Profile
                  </Button>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => handleSelectMentor(mentor._id)}
                  >
                    Select Mentor
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RecommendedMentors;