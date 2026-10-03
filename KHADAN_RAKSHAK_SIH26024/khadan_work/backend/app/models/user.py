import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class UserRole(str, enum.Enum):
    WORKER = "worker"          # Field Safety Inspector (Mining Sirdar, CMR 113)
    MANAGER = "manager"        # Colliery Agent / Mine Manager
    FIXER = "fixer"            # Action Fixer / Remedial Engineer
    SUPERVISOR = "supervisor"  # Colliery Overman / Shift Supervisor
    CORPORATE = "corporate"    # DGMS / CIL Central Directorate

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.WORKER)
    mine_name = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
