import {List, ListItem, Divider, Chip, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Card, CardContent, Avatar} from "@mui/material";
import {VideoCall, Chat, CheckCircle, Schedule, Description, History, Person, CalendarToday, AccessTime, Link, Star as StarIcon} from "@mui/icons-material";
import Button from "../../Components/Common/Button";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import styles from "../../Pages/chat/ChatRoom.module.css";

const SessionHistory = ({ initialSessions = [], userRole, fetchFromAPI = true }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(initialSessions);
  const isFetchingRef = useRef(false);

  // Debug logging
  console.log('SessionHistory received initialSessions:', initialSessions);
  console.log('SessionHistory sessions state:', sessions);

  // Convert initialSessions to the expected format when not fetching from API
  useEffect(() => {
    if (!fetchFromAPI && initialSessions.length > 0) {
      const convertedSessions = initialSessions.map(session => ({
        _id: session._id,
        type: session.type,
        date: session.date,
        status: session.status,
        duration: session.duration || '1h',
        googleMeetLink: session.googleMeetLink,
        mentor: session.mentor,
        mentee: session.mentee,
        menteeRated: session.menteeRated || false,
        menteeRating: session.menteeRating,
        recapMentor: session.recapMentor || '',
        recapMentee: session.recapMentee || '',
        actualStartTime: session.actualStartTime,
        actualEndTime: session.actualEndTime,
        actualDuration: session.actualDuration
      }));
      console.log('SessionHistory - Converted sessions:', convertedSessions);
      setSessions(convertedSessions);
    }
  }, [initialSessions, fetchFromAPI]);


  // Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [mentorId, setMentorId] = useState(null);

  // Recap states
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [recapText, setRecapText] = useState("");

  // Session History states
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [detailedSession, setDetailedSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const safeParseJSON = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const token = localStorage.getItem("token");
      const role = (
        localStorage.getItem("role") ||
        userRole ||
        ""
      ).toLowerCase();

      const res = await fetch(`http://localhost:5000/sessions/upcoming`, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          Role: role 
        },
      });

      if (!res.ok) {
        console.error("fetchSessions failed with status", res.status);
        return;
      }

      const data = await safeParseJSON(res);
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (fetchFromAPI) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchFromAPI]);


  // Submit rating
  const submitRating = async () => {
    if (!mentorId || rating === 0) return;
    try {
      const res = await fetch(`http://localhost:5000/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          mentorId,
          rating,
          sessionId: currentSessionId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit rating");
        return;
      }
      setSubmittedRating(true);
      setShowRatingModal(false);
      setRating(0);
      localStorage.setItem(
        `ratingModalDismissed_${currentSessionId}`,
        "true"
      );
    } catch (err) {
      console.error(err);
      alert("Error submitting rating");
    }
  };

  const cancelRating = () => {
    setShowRatingModal(false);
    setRating(0);
    localStorage.setItem(`ratingModalDismissed_${currentSessionId}`, "true");
  };

  // Save recap
  const saveRecap = async () => {
    if (!currentSession) return;
    const token = localStorage.getItem("token");
    const role = (
      localStorage.getItem("role") ||
      userRole ||
      ""
    ).toLowerCase();

    try {
      const endpoint =
        role === "mentor" ? `recap/mentor` : `recap/mentee`;

      await fetch(
        `http://localhost:5000/sessions/${currentSession._id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recap: recapText }),
        }
      );

      await fetchSessions();
    } catch (err) {
      console.error("Failed to save recap:", err);
    } finally {
      setOpenDialog(false);
      setRecapText("");
      setCurrentSession(null);
    }
  };

  const openRecapDialog = (session) => {
    setCurrentSession(session);
    const role = (
      localStorage.getItem("role") ||
      userRole ||
      ""
    ).toLowerCase();
    setRecapText(
      role === "mentor" ? session.recapMentor || "" : session.recapMentee || ""
    );
    setOpenDialog(true);
  };

  // Fetch detailed session information
  const fetchDetailedSession = async (sessionId) => {
    setSessionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error("Failed to fetch session details:", res.status);
        return;
      }
      
      const data = await safeParseJSON(res);
      setDetailedSession(data);
      setShowSessionHistory(true);
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  const openSessionHistory = (session) => {
    fetchDetailedSession(session._id);
  };

  // Start session
  const startSession = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        // Refresh sessions to show updated status
        if (fetchFromAPI) {
          fetchSessions();
        }
      } else {
        console.error("Failed to start session:", res.status);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  // Complete session
  const completeSession = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        // Refresh sessions to show updated status
        if (fetchFromAPI) {
          fetchSessions();
        }
      } else {
        console.error("Failed to complete session:", res.status);
      }
    } catch (err) {
      console.error("Failed to complete session:", err);
    }
  };

  const formatDateTime = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  };

  // Auto-open rating modal after completed sessions
  useEffect(() => {
    if (!sessions.length) return;

    const role = localStorage.getItem("role")?.toLowerCase();
    if (role !== "mentee") return;

    sessions.forEach((session) => {
      const dismissed =
        localStorage.getItem(`ratingModalDismissed_${session._id}`) === "true";
      if (
        session.status === "completed" &&
        !session.menteeRated &&
        !dismissed
      ) {
        setCurrentSessionId(session._id);
        setMentorId(session.mentor || null);
        setShowRatingModal(true);
      }
    });
  }, [sessions]);

  return (
    <>
      <List>
        {sessions.length === 0 ? (
          <Typography sx={{ m: 2, color: "gray" }}>
            No sessions found
          </Typography>
        ) : (
          sessions.map((session) => (
            <div key={session._id}>
              <ListItem>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Date + Status */}
                  <Box
                    sx={{ display: "flex", alignItems: "center", minWidth: "33%" }}
                  >
                    {session.type?.toLowerCase() === "video" ? (
                      <VideoCall />
                    ) : (
                      <Chat />
                    )}
                    <Typography sx={{ ml: 1 }}>
                      {formatDateTime(session.date)}
                    </Typography>
                    <Chip
                      label={
                        session.status === "completed"
                          ? "Completed"
                          : session.status === "in-progress"
                          ? "In Progress"
                          : "Upcoming"
                      }
                      color={
                        session.status === "completed"
                          ? "success"
                          : session.status === "in-progress"
                          ? "info"
                          : "warning"
                      }
                      size="small"
                      icon={
                        session.status === "completed" ? (
                          <CheckCircle />
                        ) : session.status === "in-progress" ? (
                          <AccessTime />
                        ) : (
                          <Schedule />
                        )
                      }
                      sx={{ ml: 2 }}
                    />
                  </Box>

                  {/* Duration */}
                  <Box sx={{ textAlign: "center", minWidth: "33%" }}>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {session.actualDuration !== undefined 
                        ? `Duration: ${session.actualDuration} min`
                        : `Duration: ${session.duration || "1h"}`
                      }
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box
                    sx={{
                      textAlign: "right",
                      minWidth: "33%",
                      display: "flex",
                      gap: 1,
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Video Call */}
                    {session.status === "upcoming" &&
                      session.type?.toLowerCase() === "video" && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => startSession(session._id)}
                          >
                            Start Session
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => {
                              if (session.googleMeetLink) {
                                window.open(session.googleMeetLink, "_blank");
                              }
                            }}
                          >
                            Join Call
                          </Button>
                        </>
                      )}

                    {/* In Progress Video Call */}
                    {session.status === "in-progress" &&
                      session.type?.toLowerCase() === "video" && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => {
                              if (session.googleMeetLink) {
                                window.open(session.googleMeetLink, "_blank");
                              }
                            }}
                          >
                            Join Call
                          </Button>
                          {userRole?.toLowerCase() === "mentor" && (
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              sx={{ borderRadius: 20 }}
                              onClick={() => completeSession(session._id)}
                            >
                              End Call
                            </Button>
                          )}
                        </>
                      )}

                    {/* Chat */}
                    {session.status === "upcoming" &&
                      session.type?.toLowerCase() === "chat" && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => startSession(session._id)}
                          >
                            Start Session
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => navigate(`/chat/${session._id}`)}
                          >
                            Open Chat
                          </Button>
                        </>
                      )}

                    {/* In Progress Chat */}
                    {session.status === "in-progress" &&
                      session.type?.toLowerCase() === "chat" && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 20 }}
                            onClick={() => navigate(`/chat/${session._id}`)}
                          >
                            Open Chat
                          </Button>
                          {userRole?.toLowerCase() === "mentor" && (
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              sx={{ borderRadius: 20 }}
                              onClick={() => completeSession(session._id)}
                            >
                              End Session
                            </Button>
                          )}
                        </>
                      )}

                    {/* Session History */}
                    {session.status === "completed" && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 20 }}
                        startIcon={<History />}
                        onClick={() => openSessionHistory(session)}
                        disabled={sessionLoading}
                      >
                        Session History
                      </Button>
                    )}

                    {/* Recap */}
                    {session.status === "completed" && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 20 }}
                        startIcon={<Description />}
                        onClick={() => openRecapDialog(session)}
                      >
                        {session.recapMentor || session.recapMentee
                          ? "View / Edit Recap"
                          : "Add Recap"}
                      </Button>
                    )}
                  </Box>
                </Box>
              </ListItem>
              <Divider />
            </div>
          ))
        )}
      </List>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Rate Your Mentor</h3>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={
                    star <= rating ? styles.starFilled : styles.starEmpty
                  }
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.submitRatingBtn}
                disabled={rating === 0}
                onClick={submitRating}
              >
                Submit
              </button>
              <button className={styles.cancelRatingBtn} onClick={cancelRating}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recap Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>{recapText ? "Edit Recap" : "Add Recap"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={recapText}
            onChange={(e) => setRecapText(e.target.value)}
            placeholder={
              userRole?.toLowerCase() === "mentor"
                ? "Write your mentor recap here..."
                : "Write your mentee recap here..."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button onClick={saveRecap} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session History Dialog */}
      <Dialog 
        open={showSessionHistory} 
        onClose={() => setShowSessionHistory(false)} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <History color="primary" />
            <Typography variant="h6">Session History</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {sessionLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Loading session details...</Typography>
            </Box>
          ) : detailedSession ? (
            <Grid container spacing={3} direction="column">
              {/* Session Overview */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center', mb: 3 }}>
                      Session Overview
                    </Typography>
                    <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CalendarToday color="action" />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Scheduled:</strong>
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {formatDateTime(detailedSession.date)}
                          </Typography>
                        </Box>
                      </Grid>
                      {detailedSession.actualStartTime && (
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarToday color="action" />
                              <Typography variant="body2" color="text.secondary">
                                <strong>Actual Start:</strong>
                              </Typography>
                            </Box>
                            <Typography variant="body1">
                              {formatDateTime(detailedSession.actualStartTime)}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {detailedSession.actualEndTime && (
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarToday color="action" />
                              <Typography variant="body2" color="text.secondary">
                                <strong>Actual End:</strong>
                              </Typography>
                            </Box>
                            <Typography variant="body1">
                              {formatDateTime(detailedSession.actualEndTime)}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {detailedSession.type === 'video' ? <VideoCall color="action" /> : <Chat color="action" />}
                            <Typography variant="body2" color="text.secondary">
                              <strong>Type:</strong>
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {detailedSession.type} Session
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CheckCircle color="action" />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Status:</strong>
                            </Typography>
                          </Box>
                          <Chip 
                            label={detailedSession.status} 
                            color={detailedSession.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <AccessTime color="action" />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Scheduled Duration:</strong>
                            </Typography>
                          </Box>
                          <Typography variant="body1">1 hour</Typography>
                        </Box>
                      </Grid>
                      {detailedSession.actualDuration !== undefined && (
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <AccessTime color="action" />
                              <Typography variant="body2" color="text.secondary">
                                <strong>Actual Duration:</strong>
                              </Typography>
                            </Box>
                            <Typography variant="body1">
                              {detailedSession.actualDuration} minutes
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Participants */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                      Participants
                    </Typography>
                    <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 64, height: 64 }}>
                            <Person fontSize="large" />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Mentor
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {detailedSession.mentor?.fullName || 'Unknown'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
                          <Avatar sx={{ bgcolor: 'secondary.main', mb: 2, width: 64, height: 64 }}>
                            <Person fontSize="large" />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Mentee
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {detailedSession.mentee?.fullName || 'Unknown'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Google Meet Link - Only for video sessions */}
              {detailedSession.type === 'video' && detailedSession.googleMeetLink && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                        Meeting Link
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Link color="action" />
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ 
                            cursor: 'pointer', 
                            textDecoration: 'underline',
                            wordBreak: 'break-all'
                          }}
                          onClick={() => window.open(detailedSession.googleMeetLink, '_blank')}
                        >
                          {detailedSession.googleMeetLink}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Session Metadata */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                      Session Details
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: 2,
                      '@media (max-width: 600px)': {
                        gridTemplateColumns: '1fr'
                      }
                    }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Session ID:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {detailedSession._id}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Created:</strong>
                        </Typography>
                        <Typography variant="body2">
                          {formatDateTime(detailedSession.createdAt)}
                        </Typography>
                      </Box>
                      {detailedSession.googleEventId && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Google Event ID:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {detailedSession.googleEventId}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Mentee Rating:</strong>
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {detailedSession.menteeRated ? (
                            <>
                              <StarIcon color="warning" fontSize="small" />
                              <Typography variant="body2" color="success.main">
                                {detailedSession.menteeRating ? `${detailedSession.menteeRating}/5` : 'Rated'}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not rated yet
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Session Recaps - Full width below Session Details */}
              {(detailedSession.recapMentor || detailedSession.recapMentee) && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                        Session Recaps
                      </Typography>
                      {detailedSession.recapMentor && (
                        <Box mb={3}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Mentor's Recap:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            p: 3, 
                            bgcolor: 'grey.50', 
                            borderRadius: 2,
                            whiteSpace: 'pre-wrap',
                            minHeight: '80px',
                            wordBreak: 'break-word'
                          }}>
                            {detailedSession.recapMentor}
                          </Typography>
                        </Box>
                      )}
                      {detailedSession.recapMentee && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Mentee's Recap:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            p: 3, 
                            bgcolor: 'grey.50', 
                            borderRadius: 2,
                            whiteSpace: 'pre-wrap',
                            minHeight: '80px',
                            wordBreak: 'break-word'
                          }}>
                            {detailedSession.recapMentee}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="error">Failed to load session details</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSessionHistory(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionHistory;
