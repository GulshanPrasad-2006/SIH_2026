import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ViolationSeverity(str, enum.Enum):
    CRITICAL = "Critical"  # 24h immediate danger
    MAJOR = "Major"        # 72h statutory notice
    MINOR = "Minor"        # 7 days maintenance notice

class ViolationStatus(str, enum.Enum):
    OPEN = "OPEN"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    CLOSED = "CLOSED"

class Violation(Base):
    __tablename__ = "violations"

    id = Column(String(50), primary_key=True, index=True) # e.g. VIOL-2026-0901
    inspection_id = Column(String(50), nullable=True)
    mine_name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    regulation = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(ViolationSeverity), nullable=False, default=ViolationSeverity.MAJOR)
    status = Column(Enum(ViolationStatus), nullable=False, default=ViolationStatus.OPEN)
    
    assigned_to = Column(String(150), nullable=True)
    deadline = Column(DateTime, nullable=True)
    gps_coordinates = Column(String(100), nullable=True)
    
    before_photo = Column(String(500), nullable=True)
    after_photo = Column(String(500), nullable=True)
    fix_notes = Column(Text, nullable=True)
    supervisor_notes = Column(Text, nullable=True)
    
    # Multi-Role Statutory Alert & Fixer Escalation Tracking (Supervisor / Manager / DGMS)
    dgms_alert_sent = Column(Boolean, default=False)
    dgms_alert_timestamp = Column(DateTime(timezone=True), nullable=True)
    dgms_alert_by = Column(String(150), nullable=True) # e.g. "Dr. A. Roy (DGMS Directorate)"
    dgms_alert_notes = Column(Text, nullable=True)     # e.g. "CMR Reg 104 Directive: Immediate tell-tale inspection"
    dgms_alert_level = Column(String(50), nullable=True) # "URGENT_NOTICE", "SHOW_CAUSE", "WORK_SUSPENSION_WARNING"

    alert_sent = Column(Boolean, default=False)
    alert_by_role = Column(String(50), nullable=True) # "manager", "dgms", "corporate"
    alert_by_name = Column(String(150), nullable=True)
    alert_timestamp = Column(DateTime(timezone=True), nullable=True)
    alert_level = Column(String(50), nullable=True)
    alert_notes = Column(Text, nullable=True)

    # 5-Point On-Site Review Checklist from Fixer
    work_stopped_status = Column(String(50), nullable=True, default="STOPPED") # "STOPPED" or "CONTINUED"
    work_continued_flag = Column(Boolean, default=False) # True if work was illegally continuing during fix
    gas_safe_verified = Column(Boolean, default=True)
    cordon_verified = Column(Boolean, default=True)
    loto_verified = Column(Boolean, default=True)
    supervision_ppe_verified = Column(Boolean, default=True)
    checklist_notes = Column(Text, nullable=True)

    # DGMS Work-Stoppage Directive to Mine Manager (Mines Act Sec 22)
    stoppage_warning_issued = Column(Boolean, default=False)
    stoppage_warning_timestamp = Column(DateTime(timezone=True), nullable=True)
    stoppage_warning_by = Column(String(150), nullable=True)
    stoppage_directive_text = Column(Text, nullable=True)
    stoppage_warning_ack = Column(Boolean, default=False)
    stoppage_warning_ack_time = Column(DateTime(timezone=True), nullable=True)

    # DGMS Statutory Red Alert & Re-Opening Tracking (More than 3 in 28 days = 28d suspension + 14d stoppage)
    red_alert_issued = Column(Boolean, default=False)
    red_alert_timestamp = Column(DateTime(timezone=True), nullable=True)
    red_alert_by = Column(String(150), nullable=True)
    red_alert_reason = Column(Text, nullable=True)
    reopened_from_closed = Column(Boolean, default=False)

    # 24-Hour Impending Deadline Automatic Alert to Fixer
    auto_deadline_alert_sent = Column(Boolean, default=False)
    auto_deadline_alert_time = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)

    actions = relationship("CorrectiveAction", back_populates="violation", cascade="all, delete-orphan")
