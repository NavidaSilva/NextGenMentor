import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  Chip,
  TextField,
  Collapse,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Add
} from '@mui/icons-material';
import { useState } from 'react';
import Button from "../../Components/Common/Button";

const GoalsSection = ({ goals, userRole, queryId, reload }) => {
  const [newGoal, setNewGoal] = useState('');
  const [feedbackOpenId, setFeedbackOpenId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [updatedStatuses, setUpdatedStatuses] = useState({});

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/queries/${queryId}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: newGoal }),
      });

      if (!res.ok) throw new Error("Failed to add goal");

      const data = await res.json();
      setNewGoal("");
      reload();
    } catch (err) {
      console.error(err);
      alert("Could not add goal");
    }
  };

  const handleUpdateStatus = async (goalId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/queries/goals/${goalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update goal");

      const data = await res.json();
      console.log("Goal updated", data.goal);
      reload();
    } catch (err) {
      console.error(err);
      alert("Could not update goal");
    }
  };

  const handleSubmitFeedback = async (goalId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/queries/goals/${goalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedback: feedbackText }),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      const data = await res.json();
      console.log("Feedback submitted", data.goal);
      setFeedbackText("");
      setFeedbackOpenId(null);
      reload();
    } catch (err) {
      console.error(err);
      alert("Could not submit feedback");
    }
  };

  const toggleFeedback = (goalId) => {
    setFeedbackOpenId(feedbackOpenId === goalId ? null : goalId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in-progress':
        return <RadioButtonUnchecked color="primary" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Mentorship Goals
      </Typography>

      <List>
        {goals.map((goal) => {
          const currentStatus = updatedStatuses[goal._id] || goal.status;

          return (
            <ListItem key={goal._id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ListItemIcon>{getStatusIcon(currentStatus)}</ListItemIcon>

                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2, flexWrap: 'wrap' }}>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>{goal.description}</Typography>

                  <Chip
                    label={currentStatus.replace('-', ' ')}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                    color={
                      currentStatus === 'completed'
                        ? 'success'
                        : currentStatus === 'in-progress'
                          ? 'primary'
                          : 'default'
                    }
                  />

                  {userRole === 'mentor' && (
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={currentStatus}
                        label="Status"
                        onChange={(e) => handleUpdateStatus(goal._id, e.target.value)}
                      >
                        <MenuItem value="not-started">Not Started</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Button size="small" onClick={() => toggleFeedback(goal._id)}>
                  {userRole === 'mentor'
                    ? feedbackOpenId === goal._id
                      ? 'Cancel Feedback'
                      : 'Provide Feedback'
                    : feedbackOpenId === goal._id
                      ? 'Hide Feedback'
                      : 'View Feedback'}
                </Button>
              </Box>

              <Collapse in={feedbackOpenId === goal._id} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    mt: 1,
                    ml: 5,
                    p: 2,
                    border: '1px solid #ddd',
                    borderRadius: 2,
                    backgroundColor: '#f9f9f9',
                    width: '100%'
                  }}
                >
                  {userRole === 'mentor' ? (
                    <>
                      <TextField
                        multiline
                        fullWidth
                        minRows={3}
                        placeholder="Write your feedback..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: '#5fcf80'
                            },
                            '&:hover fieldset': {
                              borderColor: '#5fcf80'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#5fcf80'
                            }
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSubmitFeedback(goal._id)}
                        disabled={!feedbackText.trim()}
                      >
                        Submit Feedback
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      {goal.feedback || 'No feedback provided yet.'}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </ListItem>
          );
        })}
      </List>

      {userRole === 'mentee' && (
        <Box sx={{ display: 'flex', mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Add new goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#5fcf80'
                },
                '&:hover fieldset': {
                  borderColor: '#5fcf80'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5fcf80'
                }
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddGoal}
            sx={{ ml: 1, mt: 0 }}
          >
            Add
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GoalsSection;
