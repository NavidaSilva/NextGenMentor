import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  useTheme,
  Fade,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Award, Star, CheckCircle, Clock } from "lucide-react";
import './BadgePopup.css';

// Custom BadgeCard component for admin dashboard with earned date
const AdminBadgeCard = ({ title, earned, progress, earnedDate }) => {
  const theme = useTheme();
  const key = title.toLowerCase();
  const [isHovered, setIsHovered] = useState(false);

  const badgeStyles = {
    "starter": { color: "#ff9800", bg: "#fff8e1" },
    "5 sessions": { color: "#2196f3", bg: "#e3f2fd" },
    "10 sessions": { color: "#4caf50", bg: "#e8f5e9" },
    "consistency master": { color: "#9c27b0", bg: "#f3e5f5" },
  };

  const { color, bg } = badgeStyles[key] || { color: "#ccc", bg: "#f9f9f9" };

  // Get badge requirements (based on actual project thresholds)
  const getRequirement = () => {
    switch (key) {
      case "starter":
        return "Complete 1 mentoring session";
      case "5 sessions":
        return "Complete 5 mentoring sessions";
      case "10 sessions":
        return "Complete 10 mentoring sessions";
      case "consistency master":
        return "Complete 20 mentoring sessions";
      default:
        return "Complete mentoring sessions";
    }
  };

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
        position: 'relative',
        borderRadius: 2,
        padding: 2,
        width: 180,
        textAlign: "center",
        backgroundColor: bg,
        border: `2px solid ${color}`,
        boxShadow: 2,
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: 4,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Earned Date Display - Only for Admin Dashboard */}
      {earned && earnedDate && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.75rem",
            fontStyle: "italic",
            marginTop: 1,
            display: "block",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          ✨ Earned {new Date(earnedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
      )}

      {/* Custom Hover Overlay */}
      {isHovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 1.5,
            zIndex: 10,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${color}20`,
            animation: 'slideInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '@keyframes slideInScale': {
              '0%': { 
                opacity: 0, 
                transform: 'scale(0.8) translateY(10px)',
                filter: 'blur(4px)'
              },
              '100%': { 
                opacity: 1, 
                transform: 'scale(1) translateY(0)',
                filter: 'blur(0px)'
              },
            },
          }}
        >
          {/* Badge Icon in Overlay */}
          <Box sx={{ mb: 1.5, opacity: 0.8, transform: 'scale(0.9)' }}>
            {getIcon()}
          </Box>

          {/* Badge Title */}
          <Typography
            variant="subtitle1"
            sx={{
              color: color,
              fontWeight: 'bold',
              mb: 1,
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            {title}
          </Typography>

          {/* Requirement Text */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(0, 0, 0, 0.7)',
              textAlign: 'center',
              mb: 1.5,
              lineHeight: 1.3,
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {getRequirement()}
          </Typography>

          {/* Earned Date */}
          <Box sx={{ textAlign: 'center' }}>
            {earnedDate && (
              <Typography
                variant="caption"
                sx={{
                  color: '#4caf50',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  display: 'block',
                  padding: '4px 8px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '12px',
                  border: '1px solid #4caf5030',
                }}
              >
                ✨ Earned {new Date(earnedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const BadgePopup = ({ 
  isOpen, 
  onClose, 
  menteeData 
}) => {
  if (!isOpen || !menteeData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 badge-popup-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden badge-popup-content">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-start justify-between p-3">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-xl font-bold">{menteeData.fullName}</h3>
                <p className="text-blue-100">Badge Achievements</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors badge-popup-close px-2 py-1 rounded"
            >
              X
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="badges-grid">
            {menteeData.earnedBadges?.map((badge, index) => {
              // Calculate progress for the badge
              const completed = menteeData.completedSessions || 0;
              let threshold = 0;

              switch (badge.title.toLowerCase()) {
                case "starter":
                  threshold = 1;
                  break;
                case "5 sessions":
                  threshold = 5;
                  break;
                case "10 sessions":
                  threshold = 10;
                  break;
                case "consistency master":
                  threshold = 20;
                  break;
                default:
                  threshold = 1;
              }

              const progress = Math.min(100, Math.round((completed / threshold) * 100));

              return (
                <AdminBadgeCard
                  key={badge.id || index}
                  title={badge.title}
                  earned={badge.earned}
                  progress={progress}
                  earnedDate={badge.earnedDate || badge.createdAt}
                />
              );
            }) || (
                <div className="col-span-2 text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Badges Yet</h3>
                  <p className="text-gray-500">Complete sessions to earn your first badge!</p>
                </div>
              )}
          </div>

          {/* Progress Summary */}
          <div className="mt-8">
            <h4 className="font-semibold text-gray-800 mb-6 text-center">Progress Summary</h4>
            <div className="flex gap-6 justify-center">
              {/* Sessions Completed Card */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-200 min-w-[180px]">
                  {/* Decorative background pattern */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-10 transform translate-x-4 -translate-y-4"></div>
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Number */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">
                      {menteeData.completedSessions || 0}
                    </div>
                    <div className="text-sm font-medium text-blue-600">Sessions Completed</div>
                  </div>
                </div>
              </div>

              {/* Badges Earned Card */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-200 min-w-[180px]">
                  {/* Decorative background pattern */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-10 transform translate-x-4 -translate-y-4"></div>
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Number */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">
                      {menteeData.earnedBadges?.filter(b => b.earned).length || 0}
                    </div>
                    <div className="text-sm font-medium text-yellow-600">Badges Earned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgePopup;
