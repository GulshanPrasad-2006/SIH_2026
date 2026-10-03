from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AttendanceCheckInRequest(BaseModel):
    mine_name: str
    worker_name: str
    designation: Optional[str] = "Face Worker"
    shift: Optional[str] = "Shift 1"
    gps_coordinates: Optional[str] = None
    is_contractor_worker: Optional[bool] = False


class AttendanceOut(BaseModel):
    id: int
    mine_name: str
    worker_name: str
    designation: Optional[str] = None
    shift: Optional[str] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    gps_coordinates: Optional[str] = None
    is_contractor_worker: bool
    working_hours_flag: str

    class Config:
        from_attributes = True


class ContractorIn(BaseModel):
    name: str
    mine_name: str
    license_number: str
    license_expiry: datetime
    work_scope: Optional[str] = None
    safety_training_status: Optional[str] = "COMPLETED"
    active_workers_count: Optional[int] = 0


class ContractorOut(BaseModel):
    id: int
    name: str
    mine_name: str
    license_number: str
    license_expiry: datetime
    work_scope: Optional[str] = None
    safety_training_status: str
    active_workers_count: int
    status: str
    flag_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContractorFlagRequest(BaseModel):
    status: str  # ACTIVE, FLAGGED, BLACKLISTED
    reason: Optional[str] = None
    updated_by: Optional[str] = "Mine Manager"
