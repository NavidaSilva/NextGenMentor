import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Pages/auth/Landing";
import Login from "./Pages/auth/Login";
import MentorSignup from "./Pages/auth/MentorSignup";
import MenteeSignup from "./Pages/auth/MenteeSignup";
import MentorDashboard from "./Pages/dashboard/MentorDashboard";
import MenteeDashboard from "./Pages/dashboard/MenteeDashboard";
import QueryDetails from "./Pages/query/QueryDetails";
import MenteeProfile from "./Pages/profile/menteeprofile";
import MentorProfile from "./Pages/profile/mentorprofile";
import MentorSettings from './Pages/settings/mentor/mentorsettings';
import MenteeSettings from './Pages/settings/mentee/menteesettings';
import TopicSelectionPage from './Pages/query/TopicSelectionPage';
import RecommendedMentors from "./Pages/query/RecommendMentors.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";
import MenteeRequests from './Pages/query/MenteeRequests';
import PublicMentorProfile from "./Pages/profile/PublicMentorProfile"; 
import PublicMenteeProfile from "./Pages/profile/PublicMenteeProfile";
import ChatRoom from './Pages/chat/ChatRoom';
import ResetPassword from './Pages/auth/ResetPassword';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/signup/mentor" element={<MentorSignup />} />
        <Route path="/signup/mentee" element={<MenteeSignup />} />
        <Route path="/mentor" element={<MentorDashboard />} />
        <Route path="/mentee" element={<MenteeDashboard />} />
        <Route path="/query/:queryId" element={<QueryDetails />} />
        <Route path="/mentee-profile-view/:menteeId" element={<PublicMenteeProfile />} />
        <Route path="/mentor-profile-view/:mentorId" element={<PublicMentorProfile />} />
        <Route path="/profile/mentee" element={<MenteeProfile />} />
        <Route path="/profile/mentor" element={
          <ProtectedRoute>
            <MentorProfile />
          </ProtectedRoute>
        } />
        <Route path="/settings/mentor/*" element={<MentorSettings />} />
        <Route path="/settings/mentee/*" element={<MenteeSettings />} />
        <Route path="/new-query" element={<TopicSelectionPage />} />
        <Route path="/recomend-mentors" element={<RecommendedMentors />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/MenteeRequests/:id" element={<MenteeRequests />} />

        <Route path="/chat/:sessionId" element={<ChatRoom />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
