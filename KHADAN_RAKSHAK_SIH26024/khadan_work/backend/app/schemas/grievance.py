from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GrievanceIn(BaseModel):
    mine_name: str
    submitted_by: str
    submitted_by_designation: Optional[str] = None
    category: str
    description: str
    is_anonymous: Optional[bool] = False
    priority: Optional[str] = "NORMAL"


class GrievanceRouteRequest(BaseModel):
    assigned_to: str
    priority: Optional[str] = None
    routed_by: Optional[str] = "Mine Manager"


class GrievanceResolveRequest(BaseModel):
    decision: str  # RESOLVED or REJECTED
    resolution_notes: str
    resolved_by: Optional[str] = "Mine Manager"


class GrievanceOut(BaseModel):
    id: str
    mine_name: str
    submitted_by: str
    submitted_by_designation: Optional[str] = None
    category: str
    description: str
    is_anonymous: str
    status: str
    assigned_to: Optional[str] = None
    priority: str
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
