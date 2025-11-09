import React from 'react';
import './AdminDashboard.css';
import { Card, CardContent } from '../../Components/Common/Card';
import CustomButton from '../../Components/Common/AdminButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Components/Common/Tabs';
import { Input } from '../../Components/Common/Input';
import { Searchtag } from '../../Components/Common/Searchtag';
import searchIcon from './search.png';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BadgeCard from "../../Components/Common/badgecard";
import { Award, Star, CheckCircle, Clock } from "lucide-react";
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  useTheme,
  Tooltip,
  Fade,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


const COLORS = ['#5fcf80', '#ffc658', '#8884d8', '#82ca9d', '#ff7f7f'];

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



// Badge icon mapping function (same as BadgeCard component)

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify admin role
    fetch('http://localhost:5000/admin/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          navigate('/login');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        navigate('/login');
      });
  }, [navigate]);

  const manualPairingRequests = [
    { mentee: 'Emily Zhang', mentor: 'Dr. Rajiv Menon' },
    { mentee: 'Michael Brown', mentor: 'Prof. Alisha Silva' },
    { mentee: 'Nina Patel', mentor: 'Dr. Evan Roberts' },
  ];


  const [supportRequests, setSupportRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showIgnoreConfirm, setShowIgnoreConfirm] = useState(false);
  const [requestToResolve, setRequestToResolve] = useState(null);
  const [requestToIgnore, setRequestToIgnore] = useState(null);

  // Dashboard statistics state
  const [stats, setStats] = useState({
    totalMentors: 0,
    totalMentees: 0,
    sessionsThisMonth: 0,
    unresolvedReports: 0,
    manualPairingsThisWeek: 0
  });

  // Session data state
  const [sessionData, setSessionData] = useState([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('week');
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Pie chart data state
  const [pieData, setPieData] = useState([]);
  const [isLoadingPieChart, setIsLoadingPieChart] = useState(true);
  const [departmentData, setDepartmentData] = useState([]);
  const [isLoadingDepartmentData, setIsLoadingDepartmentData] = useState(false);

  useEffect(() => {
    const fetchSupportRequests = async () => {
      try {
        setIsLoadingRequests(true);
        const response = await fetch('http://localhost:5000/support/admin');
        if (!response.ok) {
          throw new Error('Failed to fetch support requests');
        }
        const data = await response.json();
        setSupportRequests(data);
      } catch (error) {
        console.error('Error fetching support requests:', error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchSupportRequests();
    fetchDashboardStats(); // Add this line to fetch dashboard stats
    fetchSessionData(selectedTimePeriod); // Fetch initial session data
    fetchMentorshipTopics(); // Fetch mentorship topics for pie chart
    fetchDepartmentData(); // Fetch department statistics
    fetchAllMentors(); // Fetch all mentors for dropdown
    fetchAllMentees(); // Fetch all mentees for dropdown
    const interval = setInterval(fetchSupportRequests, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleResolveRequest = async (requestId) => {
    try {
      // Delete the request from database
      const response = await fetch(`http://localhost:5000/support/admin/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete support request');
      }

      // Remove from local state immediately
      setSupportRequests(prev => prev.filter(req => req._id !== requestId));
      setShowResolveConfirm(false);
      setRequestToResolve(null);

    } catch (error) {
      console.error('Error deleting support request:', error);
    }
  };

  const handleIgnoreRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/support/admin/${requestId}/ignore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to ignore support request');
      }
      // Refresh the list after ignoring
      const updatedResponse = await fetch('http://localhost:5000/support/admin');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setSupportRequests(updatedData);
      }
    } catch (error) {
      console.error('Error ignoring support request:', error);
    }
  };
  const confirmResolve = (request) => {
    setRequestToResolve(request);
    setShowResolveConfirm(true);
  };

  const confirmIgnore = (request) => {
    setRequestToIgnore(request);
    setShowIgnoreConfirm(true);
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      setSupportRequests(prev => prev.filter(req => req._id !== requestId));
      setShowIgnoreConfirm(false);
      setRequestToIgnore(null);
    } catch (error) {
      console.error('Error deleting support request:', error);
    }
  };

  const handleSaveForLater = async (requestId) => {
    try {
      // Mark as ignored in database
      const response = await fetch(`http://localhost:5000/support/admin/${requestId}/ignore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to save for later');
      }

      // Move the request to the bottom of the list
      setSupportRequests(prev => {
        const request = prev.find(req => req._id === requestId);
        if (request) {
          // Remove the request from current position
          const filtered = prev.filter(req => req._id !== requestId);
          // Add it to the bottom
          return [...filtered, request];
        }
        return prev;
      });

      setShowIgnoreConfirm(false);
      setRequestToIgnore(null);

    } catch (error) {
      console.error('Error saving for later:', error);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch session data for selected time period
  const fetchSessionData = async (period) => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch(`http://localhost:5000/admin/session-data/${period}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      } else {
        console.error('Failed to fetch session data');
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch mentorship topics for pie chart
  const fetchMentorshipTopics = async () => {
    try {
      setIsLoadingPieChart(true);
      const response = await fetch('http://localhost:5000/admin/mentorship-topics');

      if (response.ok) {
        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
        } else {
          console.log('❌ No valid topics data available');
          console.log('❌ Data:', data);
          setPieData([]);
        }
      } else {
        console.error('❌ Failed to fetch mentorship topics, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setPieData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching mentorship topics:', error);
      setPieData([]);
    } finally {
      setIsLoadingPieChart(false);
    }
  };

  // Fetch department statistics for the week
  const fetchDepartmentData = async () => {
    try {
      setIsLoadingDepartmentData(true);
      const response = await fetch('http://localhost:5000/admin/department-stats');

      if (response.ok) {
        const data = await response.json();
        setDepartmentData(data);
      } else {
        console.error('❌ Failed to fetch weekly department data, status:', response.status);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching weekly department data:', error);
      setDepartmentData([]);
    } finally {
      setIsLoadingDepartmentData(false);
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (period) => {
    setSelectedTimePeriod(period);
    fetchSessionData(period);
  };

  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorSearchResults, setMentorSearchResults] = useState([]);
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);

  const [selectedMentors, setSelectedMentors] = useState([]);
  const [sessionFrequencyData, setSessionFrequencyData] = useState([]);
  const [isLoadingFrequency, setIsLoadingFrequency] = useState(false);

  // Search mentors by name
  const searchMentors = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setMentorSearchResults([]);
      setShowMentorDropdown(false);
      return;
    }

    try {
      setIsLoadingMentors(true);
      const response = await fetch(`http://localhost:5000/admin/search-mentors?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        setMentorSearchResults(data);
        setShowMentorDropdown(data.length > 0);
      } else {
        console.log('🔍 [FRONTEND] API response not ok:', response.status);
        setMentorSearchResults([]);
        setShowMentorDropdown(false);
      }
    } catch (error) {
      console.error('Error searching mentors:', error);
      setMentorSearchResults([]);
      setShowMentorDropdown(false);
    } finally {
      setIsLoadingMentors(false);
    }
  };

  // Handle mentor search input change
  const handleMentorSearchChange = (e) => {
    const value = e.target.value;
    setMentorSearch(value);
    searchMentors(value);
  };

  // Handle mentor selection from dropdown
  const handleMentorSelect = (mentor) => {
    if (!selectedMentors.find(m => m._id === mentor._id)) {
      // Limit to 10 mentors maximum
      if (selectedMentors.length >= 10) {
        alert('Maximum 10 mentors can be selected. Please remove some before adding more.');
        return;
      }
      const newSelectedMentors = [...selectedMentors, mentor];
      setSelectedMentors(newSelectedMentors);
      fetchSessionFrequencyData(newSelectedMentors);
    }
    setMentorSearch('');
    setShowMentorDropdown(false);
    setMentorSearchResults([]);
  };

  // Handle adding mentor manually (fallback)
  const handleAddMentor = () => {
    if (mentorSearch && !selectedMentors.find(m => m.fullName === mentorSearch)) {
      // Limit to 10 mentors maximum
      if (selectedMentors.length >= 10) {
        alert('Maximum 10 mentors can be selected. Please remove some before adding more.');
        return;
      }

      // Only allow adding mentors that were found in search results
      const foundMentor = mentorSearchResults.find(m => m.fullName === mentorSearch);
      if (foundMentor) {
        const newSelectedMentors = [...selectedMentors, foundMentor];
        setSelectedMentors(newSelectedMentors);
        fetchSessionFrequencyData(newSelectedMentors);
      } else {
        console.log('🔍 [FRONTEND] Mentor not found in search results, cannot add manually');
        alert('Please search for the mentor first before adding them.');
      }
      setMentorSearch('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMentorDropdown && !event.target.closest('.search-wrapper')) {
        setShowMentorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentorDropdown]);

  const handleRemoveMentor = (mentor) => {
    const newSelectedMentors = selectedMentors.filter((m) => m._id !== mentor._id);
    setSelectedMentors(newSelectedMentors);
    fetchSessionFrequencyData(newSelectedMentors);
  };

  // Fetch session frequency data for selected mentors
  const fetchSessionFrequencyData = async (mentors) => {
    if (mentors.length === 0) {
      setSessionFrequencyData([]);
      return;
    }

    try {
      setIsLoadingFrequency(true);

      // Filter out any mentors with invalid IDs
      const validMentors = mentors.filter(m => m._id && !m._id.startsWith('temp-'));
      if (validMentors.length === 0) {
        setSessionFrequencyData([]);
        return;
      }

      const mentorIds = validMentors.map(m => m._id).join(',');
      const url = `http://localhost:5000/admin/mentor-session-frequency?mentorIds=${mentorIds}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setSessionFrequencyData(data);

        // Force a re-render by updating the state again
        setTimeout(() => {
          console.log('🔍 [FRONTEND] Current sessionFrequencyData state:', sessionFrequencyData);
        }, 100);
      } else {
        console.error('❌ [FRONTEND] Failed to fetch session frequency data, status:', response.status);
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Error response:', errorText);
        setSessionFrequencyData([]);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching session frequency data:', error);
      setSessionFrequencyData([]);
    } finally {
      setIsLoadingFrequency(false);
    }
  };

  // Session report state
  const [sessionReport, setSessionReport] = useState([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    topic: '',
    mentorName: ''
  });

  // Report type selection
  const [reportType, setReportType] = useState('session'); // 'session' or 'mentor'

  // Mentor report state
  const [mentorReport, setMentorReport] = useState([]);
  const [isLoadingMentorReport, setIsLoadingMentorReport] = useState(false);
  const [selectedMentorsForReport, setSelectedMentorsForReport] = useState([]);
  const [mentorFilters, setMentorFilters] = useState({
    minSessions: '',
    maxSessions: '',
    minRating: '',
    maxRating: '',
    minMentees: '',
    maxMentees: ''
  });
  const [showMentorReportDropdown, setShowMentorReportDropdown] = useState(false);
  const [mentorReportSearchQuery, setMentorReportSearchQuery] = useState('');
  const [filteredMentorsForReport, setFilteredMentorsForReport] = useState([]);

  // Compare Mentees state
  const [selectedMenteesForComparison, setSelectedMenteesForComparison] = useState([]);
  const [menteeComparisonData, setMenteeComparisonData] = useState([]);
  const [isLoadingMenteeComparison, setIsLoadingMenteeComparison] = useState(false);
  const [showMenteeComparisonDropdown, setShowMenteeComparisonDropdown] = useState(false);
  const [menteeComparisonSearchQuery, setMenteeComparisonSearchQuery] = useState('');
  const [filteredMenteesForComparison, setFilteredMenteesForComparison] = useState([]);
  const [selectedMenteeForBadges, setSelectedMenteeForBadges] = useState(null);
  const [showBadgePopup, setShowBadgePopup] = useState(false);

  // New state for dropdowns
  const [allMentors, setAllMentors] = useState([]);
  const [isLoadingMentorsDropdown, setIsLoadingMentorsDropdown] = useState(false);


  // Manual pairing state
  const [allMentees, setAllMentees] = useState([]);
  const [isLoadingMentees, setIsLoadingMentees] = useState(false);
  const [selectedPairingMentee, setSelectedPairingMentee] = useState(null);
  const [selectedMentorshipRequest, setSelectedMentorshipRequest] = useState(null);
  const [selectedReplacementMentor, setSelectedReplacementMentor] = useState(null);
  const [menteeSearchQuery, setMenteeSearchQuery] = useState('');
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');
  const [showPairingMenteeDropdown, setShowPairingMenteeDropdown] = useState(false);
  const [showPairingMentorDropdown, setShowPairingMentorDropdown] = useState(false);
  const [showPairingTopicDropdown, setShowPairingTopicDropdown] = useState(false);
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [menteeRequests, setMenteeRequests] = useState([]);
  const [isLoadingMenteeRequests, setIsLoadingMenteeRequests] = useState(false);
  const [pairingMode, setPairingMode] = useState('replace'); // 'replace' or 'create'
  const [allTopics, setAllTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Topic search state (using the same topics from session creation)
  const [topicSearch, setTopicSearch] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  // Mentor name search state (using the same pattern as Session Frequency Analysis)
  const [mentorNameSearch, setMentorNameSearch] = useState('');
  const [mentorNameSearchResults, setMentorNameSearchResults] = useState([]);
  const [showMentorNameDropdown, setShowMentorNameDropdown] = useState(false);

  // Common topics from session creation page
  const commonTopics = [
    "Computer Science / IT",
    "Business Administration",
    "Psychology",
    "Engineering",
    "Medicine / Health Sciences",
    "Law",
    "Education",
    "Design / Fine Arts",
    "Data Science / AI",
    "Product Management",
    "UX/UI Design",
    "Finance",
    "Marketing",
    "Entrepreneurship",
    "Consulting",
    "Human Resources",
    "Cybersecurity",
    "Biomedical Research",
    "Architecture",
    "Social Impact / Non-profit",
    "Agriculture & Agribusiness",
    "Aerospace & Aviation",
    "Automotive",
    "Energy (Oil, Gas, Renewables)",
    "Environmental & Sustainability",
    "Biotechnology",
    "Supply Chain & Logistics",
    "Manufacturing & Industrial",
    "Telecommunications",
    "Hospitality & Tourism",
    "Sports & Recreation",
    "Media & Entertainment",
    "Publishing & Journalism",
    "Real Estate & Urban Development",
    "Food & Beverage / Culinary Arts",
    "Public Policy & Government",
    "Military & Defense",
    "Oceanography & Marine Industries",
    "Mining & Metals",
    "Transportation (Rail, Shipping, Public Transit)",
    "Retail & E-commerce",
    "Pharmaceuticals",
    "Veterinary Medicine & Animal Sciences",
    "Insurance",
    "Cultural Heritage & Museums",
    "Performing Arts & Music",
    "Space Exploration & Research",
  ];

  // Fetch all mentors for dropdown
  const fetchAllMentors = async () => {
    try {
      setIsLoadingMentorsDropdown(true);
      const response = await fetch('http://localhost:5000/admin/all-mentors');

      if (response.ok) {
        const data = await response.json();
        setAllMentors(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch mentors:', errorData);
        alert(`Failed to fetch mentors: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching mentors:', error);
      alert(`Error fetching mentors: ${error.message}`);
    } finally {
      setIsLoadingMentorsDropdown(false);
    }
  };

  // Fetch all mentees for dropdown
  const fetchAllMentees = async () => {
    try {
      setIsLoadingMentees(true);
      const response = await fetch('http://localhost:5000/admin/all-mentees');

      if (response.ok) {
        const data = await response.json();
        setAllMentees(data);
        setFilteredMentees(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch mentees:', errorData);
        alert(`Failed to fetch mentees: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching mentees:', error);
      alert(`Error fetching mentees: ${error.message}`);
    } finally {
      setIsLoadingMentees(false);
    }
  };

  // Fetch mentorship requests for a specific mentee
  const fetchMenteeRequests = async (menteeId) => {
    try {
      setIsLoadingMenteeRequests(true);
      const response = await fetch(`http://localhost:5000/admin/mentee-requests/${menteeId}`);
      if (response.ok) {
        const data = await response.json();
        setMenteeRequests(data);
      } else {
        console.error('Failed to fetch mentee requests');
        setMenteeRequests([]);
      }
    } catch (error) {
      console.error('Error fetching mentee requests:', error);
      setMenteeRequests([]);
    } finally {
      setIsLoadingMenteeRequests(false);
    }
  };

  // Fetch all topics for create new mentorship request mode
  const fetchAllTopics = async () => {
    try {
      setIsLoadingTopics(true);
      // Use the existing commonTopics array instead of API call
      setAllTopics(commonTopics);
    } catch (error) {
      console.error('Error setting topics:', error);
      setAllTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Search topics from common topics
  const searchTopics = (searchTerm) => {
    if (searchTerm.length < 1) {
      setShowTopicDropdown(false);
      return;
    }

    const filteredTopics = commonTopics.filter(topic =>
      topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setShowTopicDropdown(filteredTopics.length > 0);
  };

  // Handle topic search input change
  const handleTopicSearchChange = (e) => {
    const value = e.target.value;
    setTopicSearch(value);
    searchTopics(value);
  };

  // Search mentees for pairing
  const searchPairingMentees = (searchTerm) => {
    setMenteeSearchQuery(searchTerm);
    if (searchTerm.length < 1) {
      setFilteredMentees(allMentees);
      setShowPairingMenteeDropdown(false);
      return;
    }

    const filtered = allMentees.filter(mentee =>
      mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMentees(filtered);
    setShowPairingMenteeDropdown(true);
  };

  // Search mentors for pairing
  const searchPairingMentors = (searchTerm) => {
    setMentorSearchQuery(searchTerm);
    if (searchTerm.length < 1) {
      setFilteredMentors(allMentors);
      setShowPairingMentorDropdown(false);
      return;
    }

    const filtered = allMentors.filter(mentor =>
      mentor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMentors(filtered);
    setShowPairingMentorDropdown(true);
  };

  // Show all mentors when topic is selected
  const showAllMentors = () => {
    setFilteredMentors(allMentors);
    setShowPairingMentorDropdown(true);
  };

  // Select mentee for pairing
  const selectPairingMentee = (mentee) => {
    setSelectedPairingMentee(mentee);
    setMenteeSearchQuery(mentee.fullName);
    setShowPairingMenteeDropdown(false);
    // Fetch mentorship requests for this mentee
    fetchMenteeRequests(mentee._id);
    // Reset other selections
    setSelectedMentorshipRequest(null);
    setSelectedReplacementMentor(null);
  };

  // Select mentorship request
  const selectMentorshipRequest = (request) => {
    setSelectedMentorshipRequest(request);
    // Reset mentor selection
    setSelectedReplacementMentor(null);
    setMentorSearchQuery('');
    // Close the topic dropdown
    setShowPairingTopicDropdown(false);
    // Show all mentors in the replacement mentor dropdown
    showAllMentors();
  };

  // Select replacement mentor
  const selectReplacementMentor = (mentor) => {
    setSelectedReplacementMentor(mentor);
    setMentorSearchQuery(mentor.fullName);
    setShowPairingMentorDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any search wrapper
      if (!event.target.closest('.search-wrapper')) {
        setShowPairingMentorDropdown(false);
        setShowPairingMenteeDropdown(false);
        setShowPairingTopicDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle pairing mode change
  const handlePairingModeChange = (mode) => {
    setPairingMode(mode);
    // Clear selections when switching modes
    setSelectedMentorshipRequest(null);
    setSelectedReplacementMentor(null);
    setMentorSearchQuery('');

    if (mode === 'create') {
      // Fetch all topics for create mode
      fetchAllTopics();
    }
  };

  // Handle create new mentorship request
  const handleCreateMentorshipRequest = async () => {
    if (!selectedPairingMentee || !selectedMentorshipRequest || !selectedReplacementMentor) {
      alert('Please select a mentee, topic, and mentor');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/admin/create-mentorship-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          menteeId: selectedPairingMentee._id,
          mentorId: selectedReplacementMentor._id,
          topic: selectedMentorshipRequest,
          description: `Mentorship request for ${selectedMentorshipRequest}`,
          communicationMethod: 'both',
          learningGoal: 'Professional development and guidance',
          mentorshipHeading: `Mentorship in ${selectedMentorshipRequest}`
        })
      });


      if (response.ok) {
        const data = await response.json();
        alert('Mentorship request created successfully!');
        // Reset selections
        setSelectedPairingMentee(null);
        setSelectedMentorshipRequest(null);
        setSelectedReplacementMentor(null);
        setMenteeRequests([]);
        setMenteeSearchQuery('');
        setMentorSearchQuery('');
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        alert(`Error: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating mentorship request:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error creating mentorship request: ${error.message}`);
    }
  };

  // Handle mentor replacement
  const handleMentorReplacement = async () => {
    if (!selectedPairingMentee || !selectedMentorshipRequest || !selectedReplacementMentor) {
      alert('Please select mentee, mentorship request, and replacement mentor');
      return;
    }

    // Check if the selected mentor is the same as current mentor
    if (selectedMentorshipRequest.mentor._id === selectedReplacementMentor._id) {
      alert('Selected mentor is similar to current mentor');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/admin/replace-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorshipRequestId: selectedMentorshipRequest._id,
          newMentorId: selectedReplacementMentor._id,
          previousMentorId: selectedMentorshipRequest.mentor._id,
          menteeId: selectedPairingMentee._id
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully replaced ${selectedMentorshipRequest.mentor.fullName} with ${selectedReplacementMentor.fullName}`);

        // Reset selections
        setSelectedPairingMentee(null);
        setSelectedMentorshipRequest(null);
        setSelectedReplacementMentor(null);
        setMenteeSearchQuery('');
        setMentorSearchQuery('');
        setMenteeRequests([]);
      } else {
        const error = await response.json();
        alert(`Failed to replace mentor: ${error.message}`);
      }
    } catch (error) {
      console.error('Error replacing mentor:', error);
      alert('Failed to replace mentor. Please try again.');
    }
  };

  const handleSupportRequestAction = async (requestId, action) => {
    try {
      const response = await fetch(`/api/admin/support-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        // Update the local state
        setSupportRequests(prev =>
          prev.map(request =>
            request._id === requestId
              ? { ...request, status: action }
              : request
          )
        );
        alert(`Support request ${action} successfully`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating support request:', error);
      alert('Failed to update support request');
    }
  };

  // Handle topic selection from dropdown
  const handleTopicSelect = (topic) => {
    setReportFilters(prev => ({
      ...prev,
      topic: topic
    }));
    setTopicSearch(topic);
    setShowTopicDropdown(false);
  };

  // Search mentors by name 
  const searchMentorNames = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setMentorNameSearchResults([]);
      setShowMentorNameDropdown(false);
      
      return;
    }

    try {
     
      const response = await fetch(`http://localhost:5000/admin/search-mentors?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        setMentorNameSearchResults(data);
        setShowMentorNameDropdown(data.length > 0);
      } else {
        setMentorNameSearchResults([]);
        setShowMentorNameDropdown(false);
      }
    } catch (error) {
      console.error('Error searching mentors:', error);
      setMentorNameSearchResults([]);
      setShowMentorNameDropdown(false);
    }
  };

  // Handle mentor name search input change
  const handleMentorNameSearchChange = (e) => {
    const value = e.target.value;
    setMentorNameSearch(value);
    searchMentorNames(value);
  };

  // Handle mentor name selection from dropdown
  const handleMentorNameSelect = (mentor) => {
    setReportFilters(prev => ({
      ...prev,
      mentorName: mentor.fullName
    }));
    setMentorNameSearch(mentor.fullName);
    setShowMentorNameDropdown(false);
    setMentorNameSearchResults([]);
  };

  // Mentor report functions
  const handleReportTypeChange = (type) => {
    setReportType(type);
    // Clear existing data when switching report types
    setSessionReport([]);
    setMentorReport([]);
    setSelectedMentorsForReport([]);
  };

  const handleMentorFilterChange = (field, value) => {
    setMentorFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchMentorsForReport = (query) => {
    setMentorReportSearchQuery(query);
    if (query.length >= 1) {
      const filtered = allMentors.filter(mentor =>
        mentor.fullName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMentorsForReport(filtered);
      setShowMentorReportDropdown(true);
    } else {
      setFilteredMentorsForReport(allMentors);
      setShowMentorReportDropdown(true);
    }
  };

  const addMentorToReport = (mentor) => {
    if (!selectedMentorsForReport.find(m => m._id === mentor._id)) {
      setSelectedMentorsForReport([...selectedMentorsForReport, mentor]);
    }
    setMentorReportSearchQuery('');
    setShowMentorReportDropdown(false);
  };

  const removeMentorFromReport = (mentorId) => {
    setSelectedMentorsForReport(selectedMentorsForReport.filter(m => m._id !== mentorId));
  };

  const fetchMentorReport = async () => {
    try {
      setIsLoadingMentorReport(true);
      const mentorIds = selectedMentorsForReport.map(m => m._id);

      const response = await fetch('http://localhost:5000/admin/mentor-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mentorIds,
          filters: mentorFilters
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMentorReport(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch mentor report:', errorData);
        alert(`Failed to fetch mentor report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching mentor report:', error);
      alert(`Error fetching mentor report: ${error.message}`);
    } finally {
      setIsLoadingMentorReport(false);
    }
  };

  const downloadMentorPDF = () => {
    if (mentorReport.length === 0) {
      alert('No mentor data to download. Please generate a report first.');
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('Mentor Report', 20, 20);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

      // Prepare table data
      const tableData = mentorReport.map(mentor => [
        mentor.fullName || 'N/A',
        mentor.email || 'N/A',
        mentor.industry?.join(', ') || 'N/A',
        mentor.completedSessions || 0,
        mentor.averageRating || 0,
        mentor.menteesCount || 0,
        mentor.yearsExperience || 'N/A',
        mentor.currentRole || 'N/A',
        mentor.education || 'N/A'
      ]);

      // Add table
      doc.autoTable({
        head: [['Name', 'Email', 'Industry', 'Sessions', 'Rating', 'Mentees', 'Experience', 'Role', 'Education']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 172, 254] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Save the PDF
      doc.save('mentor-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const downloadMentorCSV = () => {
    if (mentorReport.length === 0) {
      alert('No mentor data to download. Please generate a report first.');
      return;
    }

    try {
      // Prepare CSV headers
      const headers = ['Name', 'Email', 'Industry', 'Sessions', 'Rating', 'Mentees', 'Experience', 'Role', 'Education'];

      // Prepare CSV data
      const csvData = mentorReport.map(mentor => [
        mentor.fullName || 'N/A',
        mentor.email || 'N/A',
        mentor.industry?.join(', ') || 'N/A',
        mentor.completedSessions || 0,
        mentor.averageRating || 0,
        mentor.menteesCount || 0,
        mentor.yearsExperience || 'N/A',
        mentor.currentRole || 'N/A',
        mentor.education || 'N/A'
      ]);

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'mentor-report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV. Please try again.');
    }
  };

  // Compare Mentees functions
  const searchMenteesForComparison = (searchTerm) => {
    setMenteeComparisonSearchQuery(searchTerm);

    if (searchTerm.length < 1) {
      setFilteredMenteesForComparison(allMentees);
      setShowMenteeComparisonDropdown(false);
      return;
    }

    const filtered = allMentees.filter(mentee =>
      mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMenteesForComparison(filtered);
    setShowMenteeComparisonDropdown(true);
  };

  const addMenteeToComparison = (mentee) => {
    if (!selectedMenteesForComparison.find(m => m._id === mentee._id)) {
      setSelectedMenteesForComparison([...selectedMenteesForComparison, mentee]);
    }
    setMenteeComparisonSearchQuery('');
    setShowMenteeComparisonDropdown(false);
  };

  const removeMenteeFromComparison = (menteeId) => {
    setSelectedMenteesForComparison(selectedMenteesForComparison.filter(m => m._id !== menteeId));
  };

  const fetchMenteeComparisonData = async () => {
    if (selectedMenteesForComparison.length === 0) {
      setMenteeComparisonData([]);
      return;
    }

    try {
      setIsLoadingMenteeComparison(true);
      const menteeIds = selectedMenteesForComparison.map(m => m._id);

      const response = await fetch('http://localhost:5000/admin/mentee-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ menteeIds })
      });

      if (response.ok) {
        const data = await response.json();
        setMenteeComparisonData(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch mentee comparison data:', errorData);
        alert(`Failed to fetch mentee comparison data: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching mentee comparison data:', error);
      alert(`Error fetching mentee comparison data: ${error.message}`);
    } finally {
      setIsLoadingMenteeComparison(false);
    }
  };

  const handleBarClick = (data) => {
      // Find mentee by matching the name from chart data with menteeComparisonData first
    const menteeData = menteeComparisonData.find(m => m.name === data.name);
  
    if (menteeData) {
      // Find the original mentee object from selectedMenteesForComparison
      const mentee = selectedMenteesForComparison.find(m => m.fullName === menteeData.name);
  
      if (mentee) {
        setSelectedMenteeForBadges(mentee);
        setShowBadgePopup(true);
      } else {
        console.error('❌ [DEBUG] Could not find original mentee for:', menteeData.name);
      }
    } else {
      console.error('❌ [DEBUG] Could not find mentee data for:', data.name);
    }
  };

  const closeBadgePopup = () => {
    setShowBadgePopup(false);
    setSelectedMenteeForBadges(null);
  };

  // Fetch mentee comparison data when selected mentees change
  useEffect(() => {
    fetchMenteeComparisonData();
  }, [selectedMenteesForComparison]);

  // Close badge popup when tab changes
  useEffect(() => {
    const handleTabChange = () => {
      if (showBadgePopup) {
        closeBadgePopup();
      }
    };

    // Listen for clicks on tab triggers
    const tabTriggers = document.querySelectorAll('.tabs-trigger');
    tabTriggers.forEach(trigger => {
      trigger.addEventListener('click', handleTabChange);
    });

    return () => {
      tabTriggers.forEach(trigger => {
        trigger.removeEventListener('click', handleTabChange);
      });
    };
  }, [showBadgePopup]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTopicDropdown && !event.target.closest('.topic-search-wrapper')) {
        setShowTopicDropdown(false);
      }
      if (showMentorNameDropdown && !event.target.closest('.mentor-name-search-wrapper')) {
        setShowMentorNameDropdown(false);
      }
      if (showMentorReportDropdown && !event.target.closest('.mentor-report-search-wrapper')) {
        setShowMentorReportDropdown(false);
      }
      if (showMenteeComparisonDropdown && !event.target.closest('.mentee-comparison-search-wrapper')) {
        setShowMenteeComparisonDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTopicDropdown, showMentorNameDropdown, showMentorReportDropdown, showMenteeComparisonDropdown]);

  // Fetch session report
  const fetchSessionReport = async () => {
    try {
      setIsLoadingReport(true);
      const queryParams = new URLSearchParams();

      if (reportFilters.startDate) queryParams.append('startDate', reportFilters.startDate);
      if (reportFilters.endDate) queryParams.append('endDate', reportFilters.endDate);
      if (reportFilters.topic) queryParams.append('topic', reportFilters.topic);
      if (reportFilters.mentorName) queryParams.append('mentorName', reportFilters.mentorName);

      const response = await fetch(`http://localhost:5000/admin/session-report?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setSessionReport(data.sessions);
      } else {
        console.error('Failed to fetch session report');
      }
    } catch (error) {
      console.error('Error fetching session report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setReportFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Session Report', 105, 20, { align: 'center' });

    // Add filters info
    doc.setFontSize(12);
    let yPos = 35;
    if (reportFilters.startDate || reportFilters.endDate) {
      doc.text(`Date Range: ${reportFilters.startDate || 'Any'} - ${reportFilters.endDate || 'Any'}`, 20, yPos);
      yPos += 10;
    }
    if (reportFilters.topic) {
      doc.text(`Topic: ${reportFilters.topic}`, 20, yPos);
      yPos += 10;
    }
    if (reportFilters.mentorName) {
      doc.text(`Mentor: ${reportFilters.mentorName}`, 20, yPos);
      yPos += 10;
    }

    // Add table
    const tableData = (sessionReport || []).map(session => [
      new Date(session.date).toLocaleDateString(),
      session.mentor,
      session.mentee,
      session.topic,
      session.type,
      session.status
    ]);

    doc.autoTable({
      head: [['Date', 'Mentor', 'Mentee', 'Topic', 'Type', 'Status']],
      body: tableData,
      startY: yPos + 10,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [95, 207, 128],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save('session-report.pdf');
  };

  // Download CSV
  const downloadCSV = () => {
    const headers = ['Date', 'Mentor', 'Mentor Role', 'Mentor Industry', 'Mentee', 'Mentee Department', 'Topic', 'Subject', 'Description', 'Type', 'Status'];

    const csvContent = [
      headers.join(','),
      ...(sessionReport || []).map(session => [
        new Date(session.date).toLocaleDateString(),
        `"${session.mentor}"`,
        `"${session.mentorRole}"`,
        `"${session.mentorIndustry}"`,
        `"${session.mentee}"`,
        `"${session.menteeDepartment}"`,
        `"${session.topic}"`,
        `"${session.subject}"`,
        `"${session.description}"`,
        session.type,
        session.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <Tabs defaultValue="overview">
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">Overview</TabsTrigger>
          <TabsTrigger value="manual-pairing" className="tabs-trigger">Manual Pairing</TabsTrigger>
          <TabsTrigger value="session-frequency" className="tabs-trigger">Session Frequency</TabsTrigger>
          <TabsTrigger value="mentees" className="tabs-trigger">Mentees</TabsTrigger>
          <TabsTrigger value="reports" className="tabs-trigger">Reports</TabsTrigger>
        </TabsList>

        <div className="tab-card animated-tab">
          <TabsContent value="overview">
            {/* Top Section - Sessions Graph and Stats */}
            <div className="card-grid">
              <div className="sessions-graph">
                <div className="flex items-center mb-4">
                  <h2 className="mr-4 !mt-0 !mb-0">Sessions Over Time</h2>
                  <select
                    value={selectedTimePeriod}
                    onChange={(e) => handleTimePeriodChange(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 bg-white text-sm ml-auto "
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="3months">Last 3 Months</option>
                  </select>
                </div>
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">Loading session data...</p>
                  </div>
                ) : sessionData.length > 0 ? (
                  <ResponsiveContainer width="90%" height={200}>
                    <LineChart data={sessionData}>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        domain={[0, 'dataMax + 1']}
                        tickCount={6}
                      />
                      <Tooltip
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          });
                        }}
                      />
                      <Line type="monotone" dataKey="sessions" stroke="#5fcf80" strokeWidth={2} dot={{ fill: '#5fcf80', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">No session data available for selected period</p>
                  </div>
                )}
              </div>

              <div className="stats-section">
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{stats.totalMentors}</h2>
                    <p>Total Active Mentors</p>
                  </CardContent>
                </Card>
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{stats.totalMentees}</h2>
                    <p>Total Active Mentees</p>
                  </CardContent>
                </Card>
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{stats.sessionsThisMonth}</h2>
                    <p>Sessions This Month</p>
                  </CardContent>
                </Card>
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{stats.unresolvedReports}</h2>
                    <p>Unresolved Reports</p>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Bottom Section - Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Top 5 Mentorship Query Topics</h3>
                <div className="mb-2">
                  <button
                    onClick={fetchMentorshipTopics}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Refresh Data
                  </button>
                </div>
                {isLoadingPieChart ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">Loading topics data...</p>
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="90%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const total = pieData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${name}: ${percentage}%`;
                        }}
                        contentStyle={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={70}
                        wrapperStyle={{
                          paddingTop: '0px',
                          paddingBottom: '0px',
                          fontSize: '10px'
                        }}
                        formatter={(value) => (
                          <span style={{ fontSize: '10px', color: '#333' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">No mentorship topics available</p>
                  </div>
                )}
              </div>

              <div className="chart-card">
                <h3>Most Active Departments of the Week</h3>
                <div className="mb-2">
                  <button
                    onClick={fetchDepartmentData}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Refresh Data
                  </button>
                </div>
                {isLoadingDepartmentData ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">Loading department data...</p>
                  </div>
                ) : departmentData.length > 0 ? (
                  <ResponsiveContainer width="90%" height={250}>
                    <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="department"
                        angle={-35}
                        textAnchor="end"
                        height={80}
                        fontSize={9}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'weeklySessions') {
                            return [`${value} sessions this week`, 'Weekly Sessions'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Department: ${label}`}
                        contentStyle={{
                          fontSize: '12px',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar
                        dataKey="weeklySessions"
                        fill="#5fcf80"
                        name="Weekly Sessions"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">No department data available</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual-pairing">
            <div className="manual-pairing-container">
              {/* Left: Manual Pairing Requests */}
              <div className="manual-pairing-left">
                {/*<h2 className="text-xl font-semibold mb-0 text-left">Manual Pairing Requests</h2>
                <div className="h-10 w-full bg-gray-100 mt-4 flex items-center justify-center text-sm text-gray-500 rounded">&nbsp; </div>*/}
                <div className="manual-pairing-right1 mb-2">

                  <div className="grid grid-cols-1 gap-6 mb-2">

                    {/* Field 1: Mentee Selection */}
                    <div>
                      <h2 className="text-xl font-semibold mb-2">1. Select Mentee</h2>
                      <div className="search-wrapper relative mb-4">
                        <Input
                          className="pr-20 w-full"
                          placeholder="Search Mentees"
                          value={menteeSearchQuery}
                          onChange={(e) => searchPairingMentees(e.target.value)}
                          onFocus={() => setShowPairingMenteeDropdown(true)}
                        />
                        <img src={searchIcon} alt="Search" className="search-icon" />
                        
                        {/* Mentee Search Dropdown */}
                        {showPairingMenteeDropdown && (
                          <div className="mentor-dropdown">
                            {isLoadingMentees ? (
                              <div className="mentor-dropdown-item text-center text-gray-500">
                                Loading mentees...
                              </div>
                            ) : filteredMentees.length > 0 ? (
                              filteredMentees.map((mentee) => (
                                <div
                                  key={mentee._id}
                                  className="mentor-dropdown-item"
                                  onClick={() => selectPairingMentee(mentee)}
                                >
                                  <div className="font-medium text-gray-800">{mentee.fullName}</div>
                                  <div className="text-sm text-gray-600">{mentee.email}</div>
                                </div>
                              ))
                            ) : (
                              <div className="mentor-dropdown-item text-center text-gray-500">
                                No mentees found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Mentee Display */}
                      {selectedPairingMentee && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="font-medium text-blue-800">Selected Mentee:</div>
                          <div className="text-blue-600">{selectedPairingMentee.fullName}</div>
                          <div className="text-sm text-blue-500">{selectedPairingMentee.email}</div>
                        </div>
                      )}
                    </div>

                    {/* Field 2: Mentorship Topic Selection */}
                    <div>
                      <h2 className="text-xl font-semibold mb-2">2. Select Mentorship Topic</h2>

                      {/* Pairing Mode Checkboxes */}
                      <div className="mb-4 space-y-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input
                            type="radio"
                            name="pairingMode"
                            value="replace"
                            checked={pairingMode === 'replace'}
                            onChange={(e) => handlePairingModeChange(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Replace mentor for existing mentorship request</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input
                            type="radio"
                            name="pairingMode"
                            value="create"
                            checked={pairingMode === 'create'}
                            onChange={(e) => handlePairingModeChange(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Create new mentorship request</span>
                        </label>
                      </div>

                      <div className="search-wrapper relative mb-4">
                        <Input
                          className={`pr-20 w-full ${!selectedPairingMentee ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
                          placeholder={
                            !selectedPairingMentee
                              ? "Select mentee first"
                              : pairingMode === 'replace'
                                ? "Select a mentorship request"
                                : "Select a topic"
                          }
                          value={
                            pairingMode === 'replace'
                              ? (selectedMentorshipRequest ? selectedMentorshipRequest.topic : '')
                              : (typeof selectedMentorshipRequest === 'string' ? selectedMentorshipRequest : '')
                          }
                          disabled={!selectedPairingMentee}
                          readOnly
                          onClick={() => {
                            if (selectedPairingMentee) {
                              setShowPairingMenteeDropdown(false);
                              setShowPairingMentorDropdown(false);
                              setShowPairingTopicDropdown(!showPairingTopicDropdown);
                            }
                          }}
                        />
                        
                        {/* Topic Dropdown */}
                        {selectedPairingMentee && showPairingTopicDropdown && (
                          <div className="mentor-dropdown">
                            {pairingMode === 'replace' ? (
                              // Replace mode: Show existing mentorship requests
                              menteeRequests.length > 0 ? (
                                isLoadingMenteeRequests ? (
                                  <div className="mentor-dropdown-item text-center text-gray-500">
                                    Loading requests...
                                  </div>
                                ) : (
                                  menteeRequests.map((request) => (
                                    <div
                                      key={request._id}
                                      className="mentor-dropdown-item"
                                      onClick={() => selectMentorshipRequest(request)}
                                    >
                                      <div className="mentor-dropdown-item-name">{request.topic}</div>
                                      <div className="mentor-dropdown-item-email">Current Mentor: {request.mentor.fullName}</div>
                                      <div className="mentor-dropdown-item-industry">ID: {request._id.slice(-8)}</div>
                                    </div>
                                  ))
                                )
                              ) : (
                                <div className="mentor-dropdown-item text-center text-gray-500">
                                  No mentorship requests found for this mentee
                                </div>
                              )
                            ) : (
                              // Create mode: Show all available topics
                              isLoadingTopics ? (
                                <div className="mentor-dropdown-item text-center text-gray-500">
                                  Loading topics...
                                </div>
                              ) : allTopics.length > 0 ? (
                                allTopics.map((topic) => (
                                  <div
                                    key={topic}
                                    className="mentor-dropdown-item"
                                    onClick={() => selectMentorshipRequest(topic)}
                                  >
                                    <div className="mentor-dropdown-item-name">{topic}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="mentor-dropdown-item text-center text-gray-500">
                                  No topics available
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* No requests message - only for replace mode */}
                      {selectedPairingMentee && pairingMode === 'replace' && menteeRequests.length === 0 && !isLoadingMenteeRequests && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                          No mentorship requests found for this mentee
                        </div>
                      )}

                      {/* Selected Request/Topic Display */}
                      {selectedMentorshipRequest && (
                        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="font-medium text-purple-800">
                            {pairingMode === 'replace' ? 'Selected Request:' : 'Selected Topic:'}
                          </div>
                          <div className="text-purple-600">
                            {pairingMode === 'replace'
                              ? selectedMentorshipRequest.topic
                              : selectedMentorshipRequest
                            }
                          </div>
                          {pairingMode === 'replace' && (
                            <div className="text-sm text-purple-500">
                              Current Mentor: {selectedMentorshipRequest.mentor.fullName}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Field 3: Mentor Selection */}
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        3. Select {pairingMode === 'replace' ? 'Replacement' : ''} Mentor
                      </h2>
                      <div className="search-wrapper relative mb-4">
                        <Input
                          className={`pr-20 w-full ${!selectedMentorshipRequest ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder={
                            !selectedMentorshipRequest
                              ? "Select topic first"
                              : pairingMode === 'replace'
                                ? "Search for replacement mentor"
                                : "Search for mentor"
                          }
                          value={mentorSearchQuery}
                          onChange={(e) => searchPairingMentors(e.target.value)}
                          onFocus={() => {
                            if (selectedMentorshipRequest) {
                              setShowPairingMentorDropdown(true);
                              // Show all mentors when focusing on mentor input
                              setFilteredMentors(allMentors);
                            }
                          }}
                          disabled={!selectedMentorshipRequest}
                        />
                        <img src={searchIcon} alt="Search" className="search-icon" />
                        
                        {/* Mentor Search Dropdown */}
                        {showPairingMentorDropdown && selectedMentorshipRequest && (
                          <div className="mentor-dropdown">
                            {isLoadingMentorsDropdown ? (
                              <div className="mentor-dropdown-item text-center text-gray-500">
                                Loading mentors...
                              </div>
                            ) : filteredMentors.length > 0 ? (
                              filteredMentors.map((mentor) => (
                                <div
                                  key={mentor._id}
                                  className="mentor-dropdown-item"
                                  onClick={() => selectReplacementMentor(mentor)}
                                >
                                  <div className="font-medium text-gray-800">{mentor.fullName}</div>
                                  <div className="text-sm text-gray-600">{mentor.email}</div>
                                  <div className="text-xs text-gray-500">{mentor.industry}</div>
                                </div>
                              ))
                            ) : (
                              <div className="mentor-dropdown-item text-center text-gray-500">
                                No mentors found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Replacement Mentor Display */}
                      {selectedReplacementMentor && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-green-800">Selected Replacement Mentor:</div>
                          <div className="text-green-600">{selectedReplacementMentor.fullName}</div>
                          <div className="text-sm text-green-500">{selectedReplacementMentor.email}</div>
                          <div className="text-xs text-green-400">{selectedReplacementMentor.industry}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Mentor Replacement Interface */}
                <div className="mt-8 mb-4">
                <CustomButton
                  onClick={pairingMode === 'replace' ? handleMentorReplacement : handleCreateMentorshipRequest}
                  disabled={!selectedPairingMentee || !selectedMentorshipRequest || !selectedReplacementMentor}
                  className={!selectedPairingMentee || !selectedMentorshipRequest || !selectedReplacementMentor ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {selectedPairingMentee && selectedMentorshipRequest && selectedReplacementMentor
                    ? (pairingMode === 'replace' ? 'Replace Mentor' : 'Create Request')
                    : 'Manually Pair'
                  }
                </CustomButton>
                </div>
              </div>
              <div className="manual-pairing-right">
                <div className="requests p-8">
                  <h2 className="text-xl font-semibold mt-4 mb-8  text-left">Support Requests</h2>
                  {isLoadingRequests ? (
                    <div className="text-center py-4 ">
                      <p>Loading support requests...</p>
                    </div>
                  ) : supportRequests.length === 0 ? (
                    <div className="text-center py-4 ">
                      <p>No support requests found.</p>
                    </div>
                  ) : (
                    supportRequests.slice(0, 3).map((request, index) => (
                      <Card key={request._id || index} >
                        <CardContent>
                          <div className="mb-2 text-gray-800">
                            <strong>Date:</strong> {new Date(request.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="mb-2 text-gray-800">
                            <strong>Name:</strong> {request.name}
                          </div>
                          <div className="mb-2 text-gray-800">
                            <strong>Role:</strong> {request.role}
                          </div>
                          <div className="mb-4 text-gray-800">
                            <strong>Message:</strong> {request.message}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-white p-4 ">
                              <CustomButton
                                className="w-full"
                                onClick={() => confirmResolve(request)}
                              >
                                Resolve
                              </CustomButton>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                              <CustomButton
                                className="w-full"
                                onClick={() => confirmIgnore(request)}
                              >
                                Ignore
                              </CustomButton>
                            </div>
                          </div>
                          <div className="h-10 w-full bg-gray-100 mt-4 flex items-center justify-center text-sm text-gray-500 rounded">
                            {/* Dummy content to force render */}
                            &nbsp;
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                  {supportRequests.length > 3 && (
                    <div className="text-center py-2 text-gray-600">
                      +{supportRequests.length - 3} more requests
                    </div>
                  )}
                </div>
              </div>



            </div>
          </TabsContent>


          <TabsContent value="session-frequency">
            <div className="session-frequency-container">
              <div className="session-frequency-header">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Frequency Analysis</h2>
                <p className="text-gray-600 mb-6 text-left">
                  Track mentor performance over the past month
                </p>

                <div className="search-section">
                  <div className="search-wrapper mt-4 mb-4 w-full md:w-1/2 relative">
                    <input
                      type="text"
                      value={mentorSearch}
                      placeholder="Search Mentor by Name"
                      onChange={handleMentorSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && mentorSearchResults.length > 0) {
                          handleMentorSelect(mentorSearchResults[0]);
                        } else if (e.key === 'Enter') {
                          handleAddMentor();
                        }
                      }}
                      onFocus={() => {
                        if (mentorSearch.length >= 2) {
                          setShowMentorDropdown(true);
                        }
                      }}
                      className="search-input"
                    />
                    <img
                      src={searchIcon}
                      alt="Add"
                      className="search-icon cursor-pointer"
                      onClick={handleAddMentor}
                    />

                    {/* Mentor Search Dropdown */}
                    {showMentorDropdown && (
                      <div className="mentor-dropdown">
                        {isLoadingMentors ? (
                          <div className="p-3 text-center text-gray-500">
                            Searching mentors...
                          </div>
                        ) : mentorSearchResults.length > 0 ? (
                          mentorSearchResults.map((mentor) => (
                            <div
                              key={mentor._id}
                              className="mentor-dropdown-item"
                              onClick={() => handleMentorSelect(mentor)}
                            >
                              <div className="font-medium text-gray-800">{mentor.fullName}</div>
                              {mentor.currentRole && (
                                <div className="text-sm text-gray-600">{mentor.currentRole}</div>
                              )}
                              {mentor.industry && mentor.industry.length > 0 && (
                                <div className="text-xs text-gray-500">{mentor.industry.join(', ')}</div>
                              )}
                            </div>
                          ))
                        ) : mentorSearch.length >= 2 ? (
                          <div className="p-3 text-center text-gray-500">
                            No mentors found
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="mentor-selection-info">
                    <span className="text-sm text-gray-600">
                      Selected: {selectedMentors.length}/10 mentors
                    </span>
                  </div>
                </div>
              </div>

              <div className="selected-mentors-section">
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedMentors.map((mentor) => (
                    <Searchtag key={mentor._id} name={mentor.fullName} onRemove={() => handleRemoveMentor(mentor)} />
                  ))}
                </div>
              </div>

              <div className="chart-container">
                {selectedMentors.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3 className="empty-state-title">No Mentors Selected</h3>
                    <p className="empty-state-description">
                      Search and select mentors above to view their session frequency data
                    </p>
                  </div>
                ) : isLoadingFrequency ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading session frequency data...</p>
                  </div>
                ) : (
                  <div className="modern-chart">
                    <ResponsiveContainer width="95%" height={400}>
                      <BarChart
                        data={sessionFrequencyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                      >
                        <defs>
                          <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5fcf80" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="sessionGradientHover" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={1} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="fullName"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => {
                            if (value.length > 15) {
                              return value.substring(0, 15) + '...';
                            }
                            return value;
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          label={{
                            value: 'Sessions (Past Month)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                          formatter={(value, name) => [`${value} sessions`, 'Sessions']}
                        />
                        <Bar
                          dataKey="sessionCount"
                          fill="url(#sessionGradient)"
                          radius={[4, 4, 0, 0]}
                          onMouseEnter={(data, index) => {
                            // Add hover effect
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mentees">
            <h2 className="text-xl font-semibold mb-4">Compare Mentees</h2>

            {/* Mentee Selection */}
            <div className="mentee-comparison-search-wrapper relative mb-6">
              <div className="search-wrapper relative">
                <Input
                  className="pr-20 w-full"
                  placeholder="Search mentees to compare..."
                  value={menteeComparisonSearchQuery}
                  onChange={(e) => searchMenteesForComparison(e.target.value)}
                  onFocus={() => setShowMenteeComparisonDropdown(true)}
                />
                <img src={searchIcon} alt="Search" className="search-icon" />
              </div>

              {showMenteeComparisonDropdown && (
                <div className="mentor-dropdown">
                  {filteredMenteesForComparison.length > 0 ? (
                    filteredMenteesForComparison.map((mentee) => (
                      <div
                        key={mentee._id}
                        className="dropdown-item"
                        onClick={() => addMenteeToComparison(mentee)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {mentee.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{mentee.fullName}</p>
                            <p className="text-sm text-gray-500">{mentee.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item text-gray-500">No mentees found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Mentees */}
            {selectedMenteesForComparison.length > 0 && (
              <div className="selected-mentees-section mb-6">
                <div className="flex flex-wrap gap-2">
                  {selectedMenteesForComparison.map((mentee) => (
                    <Searchtag
                      key={mentee._id}
                      name={mentee.fullName}
                      onRemove={() => removeMenteeFromComparison(mentee._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="chart-container">
              {selectedMenteesForComparison.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h3 className="empty-state-title">No Mentees Selected</h3>
                  <p className="empty-state-description">
                    Search and select mentees above to compare their sessions and badges
                  </p>
                </div>
              ) : isLoadingMenteeComparison ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading mentee comparison data...</p>
                </div>
              ) : (
                <div className="modern-chart">
                  <ResponsiveContainer width="95%" height={400}>
                    <BarChart
                      data={menteeComparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={40}
                    >
                      <defs>
                        <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5fcf80" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#4caf50" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="badgeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ff9800" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="sessions"
                        fill="url(#sessionGradient)"
                        name="Sessions"
                        radius={[4, 4, 0, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: 'pointer' }}
                      />
                      <Bar
                        dataKey="badges"
                        fill="url(#badgeGradient)"
                        name="Badges Earned"
                        radius={[4, 4, 0, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: 'pointer' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="session-report-container">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Reports</h2>

              {/* Report Type Selection */}
              <div className="mb-6">
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="session"
                      checked={reportType === 'session'}
                      onChange={(e) => handleReportTypeChange(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Generate Session Report</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="mentor"
                      checked={reportType === 'mentor'}
                      onChange={(e) => handleReportTypeChange(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Generate Mentor Report</span>
                  </label>
                </div>
              </div>

              {/* Session Report Filters */}
              {reportType === 'session' && (
                <div className="filters-section mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <Input
                        type="date"
                        value={reportFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <Input
                        type="date"
                        value={reportFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                      <div className="topic-search-wrapper relative">
                        <input
                          type="text"
                          value={topicSearch}
                          placeholder="Search Topic"
                          onChange={handleTopicSearchChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && topicSearch.length > 0) {
                              const filteredTopics = commonTopics.filter(topic =>
                                topic.toLowerCase().includes(topicSearch.toLowerCase())
                              );
                              if (filteredTopics.length > 0) {
                                handleTopicSelect(filteredTopics[0]);
                              }
                            }
                          }}
                          onFocus={() => {
                            if (topicSearch.length >= 1) {
                              setShowTopicDropdown(true);
                            } else {
                              setShowTopicDropdown(true);
                            }
                          }}
                          className="search-input"
                        />

                          {/* Topic Search Dropdown */}
                          {showTopicDropdown && (
                           <div className="mentor-dropdown">
                            {topicSearch.length >= 1 ? (
                              commonTopics.filter(topic =>
                                topic.toLowerCase().includes(topicSearch.toLowerCase())
                              ).map((topic, index) => (
                                <div
                                  key={index}
                                  className="mentor-dropdown-item"
                                  onClick={() => handleTopicSelect(topic)}
                                >
                                  <div className="font-medium text-gray-800">{topic}</div>
                                </div>
                              ))
                            ) : (
                              commonTopics.map((topic, index) => (
                                <div
                                  key={index}
                                  className="mentor-dropdown-item"
                                  onClick={() => handleTopicSelect(topic)}
                                >
                                  <div className="font-medium text-gray-800">{topic}</div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mentor Name</label>
                      <div className="search-wrapper relative">
                        <input
                          type="text"
                          value={mentorSearch}
                          placeholder="Search Mentor by Name"
                          onChange={handleMentorSearchChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && mentorSearchResults.length > 0) {
                              handleMentorSelect(mentorSearchResults[0]);
                            }
                          }}
                          onFocus={() => {
                            if (mentorSearch.length >= 2) {
                              setShowMentorDropdown(true);
                            }
                          }}
                          className="search-input"
                        />
                        <img
                          src={searchIcon}
                          alt="Search"
                          className="search-icon"
                        />

                        {/* Mentor Search Dropdown */}
                        {showMentorDropdown && (
                          <div className="mentor-dropdown">
                            {isLoadingMentors ? (
                              <div className="p-3 text-center text-gray-500">
                                Searching mentors...
                              </div>
                            ) : mentorSearchResults.length > 0 ? (
                              mentorSearchResults.map((mentor) => (
                                <div
                                  key={mentor._id}
                                  className="mentor-dropdown-item"
                                  onClick={() => {
                                    // Set the mentor name in the report filters
                                    setReportFilters(prev => ({
                                      ...prev,
                                      mentorName: mentor.fullName
                                    }));
                                    setMentorSearch(mentor.fullName);
                                    setShowMentorDropdown(false);
                                  }}
                                >
                                  <div className="font-medium text-gray-800">{mentor.fullName}</div>
                                  {mentor.currentRole && (
                                    <div className="text-sm text-gray-600">{mentor.currentRole}</div>
                                  )}
                                  {mentor.industry && mentor.industry.length > 0 && (
                                    <div className="text-xs text-gray-500">{mentor.industry.join(', ')}</div>
                                  )}
                                </div>
                              ))
                            ) : mentorSearch.length >= 2 ? (
                              <div className="p-3 text-center text-gray-500">
                                No mentors found
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-4 mb-4">
                      <CustomButton onClick={fetchSessionReport} disabled={isLoadingReport}>
                        {isLoadingReport ? 'Loading...' : 'Generate Report'}
                      </CustomButton>
                      <CustomButton onClick={() => {
                        setReportFilters({ startDate: '', endDate: '', topic: '', mentorName: '' });
                        setMentorSearch(''); // Also clear the mentor search input
                        setTopicSearch(''); // Also clear the topic search input
                      }}>
                        Clear Filters
                      </CustomButton>
                    </div>
                  </div>

                  {/* Results Section */}
                  {sessionReport && sessionReport.length > 0 && (
                    <div className="results-section">
                      <div className="flex justify-between items-center mb-4 gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Results: {sessionReport.length} sessions found
                        </h3>
                        <div className="flex gap-4">
                          <CustomButton onClick={downloadPDF}>
                            Download PDF
                          </CustomButton>
                          <CustomButton onClick={downloadCSV}>
                            Download CSV
                          </CustomButton>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Mentor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Mentor Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Mentee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Department
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Topic
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(sessionReport || []).map((session, index) => (
                              <tr key={session.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {new Date(session.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {session.mentor}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {session.mentorRole}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {session.mentee}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {session.menteeDepartment}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {session.topic}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${session.type === 'video' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {session.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {session.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingReport && sessionReport && sessionReport.length === 0 && (
                    <div className="empty-state text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sessions Found</h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your filters or generate a report to see session data
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mentor Report Section */}
              {reportType === 'mentor' && (
                <div className="mentor-report-section mb-6">
                  {/* Mentor Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Mentors (Optional)</h3>
                    <p className="text-sm text-gray-600 mb-4">Leave empty to include all mentors, or select specific mentors to filter</p>
                    <div className="mentor-report-search-wrapper relative mb-4">
                      <input
                        type="text"
                        value={mentorReportSearchQuery}
                        placeholder="Search mentors..."
                        onChange={(e) => searchMentorsForReport(e.target.value)}
                        onFocus={() => setShowMentorReportDropdown(true)}
                        className="search-input w-full"
                      />

                      {/* Mentor Dropdown */}
                      {showMentorReportDropdown && (
                        <div className="mentor-dropdown">
                          {filteredMentorsForReport.map((mentor) => (
                            <div
                              key={mentor._id}
                              className="mentor-dropdown-item"
                              onClick={() => addMentorToReport(mentor)}
                            >
                              <div className="font-medium text-gray-800">{mentor.fullName}</div>
                              <div className="text-sm text-gray-600">{mentor.email}</div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Mentors */}
                    {selectedMentorsForReport.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Mentors:</h4>
                        <div className="flex gap-4">
                          {selectedMentorsForReport.map((mentor) => (
                            <div
                              key={mentor._id}
                              className="inline-flex items-center gap-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                            >
                             <span className="leading-none">{mentor.fullName}</span>
                             {'\u00A0'.repeat(3)}
                              <button
                                onClick={() => removeMentorFromReport(mentor._id)}
                                className=" text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mentor Filters */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Sessions</label>
                        <Input
                          type="number"
                          value={mentorFilters.minSessions}
                          onChange={(e) => handleMentorFilterChange('minSessions', e.target.value)}
                          className="w-full"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Sessions</label>
                        <Input
                          type="number"
                          value={mentorFilters.maxSessions}
                          onChange={(e) => handleMentorFilterChange('maxSessions', e.target.value)}
                          className="w-full"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={mentorFilters.minRating}
                          onChange={(e) => handleMentorFilterChange('minRating', e.target.value)}
                          className="w-full"
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Rating</label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={mentorFilters.maxRating}
                          onChange={(e) => handleMentorFilterChange('maxRating', e.target.value)}
                          className="w-full"
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Mentees</label>
                        <Input
                          type="number"
                          value={mentorFilters.minMentees}
                          onChange={(e) => handleMentorFilterChange('minMentees', e.target.value)}
                          className="w-full"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Mentees</label>
                        <Input
                          type="number"
                          value={mentorFilters.maxMentees}
                          onChange={(e) => handleMentorFilterChange('maxMentees', e.target.value)}
                          className="w-full"
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-4 mb-4">
                      <CustomButton onClick={fetchMentorReport} disabled={isLoadingMentorReport}>
                        {isLoadingMentorReport ? 'Loading...' : 'Generate Mentor Report'}
                      </CustomButton>
                      <CustomButton onClick={() => {
                        setSelectedMentorsForReport([]);
                        setMentorFilters({
                          minSessions: '',
                          maxSessions: '',
                          minRating: '',
                          maxRating: '',
                          minMentees: '',
                          maxMentees: ''
                        });
                      }}>
                        Clear All
                      </CustomButton>
                    </div>
                  </div>

                  {/* Mentor Report Results */}
                  {mentorReport.length > 0 && (
                    <div className="results-section">
                      <div className="flex justify-between items-center mb-4 gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Results: {mentorReport.length} mentors found
                        </h3>
                        <div className="flex gap-4">
                          <CustomButton onClick={downloadMentorPDF}>
                            Download PDF
                          </CustomButton>
                          <CustomButton onClick={downloadMentorCSV}>
                            Download CSV
                          </CustomButton>
                        </div>
                      </div>

                      {/* Mentor Report Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Mentor Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Industry
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Completed Sessions
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Average Rating
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Total Ratings
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Mentees Count
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Years Experience
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {mentorReport.map((mentor, index) => (
                              <tr key={mentor._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.fullName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.industry?.join(', ') || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.completedSessions || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.averageRating ? mentor.averageRating.toFixed(1) : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.totalRatings || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.menteesCount || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {mentor.yearsExperience || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty State for Mentor Report */}
                  {!isLoadingMentorReport && mentorReport.length === 0 && selectedMentorsForReport.length === 0 && (
                    <div className="empty-state text-center py-12">
                      <div className="text-6xl mb-4">👥</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Generate Report</h3>
                      <p className="text-gray-600 mb-6">
                        Select specific mentors above or leave empty to include all mentors. Apply filters and generate your report.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>




      {showResolveConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">Confirm Resolution</h3>
            <p className="mb-6">
              Are you sure you want to resolve this support request from <strong>{requestToResolve?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <CustomButton onClick={() => handleResolveRequest(requestToResolve?._id)}>
                Yes, Resolve
              </CustomButton>
              <CustomButton onClick={() => setShowResolveConfirm(false)}>
                Cancel
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* Ignore Confirmation Modal */}
      {showIgnoreConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">Ignore Request</h3>
            <p className="mb-6">
              What would you like to do with this request from <strong>{requestToIgnore?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <CustomButton onClick={() => handleDeleteRequest(requestToIgnore?._id)}>
                Delete
              </CustomButton>
              <CustomButton onClick={() => handleSaveForLater(requestToIgnore?._id)}>
                Save for Later
              </CustomButton>
              <CustomButton onClick={() => setShowIgnoreConfirm(false)}>
                Cancel
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* Badge Popup */}
      {showBadgePopup && selectedMenteeForBadges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 badge-popup-overlay">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden badge-popup-content">
            {/* Close Button - Top Right Corner */}
            <div 
              onClick={closeBadgePopup}
              className="absolute z-10 w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 font-bold text-xl cursor-pointer"
              style={{
                top: '24px',
                right: '24px',
                position: 'absolute'
              }}
            >
              ×
            </div>
             
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
               <div className="text-center">
                 <h3 
                   className="text-xl font-bold" 
                   style={{ textAlign: 'center' }}
                 >
                   {selectedMenteeForBadges.fullName}
                 </h3>
                    <p className="text-blue-100">Badge Achievements</p>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              <div 
                className="p-6"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, max-content))',
                  justifyContent: 'center',
                  gap: '24px',
                  padding: '24px'
                }}
              >
                {selectedMenteeForBadges.earnedBadges?.map((badge, index) => {
                  // Calculate progress for the badge
                  const completed = selectedMenteeForBadges.completedSessions || 0;
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
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-6xl mb-4">🏆</div>
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Badges Yet</h3>
                      <p className="text-gray-500">Complete sessions to earn your first badge!</p>
                    </div>
                  )}
              </div>

                <div className="stats-section2">
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}> {selectedMenteeForBadges.completedSessions || 0}</h2>
                    <p>Sessions</p>
                  </CardContent>
                </Card>
                <Card className="stat-card">
                  <CardContent>
                    <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{selectedMenteeForBadges.earnedBadges?.filter(b => b.earned).length || 0}</h2>
                    <p>Badges</p>
                  </CardContent>
                </Card>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Add CSS for badges grid to match mentee module styling
const badgeStyles = `
  .badges-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = badgeStyles;
  document.head.appendChild(styleSheet);
}
