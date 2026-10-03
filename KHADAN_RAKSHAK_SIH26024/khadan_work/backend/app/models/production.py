from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class ProductionRecord(Base):
    """
    Daily/shift-wise production returns per mine vs. DGMS-approved capacity
    (SIH-26024 Phase 1: Production Compliance).
    """
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_name = Column(String(150), nullable=False, index=True)
    production_date = Column(DateTime, nullable=False)
    shift = Column(String(20), nullable=True, default="Shift 1")
    quantity_extracted_tonnes = Column(Float, nullable=False)
    approved_capacity_tonnes = Column(Float, nullable=False)
    seam_or_block = Column(String(150), nullable=True)
    is_overproduction = Column(Boolean, default=False)
    remarks = Column(Text, nullable=True)
    recorded_by = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
