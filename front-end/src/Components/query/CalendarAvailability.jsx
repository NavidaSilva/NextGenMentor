import { Box, Typography, Button } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { useState } from "react";
import React from "react";

const CalendarAvailability = ({ slots, onSelectSlot }) => {
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const handleSlotSelect = (slot, index) => {
    setSelectedSlotId(index);
    onSelectSlot(slot);
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
      {slots.map((slot, index) => (
        <Button
          key={index}
          variant={selectedSlotId === index ? "contained" : "outlined"}
          onClick={() => handleSlotSelect(slot, index)}
          sx={{
            p: 2,
            backgroundColor: selectedSlotId === index ? '#5fcf80' : 'transparent',
            color: selectedSlotId === index ? '#fff' : '#5fcf80',
            borderColor: '#5fcf80',
            '&:hover': {
              backgroundColor: selectedSlotId === index ? '#4dbd6c' : 'rgba(95, 207, 128, 0.1)',
            }
          }}
        >
          <Typography variant="subtitle2">{slot.date}  -</Typography>
          <Typography variant="body2"> {slot.time}</Typography>
        </Button>
      ))}
    </Box>
  );
};

export default CalendarAvailability;
