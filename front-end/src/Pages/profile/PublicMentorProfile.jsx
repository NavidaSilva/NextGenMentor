import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import "./profile.css";
import "./ratingoverview.css";

const PublicMentorProfile = () => {
  const { mentorId } = useParams();
  const [mentorData, setMentorData] = useState(null);

  useEffect(() => {
    const fetchMentor = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/mentor/${mentorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMentorData(data);
        } else {
          console.error("Failed to fetch public mentor profile", data);
        }
      } catch (err) {
        console.error("Error fetching public mentor:", err);
      }
    };

    fetchMentor();
  }, [mentorId]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star">&#9733;</span>
        ))}
        {halfStar && <span className="star">&#9733;</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">&#9734;</span>
        ))}
      </>
    );
  };

  if (!mentorData) return <div>Loading profile...</div>;

  const profileSrc = mentorData.profilePicture
  ? (mentorData.profilePicture.startsWith("http")
      ? mentorData.profilePicture
      : `http://localhost:5000${mentorData.profilePicture}`)
  : null;

  return (
    <div className="profile-container">
      <aside className="sidebar">
        {profileSrc ? (
          <img
            src={profileSrc}
            alt={`${mentorData.fullName}'s avatar`}
            className="avatar"
          />
        ) : (
          <AccountCircleRoundedIcon
            style={{ fontSize: "120px", color: "#888" }}
            className="avatar"
          />
        )}

        <h3 className="mentee-name">{mentorData.fullName}</h3>
        <p><strong>{mentorData.completedSessions || 0}</strong> Sessions Completed</p>
        <p><strong>{mentorData.menteesCount || 0}</strong> Mentees</p>

        <div className="rating-overview-card">
          <h4>Rating overview</h4>
          <div className="rating-score">
            <span className="score">{(mentorData.averageRating || 0).toFixed(1)}</span>
            <span className="out-of">/5</span>
          </div>
          <div className="stars">{renderStars(mentorData.averageRating || 0)}</div>
          <p className="total-ratings">{(mentorData.totalRatings || 0).toLocaleString()} ratings</p>
        </div>
      </aside>

      <main className="main-content">
        <h2>Mentor Profile</h2>
        <div className="overview-section">
          <h3>Hello, I’m {mentorData.fullName}</h3>
          <div className="mentee-info">
            <p>
  <strong>Email:</strong>{" "}
  {mentorData.emailVisibility ? mentorData.email : <em>Hidden by user</em>}
</p>
            <p><strong>Current Status:</strong> {mentorData.currentStatus || "Not set yet"}</p> 
            <p><strong>Field(s) of Expertise:</strong> {mentorData.industry?.join(", ")}</p>
            <p><strong>Years of Experience:</strong> {mentorData.yearsExperience}</p>
            <p><strong>Current Role:</strong> {mentorData.currentRole}</p>
            <p><strong>Education:</strong> {mentorData.education}</p>
            <p><strong>LinkedIn:</strong> <a href={mentorData.linkedIn} target="_blank" rel="noreferrer">{mentorData.linkedIn}</a></p>
            <p><strong>Mentorship Format:</strong> {mentorData.mentorshipFormat}</p>
            <p><strong>Preferred Mentee Level:</strong> {mentorData.menteeLevel?.join(", ")}</p>
            <p><strong>Bio:</strong> {mentorData.bio}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicMentorProfile;
