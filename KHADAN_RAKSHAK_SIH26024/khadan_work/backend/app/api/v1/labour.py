from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.attendance import AttendanceRecord
from app.models.contractor import Contractor
from app.schemas.labour import (
    AttendanceCheckInRequest,
    AttendanceOut,
    ContractorIn,
    ContractorOut,
    ContractorFlagRequest
)
from app.ws.manager import broadcast_event

router = APIRouter(prefix="/labour", tags=["Phase 1: Labour & Contractor Compliance"])


# ---------------------------------------------------------------
# Worker Attendance
# ---------------------------------------------------------------
@router.get("/attendance", response_model=List[AttendanceOut])
def list_attendance(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    if user_role in {"manager", "supervisor"} and user_mine: mine = user_mine
    query = db.query(AttendanceRecord)
    if mine and mine != "ALL":
        query = query.filter(AttendanceRecord.mine_name.like(f"{mine.split(' ')[0]}%"))
    return query.order_by(AttendanceRecord.check_in_time.desc()).limit(100).all()


@router.post("/attendance/check-in", response_model=AttendanceOut)
async def check_in_worker(payload: AttendanceCheckInRequest, db: Session = Depends(get_db)):
    """Geo-tagged worker/contractor shift check-in (reuses the app's existing GPS pattern)."""
    record = AttendanceRecord(
        mine_name=payload.mine_name,
        worker_name=payload.worker_name,
        designation=payload.designation,
        shift=payload.shift,
        check_in_time=datetime.now(),
        gps_coordinates=payload.gps_coordinates,
        is_contractor_worker=payload.is_contractor_worker
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    await broadcast_event("attendance_checkin", {
        "mine_name": record.mine_name,
        "worker_name": record.worker_name,
        "is_contractor_worker": record.is_contractor_worker
    })

    return record


# ---------------------------------------------------------------
# Contractor Management
# ---------------------------------------------------------------
@router.get("/contractors", response_model=List[ContractorOut])
def list_contractors(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    if user_role in {"manager", "supervisor"} and user_mine: mine = user_mine
    query = db.query(Contractor)
    if mine and mine != "ALL":
        query = query.filter(Contractor.mine_name.like(f"{mine.split(' ')[0]}%"))
    contractors = query.order_by(Contractor.created_at.desc()).all()

    now = datetime.now()
    changed = False
    for c in contractors:
        if c.license_expiry < now and c.status == "ACTIVE":
            c.status = "EXPIRED"
            changed = True
    if changed:
        db.commit()

    return contractors


@router.post("/contractors", response_model=ContractorOut)
async def add_contractor(payload: ContractorIn, db: Session = Depends(get_db)):
    contractor = Contractor(**payload.model_dump())
    db.add(contractor)
    db.commit()
    db.refresh(contractor)

    await broadcast_event("contractor_added", {
        "mine_name": contractor.mine_name,
        "name": contractor.name
    })

    return contractor


@router.post("/contractors/{contractor_id}/status", response_model=ContractorOut)
async def update_contractor_status(
    contractor_id: int,
    payload: ContractorFlagRequest,
    db: Session = Depends(get_db)
):
    """Mine Manager / DGMS flags, blacklists, or reinstates a contractor."""
    contractor = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    contractor.status = payload.status.upper()
    contractor.flag_reason = payload.reason
    db.commit()
    db.refresh(contractor)

    await broadcast_event("contractor_status_changed", {
        "mine_name": contractor.mine_name,
        "name": contractor.name,
        "status": contractor.status,
        "updated_by": payload.updated_by
    })

    return contractor


# ---------------------------------------------------------------
# Combined summary
# ---------------------------------------------------------------
@router.get("/summary")
def labour_summary(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    if user_role in {"manager", "supervisor"} and user_mine: mine = user_mine
    now = datetime.now()
    a_query = db.query(AttendanceRecord)
    c_query = db.query(Contractor)
    if mine and mine != "ALL":
        prefix = mine.split(' ')[0]
        a_query = a_query.filter(AttendanceRecord.mine_name.like(f"{prefix}%"))
        c_query = c_query.filter(Contractor.mine_name.like(f"{prefix}%"))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    present_today = a_query.filter(AttendanceRecord.check_in_time >= today_start).count()
    contractors = c_query.all()
    expiring_soon = sum(
        1 for c in contractors
        if now <= c.license_expiry <= now + timedelta(days=14)
    )
    flagged = sum(1 for c in contractors if c.status in ("FLAGGED", "BLACKLISTED", "EXPIRED"))

    return {
        "mine": mine,
        "workers_present_today": present_today,
        "active_contractors": len(contractors),
        "contractor_licenses_expiring_14d": expiring_soon,
        "flagged_or_expired_contractors": flagged
    }
