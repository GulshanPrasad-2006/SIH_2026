from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.environmental import EnvironmentalRecord
from app.schemas.environmental import EnvironmentalRecordIn, EnvironmentalRecordOut
from app.ws.manager import broadcast_event

router = APIRouter(prefix="/environmental", tags=["Phase 1: Environmental Compliance"])


def _derive_status(payload: EnvironmentalRecordIn) -> str:
    if payload.consent_valid_until and payload.consent_valid_until < datetime.now():
        return "PENDING_RENEWAL"
    if payload.statutory_limit is not None and payload.reading_value > payload.statutory_limit:
        return "EXCEEDS_LIMIT"
    return "WITHIN_LIMIT"


@router.get("/records", response_model=List[EnvironmentalRecordOut])
def list_environmental_records(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """Digital register of environmental parameters (air/water/land/plantation) per mine."""
    if user_role in {"manager", "supervisor"} and user_mine: mine = user_mine
    query = db.query(EnvironmentalRecord)
    if mine and mine != "ALL":
        query = query.filter(EnvironmentalRecord.mine_name.like(f"{mine.split(' ')[0]}%"))
    return query.order_by(EnvironmentalRecord.created_at.desc()).all()


@router.post("/records", response_model=EnvironmentalRecordOut)
async def create_environmental_record(payload: EnvironmentalRecordIn, db: Session = Depends(get_db)):
    """Logs a new environmental reading and auto-flags statutory-limit or consent breaches."""
    record = EnvironmentalRecord(
        mine_name=payload.mine_name,
        category=payload.category,
        parameter=payload.parameter,
        reading_value=payload.reading_value,
        unit=payload.unit,
        statutory_limit=payload.statutory_limit,
        status=_derive_status(payload),
        consent_valid_until=payload.consent_valid_until,
        recorded_by=payload.recorded_by,
        remarks=payload.remarks
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    await broadcast_event("environmental_record_added", {
        "mine_name": record.mine_name,
        "parameter": record.parameter,
        "status": record.status,
        "recorded_by": record.recorded_by
    })

    return record


@router.get("/summary")
def environmental_summary(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """Live rollup for the Environmental Compliance dashboard tile."""
    query = db.query(EnvironmentalRecord)
    if mine and mine != "ALL":
        query = query.filter(EnvironmentalRecord.mine_name.like(f"{mine.split(' ')[0]}%"))
    records = query.all()

    total = len(records)
    exceeding = sum(1 for r in records if r.status == "EXCEEDS_LIMIT")
    pending_renewal = sum(1 for r in records if r.status == "PENDING_RENEWAL")

    return {
        "mine": mine,
        "total_parameters_tracked": total,
        "exceeding_statutory_limit": exceeding,
        "pending_consent_renewal": pending_renewal,
        "compliant": max(total - exceeding - pending_renewal, 0)
    }
