"""
Hash-chained audit trail writer. Call write_audit(...) from any mutating
endpoint after db.commit() to append a tamper-evident record. Every write
reads the last row's hash, chains onto it, and commits its own — so the
integrity of the whole log can be re-verified end-to-end at any time via
GET /api/v1/audit/verify (see api/v1/audit.py).
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog, GENESIS_HASH, compute_entry_hash


def write_audit(db: Session, entity_type: str, entity_id: str, action: str,
                 actor: str = None, mine_name: str = None, payload_summary: str = "") -> AuditLog:
    """
    Never raises out to the caller — an audit-log write failing should
    never break the underlying statutory action it's recording. Returns
    the created row, or None if the write failed.
    """
    try:
        last = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        prev_hash = last.payload_hash if last else GENESIS_HASH
        ts = datetime.now(timezone.utc).isoformat()

        entry_hash = compute_entry_hash(
            entity_type, entity_id, action, actor or "system",
            payload_summary or "", prev_hash, ts
        )

        entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor=actor,
            mine_name=mine_name,
            payload_summary=payload_summary,
            payload_hash=entry_hash,
            prev_hash=prev_hash,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    except Exception:
        db.rollback()
        return None
