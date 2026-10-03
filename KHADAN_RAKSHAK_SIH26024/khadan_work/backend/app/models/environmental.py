from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class EnvironmentalRecord(Base):
    """
    Statutory environmental compliance readings per mine — Consent to Operate (CTO)
    validity, emission/effluent parameters vs. statutory limits, and land/forest
    clearance & plantation tracking (SIH-26024 Phase 1: Environmental Compliance).
    """
    __tablename__ = "environmental_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False)   # Air Quality, Water Discharge, Land & Forest, Plantation
    parameter = Column(String(150), nullable=False)   # e.g. "Suspended Particulate Matter (SPM)"
    reading_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    statutory_limit = Column(Float, nullable=True)
    status = Column(String(30), nullable=False, default="WITHIN_LIMIT")  # WITHIN_LIMIT, EXCEEDS_LIMIT, PENDING_RENEWAL
    consent_valid_until = Column(DateTime, nullable=True)
    recorded_by = Column(String(150), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
