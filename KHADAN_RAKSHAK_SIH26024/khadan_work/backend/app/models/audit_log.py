import hashlib
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    """
    Hash-chained, append-only audit trail. Each entry's hash is computed
    over its own payload PLUS the previous entry's hash, so any tampering
    with (or deletion of) a past entry breaks every hash after it — the
    same tamper-evidence property the site's copy already claims under
    "blockchain-style audit trail", without needing an actual blockchain
    (SIH-26024 Phase 4: Blockchain-Style Audit Trail).
    """
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # VIOLATION, INSPECTION, ACTION, GRIEVANCE, ENVIRONMENTAL, CONTRACTOR, ...
    entity_id = Column(String(50), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # CREATED, UPDATED, CLOSED, VERIFIED, ESCALATED, RESOLVED ...
    actor = Column(String(150), nullable=True)
    mine_name = Column(String(150), nullable=True)
    payload_summary = Column(Text, nullable=True)  # short human-readable description, hashed into the chain
    payload_hash = Column(String(64), nullable=False)   # sha256(this entry's content + prev_hash)
    prev_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


GENESIS_HASH = "0" * 64


def compute_entry_hash(entity_type: str, entity_id: str, action: str, actor: str,
                        payload_summary: str, prev_hash: str, timestamp_iso: str) -> str:
    """Deterministic sha256 over the entry's fields chained to the previous hash."""
    raw = f"{entity_type}|{entity_id}|{action}|{actor}|{payload_summary}|{prev_hash}|{timestamp_iso}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
