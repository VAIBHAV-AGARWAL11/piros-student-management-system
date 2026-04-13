"""
schema.py - PIROS Recruitment Platform
=======================================
Python-side data schema definitions that mirror the Mongoose models.
Used by the AI/resume analysis microservice and analytics scripts.

All models are represented as Python dataclasses for type-safety and easy
serialization to/from MongoDB documents via PyMongo or MongoEngine.
"""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────────
#  Enums (match Mongoose enum constraints)
# ─────────────────────────────────────────────

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"
    ALUMNI = "alumni"
    COMPANY = "company"


class ApplicationStatus(str, Enum):
    APPLIED = "Applied"
    UNDER_REVIEW = "Under Review"
    INTERVIEW_SCHEDULED = "Interview Scheduled"
    SELECTED = "Selected"
    REJECTED = "Rejected"


class JobStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"


# ─────────────────────────────────────────────
#  User Schema
# ─────────────────────────────────────────────

@dataclass
class UserSchema:
    """
    Mirrors the Mongoose User model at backend/models/User.js

    Fields:
        name        : Full display name of the user.
        email       : Unique email address (used as login identifier).
        password    : BCrypt-hashed password string (never stored in plain text).
        role        : Determines platform access level (student/admin/alumni/company).
        is_verified : OTP email verification flag. True in prototype, OTP in production.
        otp_code    : Temporary OTP code for email verification flow.
        skills      : Array of self-reported skills displayed on student profile.
        cgpa        : CGPA score (0.0–10.0) for eligibility filtering.
        resume_url  : Cloud URL for the uploaded resume file.
        ats_score   : Latest ATS score computed by the resume analyzer.
        test_score_total : Aggregate test score for leaderboard ranking.
        created_at  : Document creation timestamp.
        updated_at  : Document last modified timestamp.
    """
    name: str
    email: str
    password: str
    role: UserRole = UserRole.STUDENT
    is_verified: bool = True
    otp_code: Optional[str] = None
    skills: List[str] = field(default_factory=list)
    cgpa: Optional[float] = None
    resume_url: Optional[str] = None
    ats_score: float = 0.0
    test_score_total: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  Job Schema
# ─────────────────────────────────────────────

@dataclass
class JobLocation:
    """Embedded geo-location sub-document for a Job posting."""
    city: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@dataclass
class JobRating:
    """Embedded rating/review sub-document for a Job posting."""
    user_id: str = ""          # ObjectId reference to User
    score: int = 5             # 1–5 star rating
    review: Optional[str] = None


@dataclass
class JobSchema:
    """
    Mirrors the Mongoose Job model at backend/models/Job.js

    Fields:
        title           : Job title / position name.
        company         : Hiring company name.
        description     : Full job description used for ATS keyword matching.
        salary          : Expected CTC / salary package (annual, INR).
        required_skills : List of required technical/soft skills for ATS.
        location        : Embedded geo-location object.
        status          : 'Open' or 'Closed' — controls visibility to students.
        ratings         : Array of user rating sub-documents.
        created_at      : Document creation timestamp.
        updated_at      : Document last modified timestamp.
    """
    title: str
    company: str
    description: str
    salary: Optional[float] = None
    required_skills: List[str] = field(default_factory=list)
    location: Optional[JobLocation] = None
    status: JobStatus = JobStatus.OPEN
    ratings: List[JobRating] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  Application Schema
# ─────────────────────────────────────────────

@dataclass
class ApplicationSchema:
    """
    Mirrors the Mongoose Application model at backend/models/Application.js

    Fields:
        job_id                   : ObjectId reference to the applied Job.
        student_id               : ObjectId reference to the applying User.
        status                   : ATS tracking stage of the application.
        interview_date           : Scheduled interview date/time (if applicable).
        interview_link           : Video/online interview URL.
        match_percentage_at_apply: ATS score at the time of submission.
        created_at               : Document creation timestamp.
        updated_at               : Document last modified timestamp.
    """
    job_id: str
    student_id: str
    status: ApplicationStatus = ApplicationStatus.APPLIED
    interview_date: Optional[datetime] = None
    interview_link: Optional[str] = None
    match_percentage_at_apply: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  ATS Analysis Result (not stored in DB — used transiently)
# ─────────────────────────────────────────────

@dataclass
class ATSAnalysisResult:
    """
    Result returned by the ATS resume analysis engine (resumeController.js / AI layer).

    Fields:
        score              : ATS match score (0–100).
        matched_keywords   : Keywords from JD found in the resume.
        missing_keywords   : Keywords from JD absent in the resume.
        suggestions        : List of actionable improvement suggestions.
        resume_text_sample : First 200 chars of extracted resume text for preview.
    """
    score: int
    matched_keywords: List[str]
    missing_keywords: List[str]
    suggestions: List[str]
    resume_text_sample: str = ""


# ─────────────────────────────────────────────
#  JWT Payload Schema
# ─────────────────────────────────────────────

@dataclass
class JWTPayload:
    """
    Shape of the decoded JWT payload used for authentication across the platform.
    Generated by User.getSignedJwtToken() and decoded by the protect middleware.

    Fields:
        id   : MongoDB ObjectId of the authenticated user.
        role : Role string for RBAC authorization checks.
        iat  : Issued-at timestamp (Unix epoch).
        exp  : Expiry timestamp (Unix epoch). Default: 30 days.
    """
    id: str
    role: UserRole
    iat: int
    exp: int
