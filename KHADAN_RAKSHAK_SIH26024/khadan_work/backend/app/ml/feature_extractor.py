from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.violation import Violation, ViolationSeverity, ViolationStatus
from app.models.inspection import Inspection

def extract_mine_features(mine_name: str, db: Session) -> Dict[str, Any]:
    """
    Feature Engineering Pipeline for Coal Mine Safety & Statutory Compliance:
    - Violation Frequency & Velocity
    - Critical Violation Ratio
    - Mean Time to Fix (MTTF) in hours
    - Overdue Rate (tasks exceeding statutory deadline)
    - DGMS Compliance Rate
    """
    violations = db.query(Violation).filter(Violation.mine_name.like(f"{mine_name.split(' ')[0]}%")).all()
    inspections = db.query(Inspection).filter(Inspection.mine_name.like(f"{mine_name.split(' ')[0]}%")).all()

    total_violations = len(violations)
    open_violations = sum(1 for v in violations if v.status == ViolationStatus.OPEN)
    critical_count = sum(1 for v in violations if v.severity == ViolationSeverity.CRITICAL)
    major_count = sum(1 for v in violations if v.severity == ViolationSeverity.MAJOR)
    minor_count = sum(1 for v in violations if v.severity == ViolationSeverity.MINOR)

    critical_ratio = (critical_count / total_violations) if total_violations > 0 else 0.0

    now = datetime.now()
    overdue_count = sum(1 for v in violations if v.status == ViolationStatus.OPEN and v.deadline and v.deadline < now)
    overdue_rate = (overdue_count / open_violations) if open_violations > 0 else 0.0

    # Calculate average compliance score across inspections
    if inspections:
        avg_compliance = sum(i.compliance_score for i in inspections) / len(inspections)
    else:
        avg_compliance = 92.0

    # Calculate Mean Time To Fix (MTTF) for closed violations
    fix_times_hours = []
    for v in violations:
        if v.status == ViolationStatus.CLOSED and v.closed_at and v.created_at:
            # handle tz if present
            c_at = v.created_at.replace(tzinfo=None) if v.created_at.tzinfo else v.created_at
            cl_at = v.closed_at.replace(tzinfo=None) if v.closed_at.tzinfo else v.closed_at
            duration = (cl_at - c_at).total_seconds() / 3600.0
            fix_times_hours.append(duration)
    
    mean_time_to_fix = sum(fix_times_hours) / len(fix_times_hours) if fix_times_hours else 24.0

    return {
        "mine_name": mine_name,
        "total_violations": total_violations,
        "open_violations": open_violations,
        "critical_count": critical_count,
        "major_count": major_count,
        "minor_count": minor_count,
        "critical_ratio": round(critical_ratio, 3),
        "overdue_count": overdue_count,
        "overdue_rate": round(overdue_rate, 3),
        "avg_compliance_score": round(avg_compliance, 1),
        "mean_time_to_fix_hours": round(mean_time_to_fix, 1),
        "feature_vector": [
            total_violations,
            open_violations,
            critical_ratio,
            overdue_rate,
            avg_compliance,
            mean_time_to_fix
        ]
    }
