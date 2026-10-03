from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Reminder(Base):
    """
    Proactive deadline-approaching notifications for pending corrective
    actions, licence renewals, and consent-to-operate expiries — the
    "automated alerts & reminders" requirement from the PS, distinct from
    the existing after-the-fact Red Alert / Stoppage Warning mechanisms
    (SIH-26024 Phase 3: Reminders & Escalation Engine).
    """
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(50), nullable=False, index=True)  # VIOLATION_DEADLINE, CONTRACTOR_LICENSE, CTO_RENEWAL, GRIEVANCE_SLA
    target_id = Column(String(50), nullable=False)  # e.g. violation id, contractor id, environmental record id
    mine_name = Column(String(150), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    detail = Column(Text, nullable=True)
    due_at = Column(DateTime, nullable=False)
    severity = Column(String(20), default="NORMAL")  # NORMAL, WARNING, CRITICAL, OVERDUE
    channel = Column(String(30), default="IN_APP")  # IN_APP, SMS, EMAIL (simulated)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(150), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
