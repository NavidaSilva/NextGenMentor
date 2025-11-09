import React from "react";

import { Award, Star, CheckCircle, Clock } from "lucide-react";
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const badgeStyles = {
  "starter": {
    color: "#ff9800",
    bg: "#fff8e1",
  },
  "5 sessions": {
    color: "#2196f3",
    bg: "#e3f2fd",
  },
  "10 sessions": {
    color: "#4caf50",
    bg: "#e8f5e9",
  },
  "consistency master": {
    color: "#9c27b0",
    bg: "#f3e5f5",
  },
};

const BadgeCard = ({ title, earned, progress }) => {
  const theme = useTheme();
  const key = title.toLowerCase();
  const { color, bg } = badgeStyles[key] || { color: "#ccc", bg: "#f9f9f9" };

  const getIcon = () => {
    const props = { size: 32, color: earned ? color : "#bbb" };
    switch (key) {
      case "starter":
        return <Award {...props} />;
      case "5 sessions":
        return <CheckCircle {...props} />;
      case "10 sessions":
        return <Star {...props} />;
      case "consistency master":
        return <Clock {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        padding: 2,
        width: 180,
        textAlign: "center",
        backgroundColor: bg,
        border: `2px solid ${color}`,
        boxShadow: 2,
        transition: "transform 0.25s ease",
        "&:hover": {
          transform: "scale(1.05)",
        },
      }}
    >
      {/* Icon with Progress Ring */}
      <Box sx={{ position: "relative", width: 100, height: 100, mx: "auto", mb: 2 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: "#fff",
            border: earned ? `2px solid ${color}` : "2px dashed #ccc",
            zIndex: 2,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {getIcon()}
        </Avatar>

        <CircularProgress
          variant="determinate"
          value={progress}
          size={100}
          thickness={5}
          sx={{
            color: earned ? color : theme.palette.grey[300],
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      </Box>

      
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>

      
      <Typography
        variant="body2"
        sx={{ color: earned ? "success.main" : "text.secondary", display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5 }}
      >
        {earned ? (
          <>
            Unlocked <EmojiEventsIcon fontSize="small" />
          </>
        ) : (
          `Progress: ${progress}%`
        )}
      </Typography>
    </Box>
  );
};

export default BadgeCard;
