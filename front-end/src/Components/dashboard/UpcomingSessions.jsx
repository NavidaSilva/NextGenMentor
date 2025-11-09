import { List, Box, Typography } from '@mui/material';
import SessionCard from './SessionCard';
import React, { useState, useEffect } from 'react';

const UpcomingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(localStorage.getItem("role")); 

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/sessions/upcoming`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Role: role,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setSessions(data.sessions || []);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [role]);

  if (loading) return <Typography>Loading upcoming sessions...</Typography>;
  if (!sessions.length) return <Typography>No upcoming sessions.</Typography>;

  const closestSession = sessions[0];

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
      <SessionCard
        key={closestSession._id}
        session={{
          id: closestSession._id,
          with:
            role === 'mentor'
              ? closestSession.mentee?.fullName
              : closestSession.mentor?.fullName,
          topic: closestSession.topic || 'Mentorship Session',
          type: closestSession.type === 'video' ? 'Video Call' : 'Chat',
          duration: '1hr',
          date: new Date(closestSession.date).toLocaleString(),
        }}
      />
    </Box>
  );
};


export default UpcomingSessions;
