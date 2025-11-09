import React, { useState } from 'react';
import './deleteaccount.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MentorDeleteAccount() {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmation.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE in uppercase to confirm.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/mentor/delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.clear();
      navigate('/?deleted=true'); // Redirect to Landing with query param
    } catch (err) {
      alert('Failed to delete account. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-container">
      <h1>Delete Your Mentor Account</h1>
      <p className="warning-text">
        This action is <strong>permanent</strong> and will delete all your mentor data.
      </p>

      <label htmlFor="confirmation">Type <strong>DELETE</strong> below:</label>
      <input
        id="confirmation"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="Type DELETE"
        disabled={loading}
      />

      <button
        className="btn-delete"
        onClick={handleDelete}
        disabled={confirmation.trim().toUpperCase() !== 'DELETE' || loading}
      >
        {loading ? 'Deleting...' : 'Permanently Delete Account'}
      </button>
    </div>
  );
}
