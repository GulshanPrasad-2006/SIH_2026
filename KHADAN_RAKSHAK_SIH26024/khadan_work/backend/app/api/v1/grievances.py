from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import random

from app.database import get_db
from app.models.grievance import Grievance, GrievanceStatus
from app.schemas.grievance import GrievanceIn, GrievanceOut, GrievanceRouteRequest, GrievanceResolveRequest
from app.ws.manager import broadcast_event
from app.utils.audit import write_audit

router = APIRouter(prefix="/grievances", tags=["Phase 3: Grievance Handling"])


def _next_grievance_id(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Grievance).count() + 1
    return f"GRV-{year}-{count:04d}-{random.randint(100,999)}"


@router.get("/", response_model=List[GrievanceOut])
def list_grievances(
    mine: Optional[str] = "ALL",
    status: Optional[str] = "ALL",
    user_role: Optional[str] = None,
    user_mine: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Screen 16: Grievance register. Mine-scoped roles (manager/supervisor)
    only see their own colliery's grievances; DGMS/corporate see all.
    """
    if user_role in ["manager", "supervisor"] and user_mine:
        mine = user_mine

    query = db.query(Grievance)
    if mine and mine != "ALL":
        query = query.filter(Grievance.mine_name.like(f"{mine.split(' ')[0]}%"))
    if status and status != "ALL":
        query = query.filter(Grievance.status == status)
    return query.order_by(Grievance.created_at.desc()).all()


@router.get("/summary")
def grievance_summary(mine: Optional[str] = "ALL", user_role: Optional[str] = None, user_mine: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Grievance)
    if mine and mine != "ALL":
        query = query.filter(Grievance.mine_name.like(f"{mine.split(' ')[0]}%"))
    all_g = query.all()
    open_g = [g for g in all_g if g.status in (GrievanceStatus.SUBMITTED, GrievanceStatus.ROUTED, GrievanceStatus.IN_PROGRESS)]
    return {
        "total": len(all_g),
        "open": len(open_g),
        "resolved": sum(1 for g in all_g if g.status == GrievanceStatus.RESOLVED),
        "rejected": sum(1 for g in all_g if g.status == GrievanceStatus.REJECTED),
        "urgent_open": sum(1 for g in open_g if g.priority == "URGENT"),
    }


@router.post("/", response_model=GrievanceOut)
async def submit_grievance(payload: GrievanceIn, db: Session = Depends(get_db)):
    """
    Screen 16 (submission side — App-primary per platform strategy, web
    fallback here for completeness). Worker submits a grievance; it enters
    the queue as SUBMITTED, awaiting routing by the Mine Manager.
    """
    g = Grievance(
        id=_next_grievance_id(db),
        mine_name=payload.mine_name,
        submitted_by="Anonymous Worker" if payload.is_anonymous else payload.submitted_by,
        submitted_by_designation=payload.submitted_by_designation,
        category=payload.category,
        description=payload.description,
        is_anonymous="YES" if payload.is_anonymous else "NO",
        status=GrievanceStatus.SUBMITTED,
        priority=payload.priority or "NORMAL",
    )
    db.add(g)
    db.commit()
    db.refresh(g)

    write_audit(db, "GRIEVANCE", g.id, "CREATED", actor=g.submitted_by, mine_name=g.mine_name,
                payload_summary=f"{g.category} grievance filed at {g.mine_name}")

    await broadcast_event("grievance_submitted", {
        "grievance_id": g.id, "mine_name": g.mine_name, "category": g.category, "priority": g.priority
    })
    return g


@router.post("/{grievance_id}/route", response_model=GrievanceOut)
async def route_grievance(grievance_id: str, payload: GrievanceRouteRequest, db: Session = Depends(get_db)):
    """Mine Manager routes an intake grievance to a designated officer."""
    g = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not g:
        raise HTTPException(404, "Grievance not found")

    g.assigned_to = payload.assigned_to
    if payload.priority:
        g.priority = payload.priority
    g.status = GrievanceStatus.ROUTED
    db.commit()
    db.refresh(g)

    write_audit(db, "GRIEVANCE", g.id, "ROUTED", actor=payload.routed_by, mine_name=g.mine_name,
                payload_summary=f"Routed to {g.assigned_to}")

    await broadcast_event("grievance_routed", {
        "grievance_id": g.id, "mine_name": g.mine_name, "assigned_to": g.assigned_to
    })
    return g


@router.post("/{grievance_id}/resolve", response_model=GrievanceOut)
async def resolve_grievance(grievance_id: str, payload: GrievanceResolveRequest, db: Session = Depends(get_db)):
    """Designated officer marks a grievance resolved or rejected with notes."""
    g = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not g:
        raise HTTPException(404, "Grievance not found")

    g.status = GrievanceStatus.RESOLVED if payload.decision.upper() == "RESOLVED" else GrievanceStatus.REJECTED
    g.resolution_notes = payload.resolution_notes
    g.resolved_by = payload.resolved_by
    g.resolved_at = datetime.now()
    db.commit()
    db.refresh(g)

    write_audit(db, "GRIEVANCE", g.id, g.status.value, actor=payload.resolved_by, mine_name=g.mine_name,
                payload_summary=payload.resolution_notes[:200])

    await broadcast_event("grievance_resolved", {
        "grievance_id": g.id, "mine_name": g.mine_name, "status": g.status.value
    })
    return g
