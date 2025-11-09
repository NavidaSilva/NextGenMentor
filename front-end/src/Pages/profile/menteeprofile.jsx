import React, { useState, useEffect } from "react";
import BadgeCard from "../../Components/Common/badgecard";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import "./profile.css";

const allPossibleBadges = [
  { id: "1", title: "Starter" },
  { id: "2", title: "5 Sessions" },
  { id: "3", title: "10 Sessions" },
  { id: "4", title: "Consistency Master" },
];

const MenteeProfile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [menteeData, setMenteeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentee = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch("http://localhost:5000/mentee/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch mentee profile");
        }

        const data = await res.json();
        setMenteeData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentee();
  }, []);

  const mergedBadges = allPossibleBadges.map((badge) => {
  const found = menteeData?.earnedBadges?.find((b) => b.id === badge.id);
  const completed = menteeData?.completedSessions || 0;
  let threshold = 0;

  switch (badge.title) {
    case "Starter":
      threshold = 1;
      break;
    case "5 Sessions":
      threshold = 5;
      break;
    case "10 Sessions":
      threshold = 10;
      break;
    case "Consistency Master":
      threshold = 20;
      break;
    default:
      threshold = 1;
  }

  const progress = Math.min(100, Math.round((completed / threshold) * 100));

  return {
    ...badge,
    earned: !!found?.earned,
    progress,
  };
});


  const avatarSrc =
  menteeData?.profilePicture && !menteeData.profilePictureHidden 
    ? menteeData.profilePicture.startsWith("http")
      ? menteeData.profilePicture
      : `http://localhost:5000${menteeData.profilePicture}`
    : null;


  if (loading) return <div>Loading profile...</div>;

  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!menteeData) return null;

  return (
    <div className="profile-container">
      <aside className="sidebar" style={{ textAlign: "center" }}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={`${menteeData.fullName}'s avatar`}
            className="avatar"
            style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <AccountCircleRoundedIcon style={{ fontSize: 120, color: "#999" }} />
        )}
        <h3 className="mentee-name">{menteeData.fullName}</h3>
        <p>
          <strong>{menteeData.completedSessions || 0}</strong> Sessions Completed
        </p>
        <p>
          <strong>{mergedBadges.filter((b) => b.earned).length}</strong> Badges Earned
        </p>
      </aside>

      <main className="main-content">
        <h2>Your Profile</h2>
        <div className="tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={activeTab === "overview" ? "active" : ""}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={activeTab === "achievements" ? "active" : ""}
          >
            Achievements
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-section">
              <h3>Welcome back, {menteeData.fullName}!</h3>
              <div className="mentee-info">
                <p><strong>Full Name:</strong> {menteeData.fullName}</p>
                <p>
  <strong>Email:</strong>{" "}
  {menteeData.emailVisibility ? menteeData.email : <em>Hidden by user</em>}
</p>
                <p><strong>Current Status:</strong> {menteeData.currentStatus || "Not set yet"}</p>
                <p><strong>Field(s) of Study:</strong> {menteeData.fieldOfStudy?.join(", ") || "Not set yet"}</p>
                <p><strong>LinkedIn Profile:</strong> {menteeData.linkedIn ? (
                  <a href={menteeData.linkedIn} target="_blank" rel="noopener noreferrer">{menteeData.linkedIn}</a>
                ) : "Not set yet"}</p>
                <p><strong>Preffered Mentor Type(s):</strong> {menteeData.mentorType?.join(", ") || "Not set yet"}</p>
                <p><strong>Topics need help with:</strong> {menteeData.topics?.join(", ") || "Not set yet"}</p>
                <p><strong>Mentorship Format:</strong> {menteeData.mentorshipFormat || "Not set yet"}</p>
                <p><strong>Learning Goals:</strong> {menteeData.goals || "Not set yet"}</p>
                <p><strong>Bio:</strong> {menteeData.bio || "Not set yet"}</p>
              </div>
            </div>
          )}
          {activeTab === "achievements" && (
            <div className="badges-grid">
  {mergedBadges.map((badge) => (
    <BadgeCard
      key={badge.id}
      title={badge.title}
      earned={badge.earned}
      progress={badge.progress}
    />
  ))}
</div>

          )}
        </div>
      </main>
    </div>
  );
};

export default MenteeProfile;
