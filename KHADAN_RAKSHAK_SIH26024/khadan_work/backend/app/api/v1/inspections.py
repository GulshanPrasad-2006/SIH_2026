import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.inspection import ChecklistItem, Inspection, ChecklistResult
from app.models.violation import Violation, ViolationSeverity, ViolationStatus
from app.schemas.inspection import (
    ChecklistItemOut,
    InspectionStartRequest,
    InspectionSubmitRequest,
    InspectionOut
)
from app.utils.file_storage import save_uploaded_photo
from app.ws.manager import broadcast_event
from app.utils.audit import write_audit

router = APIRouter(prefix="/inspections", tags=["Screens 2, 3, 4: Field-Worker Inspections"])

@router.get("/recent", response_model=List[InspectionOut])
def get_recent_inspections(
    mine: Optional[str] = None,
    inspector_name: Optional[str] = None,
    user_role: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Screen 2: Fetch Form IV statutory inspections, role-scoped.
    - worker: only their own inspections (filtered by inspector_name)
    - manager/supervisor: all inspections in their mine
    - corporate: all inspections across all mines
    """
    query = db.query(Inspection)
    if mine and mine != "ALL":
        query = query.filter(Inspection.mine_name.like(f"{mine.split(' ')[0]}%"))
    # Workers see only their own inspections
    if user_role == "worker" and inspector_name:
        query = query.filter(Inspection.inspector_name.like(f"%{inspector_name.split(' ')[0]}%"))
    return query.order_by(Inspection.created_at.desc()).limit(limit).all()

@router.post("/start")
def start_new_inspection(request: InspectionStartRequest):
    """
    Screen 2 -> Screen 3: Generates a new unique statutory inspection reference.
    """
    rand_suffix = random.randint(1000, 9999)
    prefix = "INSP-BCCL" if "BCCL" in request.mine_name else "INSP-MINE"
    inspection_id = f"{prefix}-2026-{rand_suffix}"
    
    return {
        "inspection_id": inspection_id,
        "mine_name": request.mine_name,
        "shift": request.shift,
        "location_details": request.location_details,
        "status": "INITIALIZED"
    }

@router.get("/checklists/default", response_model=List[ChecklistItemOut])
def get_default_checklist(db: Session = Depends(get_db)):
    """
    Screen 3: Returns the 10 statutory DGMS CMR-2017 checklist parameters.
    """
    return db.query(ChecklistItem).order_by(ChecklistItem.item_number.asc()).all()

@router.post("/uploads/photo")
async def upload_inspection_photo(file: UploadFile = File(...)):
    """
    Screen 3 & 7: Handles photographic evidence upload and returns serving URL.
    """
    photo_url = save_uploaded_photo(file, prefix="inspection_proof")
    return {
        "photo_url": photo_url,
        "filename": file.filename,
        "status": "UPLOADED_SUCCESS"
    }

@router.post("/{inspection_id}/submit")
async def submit_inspection(
    inspection_id: str,
    payload: InspectionSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Screen 4: Summarizes pass/fail checklist results, stores Form IV log,
    and automatically creates open violations for any failed parameters.
    """
    passed = sum(1 for r in payload.results if r.status == "pass")
    failed = sum(1 for r in payload.results if r.status == "fail")
    total = len(payload.results)
    compliance_score = round((passed / total) * 100.0, 1) if total > 0 else 100.0

    # Create Inspection record
    inspection = Inspection(
        id=inspection_id,
        mine_name=payload.mine_name,
        inspector_name=payload.inspector_name,
        shift=payload.shift or "Shift 1",
        location_details=payload.location_details or "Colliery Underground",
        passed_count=passed,
        failed_count=failed,
        compliance_score=compliance_score,
        statutory_attestation=payload.statutory_attestation,
        status="ACTIONS_PENDING" if failed > 0 else "COMPLETED"
    )
    db.add(inspection)
    db.flush()

    # Create Checklist Results & generated open violations
    created_violations = []
    for res in payload.results:
        item = db.query(ChecklistItem).filter(ChecklistItem.id == res.item_id).first()
        c_res = ChecklistResult(
            inspection_id=inspection_id,
            item_id=res.item_id,
            status=res.status,
            severity=res.severity,
            notes=res.notes,
            photo_url=res.photo_url,
            gps_coordinates=res.gps_coordinates
        )
        db.add(c_res)

        if res.status == "fail" and item:
            viol_id = f"VIOL-2026-{random.randint(1000, 9999)}"
            sev = ViolationSeverity.MAJOR
            if res.severity == "Critical":
                sev = ViolationSeverity.CRITICAL
            elif res.severity == "Minor":
                sev = ViolationSeverity.MINOR

            violation = Violation(
                id=viol_id,
                inspection_id=inspection_id,
                mine_name=payload.mine_name,
                category=item.category,
                regulation=item.regulation_code,
                title=item.title,
                description=res.notes or f"Non-compliance identified in {item.title}.",
                severity=sev,
                status=ViolationStatus.OPEN,
                assigned_to=item.default_assignee or "Anil Verma (Ventilation Officer)",
                gps_coordinates=res.gps_coordinates or "23.7508° N, 86.4132° E",
                before_photo=res.photo_url or "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60"
            )
            db.add(violation)
            created_violations.append(viol_id)

    db.commit()

    write_audit(db, "INSPECTION", inspection_id, "SUBMITTED", actor=payload.inspector_name,
                mine_name=payload.mine_name,
                payload_summary=f"Form IV submitted — {passed} passed, {failed} failed, "
                                 f"{len(created_violations)} violation(s) raised")

    await broadcast_event("inspection_submitted", {
        "inspection_id": inspection_id,
        "mine_name": payload.mine_name,
        "inspector_name": payload.inspector_name,
        "compliance_score": compliance_score,
        "failed_count": failed,
        "open_violations_created": created_violations
    })

    return {
        "inspection_id": inspection_id,
        "compliance_score": compliance_score,
        "passed_count": passed,
        "failed_count": failed,
        "open_violations_created": created_violations,
        "status": "SUBMITTED_SUCCESSFULLY",
        "requires_action_assignment": len(created_violations) > 0
    }
