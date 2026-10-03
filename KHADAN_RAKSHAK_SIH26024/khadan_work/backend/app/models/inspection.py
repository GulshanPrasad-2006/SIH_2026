from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    item_number = Column(Integer, unique=True, nullable=False)
    regulation_code = Column(String(50), nullable=False) # e.g. CMR 2017 Reg 130
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    default_assignee = Column(String(100), nullable=True)

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True, index=True) # e.g. INSP-BCCL-2026-0902-8419
    mine_name = Column(String(150), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    inspector_name = Column(String(100), nullable=False)
    shift = Column(String(20), default="Shift 1")
    location_details = Column(String(255), nullable=True)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    compliance_score = Column(Float, default=100.0)
    statutory_attestation = Column(Boolean, default=True)
    status = Column(String(50), default="COMPLETED") # IN_PROGRESS, COMPLETED, ACTIONS_DISPATCHED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    results = relationship("ChecklistResult", back_populates="inspection", cascade="all, delete-orphan")

class ChecklistResult(Base):
    __tablename__ = "checklist_results"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    status = Column(String(20), nullable=False) # pass / fail
    severity = Column(String(20), nullable=True) # Critical, Major, Minor
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    gps_coordinates = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("Inspection", back_populates="results")
    item = relationship("ChecklistItem")
