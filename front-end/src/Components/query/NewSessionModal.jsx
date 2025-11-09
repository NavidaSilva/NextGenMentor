import { useEffect, useState } from "react";
import { Modal, Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import CalendarAvailability from './CalendarAvailability';
import Button from "../../Components/Common/Button";
import React from "react";

const NewSessionModal = ({ open, onClose, mentorAvailability, mentorId, mentorshipRequestId , onSessionCreated }) => {
  const [sessionType, setSessionType] = useState('video');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);


  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (open) {
          setSelectedSlot(null);

      fetchSlots();
    }
  }, [open]);

  const fetchSlots = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/mentor/${mentorId}/availability`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSlots(data.slots);
    } else {
      console.error(data.error);
    }
    setLoading(false);
  };

const handleClose = () => {
  setSelectedSlot(null);
  setSessionType('video');
  onClose();
};

  const handleSubmit = async () => {
      setSubmitting(true);  //  disable button

  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/mentor/${mentorId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      date: selectedSlot.date,
      time: selectedSlot.time,
      sessionType,
      mentorshipRequestId,  
    }),
  });

  const data = await res.json();
  if (res.ok) {
      if (onSessionCreated) {
        onSessionCreated();
      onClose();

      }
  } else {
    console.error(data.error);
  }
    setSubmitting(false); // re-enable button#
};


  return (
<Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2
      }}>
        <Typography variant="h5" gutterBottom>Schedule New Session</Typography>

        <RadioGroup
          row
          value={sessionType}
          onChange={(e) => setSessionType(e.target.value)}
          sx={{ mb: 3 }}
        >
          <FormControlLabel
            value="video"
            control={<Radio sx={{ color: '#5fcf80', '&.Mui-checked': { color: '#5fcf80' } }} />}
            label="Video Call"
          />
          <FormControlLabel
            value="chat"
            control={<Radio sx={{ color: '#5fcf80', '&.Mui-checked': { color: '#5fcf80' } }} />}
            label="Chat Session"
          />
        </RadioGroup>

        <Typography variant="h6" gutterBottom>Select Time Slot</Typography>

        {loading ? (
          <Typography>Loading slots...</Typography>
        ) : (
          <CalendarAvailability
            slots={slots}
            onSelectSlot={setSelectedSlot}
          />
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
<Button onClick={handleClose} sx={{ mr: 2 }}>Cancel</Button>
        <Button
  variant="contained"
  onClick={handleSubmit}
  disabled={!selectedSlot || submitting}
>
  {submitting ? 'Submitting…' : 'Confirm Session'}
</Button>

        </Box>
      </Box>
    </Modal>
  );
};

export default NewSessionModal;
