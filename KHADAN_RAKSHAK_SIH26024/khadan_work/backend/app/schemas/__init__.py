from app.schemas.auth import LoginRequest, UserProfile, TokenResponse, MineBrief
from app.schemas.inspection import (
    ChecklistItemOut,
    ChecklistResultIn,
    ChecklistResultOut,
    InspectionStartRequest,
    InspectionSubmitRequest,
    InspectionOut
)
from app.schemas.action import (
    ActionAssignItem,
    ActionAssignRequest,
    ActionCloseRequest,
    ActionVerifyRequest,
    ViolationOut,
    FixerInfo
)
from app.schemas.analytics import (
    DashboardOverviewOut,
    TrendDataPoint,
    SeverityCount,
    MineDrilldownOut
)
from app.schemas.environmental import EnvironmentalRecordIn, EnvironmentalRecordOut
from app.schemas.production import ProductionRecordIn, ProductionRecordOut
from app.schemas.labour import (
    AttendanceCheckInRequest,
    AttendanceOut,
    ContractorIn,
    ContractorOut,
    ContractorFlagRequest
)

__all__ = [
    "LoginRequest",
    "UserProfile",
    "TokenResponse",
    "MineBrief",
    "ChecklistItemOut",
    "ChecklistResultIn",
    "ChecklistResultOut",
    "InspectionStartRequest",
    "InspectionSubmitRequest",
    "InspectionOut",
    "ActionAssignItem",
    "ActionAssignRequest",
    "ActionCloseRequest",
    "ActionVerifyRequest",
    "ViolationOut",
    "FixerInfo",
    "DashboardOverviewOut",
    "TrendDataPoint",
    "SeverityCount",
    "MineDrilldownOut",
    "EnvironmentalRecordIn",
    "EnvironmentalRecordOut",
    "ProductionRecordIn",
    "ProductionRecordOut",
    "AttendanceCheckInRequest",
    "AttendanceOut",
    "ContractorIn",
    "ContractorOut",
    "ContractorFlagRequest"
]
