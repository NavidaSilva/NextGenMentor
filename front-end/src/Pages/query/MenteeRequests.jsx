import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import Button from "../../Components/Common/Button";
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

const MenteeRequests = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role");

  const [query, setQuery] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchQuery = async () => {
      const response = await fetch(`http://localhost:5000/queries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setQuery(data.query);
    };

    fetchQuery();
  }, [id]);

  if (!query) return <div>Loading...</div>;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: { xs: 2, md: 0.1 },
      }}
    >
      <Paper
        elevation={5}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          width: { xs: "100%", md: "900px" },
          height: { xs: "auto", md: "90vh" }, 
          backgroundColor: "#f9fff7",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: '#5fcf80',
              fontWeight: 'bold',
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <SchoolIcon /> Mentorship Query Details
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Paper
  elevation={2}
  sx={{ p: 3, mb: 4, borderRadius: 2, backgroundColor: "#cff5d0ff" }}
>
  <Typography sx={{ mb: 1 }}>
    <strong>Topic:</strong> {query.topic}
  </Typography>
  <Typography sx={{ mb: 2, color: "#555" }}>
    <strong>Description:</strong> {query.description}
  </Typography>
  <Typography sx={{ mb: 1 }}>
    <strong>Mentorship Heading:</strong> {query.mentorshipHeading}
  </Typography>
  <Typography sx={{ mb: 1 }}>
    <strong>Learning Goal:</strong> {query.learningGoal}
  </Typography>
  <Typography sx={{ mb: 1 }}>
    <strong>Communication Method:</strong> {query.communicationMethod}
  </Typography>
  <Typography>
    <strong>Status:</strong> 
    <Chip 
      label={query.status.toUpperCase()} 
      sx={{ 
        ml: 1, 
        fontWeight: "bold",
        backgroundColor: query.status === "pending" ? "#4caf50" 
                          : query.status === "accepted" ? "#4caf50" 
                          : "#4caf50",
        color: "#fff"
      }} 
    />
  </Typography>
</Paper>


          <Paper
            elevation={2}
            sx={{ p: 3, borderRadius: 2, backgroundColor: "#cff5d0ff" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon /> Mentee:
            </Typography>
            <Typography sx={{ mb: 1 }}>{query.mentee.fullName}</Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon /> Mentor:
            </Typography>
            <Typography sx={{ mb: 1 }}>{query.mentor.fullName}</Typography>
          </Paper>
        </Box>

        {/* Action buttons at bottom */}
        {role === "mentor" && query.status === "pending" && (
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button 
              variant="contained" 
              color="success" 
              sx={{ mr: 2, textTransform: "none", fontWeight: "bold" }}
              onClick={async () => {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5000/queries/${query._id}/accept`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  alert("Accepted!");
                  window.location.href = "/mentor";
                }
              }}
            >
              Accept
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              sx={{ textTransform: "none", fontWeight: "bold", borderWidth: 2 }}
              onClick={async () => {
                const token = localStorage.getItem("token");
                const response = await fetch(
                  `http://localhost:5000/queries/${query._id}/reject`,
                  {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                if (response.ok) {
                  alert("Rejected!");
                  window.location.href = "/mentor";
                } else {
                  const data = await response.json();
                  alert("Failed to reject: " + (data?.error || "Unknown error"));
                }
              }}
            >
              Reject
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MenteeRequests;
