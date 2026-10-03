from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChecklistItemOut(BaseModel):
    id: int
    item_number: int
    regulation_code: str
    title: str
    description: str
    category: str
    default_assignee: Optional[str] = None

    class Config:
        from_attributes = True

class ChecklistResultIn(BaseModel):
    item_id: int
    status: str # "pass" or "fail"
    severity: Optional[str] = None # "Critical", "Major", "Minor"
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    gps_coordinates: Optional[str] = None

class InspectionStartRequest(BaseModel):
    mine_name: str
    shift: Optional[str] = "Shift 1"
    location_details: Optional[str] = "Underground Seam V"

class InspectionSubmitRequest(BaseModel):
    inspection_id: str
    mine_name: str
    inspector_name: str
    shift: Optional[str] = "Shift 1"
    location_details: Optional[str] = None
    statutory_attestation: bool = True
    results: List[ChecklistResultIn]

class ChecklistResultOut(BaseModel):
    item_id: int
    status: str
    severity: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    gps_coordinates: Optional[str] = None

    class Config:
        from_attributes = True

class InspectionOut(BaseModel):
    id: str
    mine_name: str
    inspector_name: str
    shift: str
    location_details: Optional[str] = None
    passed_count: int
    failed_count: int
    compliance_score: float
    status: str
    created_at: datetime
    results: List[ChecklistResultOut] = []

    class Config:
        from_attributes = True
