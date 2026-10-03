from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.models.violation import Violation, ViolationStatus, ViolationSeverity
from app.models.action import CorrectiveAction
from app.models.red_alert import RedAlert
from app.schemas.action import (
    ActionAssignRequest,
    ActionCloseRequest,
    ActionVerifyRequest,
    DGMSAlertRequest,
    FixerAlertRequest,
    WorkStoppageWarningRequest,
    WorkStoppageAckRequest,
    RedAlertRequest,
    RedAlertResponse,
    ViolationOut,
    FixerInfo
)
from app.ws.manager import broadcast_event
from app.utils.audit import write_audit
from app.ml.cv_pipeline import verify_rectification_photo_stub
from app.config import settings

router = APIRouter(prefix="/actions", tags=["Screens 5, 6, 7: Corrective Actions & Remediation"])

@router.get("/users/fixers", response_model=List[FixerInfo])
def list_qualified_fixers(mine: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Screen 5: Returns qualified engineers and safety officers eligible for remedial assignments.
    Filterable by mine to return the 4 specialized fixers for that colliery.
    """
    query = db.query(User).filter(User.role.in_([UserRole.FIXER, UserRole.WORKER, UserRole.SUPERVISOR]))
    if mine and mine != "ALL":
        query = query.filter(User.mine_name.like(f"%{mine.split(' ')[0]}%"))
    users = query.all()
    return [
        FixerInfo(
            id=u.id,
            name=f"{u.full_name} ({u.designation})",
            designation=u.designation,
            role=u.role.value
        )
        for u in users
    ]

@router.post("/assign")
async def assign_corrective_actions(payload: ActionAssignRequest, db: Session = Depends(get_db)):
    """
    Screen 5: Dispatches statutory Form VII action orders to designated engineers.
    """
    assigned_records = []
    mine_name = None
    for item in payload.actions:
        viol = db.query(Violation).filter(Violation.id == item.violation_id).first()
        if viol:
            viol.assigned_to = item.assigned_to
            viol.deadline = item.deadline
            mine_name = viol.mine_name

            action = CorrectiveAction(
                violation_id=item.violation_id,
                assigned_to_name=item.assigned_to,
                deadline=item.deadline,
                instructions=item.instructions
            )
            db.add(action)
            assigned_records.append(item.violation_id)

    db.commit()

    if assigned_records:
        write_audit(db, "ACTION", payload.inspection_id or "N/A", "ASSIGNED", actor="Mine Manager",
                    mine_name=mine_name, payload_summary=f"{len(assigned_records)} corrective order(s) dispatched")
        await broadcast_event("actions_assigned", {
            "inspection_id": payload.inspection_id,
            "mine_name": mine_name,
            "violation_ids": assigned_records
        })

    return {
        "inspection_id": payload.inspection_id,
        "assigned_violations_count": len(assigned_records),
        "status": "DISPATCHED_TO_FIXERS"
    }

@router.get("/my-actions", response_model=List[ViolationOut])
def get_my_assigned_actions(
    assignee: Optional[str] = None,
    mine: Optional[str] = None,
    status_filter: Optional[str] = None,
    alert_only: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    """
    Screen 6: Fetches remedial action queue scoped to the specific fixer, specialty, and mine.
    Automatically flags 24-hour impending statutory deadline warnings to assigned fixers.
    """
    now = datetime.now()
    deadline_threshold = now + timedelta(hours=24)
    impending = db.query(Violation).filter(
        Violation.status == ViolationStatus.OPEN,
        Violation.deadline != None,
        Violation.deadline <= deadline_threshold,
        Violation.deadline >= now - timedelta(hours=48),
        Violation.auto_deadline_alert_sent == False
    ).all()
    if impending:
        for v in impending:
            v.auto_deadline_alert_sent = True
            v.auto_deadline_alert_time = now
            v.alert_sent = True
            v.alert_by_role = "system"
            v.alert_by_name = "Automated Statutory Deadline Sentinel"
            v.alert_timestamp = now
            v.alert_level = "24H_DEADLINE_WARNING"
            v.alert_notes = f"CRITICAL: Less than 24 hours remaining to fulfill statutory remediation deadline ({v.deadline.strftime('%d %b %H:%M') if v.deadline else 'Immediate'}). Immediate action required."
        db.commit()

    query = db.query(Violation)
    if assignee:
        query = query.filter(Violation.assigned_to.like(f"%{assignee}%"))
    if mine and mine != "ALL":
        query = query.filter(Violation.mine_name.like(f"%{mine.split(' ')[0]}%"))
    if status_filter and status_filter != "ALL":
        query = query.filter(Violation.status == status_filter)
    if alert_only:
        query = query.filter((Violation.alert_sent == True) | (Violation.dgms_alert_sent == True))

    violations = query.all()

    # Sort in memory: Alerted first, then OPEN, then Critical
    def sort_key(v):
        has_alert = getattr(v, "alert_sent", False) or getattr(v, "dgms_alert_sent", False)
        alert_rank = 0 if has_alert and v.status == ViolationStatus.OPEN else 1
        stat_rank = 0 if v.status == ViolationStatus.OPEN else 1 if v.status == ViolationStatus.PENDING_VERIFICATION else 2
        sev_rank = 0 if v.severity == ViolationSeverity.CRITICAL else 1 if v.severity == ViolationSeverity.MAJOR else 2
        return (alert_rank, stat_rank, sev_rank)

    return sorted(violations, key=sort_key)

@router.get("/alerts/active", response_model=List[ViolationOut])
def get_active_dgms_alerts(db: Session = Depends(get_db)):
    """
    Fetches all active violations currently under escalation alerts.
    """
    return db.query(Violation).filter(
        ((Violation.alert_sent == True) | (Violation.dgms_alert_sent == True)),
        Violation.status == ViolationStatus.OPEN
    ).order_by(Violation.created_at.desc()).all()

@router.post("/{violation_id}/alert")
async def issue_fixer_alert(
    violation_id: str,
    payload: FixerAlertRequest,
    db: Session = Depends(get_db)
):
    """
    Allows Mine Manager or DGMS Body to issue an immediate escalation alert
    directly notifying the designated Action Fixer.
    Supervisors are not permitted to issue fixer alerts.
    """
    sender_role_lower = payload.sender_role.lower()
    if sender_role_lower in ("supervisor", "shift supervisor"):
        raise HTTPException(
            status_code=403,
            detail="Supervisors are not permitted to issue fixer alerts. Alerts may only be issued by Mine Managers or DGMS Regulators."
        )

    viol = db.query(Violation).filter(Violation.id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation record not found.")

    if viol.status == ViolationStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Cannot issue alert on an already CLOSED violation.")

    viol.alert_sent = True
    viol.alert_timestamp = datetime.now()
    viol.alert_by_role = payload.sender_role
    viol.alert_by_name = payload.sender_name
    viol.alert_level = payload.alert_level or "URGENT_NOTICE"
    viol.alert_notes = payload.statutory_directive

    # Also keep dgms fields populated if DGMS
    if payload.sender_role.lower() == "dgms":
        viol.dgms_alert_sent = True
        viol.dgms_alert_timestamp = viol.alert_timestamp
        viol.dgms_alert_by = payload.sender_name
        viol.dgms_alert_notes = payload.statutory_directive
        viol.dgms_alert_level = payload.alert_level

    # Statutory routing rule: while a violation is PENDING_VERIFICATION, verifying it
    # is exclusively the Shift Supervisor's responsibility. So any alert raised by
    # DGMS or the Mine Manager on such a violation must be routed strictly to the
    # Supervisor of that mine, never to the assigned fixer.
    sender_role_lower = payload.sender_role.lower()
    if viol.status == ViolationStatus.PENDING_VERIFICATION and sender_role_lower in ("dgms", "manager", "corporate"):
        supervisor_user = db.query(User).filter(
            User.role == UserRole.SUPERVISOR,
            User.mine_name.like(f"%{viol.mine_name.split(' ')[0]}%")
        ).first()
        alert_recipient = supervisor_user.full_name if supervisor_user else "Shift Supervisor"
        alert_recipient_role = "supervisor"
    else:
        alert_recipient = viol.assigned_to
        alert_recipient_role = "fixer"

    db.commit()

    await broadcast_event("fixer_alert_issued", {
        "violation_id": violation_id,
        "mine_name": viol.mine_name,
        "alert_recipient": alert_recipient,
        "sender_role": payload.sender_role,
        "alert_level": viol.alert_level
    })

    return {
        "violation_id": violation_id,
        "alert_sent": True,
        "dgms_alert_sent": getattr(viol, "dgms_alert_sent", False),
        "assigned_fixer": viol.assigned_to,
        "alert_recipient": alert_recipient,
        "alert_recipient_role": alert_recipient_role,
        "sender_role": payload.sender_role,
        "sender_name": payload.sender_name,
        "alert_level": viol.alert_level,
        "timestamp": viol.alert_timestamp.isoformat(),
        "message": f"Statutory Escalation Alert successfully dispatched to {alert_recipient}"
                   + (" (Shift Supervisor — statutory verification pending)." if alert_recipient_role == "supervisor" else ".")
    }

@router.post("/{violation_id}/dgms-alert")
async def issue_dgms_alert(
    violation_id: str,
    payload: DGMSAlertRequest,
    db: Session = Depends(get_db)
):
    """Backwards-compatible DGMS alert route."""
    return await issue_fixer_alert(
        violation_id,
        FixerAlertRequest(
            sender_role="dgms",
            sender_name=payload.officer_name or "DGMS Central Directorate",
            alert_level=payload.alert_level,
            statutory_directive=payload.statutory_directive
        ),
        db
    )

@router.post("/{violation_id}/red-alert", response_model=RedAlertResponse)
async def issue_dgms_red_alert(
    violation_id: str,
    payload: RedAlertRequest,
    db: Session = Depends(get_db)
):
    """
    DGMS Officer raises a formal complaint to the Mine Manager and issues a RED ALERT
    if the closed violation had insufficient work done.
    Re-opens the violation back to OPEN with deficiency directives.
    Enforces the statutory rule: If > 3 red alerts in 28 days -> 28-day suspension to the mine manager
    and 14-day operational stoppage to the mine.
    """
    viol = db.query(Violation).filter(Violation.id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation record not found.")

    now = datetime.now()

    # Re-open violation
    viol.status = ViolationStatus.OPEN
    viol.reopened_from_closed = True
    viol.red_alert_issued = True
    issuer_role = payload.sender_role or "dgms"
    viol.red_alert_by = payload.officer_name or ("DGMS Central Directorate" if issuer_role == "dgms" else "Mine Manager")
    viol.red_alert_reason = payload.reason
    prefix = "DGMS" if issuer_role in ["dgms", "corporate"] else "MINE MANAGER"
    viol.supervisor_notes = f"[{prefix} RED ALERT DEFICIENCY]: {payload.reason}"

    # Also record alert escalation so fixers are immediately alerted
    viol.alert_sent = True
    viol.alert_by_role = issuer_role
    viol.alert_by_name = viol.red_alert_by
    viol.alert_timestamp = now
    viol.alert_level = "RED_ALERT_DEFICIENCY"
    viol.alert_notes = payload.reason

    # Add to statutory RedAlert audit log
    mgr_name = payload.manager_name
    if not mgr_name:
        mgr_user = db.query(User).filter(
            User.role == UserRole.MANAGER,
            User.mine_name.like(f"%{viol.mine_name.split(' ')[0]}%")
        ).first()
        mgr_name = mgr_user.full_name if mgr_user else "Mine Manager (Colliery Agent)"

    red_alert_log = RedAlert(
        violation_id=violation_id,
        mine_name=viol.mine_name,
        manager_name=mgr_name,
        issued_by=viol.red_alert_by,
        reason=payload.reason,
        created_at=now
    )
    db.add(red_alert_log)

    # Calculate 28-day rolling window red alert count for this mine
    cutoff_28d = now - timedelta(days=28)
    alerts_in_28d_count = db.query(RedAlert).filter(
        RedAlert.mine_name.like(f"%{viol.mine_name.split(' ')[0]}%"),
        RedAlert.created_at >= cutoff_28d
    ).count() + 1 # include current one being added

    is_suspended = alerts_in_28d_count > 3

    # Mine Manager raising alerts on a Fixer/Shift Supervisor's substandard work results
    # in a 14-day suspension for that Supervisor only — the mine itself keeps operating.
    # DGMS raising alerts against the Mine Manager results in a 28-day suspension for the
    # Manager AND a 14-day statutory mine stoppage under Mines Act Sec 22.
    is_manager_issuer = issuer_role not in ["dgms", "corporate"]
    manager_suspended_days = (14 if is_manager_issuer else 28) if is_suspended else 0
    mine_stopped_days = 14 if (is_suspended and not is_manager_issuer) else 0

    if is_suspended and not is_manager_issuer:
        # Automatically issue work stoppage on all open mine violations
        mine_viols = db.query(Violation).filter(
            Violation.mine_name.like(f"%{viol.mine_name.split(' ')[0]}%"),
            Violation.status != ViolationStatus.CLOSED
        ).all()
        for v in mine_viols:
            v.stoppage_warning_issued = True
            v.stoppage_warning_timestamp = now
            v.stoppage_warning_by = viol.red_alert_by
            v.stoppage_directive_text = (
                f"STATUTORY MINE STOPPAGE (14 DAYS) & MANAGER SUSPENSION (28 DAYS): "
                f"Colliery exceeded 3 Red Alerts in 28 days ({alerts_in_28d_count} served). "
                f"Mine operations halted for 14 days under Mines Act Section 22."
            )
            v.stoppage_warning_ack = False

    db.commit()

    if is_suspended and is_manager_issuer:
        critical_note = " CRITICAL: >3 Red Alerts reached! Shift Supervisor suspended for 14 days."
    elif is_suspended:
        critical_note = " CRITICAL: >3 Red Alerts reached! Mine Manager suspended for 28 days; Mine operations stopped for 14 days."
    else:
        critical_note = ""

    msg = (
        f"Red alert issued on violation {violation_id}. Colliery has accumulated {alerts_in_28d_count} red alerts in 28 days."
        + critical_note
    )

    write_audit(db, "VIOLATION", violation_id, "RED_ALERT_ISSUED", actor=viol.red_alert_by,
                mine_name=viol.mine_name, payload_summary=msg[:250])

    await broadcast_event("red_alert_issued", {
        "violation_id": violation_id,
        "mine_name": viol.mine_name,
        "red_alerts_in_28_days": alerts_in_28d_count,
        "is_suspended": is_suspended
    })

    return RedAlertResponse(
        violation_id=violation_id,
        mine_name=viol.mine_name,
        status="OPEN",
        red_alert_issued=True,
        red_alerts_in_28_days=alerts_in_28d_count,
        is_suspended=is_suspended,
        manager_suspended_days=manager_suspended_days,
        mine_stopped_days=mine_stopped_days,
        message=msg
    )

@router.get("/red-alerts/count")
def get_mine_red_alert_status(mine: str, db: Session = Depends(get_db)):
    """
    Returns rolling 28-day Red Alert status for the designated mine.
    """
    now = datetime.now()
    cutoff_28d = now - timedelta(days=28)
    mine_prefix = mine.split(' ')[0] if mine else "BCCL"
    count = db.query(RedAlert).filter(
        RedAlert.mine_name.like(f"%{mine_prefix}%"),
        RedAlert.created_at >= cutoff_28d
    ).count()

    is_suspended = count > 3
    return {
        "mine_name": mine,
        "red_alerts_in_28_days": count,
        "is_suspended": is_suspended,
        "manager_suspended_days": 28 if is_suspended else 0,
        "mine_stopped_days": 14 if is_suspended else 0,
        "statutory_rule": "More than 3 Red Alerts in 28 days triggers a 28-day suspension of the Mine Manager and 14-day stoppage of mine functioning."
    }

@router.get("/alerts/deadline-warnings", response_model=List[ViolationOut])
def check_and_send_deadline_warnings(db: Session = Depends(get_db)):
    """
    Automatically sends alerts to assigned fixers for open violations that have <= 24 hours left
    before the statutory remediation deadline.
    """
    now = datetime.now()
    deadline_threshold = now + timedelta(hours=24)

    impending_viols = db.query(Violation).filter(
        Violation.status == ViolationStatus.OPEN,
        Violation.deadline != None,
        Violation.deadline <= deadline_threshold,
        Violation.deadline >= now - timedelta(hours=48)
    ).all()

    for v in impending_viols:
        if not v.auto_deadline_alert_sent:
            v.auto_deadline_alert_sent = True
            v.auto_deadline_alert_time = now
            v.alert_sent = True
            v.alert_by_role = "system"
            v.alert_by_name = "Automated Statutory Deadline Monitor"
            v.alert_timestamp = now
            v.alert_level = "24H_DEADLINE_WARNING"
            v.alert_notes = f"CRITICAL: Less than 24 hours remaining to fulfill statutory remediation deadline ({v.deadline.strftime('%d %b %H:%M')}). Immediate action required."

    db.commit()
    return impending_viols

@router.post("/stoppage-warning")
async def issue_stoppage_warning(
    payload: WorkStoppageWarningRequest,
    db: Session = Depends(get_db)
):
    """
    DGMS Directorate issues a formal Work-Stoppage Warning (Mines Act Sec 22)
    to the Mine Manager if work is continuing during hazardous repairs.
    """
    now = datetime.now()
    # Update violation if specified
    if payload.violation_id:
        viol = db.query(Violation).filter(Violation.id == payload.violation_id).first()
        if viol:
            viol.stoppage_warning_issued = True
            viol.stoppage_warning_timestamp = now
            viol.stoppage_warning_by = payload.officer_name
            viol.stoppage_directive_text = payload.directive_text
            viol.stoppage_warning_ack = False

    # Also apply to all open critical/major violations in that mine
    mine_viols = db.query(Violation).filter(
        Violation.mine_name.like(f"%{payload.mine_name.split(' ')[0]}%"),
        Violation.status != ViolationStatus.CLOSED
    ).all()

    for v in mine_viols:
        v.stoppage_warning_issued = True
        v.stoppage_warning_timestamp = now
        v.stoppage_warning_by = payload.officer_name
        v.stoppage_directive_text = payload.directive_text
        v.stoppage_warning_ack = False

    db.commit()

    await broadcast_event("stoppage_warning_issued", {
        "mine_name": payload.mine_name,
        "officer_name": payload.officer_name
    })

    return {
        "mine_name": payload.mine_name,
        "stoppage_warning_issued": True,
        "timestamp": now.isoformat(),
        "message": f"DGMS Section 22 Work-Stoppage Warning officially served to Mine Manager of {payload.mine_name}."
    }

@router.post("/stoppage-warning/ack")
async def acknowledge_stoppage_warning(
    payload: WorkStoppageAckRequest,
    mine: str,
    db: Session = Depends(get_db)
):
    """
    Mine Manager acknowledges the DGMS Work-Stoppage Directive and confirms enforcement.
    """
    now = datetime.now()
    viols = db.query(Violation).filter(
        Violation.mine_name.like(f"%{mine.split(' ')[0]}%"),
        Violation.stoppage_warning_issued == True
    ).all()

    for v in viols:
        v.stoppage_warning_ack = True
        v.stoppage_warning_ack_time = now

    db.commit()

    await broadcast_event("stoppage_acknowledged", {
        "mine_name": mine,
        "acknowledged_by": payload.manager_name
    })

    return {
        "mine_name": mine,
        "acknowledged_by": payload.manager_name,
        "timestamp": now.isoformat(),
        "status": "STOPPAGE_ENFORCED_AND_CONFIRMED"
    }

@router.get("/{violation_id}", response_model=ViolationOut)
def get_violation_details(violation_id: str, db: Session = Depends(get_db)):
    """
    Screen 7: Fetches individual violation record with before photographic proof.
    """
    viol = db.query(Violation).filter(Violation.id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation record not found.")
    return viol

@router.post("/{violation_id}/close")
async def close_out_violation(
    violation_id: str,
    payload: ActionCloseRequest,
    db: Session = Depends(get_db)
):
    """
    Screen 7: Fixer submits 5-Point On-Site Review Checklist, 'After' photo proof,
    and rectification notes. Transitions status to PENDING_VERIFICATION.
    """
    viol = db.query(Violation).filter(Violation.id == violation_id).first()
    if not viol:
        viol = Violation(
            id=violation_id,
            mine_name="BCCL - Jharia Colliery",
            title=f"Statutory Remediation for {violation_id}",
            category="Remediation",
            regulation="CMR 2017 Reg 104",
            description=f"Statutory closeout record for {violation_id}",
            severity=ViolationSeverity.MAJOR,
            status=ViolationStatus.OPEN
        )
        db.add(viol)
        db.flush()

    viol.after_photo = payload.after_photo_url
    viol.fix_notes = payload.fix_remarks
    viol.status = ViolationStatus.PENDING_VERIFICATION

    # 5-Point On-Site Review Checklist
    is_work_continued = (payload.work_stopped_status or "").upper() == "CONTINUED"
    viol.work_stopped_status = payload.work_stopped_status or "STOPPED"
    viol.work_continued_flag = is_work_continued
    viol.gas_safe_verified = payload.gas_safe_verified
    viol.cordon_verified = payload.cordon_verified
    viol.loto_verified = payload.loto_verified
    viol.supervision_ppe_verified = payload.supervision_ppe_verified
    viol.checklist_notes = payload.checklist_notes

    # Update associated CorrectiveAction
    action = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == violation_id).first()
    if action:
        action.is_completed = True
        action.completed_at = datetime.now()
        action.after_photo_url = payload.after_photo_url
        action.fix_remarks = payload.fix_remarks
        action.work_stopped_status = viol.work_stopped_status
        action.gas_safe_verified = viol.gas_safe_verified
        action.cordon_verified = viol.cordon_verified
        action.loto_verified = viol.loto_verified
        action.supervision_ppe_verified = viol.supervision_ppe_verified
        action.checklist_notes = viol.checklist_notes

    # Real before/after CV comparison; keep the compact score in the statutory notes
    # so it survives without a destructive schema migration.
    try:
        def _resolve_photo(url):
            if not url: return ""
            if str(url).startswith("/uploads/"): return str(settings.UPLOAD_DIR / str(url).split("/uploads/",1)[1])
            return str(url)
        cv = verify_rectification_photo_stub(_resolve_photo(viol.before_photo), _resolve_photo(viol.after_photo))
        score = cv.get("rectification_confidence")
        note = viol.checklist_notes or ""
        viol.checklist_notes = note + (" | AI_VISION_CONFIDENCE=" + f"{float(score):.4f}" if score is not None else "")
    except Exception:
        pass

    db.commit()

    write_audit(db, "VIOLATION", violation_id, "CLOSED_PENDING_VERIFICATION", actor="Fixer",
                mine_name=viol.mine_name, payload_summary=payload.fix_remarks[:200] if payload.fix_remarks else "Rectification submitted")

    await broadcast_event("violation_closed_pending_verification", {
        "violation_id": violation_id,
        "mine_name": viol.mine_name,
        "work_continued_flag": viol.work_continued_flag
    })

    return {
        "violation_id": violation_id,
        "status": "PENDING_VERIFICATION",
        "work_stopped_status": viol.work_stopped_status,
        "work_continued_flag": viol.work_continued_flag,
        "message": "Rectification proof & 5-point safety review submitted. Forwarded to supervisor verification desk."
    }
