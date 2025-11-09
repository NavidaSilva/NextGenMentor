import { useEffect, useState } from "react";
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography, Box } from "@mui/material";
import CustomButton from "../../Components/Common/Button";

const MentorshipRequests = ({ role }) => {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchRequests = async () => {
      const response = await fetch(
        `http://localhost:5000/queries/${role}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) setQueries(data.requests);
    };

    fetchRequests();
  }, [role]);

  return (
    <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
      <List>
        {queries.map((query) => (
          <ListItem key={query._id} alignItems="flex-start">
            <ListItemAvatar>
              <Avatar
  src={
    role === "mentor"
      ? query.mentee.profilePicture
        ? `http://localhost:5000${query.mentee.profilePicture}`
        : ""

        
      : query.mentor.profilePicture
        ? `http://localhost:5000${query.mentor.profilePicture}`
        : ""
  }
/>

            </ListItemAvatar>

            <ListItemText
              primary={query.topic}
              secondary={
                <Box display="flex" flexDirection="column" alignItems="flex-start" mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {role === "mentor" ? query.mentee.fullName : query.mentor.fullName}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Status: {query.status}
                  </Typography>

                  <CustomButton
                    sx={{ mt: 1, px: 1.5, py: 0.5, fontSize: "0.75rem", textTransform: "none" }}
                    size="small"
                      onClick={() => window.location.href = `/MenteeRequests/${query._id}?role=${role}`}

                  >
                    
                    View details
                  </CustomButton>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MentorshipRequests;
