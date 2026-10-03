from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductionRecordIn(BaseModel):
    mine_name: str
    production_date: datetime
    shift: Optional[str] = "Shift 1"
    quantity_extracted_tonnes: float
    approved_capacity_tonnes: float
    seam_or_block: Optional[str] = None
    remarks: Optional[str] = None
    recorded_by: Optional[str] = "Production Officer"


class ProductionRecordOut(BaseModel):
    id: int
    mine_name: str
    production_date: datetime
    shift: Optional[str] = None
    quantity_extracted_tonnes: float
    approved_capacity_tonnes: float
    seam_or_block: Optional[str] = None
    is_overproduction: bool
    remarks: Optional[str] = None
    recorded_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
