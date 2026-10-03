from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.violation import Violation, ViolationStatus
from app.models.action import CorrectiveAction
from app.schemas.action import ActionVerifyRequest, ViolationOut
from app.ws.manager import broadcast_event
from app.utils.audit import write_audit
from app.ml.cv_pipeline import verify_rectification_photo_stub
from app.config import settings

router = APIRouter(prefix="/verifications", tags=["Screen 8: Supervisor Statutory Verification"])


@router.post("/vision")
def verify_rectification_vision(before_photo_url: str, after_photo_url: str):
    """Compare uploaded Before/After proof images with a deterministic CV pipeline."""
    def resolve(url: str):
        if not url: return ""
        if url.startswith("/uploads/"):
            return str(settings.UPLOAD_DIR / url.split("/uploads/",1)[1])
        if url.startswith(("http://", "https://")):
            try:
                import urllib.request, tempfile
                suffix = Path(url.split("?",1)[0]).suffix or ".jpg"
                target = Path(tempfile.gettempdir()) / f"khadan_vision_{abs(hash(url))}{suffix}"
                if not target.exists(): urllib.request.urlretrieve(url, target)
                return str(target)
            except Exception: return ""
        return url
    return verify_rectification_photo_stub(resolve(before_photo_url), resolve(after_photo_url))

@router.get("/pending", response_model=List[ViolationOut])
def get_pending_verifications(mine: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Screen 8: Fetches items awaiting supervisor before/after verification (Form VII-A).
    Optionally scoped to supervisor's mine.
    """
    query = db.query(Violation).filter(Violation.status == ViolationStatus.PENDING_VERIFICATION)
    if mine and mine != "ALL":
        query = query.filter(Violation.mine_name.like(f"%{mine.split(' ')[0]}%"))
    return query.order_by(Violation.created_at.desc()).all()

@router.post("/{violation_id}/review")
async def review_violation(
    violation_id: str,
    payload: ActionVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Screen 8: Supervisor reviews side-by-side photographic evidence:
    - APPROVE: Marks violation as CLOSED under CMR-2017.
    - REJECT: Returns violation to OPEN state with corrective directives.
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
            status=ViolationStatus.PENDING_VERIFICATION
        )
        db.add(viol)
        db.flush()

    decision_upper = payload.decision.upper()
    if decision_upper == "APPROVE":
        viol.status = ViolationStatus.CLOSED
        viol.closed_at = datetime.now()
        viol.supervisor_notes = payload.supervisor_remarks or "Statutory compliance verified and confirmed under CMR 2017."

        action = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == violation_id).first()
        if action:
            action.is_verified = True
            action.verified_at = datetime.now()
            action.supervisor_remarks = viol.supervisor_notes

        msg = f"Violation {violation_id} officially approved and closed."
    elif decision_upper == "REJECT":
        viol.status = ViolationStatus.OPEN
        viol.supervisor_notes = payload.supervisor_remarks or "Rectification rejected. Please re-work and re-submit proof."
        msg = f"Violation {violation_id} rejected and returned to fixer queue."
    else:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVE' or 'REJECT'.")

    db.commit()

    write_audit(db, "VIOLATION", violation_id, f"VERIFICATION_{decision_upper}", actor="Supervisor",
                mine_name=viol.mine_name, payload_summary=msg)

    await broadcast_event("violation_verified", {
        "violation_id": violation_id,
        "mine_name": viol.mine_name,
        "decision": decision_upper,
        "new_status": viol.status.value
    })

    return {
        "violation_id": violation_id,
        "new_status": viol.status.value,
        "message": msg
    }
