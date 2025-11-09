import { Badge, IconButton, Menu, MenuItem } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import React, { useState, useEffect } from 'react';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotifications(data.notifications))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);

    // Mark notifications as seen
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/notifications/mark-seen", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, seen: true }))
        );
      })
      .catch(err => console.error(err));
  };

  const handleClose = () => setAnchorEl(null);

  const unseenCount = notifications.filter(n => !n.seen).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleMenuOpen}>
        <Badge badgeContent={unseenCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {notifications.length === 0 ? (
          <MenuItem>No notifications</MenuItem>
        ) : (
          notifications.map((note, i) => (
            <MenuItem key={i} onClick={handleClose}>
              {note.message}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
