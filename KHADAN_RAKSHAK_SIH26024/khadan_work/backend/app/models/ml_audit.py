from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class MLRiskAudit(Base):
    __tablename__ = "ml_risk_audits"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, nullable=False, index=True)
    mine_name = Column(String(150), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    feature_vector_json = Column(Text, nullable=True) # Serialized feature dictionary
    model_version = Column(String(50), default="heuristic_v1_tabular")
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
