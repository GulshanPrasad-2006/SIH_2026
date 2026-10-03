from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class AttendanceRecord(Base):
    """
    Geo-tagged worker attendance / shift check-in log
    (SIH-26024 Phase 1: Labour Compliance).
    """
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_name = Column(String(150), nullable=False, index=True)
    worker_name = Column(String(150), nullable=False)
    designation = Column(String(150), nullable=True)
    shift = Column(String(20), nullable=True, default="Shift 1")
    check_in_time = Column(DateTime(timezone=True), nullable=False)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    gps_coordinates = Column(String(100), nullable=True)
    is_contractor_worker = Column(Boolean, default=False)
    working_hours_flag = Column(String(30), default="NORMAL")  # NORMAL, OVERTIME, STATUTORY_BREACH
    created_at = Column(DateTime(timezone=True), server_default=func.now())
