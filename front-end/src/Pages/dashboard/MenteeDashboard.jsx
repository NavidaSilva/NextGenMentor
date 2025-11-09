import { useEffect, useState } from 'react';
import {Container, Grid, Paper, Typography,  Box} from '@mui/material';
import DashboardHeader from '../../Components/dashboard/Header';
import ActiveQueries from '../../Components/dashboard/ActiveQueries';
import UpcomingSessions from '../../Components/dashboard/UpcomingSessions';
import SessionCard from '../../Components/dashboard/SessionCard';
import MentorshipRequests from "../../Components/dashboard/MentorshipRequests.jsx";
import Button from "../../Components/Common/Button";
import { useNavigate } from "react-router-dom";

const MenteeDashboard = () => {  
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); 
  
  useEffect(() => {
  const existingToken = localStorage.getItem("token");

  
  if (!existingToken) {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  const fetchMentee = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch('http://localhost:5000/mentee/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        localStorage.setItem("role", "mentee");  

      } else {
        console.error('Failed to fetch mentee data', data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  fetchMentee();
}, []);


  if (!user) {
    return <div>Loading...</div>; 
  }

    return (
        <div className="dashboard">
            <DashboardHeader user={user} />

            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome, {user.fullName}!
                </Typography>


                <Button
                    sx={{ mb: 3, textTransform: 'none', borderRadius: '20px',width: '100%'  }}
                    onClick={() =>  navigate("/new-query")}
                >
                    + Create New Mentorship Query
                </Button>


                {/* Active Mentorship Queries (full width) */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ backgroundColor: '#5fcf80', color: '#ffffff', px: 2, py: 1, borderRadius: 1, mb: 2 }}>
                        <Typography variant="h6">
                            Active Mentorship Queries
                        </Typography>
                    </Box>
                    <ActiveQueries role="mentee" />

                </Paper>

                {/* Two-column layout for Upcoming Sessions and Mentorship Requests */}
                <Box display="flex" gap={3}>
                    <Box flex={1}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ backgroundColor: '#5fcf80', color: '#ffffff', px: 2, py: 1, borderRadius: 1, mb: 2 }}>
                                <Typography variant="h6">
                                    Upcoming Sessions
                                </Typography>
                            </Box>
                            <UpcomingSessions />
                        </Paper>
                    </Box>
                    <Box flex={1}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ backgroundColor: '#5fcf80', color: '#ffffff', px: 2, py: 1, borderRadius: 1, mb: 2 }}>
                                <Typography variant="h6">
                                    Mentorship Requests
                                </Typography>
                            </Box>
                            <MentorshipRequests role="mentee" />
                        </Paper>
                    </Box>
                </Box>
            </Container>
        </div>
    );
};

export default MenteeDashboard;