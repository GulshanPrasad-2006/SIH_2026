"""
Phase 3: Reminders & Escalation Engine.

Proactive deadline-approaching notifications — distinct from the existing
after-the-fact Red Alert / Stoppage Warning mechanisms, which only fire
once a violation is already overdue. This engine scans three statutory
deadline sources and materializes/updates Reminder rows:
  1. Open violation corrective-action deadlines (from `violations`)
  2. Contractor license expiries (from `contractors`)
  3. Environmental Consent-to-Operate expiries (from `environmental_records`)

`scan_and_generate_reminders()` is idempotent (keyed on target_type +
target_id) and is called both on-demand (GET /reminders/scan) and once at
backend startup, so the reminder queue always reflects current DB state —
no separate scheduler process required for a demo, though a real deployment
would call the same function from a periodic APScheduler/cron job.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.reminder import Reminder
from app.models.violation import Violation, ViolationStatus
from app.models.contractor import Contractor
from app.models.environmental import EnvironmentalRecord
from app.ws.manager import broadcast_event
from app.utils.audit import write_audit

router = APIRouter(prefix="/reminders", tags=["Phase 3: Reminders & Escalation Engine"])


def _severity_for(due_at: datetime, now: datetime) -> str:
    delta = (due_at - now).total_seconds() / 3600.0  # hours
    if delta < 0:
        return "OVERDUE"
    if delta <= 24:
        return "CRITICAL"
    if delta <= 72:
        return "WARNING"
    return "NORMAL"


def scan_and_generate_reminders(db: Session) -> dict:
    now = datetime.now()
    created, updated = 0, 0

    def upsert(target_type, target_id, mine_name, title, detail, due_at):
        nonlocal created, updated
        existing = db.query(Reminder).filter(
            Reminder.target_type == target_type, Reminder.target_id == str(target_id)
        ).first()
        severity = _severity_for(due_at, now)
        if existing:
            if not existing.acknowledged:
                existing.severity = severity
                existing.due_at = due_at
                existing.detail = detail
                updated += 1
        else:
            r = Reminder(
                target_type=target_type, target_id=str(target_id), mine_name=mine_name,
                title=title, detail=detail, due_at=due_at, severity=severity,
                channel="IN_APP", notified_at=now,
            )
            db.add(r)
            created += 1

    # 1. Open violation deadlines
    open_viols = db.query(Violation).filter(Violation.status == ViolationStatus.OPEN, Violation.deadline.isnot(None)).all()
    for v in open_viols:
        upsert("VIOLATION_DEADLINE", v.id, v.mine_name,
               f"Corrective action due — {v.title}",
               f"{v.regulation} · assigned to {v.assigned_to or 'unassigned'}", v.deadline)

    # 2. Contractor license expiries within 30 days (or already expired)
    contractors = db.query(Contractor).all()
    for c in contractors:
        if c.license_expiry and c.license_expiry <= now + timedelta(days=30):
            upsert("CONTRACTOR_LICENSE", c.id, c.mine_name,
                   f"Contractor licence renewal — {c.name}",
                   f"Licence {c.license_number} expiring", c.license_expiry)

    # 3. Environmental Consent-to-Operate expiries within 45 days
    env_records = db.query(EnvironmentalRecord).filter(EnvironmentalRecord.consent_valid_until.isnot(None)).all()
    for e in env_records:
        if e.consent_valid_until and e.consent_valid_until <= now + timedelta(days=45):
            upsert("CTO_RENEWAL", e.id, e.mine_name,
                   f"Consent-to-Operate renewal — {e.parameter}",
                   e.category, e.consent_valid_until)

    db.commit()
    return {"created": created, "updated": updated, "scanned_at": now.isoformat()}


@router.get("/scan")
async def run_reminder_scan(db: Session = Depends(get_db)):
    """Triggers a fresh scan across all three deadline sources."""
    result = scan_and_generate_reminders(db)
    if result["created"] > 0:
        await broadcast_event("reminders_generated", result)
    return result


@router.get("/", response_model=List[dict])
def list_reminders(
    mine: Optional[str] = "ALL",
    severity: Optional[str] = "ALL",
    include_acknowledged: bool = False,
    user_role: Optional[str] = None,
    user_mine: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Screen 19: live reminder queue, most urgent first."""
    if user_role in ["manager", "supervisor"] and user_mine:
        mine = user_mine

    query = db.query(Reminder)
    if mine and mine != "ALL":
        query = query.filter(Reminder.mine_name.like(f"{mine.split(' ')[0]}%"))
    if not include_acknowledged:
        query = query.filter(Reminder.acknowledged == False)
    if severity and severity != "ALL":
        query = query.filter(Reminder.severity == severity)

    rows = query.all()
    order = {"OVERDUE": 0, "CRITICAL": 1, "WARNING": 2, "NORMAL": 3}
    rows.sort(key=lambda r: (order.get(r.severity, 9), r.due_at))

    return [{
        "id": r.id, "target_type": r.target_type, "target_id": r.target_id, "mine_name": r.mine_name,
        "title": r.title, "detail": r.detail, "due_at": r.due_at.isoformat() if r.due_at else None,
        "severity": r.severity, "acknowledged": r.acknowledged, "escalated": r.escalated,
        "acknowledged_by": r.acknowledged_by,
    } for r in rows]


@router.get("/summary")
def reminders_summary(mine: Optional[str] = "ALL", db: Session = Depends(get_db)):
    query = db.query(Reminder).filter(Reminder.acknowledged == False)
    if mine and mine != "ALL":
        query = query.filter(Reminder.mine_name.like(f"{mine.split(' ')[0]}%"))
    rows = query.all()
    return {
        "overdue": sum(1 for r in rows if r.severity == "OVERDUE"),
        "critical": sum(1 for r in rows if r.severity == "CRITICAL"),
        "warning": sum(1 for r in rows if r.severity == "WARNING"),
        "normal": sum(1 for r in rows if r.severity == "NORMAL"),
        "total_pending": len(rows),
    }


@router.post("/{reminder_id}/acknowledge")
async def acknowledge_reminder(reminder_id: int, acknowledged_by: str = "Mine Manager", db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    r.acknowledged = True
    r.acknowledged_by = acknowledged_by
    r.acknowledged_at = datetime.now()
    db.commit()

    write_audit(db, "REMINDER", str(r.id), "ACKNOWLEDGED", actor=acknowledged_by, mine_name=r.mine_name,
                payload_summary=r.title)

    await broadcast_event("reminder_acknowledged", {"reminder_id": r.id, "mine_name": r.mine_name, "title": r.title})
    return {"status": "acknowledged", "id": r.id}


@router.post("/{reminder_id}/escalate")
async def escalate_reminder(reminder_id: int, escalated_by: str = "System (Auto-Escalation)", db: Session = Depends(get_db)):
    """Manually or automatically push an overdue reminder into the DGMS escalation channel."""
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    r.escalated = True
    r.escalated_at = datetime.now()
    db.commit()

    write_audit(db, "REMINDER", str(r.id), "ESCALATED", actor=escalated_by, mine_name=r.mine_name,
                payload_summary=r.title)

    await broadcast_event("reminder_escalated", {"reminder_id": r.id, "mine_name": r.mine_name, "title": r.title})
    return {"status": "escalated", "id": r.id}
