import React, { useState, useEffect } from 'react';
import styles from './ChatRoom.module.css';
import { useParams, useNavigate } from 'react-router-dom';
import { SendHorizontal, Star } from 'lucide-react';

function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || payload.sub;
  } catch {
    return null;
  }
}

const ChatRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userId = getUserIdFromToken();
  const userRole = localStorage.getItem('role')?.toLowerCase();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [mentorId, setMentorId] = useState(null);

  const [rating, setRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkSessionStatus = async () => {
  try {
    const res = await fetch(`http://localhost:5000/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Failed to fetch session');
    const data = await res.json();

    const dismissed = localStorage.getItem(`ratingModalDismissed_${sessionId}`) === 'true';

    if (data.status === 'completed') {
      setSessionCompleted(true);

      if (userRole === 'mentee' && !data.menteeRated && !dismissed) {
        setShowRatingModal(true);
      }
    }

    if (data.menteeRated) setSubmittedRating(true);
    if (data.date) setSessionStartTime(new Date(data.date));
    setMentorId(data.mentor?._id || data.mentor);

  } catch (err) {
    console.error(err);
  }
};


  const sendMessage = async () => {
    if (sessionCompleted || !message.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/messages/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
        return;
      }
      setMessage('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndSession = async () => {
    if (userRole !== 'mentor') {
      alert('Only the mentor can end this session.');
      return;
    }
    const confirmEnd = window.confirm('Are you sure you want to end the session?');
    if (!confirmEnd) return;

    try {
      const res = await fetch(`http://localhost:5000/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to end session');
        return;
      }
      setSessionCompleted(true);

      if (userRole === 'mentee') {
        setShowRatingModal(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to end session.');
    }
  };

  const submitRating = async () => {
    if (!mentorId || rating === 0) return;
    try {
      const res = await fetch(`http://localhost:5000/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ mentorId, rating, sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to submit rating');
        return;
      }
      setSubmittedRating(true);
      setShowRatingModal(false);
      setModalDismissed(true);
    } catch (err) {
      console.error(err);
      alert('Error submitting rating');
    }
  };

  const cancelRating = () => {
  setShowRatingModal(false);
  setModalDismissed(true);
  localStorage.setItem(`ratingModalDismissed_${sessionId}`, 'true');
  };

  const handleExit = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchMessages();
    checkSessionStatus();
    const messagesInterval = setInterval(fetchMessages, 2000);
    const statusInterval = setInterval(checkSessionStatus, 5000);
    return () => {
      clearInterval(messagesInterval);
      clearInterval(statusInterval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionStartTime) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime.getTime();
      if (elapsed >= 60 * 60 * 1000) setSessionCompleted(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  useEffect(() => {
    const list = document.querySelector(`.${styles.messageList}`);
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      <h2>Chat Room</h2>

      <ul className={styles.messageList}>
        {messages.map((msg) => {
          const isSentByMe = msg.user?._id === userId;
          return (
            <li
              key={msg._id}
              className={`${styles.messageItem} ${isSentByMe ? styles.sent : styles.received}`}
            >
              <strong>{msg.user?.fullName || 'Unknown'}:</strong> {msg.message}
            </li>
          );
        })}
      </ul>

      {!sessionCompleted && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className={styles.inputArea}
        >
          <input
            className={styles.inputField}
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className={styles.sendButton} disabled={!message.trim()}>
            <SendHorizontal size={20} />
          </button>
        </form>
      )}

      {userRole === 'mentor' && !sessionCompleted && (
        <button className={styles.endSessionButton} onClick={handleEndSession}>
          End Session
        </button>
      )}

      {sessionCompleted && (
        <>
          <p className={styles.sessionEndedMsg}>This session has ended.</p>
          <button className={styles.exitButton} onClick={handleExit}>
            Exit Chat
          </button>
          {userRole === 'mentee' && submittedRating && (
            <p className={styles.thankYou}>Thank you for rating your mentor!</p>
          )}
        </>
      )}

      {showRatingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Rate Your Mentor</h3>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={star <= rating ? styles.starFilled : styles.starEmpty}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.submitRatingBtn}
                disabled={rating === 0}
                onClick={submitRating}
              >
                Submit
              </button>
              <button className={styles.cancelRatingBtn} onClick={cancelRating}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
