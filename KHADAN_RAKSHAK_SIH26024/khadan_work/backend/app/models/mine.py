from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    subsidiary = Column(String(100), nullable=False) # BCCL, ECL, SECL, NCL, CCL
    zone = Column(String(100), nullable=False)
    mine_type = Column(String(50), nullable=False)   # Underground, Opencast, Coal Washery
    depth = Column(String(50), nullable=True)        # e.g. 310m
    gassy_category = Column(String(50), nullable=False) # Degree I, Degree II, Degree III
    latitude = Column(Float, nullable=True)           # GIS mapping (Phase 3)
    longitude = Column(Float, nullable=True)
    risk_score = Column(Float, default=50.0)         # AI Composite Risk Index (0 - 100)
    compliance_rate = Column(Float, default=90.0)    # Compliance percentage
    open_violations_count = Column(Integer, default=0)
    critical_violations_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
