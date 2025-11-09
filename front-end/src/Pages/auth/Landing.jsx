import { useNavigate, useLocation } from "react-router-dom";
import RoleSelectionCard from "../../Components/auth/RoleSelectionCard";
import Button from "../../Components/Common/Button";
import React, { useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import aaImage from "../../assets/aa.png"; 
import GoogleAuthButton from "../../Components/auth/GoogleAuthButton";

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.clear(); // clear stale token on entering login page

    const params = new URLSearchParams(location.search);
    const error = params.get('error');

    if (error) {    
      let message = "";
      switch (error) {
        case "not_registered":
          message = "You are not registered yet. Please sign up first.";
          break;
        case "already_registered_as_mentor":
          message = "This email is already registered as a Mentor.";
          break;
        case "already_registered_as_mentee":
          message = "This email is already registered as a Mentee.";
          break;
        case "auth_failed":
          message = "Authentication failed. Please try again.";
          break;
        default:
          message = "Something went wrong. Please try again.";
      }
    toast.error(message);
    }
  }, [location]);

  return (
 
 <div className="landing-container">
  <div className="landing-hero">
    <div className="hero-text">
      <h1>Unlock Your Potential, Faster. Expert Mentors Await.</h1>
      <p>Grow your career with personalized guidance</p>
    </div>
    <div className="hero-image">
      <img className="landingimage" src={aaImage} alt="Mentorship illustration" />
    </div>    
  </div>

      <h1 className="headingmentor">NextGenMentor</h1>


      <div className="auth-options">
        <div className="login-section">
          <h2>Already have an account?</h2>
          <GoogleAuthButton
            onClick={() => {
              window.location.href =
                "http://localhost:5000/auth/google-login";
              localStorage.clear();
            }}
          />
          <Button
            onClick={() => navigate("/login")}
            sx={{ width: "100%" }}
          >
            Login with Email
          </Button>

        </div>

        <div className="signup-section">
          <h2>New here? Join as:</h2>
          <div className="role-cards">
            <RoleSelectionCard
              title="Mentor"
              description="Share your knowledge and guide others"
              icon="👨‍🏫"
              onClick={() => navigate("/signup/mentor")}
            />
            <RoleSelectionCard
              title="Mentee"
              description="Get personalized career guidance"
              icon="🎓"
              onClick={() => navigate("/signup/mentee")}
            />
          </div>
        </div>
      </div>
      
       <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    </div>
  );
};

export default Landing;
