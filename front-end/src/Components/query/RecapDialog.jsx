// components/RecapDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

const RecapDialog = ({ open, onClose, sessionId }) => {
  const [recap, setRecap] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (open) {
      fetch(`http://localhost:5000/sessions/${sessionId}/recap`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setRecap(data.recap || ""));
    }
  }, [open, sessionId]);

  const handleSave = async () => {
    await fetch(`http://localhost:5000/sessions/${sessionId}/recap`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recap })
    });
    onClose(recap);
  };

  return (
    <Dialog open={open} onClose={() => onClose(null)} fullWidth maxWidth="sm">
      <DialogTitle>Session Recap</DialogTitle>
      <DialogContent>
        <TextField
          multiline
          minRows={5}
          fullWidth
          value={recap}
          onChange={(e) => setRecap(e.target.value)}
          placeholder="Write recap for this session..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(null)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecapDialog;
