import React from "react";
import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  Divider
} from '@mui/material';
import { NoteAdd, Edit, Delete } from '@mui/icons-material';
import Button from "../../Components/Common/Button";

const NotesSection = ({ notes, queryId, reload }) => {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const addNote = async () => {

    console.log(role);
    await fetch(`http://localhost:5000/note/${queryId}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: newNote,       role: role   //  role along
 })
    });
    setNewNote('');
    reload();
  };

  const updateNote = async (noteId) => {
    await fetch(`http://localhost:5000/note/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: editContent })
    });
    setEditingId(null);
    reload();
  };

  const deleteNote = async (noteId) => {
    await fetch(`http://localhost:5000/note/notes/${noteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    reload();
  };

  const handleEdit = (note) => {
    setEditingId(note._id);
    setEditContent(note.content);
  };

  const mynotes = notes.filter(
    note => note.createdByModel === role
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Notes</Typography>

      {/* Add New Note */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Add a new note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          multiline
          minRows={4}
        />
        <Button
          startIcon={<NoteAdd />}
          onClick={addNote}
          disabled={!newNote.trim()}
        >
          Add
        </Button>
      </Box>

      {/* Notes List */}
      <List>
        {mynotes.map((note) => (
          <div key={note._id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 1
              }}
            >
              {editingId === note._id ? (
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                  <TextField
                    fullWidth
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    multiline
                    minRows={3}
                  />
                  <Button
                    sx={{ borderRadius: 20 }}
                    variant="contained"
                    onClick={() => updateNote(note._id)}
                  >
                    Save
                  </Button>
                </Box>
              ) : (
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1 }}
                  >
                    {note.content}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {new Date(note.createdAt).toLocaleString()}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        sx={{ borderRadius: 20 }}
                        startIcon={<Edit />}
                        onClick={() => handleEdit(note)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        sx={{ borderRadius: 20 }}
                        startIcon={<Delete />}
                        onClick={() => deleteNote(note._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </ListItem>
            <Divider />
          </div>
        ))}
      </List>
    </Box>
  );
};

export default NotesSection;
