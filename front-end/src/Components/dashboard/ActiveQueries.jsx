import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography } from '@mui/material';
import { Box } from '@mui/material';
import React, { useState, useEffect } from 'react';
import CustomButton from "../../Components/Common/Button";
import {useNavigate} from "react-router-dom";

const ActiveQueries = ({ role }) => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    const fetchActive = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/queries/${role}/active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) setQueries(data.requests);
    };

    fetchActive();
  }, [role]);

  return (
    <Box>
      <List>
        {queries.map((query) => (
          <ListItem
            key={query._id}
            alignItems="flex-start"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <ListItemAvatar>
              <Avatar>
                {role === "mentor" 
                  ? query.mentee.fullName[0] 
                  : query.mentor.fullName[0]}
              </Avatar>
            </ListItemAvatar>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{query.topic}</Typography>
                <Typography variant="subtitle3" color="text.secondary">
                  {role === "mentor" ? query.mentee.fullName : query.mentor.fullName}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: 'center', mr:6}}>
                <Typography variant="body2" color="text.secondary">
                  Started: {new Date(query.createdAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ flexShrink: 0 }}>
                <CustomButton
                  onClick={() => navigate(`/query/${query._id}`)}
                  sx={{
                    borderRadius: '25px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    ml: 2,
                  }}
                  size="small"
                >
                  View details
                </CustomButton>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ActiveQueries;
