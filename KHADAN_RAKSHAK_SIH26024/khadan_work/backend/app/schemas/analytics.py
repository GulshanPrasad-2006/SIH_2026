from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SeverityCount(BaseModel):
    critical: int
    major: int
    minor: int

class TrendDataPoint(BaseModel):
    month: str
    reported: int
    closed: int

class DashboardOverviewOut(BaseModel):
    mine_filter: str
    open_violations: int
    critical_violations: int
    overdue_actions: int
    compliance_pct: float
    severity_distribution: SeverityCount
    trend_history: List[TrendDataPoint]

class MineDrilldownOut(BaseModel):
    id: int
    name: str
    subsidiary: str
    zone: str
    mine_type: str
    depth: Optional[str]
    gassy_category: str
    risk_score: float
    risk_level: str
    compliance_rate: float
    open_violations: int
    critical_violations: int
    last_audit: str
    anomaly_score: Optional[float] = 0.05
    top_risk_factors: Optional[List[str]] = []

    class Config:
        from_attributes = True
