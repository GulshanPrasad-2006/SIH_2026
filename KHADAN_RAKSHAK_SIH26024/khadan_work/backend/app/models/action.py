from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(String(50), ForeignKey("violations.id"), nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(100), nullable=False)
    deadline = Column(DateTime, nullable=False)
    instructions = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    fix_remarks = Column(Text, nullable=True)
    after_photo_url = Column(String(500), nullable=True)

    # 5-Point On-Site Review Checklist
    work_stopped_status = Column(String(50), nullable=True, default="STOPPED")
    gas_safe_verified = Column(Boolean, default=True)
    cordon_verified = Column(Boolean, default=True)
    loto_verified = Column(Boolean, default=True)
    supervision_ppe_verified = Column(Boolean, default=True)
    checklist_notes = Column(Text, nullable=True)

    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    supervisor_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    violation = relationship("Violation", back_populates="actions")
