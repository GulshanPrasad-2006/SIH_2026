"""
Phase 3: GIS Map View — plots mines and open violations geographically,
color-coded by severity/risk, built from the mines table (now carrying
lat/lng) plus the existing violations ledger's free-text GPS field.
"""
import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.mine import Mine
from app.models.violation import Violation, ViolationStatus, ViolationSeverity

router = APIRouter(prefix="/gis", tags=["Phase 3: GIS Map View"])


def _parse_gps(raw: Optional[str]):
    """Parses strings like '23.7508° N, 86.4132° E' -> (lat, lng). Returns (None, None) on failure."""
    if not raw:
        return None, None
    nums = re.findall(r"[-+]?\d*\.\d+|\d+", raw)
    if len(nums) < 2:
        return None, None
    try:
        lat, lng = float(nums[0]), float(nums[1])
        if "S" in raw.upper():
            lat = -abs(lat)
        if "W" in raw.upper():
            lng = -abs(lng)
        return lat, lng
    except ValueError:
        return None, None


@router.get("/mines")
def gis_mines(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """All mines with coordinates, risk score, and open-violation counts for map pins."""
    # Server-side scope: mine-scoped roles cannot request ALL or another mine.
    if user_role in {"manager", "supervisor"}:
        mine = user_mine or "__NO_MINE_ASSIGNED__"
    mines_q = db.query(Mine)
    if mine and mine != "ALL":
        mines_q = mines_q.filter(Mine.name == mine)
    mines = mines_q.all()
    out = []
    for m in mines:
        if m.latitude is None or m.longitude is None:
            continue
        if m.risk_score >= 70:
            tier = "CRITICAL"
        elif m.risk_score >= 45:
            tier = "ELEVATED"
        else:
            tier = "STABLE"
        out.append({
            "mine_name": m.name, "subsidiary": m.subsidiary, "zone": m.zone,
            "mine_type": m.mine_type, "latitude": m.latitude, "longitude": m.longitude,
            "risk_score": m.risk_score, "risk_tier": tier,
            "compliance_rate": m.compliance_rate,
            "open_violations_count": m.open_violations_count,
            "critical_violations_count": m.critical_violations_count,
        })
    return out


@router.get("/violations")
def gis_violations(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """All GPS-tagged violations for the permitted mine scope.

    DGMS can request ALL for a consolidated map. Mine-scoped roles are
    forcibly restricted to their assigned mine. Closed violations are also
    returned so the paper map can show the complete violation history; the
    frontend renders closed items distinctly from active hazards.
    """
    # Server-side scope: mine-scoped roles cannot request ALL or another mine.
    if user_role in {"manager", "supervisor"}:
        mine = user_mine or "__NO_MINE_ASSIGNED__"
    query = db.query(Violation)
    if mine and mine != "ALL":
        query = query.filter(Violation.mine_name == mine)

    out = []
    for v in query.all():
        lat, lng = _parse_gps(v.gps_coordinates)
        if lat is None:
            continue
        # Keep the field-zone label from the GPS annotation when present.
        # This is a descriptive demo label, not a surveyed statutory boundary.
        zone_match = re.search(r"\(([^)]+)\)", v.gps_coordinates or "")
        zone_label = zone_match.group(1).strip() if zone_match else None
        out.append({
            "violation_id": v.id, "mine_name": v.mine_name, "title": v.title,
            "category": v.category, "regulation": v.regulation,
            "severity": v.severity.value if hasattr(v.severity, "value") else v.severity,
            "status": v.status.value if hasattr(v.status, "value") else v.status,
            "latitude": lat, "longitude": lng, "zone": zone_label,
            "assigned_to": v.assigned_to,
            "deadline": v.deadline.isoformat() if v.deadline else None,
        })
    return out
