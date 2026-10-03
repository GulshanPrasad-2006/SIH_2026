from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EnvironmentalRecordIn(BaseModel):
    mine_name: str
    category: str
    parameter: str
    reading_value: float
    unit: Optional[str] = None
    statutory_limit: Optional[float] = None
    consent_valid_until: Optional[datetime] = None
    recorded_by: Optional[str] = "Environmental Compliance Officer"
    remarks: Optional[str] = None


class EnvironmentalRecordOut(BaseModel):
    id: int
    mine_name: str
    category: str
    parameter: str
    reading_value: float
    unit: Optional[str] = None
    statutory_limit: Optional[float] = None
    status: str
    consent_valid_until: Optional[datetime] = None
    recorded_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
