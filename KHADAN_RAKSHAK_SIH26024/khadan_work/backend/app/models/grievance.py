import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base


class GrievanceStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ROUTED = "ROUTED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class Grievance(Base):
    """
    Worker-submitted grievance intake, routed to a designated officer and
    tracked to resolution using the same escalation-ladder pattern as
    statutory violations (SIH-26024 Phase 3: Grievance Handling).
    """
    __tablename__ = "grievances"

    id = Column(String(50), primary_key=True, index=True)  # e.g. GRV-2026-0042
    mine_name = Column(String(150), nullable=False, index=True)
    submitted_by = Column(String(150), nullable=False)
    submitted_by_designation = Column(String(150), nullable=True)
    category = Column(String(100), nullable=False)  # Wages, Safety, Harassment, Working Hours, Welfare Facilities, Other
    description = Column(Text, nullable=False)
    is_anonymous = Column(String(10), default="NO")  # YES / NO
    status = Column(Enum(GrievanceStatus), nullable=False, default=GrievanceStatus.SUBMITTED)
    assigned_to = Column(String(150), nullable=True)
    priority = Column(String(20), default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(150), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
