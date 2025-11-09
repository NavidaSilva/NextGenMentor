import React from "react";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Paper, Typography, Tabs, Tab, Box,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, FormControlLabel, Radio, RadioGroup
} from '@mui/material';
import QueryHeader from '../../Components/query/QueryHeader';
import SessionHistory from '../../Components/query/SessionHistory';
import FilesSection from '../../Components/query/FilesSection';
import NotesSection from '../../Components/query/NotesSection';
import GoalsSection from '../../Components/query/GoalsSection';
import NewSessionModal from '../../Components/query/NewSessionModal';
import Button from "../../Components/Common/Button"; 
import RecentActivity from "../../Components/query/RecentActivity";
import axios from "axios";

const QueryDetails = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(false);

  //  Rematch dialog state
  const [rematchOpen, setRematchOpen] = useState(false);
  const [rematchReason, setRematchReason] = useState("");

  //  Decline dialog state (for mentors)
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    const fetchQuery = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      setUserRole(role);

      const res = await fetch(`http://localhost:5000/queries/${queryId}/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const q = data.query;
        setQuery({
          id: q._id,
          topic: q.topic,
          description: q.description,
          createdAt: q.createdAt,
          partner: role === 'mentor'
            ? {
              id: q.mentee._id,
              name: q.mentee.fullName,
              email: q.mentee.email,
              status: q.mentee.currentStatus,
              field: Array.isArray(q.mentee.fieldOfStudy)
                ? q.mentee.fieldOfStudy.join(', ')
                : q.mentee.fieldOfStudy,
            }
            : {
              id: q.mentor._id,
              name: q.mentor.fullName,
              email: q.mentor.email,
              experience: q.mentor.yearsExperience,
              expertise: Array.isArray(q.mentor.industry)
                ? q.mentor.industry.join(', ')
                : q.mentor.industry,
            },
          sessions: (
            q.sessions?.map(s => ({
              id: s._id,
              type: s.type,
              date: s.date,
              status: s.status,
              duration: '1hr',
              googleMeetLink: s.type === 'video' ? s.googleMeetLink : null,
              menteeRated: s.menteeRated,
              menteeRating: s.menteeRating
            })) || []
          ).sort((a, b) => new Date(b.date) - new Date(a.date)),
          files: q.files || [],
          notes: q.notes || [], //notes
          goals: q.goals || []
        });

        const activities = [];

        activities.push({
          type: "info",
          title: "Query created",
          description: `Query on "${q.topic}" started.`,
          date: new Date(q.createdAt).toLocaleString()
        });

        q.sessions?.forEach(s => {
          activities.push({
            type: "video",
            title: "Session Scheduled",
            description: `${s.type} session scheduled.`,
            date: new Date(s.date).toLocaleString()
          });
        });

        q.files?.forEach(f => {
          activities.push({
            type: "file",
            title: "File Uploaded",
            description: `${f.name} uploaded.`,
            date: new Date(f.uploadedAt).toLocaleString()
          });
        });

        q.goals?.forEach(g => {
          activities.push({
            type: "note",
            title: "Goal Defined",
            description: g.description,
            date: new Date(g.createdAt).toLocaleString()
          });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivities(activities.slice(0, 2));
      }
    };

    fetchQuery();
  }, [queryId, reloadFlag]);

  if (!query) return <div>Loading...</div>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <QueryHeader
        query={query}
        userRole={userRole}
        onBack={() => navigate(userRole === 'mentor' ? '/mentor' : '/mentee')}
      />

      <Grid
        container
        columns={12}
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
          columnGap: 3,
          rowGap: 3,
        }}
      >
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 12' } }}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              TabIndicatorProps={{
                style: { backgroundColor: '#5fcf80' },
              }}
            >
              <Tab label="Overview" sx={{ '&.Mui-selected': { color: '#5fcf80' } }} />
              <Tab label="Sessions" sx={{ '&.Mui-selected': { color: '#5fcf80' } }} />
              <Tab label="Files" sx={{ '&.Mui-selected': { color: '#5fcf80' } }} />
              <Tab label="Notes" sx={{ '&.Mui-selected': { color: '#5fcf80' } }} />
              <Tab label="Goals" sx={{ '&.Mui-selected': { color: '#5fcf80' } }} />
            </Tabs>

            <Box sx={{ mt: 3 }}>
              {activeTab === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>Query Description</Typography>
                  <Typography paragraph>{query.description}</Typography>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    {userRole === 'mentor' ? 'Mentee Details' : 'Mentor Details'}
                  </Typography>
                  <Typography>
                    <strong>Name:</strong> {query.partner.name}<br />
                    {userRole === 'mentor' ? (
                      <>
                        <strong>Status:</strong> {query.partner.status}<br />
                        <strong>Field:</strong> {query.partner.field}
                      </>
                    ) : (
                      <>
                        <strong>Expertise:</strong> {query.partner.expertise}<br />
                        <strong>Experience:</strong> {query.partner.experience}
                      </>
                    )}
                  </Typography>
                </>
              )}

              {activeTab === 1 && <SessionHistory sessions={query.sessions} userRole={userRole} />}
              {activeTab === 2 && (
                <FilesSection
                  files={query.files}
                  queryId={query.id}
                  reload={() => setReloadFlag(prev => !prev)}
                />
              )}

              
  {activeTab === 3 && (
                <NotesSection
                  notes={query.notes}
                  queryId={query.id}
                  reload={() => setReloadFlag((prev) => !prev)}
                />
              )}
              
              
              {activeTab === 4 && (
                <GoalsSection
                  goals={query.goals}
                  userRole={userRole}
                  queryId={query.id}
                  reload={() => setReloadFlag(prev => !prev)}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {![2, 3, 4].includes(activeTab) && (
          <>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                {userRole === 'mentee' && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setIsModalOpen(true)}
                  >
                    Schedule New Session
                  </Button>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => {
                    if (userRole === 'mentee') {
                      navigate(`/mentor-profile-view/${query.partner.id}`);
                    } else {
                      navigate(`/mentee-profile-view/${query.partner.id}`);
                    }
                  }}
                >
                  View Full Profile
                </Button>

                {userRole === 'mentee' && (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => setRematchOpen(true)}
                  >
                    Rematch
                  </Button>
                )}

                {userRole === 'mentor' && (
                  <Button
                    variant="outlined"
                    color="success"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => setDeclineOpen(true)}
                  >
                    Decline Mentorship
                  </Button>
                )}
              </Paper>
            </Grid>

            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Paper sx={{ p: 3, height: '250px', overflowY: 'auto' }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <RecentActivity activities={recentActivities} />
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* New Session Modal */}
      {userRole === 'mentee' && (
        <NewSessionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mentorId={query.partner.id}
          mentorshipRequestId={query.id}
          onSessionCreated={() => setReloadFlag(prev => !prev)}
        />
      )}

      {/* 🔄 Rematch Dialog */}
      <Dialog open={rematchOpen} onClose={() => setRematchOpen(false)}>
        <DialogTitle>Why do you want a rematch?</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <RadioGroup
              value={rematchReason}
              onChange={(e) => setRematchReason(e.target.value)}
              sx={{ '& .Mui-checked': { color: 'green !important' } }} //  Mentee radios green
            >
              <FormControlLabel 
                value="Mentee felt their goals may be better supported by a mentor with a different set of skills or experience." 
                control={<Radio />} 
                label="Mentor’s skills/experience don’t align with my needs." 
              />
              <FormControlLabel 
                value="Mentee experienced some communication challenges and is looking for a better fit in terms of interaction style." 
                control={<Radio />} 
                label="Difficulty understanding the mentor." 
              />
              <FormControlLabel 
                value="Mentee is seeking a mentoring relationship where they feel more at ease and supported" 
                control={<Radio />} 
                label="I don’t feel comfortable continuing with this mentor." 
              />
              <FormControlLabel 
                value="Mentee hoped for a more engaging or hands-on experience during the session" 
                control={<Radio />} 
                label="Mentor wasn’t engaged or helpful in the session." 
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRematchOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!rematchReason}
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                  "http://localhost:5000/rematch",
                  { mentorshipRequestId: query.id, reason: rematchReason },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Rematch submitted:", response.data);
                navigate("/new-query");
              } catch (err) {
                console.error("Error submitting rematch:", err);
              }
              setRematchOpen(false);
              setRematchReason("");
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Decline Mentorship Dialog (Mentor) */}
      <Dialog open={declineOpen} onClose={() => setDeclineOpen(false)}>
        <DialogTitle>Why are you declining this mentorship?</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <RadioGroup
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              sx={{ '& .Mui-checked': { color: 'green !important' } }} //  Mentor radios green
            >
              <FormControlLabel
                value="Not available for further mentorship sessions."
                control={<Radio />}
                label="I don’t have time to continue."
              />
              <FormControlLabel
                value="This query does not match my area of expertise."
                control={<Radio />}
                label="Query not in my expertise."
              />
              <FormControlLabel
                value="I think another mentor could better support this mentee."
                control={<Radio />}
                label="Better fit with another mentor."
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeclineOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!declineReason}
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                  "http://localhost:5000/decline",
                  { mentorshipRequestId: query.id, reason: declineReason },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Decline submitted:", response.data);
                navigate("/mentor");
              } catch (err) {
                console.error("Error submitting decline:", err);
              }
              setDeclineOpen(false);
              setDeclineReason("");
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QueryDetails;
