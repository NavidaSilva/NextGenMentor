# MentorMentee Platform

A full-stack **Mentor-Mentee Management System** that intelligently matches mentors and mentees, enables real-time communication, and provides admin-level analytics and reporting.  
Built with **React**, **Node.js**, **MongoDB**, and an **AI-driven backend** using **SentenceTransformers**.

---

## 🧠 Key Features

### 🤖 Automated Mentor - Mentee Matching
Developed an intelligent matching algorithm using **SentenceTransformers** and **cosine similarity** to semantically pair mentors and mentees based on:
- Research interests
- Expertise
- Availability  
Includes a **weighted scoring system** for optimal pairing.

### 👥 User Management
- Separate user flows for **mentors**, **mentees**, and **administrators**
- **Google OAuth** integration for seamless login
- **JWT-based authentication** for secure sessions

### 💬 Real-Time Communication
- Built a **chat system** using **Socket.io**
- Integrated **Google Meet** for virtual mentorship sessions

### 📝 Feedback & Evaluation
- Mentor rating system with dropdown menus
- Feedback submission
- Progress milestone tracking

### 📊 Report Generation
- Export mentorship data as **PDF** or **CSV**
- Performance analytics for administrators and stakeholders

### 🧩 Admin Controls
- Manual re-matching capabilities
- User verification and moderation
- Dashboard comparison tools for mentee performance monitoring

---

## 🧱 Docker Setup

### Build and Run All Services
```bash
docker compose up --build
