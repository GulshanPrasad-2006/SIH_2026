from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class RedAlert(Base):
    __tablename__ = 'red_alerts'

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(String(50), ForeignKey('violations.id'), nullable=False, index=True)
    mine_name = Column(String(150), nullable=False, index=True)
    manager_name = Column(String(150), nullable=True)
    issued_by = Column(String(150), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
