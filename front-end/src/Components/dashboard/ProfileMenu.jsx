import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { AccountCircle, Settings, Logout } from '@mui/icons-material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { useNavigate } from 'react-router-dom';

const ProfileMenu = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const userRole = user?.role || (user?.fieldOfStudy ? 'mentee' : 'mentor'); // fallback logic

  const goToProfile = () => {
    handleClose();
    navigate(`/profile/${userRole}`);
  };

  const goToSettings = () => {
    handleClose();
    navigate(`/settings/${userRole}`);
  };

 const handleLogout = () => {
  handleClose(); 
  if (window.confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
};

  const profilePicSrc =
    user?.profilePicture?.startsWith("http")
      ? user.profilePicture
      : user?.profilePicture
        ? `http://localhost:5000${user.profilePicture}`
        : null;

  return (
    <>
      <IconButton onClick={handleClick} size="small" sx={{ ml: 2 }}>
        {profilePicSrc ? (
          <Avatar src={profilePicSrc} alt={user?.fullName || 'Profile'} />
        ) : (
          <AccountCircleRoundedIcon fontSize="large" />
        )}
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={goToProfile}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={goToSettings}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;
