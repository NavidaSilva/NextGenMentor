from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId
import numpy as np
from sentence_transformers import SentenceTransformer, util

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/mentormentee")
client = MongoClient(mongo_uri)
db = client.get_database("mentormentee")
mentors_collection = db.get_collection("mentors")

embedder = SentenceTransformer('all-MiniLM-L6-v2')

class MenteeQuery(BaseModel):
    topics: List[str]
    mentorshipFormat: Optional[str] = "both"
    preferredExperience: Optional[str] = None
    menteeLevel: Optional[str] = None

def preprocess_text(text: str) -> str:
    return text.lower()

def calculate_topic_similarity(mentor_topics: List[str], mentee_topics: List[str]) -> float:
    if not mentor_topics or not mentee_topics:
        return 0.0
    mentor_text = ", ".join(mentor_topics)
    mentee_text = ", ".join(mentee_topics)
    mentor_emb = embedder.encode(mentor_text, convert_to_tensor=True)
    mentee_emb = embedder.encode(mentee_text, convert_to_tensor=True)
    sim_score = util.cos_sim(mentor_emb, mentee_emb).item()
    return sim_score

def parse_experience(exp: str) -> int:
    """Convert experience range (e.g., '0-2', '3-5') to a numeric value."""
    if not exp:
        return 0
    try:
        # Take the upper bound of the range (e.g., '0-2' -> 2, '3-5' -> 5)
        return int(exp.split('-')[-1])
    except (ValueError, IndexError):
        return 0  # Fallback to 0 if parsing fails

@app.post("/suggest-mentors/")
async def suggest_mentors(query: MenteeQuery):
    try:
        print("Received query:", query.dict())
        mentors = list(mentors_collection.find({
            "mentorshipFormat": {"$in": ["both", query.mentorshipFormat]}
        }, {
            "fullName": 1, "email": 1, "bio": 1, "profilePicture": 1, "mentorshipFormat": 1,
            "industry": 1, "menteeLevel": 1, "yearsExperience": 1, "currentRole": 1, "education": 1,
            "linkedIn": 1, "completedSessions": 1, "menteesCount": 1, "averageRating": 1, "totalRatings": 1
        }))
        print("Found mentors:", len(mentors))

        mentor_scores = []
        for mentor in mentors:
            print("Processing mentor:", mentor["fullName"], mentor["email"])
            score = 0.0

            # Topic similarity
            mentor_industries = mentor.get("industry") or []
            if isinstance(mentor_industries, str):
                mentor_industries = [mentor_industries]
            topic_sim = calculate_topic_similarity(mentor_industries, query.topics)
            print("Topic similarity:", topic_sim)
            score += topic_sim * 40

            # Experience match
            if query.preferredExperience and mentor.get("yearsExperience"):
                try:
                    mentee_exp = parse_experience(query.preferredExperience)
                    mentor_exp = parse_experience(mentor["yearsExperience"])
                    exp_diff = abs(mentor_exp - mentee_exp)
                    exp_score = max(0, 20 - exp_diff)
                    score += exp_score
                    print("Experience score:", exp_score)
                except Exception as e:
                    print(f"Experience parsing error for mentor {mentor['_id']}: {e}")
                    score += 10  # Neutral score
            else:
                score += 10
                print("Neutral experience score: 10")

            # Mentee level match
            mentee_level = query.menteeLevel
            mentor_mentee_levels = mentor.get("menteeLevel") or []
            if isinstance(mentor_mentee_levels, str):
                mentor_mentee_levels = [mentor_mentee_levels]
            if mentee_level and mentee_level in mentor_mentee_levels:
                score += 15
                print("Mentee level match score: 15")
            else:
                score += 5
                print("Mentee level neutral score: 5")

            # Ratings and completed sessions
            avg_rating = mentor.get("averageRating", 0)
            total_ratings = mentor.get("totalRatings", 0)
            completed_sessions = mentor.get("completedSessions", 0)
            rating_score = (avg_rating / 5) * 15 if total_ratings > 0 else 5
            session_score = min(completed_sessions / 50, 1.0) * 10
            score += rating_score + session_score
            print("Rating score:", rating_score, "Session score:", session_score)

            mentor_scores.append({
                **mentor,
                "_id": str(mentor["_id"]),
                "matchScore": round(score, 2)
            })

        mentor_scores = sorted(mentor_scores, key=lambda x: x["matchScore"], reverse=True)
        print("Sorted mentors:", mentor_scores)
        return {"mentors": mentor_scores[:10]}
    except Exception as e:
        print(f"Error in suggest_mentors: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")