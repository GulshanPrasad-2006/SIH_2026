from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Contractor(Base):
    """
    Third-party contractor master record — licensing, safety-training status,
    and active work orders per mine (SIH-26024 Phase 1: Contractor Management).
    """
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    mine_name = Column(String(150), nullable=False, index=True)
    license_number = Column(String(100), nullable=False)
    license_expiry = Column(DateTime, nullable=False)
    work_scope = Column(String(200), nullable=True)
    safety_training_status = Column(String(30), default="COMPLETED")  # COMPLETED, PENDING, EXPIRED
    active_workers_count = Column(Integer, default=0)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, FLAGGED, BLACKLISTED, EXPIRED
    flag_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
