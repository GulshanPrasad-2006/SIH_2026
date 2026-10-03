from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.production import ProductionRecord
from app.schemas.production import ProductionRecordIn, ProductionRecordOut
from app.ws.manager import broadcast_event

router = APIRouter(prefix="/production", tags=["Phase 1: Production Compliance"])


@router.get("/records", response_model=List[ProductionRecordOut])
def list_production_records(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """Statutory daily/shift-wise production return log per mine."""
    if user_role in {"manager", "supervisor"} and user_mine: mine = user_mine
    query = db.query(ProductionRecord)
    if mine and mine != "ALL":
        query = query.filter(ProductionRecord.mine_name.like(f"{mine.split(' ')[0]}%"))
    return query.order_by(ProductionRecord.production_date.desc()).limit(60).all()


@router.post("/records", response_model=ProductionRecordOut)
async def log_production_record(payload: ProductionRecordIn, db: Session = Depends(get_db)):
    """Logs a production return and flags overproduction against approved statutory capacity."""
    is_over = payload.quantity_extracted_tonnes > payload.approved_capacity_tonnes

    record = ProductionRecord(
        mine_name=payload.mine_name,
        production_date=payload.production_date,
        shift=payload.shift,
        quantity_extracted_tonnes=payload.quantity_extracted_tonnes,
        approved_capacity_tonnes=payload.approved_capacity_tonnes,
        seam_or_block=payload.seam_or_block,
        is_overproduction=is_over,
        remarks=payload.remarks,
        recorded_by=payload.recorded_by
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    await broadcast_event("production_record_added", {
        "mine_name": record.mine_name,
        "quantity_extracted_tonnes": record.quantity_extracted_tonnes,
        "is_overproduction": record.is_overproduction
    })

    return record


@router.get("/summary")
def production_summary(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    """Live rollup for the Production Compliance dashboard tile — last 30 days."""
    cutoff = datetime.now() - timedelta(days=30)
    query = db.query(ProductionRecord).filter(ProductionRecord.production_date >= cutoff)
    if mine and mine != "ALL":
        query = query.filter(ProductionRecord.mine_name.like(f"{mine.split(' ')[0]}%"))
    records = query.all()

    total_extracted = sum(r.quantity_extracted_tonnes for r in records)
    total_approved = sum(r.approved_capacity_tonnes for r in records)
    overproduction_days = sum(1 for r in records if r.is_overproduction)

    return {
        "mine": mine,
        "window_days": 30,
        "total_extracted_tonnes": round(total_extracted, 1),
        "total_approved_capacity_tonnes": round(total_approved, 1),
        "utilization_pct": round((total_extracted / total_approved) * 100, 1) if total_approved else 0.0,
        "overproduction_incidents": overproduction_days
    }
