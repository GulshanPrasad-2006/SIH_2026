from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.violation import ViolationSeverity, ViolationStatus

class ActionAssignItem(BaseModel):
    violation_id: str
    assigned_to: str
    deadline: datetime
    instructions: Optional[str] = "Inspect, rectify defect and upload photographic proof."

class ActionAssignRequest(BaseModel):
    inspection_id: str
    actions: List[ActionAssignItem]

class ActionCloseRequest(BaseModel):
    after_photo_url: str
    fix_remarks: str
    work_stopped_status: Optional[str] = "STOPPED" # "STOPPED" or "CONTINUED"
    gas_safe_verified: Optional[bool] = True
    cordon_verified: Optional[bool] = True
    loto_verified: Optional[bool] = True
    supervision_ppe_verified: Optional[bool] = True
    checklist_notes: Optional[str] = None

class ActionVerifyRequest(BaseModel):
    decision: str # "APPROVE" or "REJECT"
    supervisor_remarks: Optional[str] = None

class DGMSAlertRequest(BaseModel):
    officer_name: Optional[str] = "Dr. A. Roy (DGMS Central Directorate)"
    alert_level: Optional[str] = "URGENT_NOTICE" # "URGENT_NOTICE", "SHOW_CAUSE", "WORK_SUSPENSION_WARNING"
    statutory_directive: str

class FixerAlertRequest(BaseModel):
    sender_role: str # "manager", "dgms", "corporate" (supervisors not permitted)
    sender_name: str # e.g. "V. K. Mehta (Mine Manager)" or "Dr. A. Roy (DGMS)"
    alert_level: Optional[str] = "URGENT_NOTICE"
    statutory_directive: str

class WorkStoppageWarningRequest(BaseModel):
    officer_name: Optional[str] = "Dr. A. Roy (DGMS Central Directorate)"
    mine_name: str
    directive_text: str
    violation_id: Optional[str] = None

class WorkStoppageAckRequest(BaseModel):
    manager_name: str
    compliance_notes: Optional[str] = "Work stoppage enforced across affected district per DGMS directive."

class RedAlertRequest(BaseModel):
    officer_name: Optional[str] = "Dr. A. Roy (DGMS Central Directorate)"
    reason: str
    manager_name: Optional[str] = None
    sender_role: Optional[str] = "corporate"

class RedAlertResponse(BaseModel):
    violation_id: str
    mine_name: str
    status: str
    red_alert_issued: bool
    red_alerts_in_28_days: int
    is_suspended: bool
    manager_suspended_days: int
    mine_stopped_days: int
    message: str

class ViolationOut(BaseModel):
    id: str
    inspection_id: Optional[str] = None
    mine_name: str
    category: str
    regulation: str
    title: str
    description: str
    severity: ViolationSeverity
    status: ViolationStatus
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None
    gps_coordinates: Optional[str] = None
    before_photo: Optional[str] = None
    after_photo: Optional[str] = None
    fix_notes: Optional[str] = None
    supervisor_notes: Optional[str] = None
    
    # DGMS Alert Tracking
    dgms_alert_sent: Optional[bool] = False
    dgms_alert_timestamp: Optional[datetime] = None
    dgms_alert_by: Optional[str] = None
    dgms_alert_notes: Optional[str] = None
    dgms_alert_level: Optional[str] = None

    # Multi-Role Alert Tracking
    alert_sent: Optional[bool] = False
    alert_by_role: Optional[str] = None
    alert_by_name: Optional[str] = None
    alert_timestamp: Optional[datetime] = None
    alert_level: Optional[str] = None
    alert_notes: Optional[str] = None

    # 5-Point On-Site Review Checklist
    work_stopped_status: Optional[str] = "STOPPED"
    work_continued_flag: Optional[bool] = False
    gas_safe_verified: Optional[bool] = True
    cordon_verified: Optional[bool] = True
    loto_verified: Optional[bool] = True
    supervision_ppe_verified: Optional[bool] = True
    checklist_notes: Optional[str] = None

    # DGMS Work Stoppage Directive to Mine Manager
    stoppage_warning_issued: Optional[bool] = False
    stoppage_warning_timestamp: Optional[datetime] = None
    stoppage_warning_by: Optional[str] = None
    stoppage_directive_text: Optional[str] = None
    stoppage_warning_ack: Optional[bool] = False
    stoppage_warning_ack_time: Optional[datetime] = None

    # Red Alert & Statutory Suspension Tracking
    red_alert_issued: Optional[bool] = False
    red_alert_timestamp: Optional[datetime] = None
    red_alert_by: Optional[str] = None
    red_alert_reason: Optional[str] = None
    reopened_from_closed: Optional[bool] = False

    # 24-Hour Impending Deadline Automatic Alert
    auto_deadline_alert_sent: Optional[bool] = False
    auto_deadline_alert_time: Optional[datetime] = None

    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FixerInfo(BaseModel):
    id: int
    name: str
    designation: str
    role: str

