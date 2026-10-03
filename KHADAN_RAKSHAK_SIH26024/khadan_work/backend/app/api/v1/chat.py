"""
Phase 4: Conversational Interface — a lightweight rule-based assistant
that answers "what's my compliance % this month" style questions by
calling the same live-computed functions the dashboards use (no external
LLM dependency, so it works fully offline/air-gapped, which matters for
a DGMS statutory system).
"""
import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.api.v1.analytics import _compute_live_compliance
from app.models.mine import Mine
from app.models.violation import Violation, ViolationStatus
from app.models.reminder import Reminder
from app.models.grievance import Grievance, GrievanceStatus

router = APIRouter(prefix="/chat", tags=["Phase 4: Conversational Interface"])


class ChatQuery(BaseModel):
    query: str
    mine_name: Optional[str] = "ALL"
    language: Optional[str] = "en"


def _resolve_mine(text: str, default_mine: str, db: Session) -> str:
    mines = [m.name for m in db.query(Mine).all()]
    low = text.lower()
    for m in mines:
        if m.split(" - ")[0].split(" ")[0].lower() in low or m.split(" ")[0].lower() in low:
            return m
    return default_mine


@router.post("/query")
def chat_query(payload: ChatQuery, db: Session = Depends(get_db)):
    q = payload.query.lower().strip()
    hi = (payload.language or "en").lower().startswith("hi") or bool(re.search(r"[\u0900-\u097f]", q))
    mine = _resolve_mine(q, payload.mine_name or "ALL", db)
    scope_en = mine if mine != "ALL" else "all mines"
    scope_hi = mine if mine != "ALL" else "सभी खदानों"

    def answer(en: str, hindi: str, data=None):
        return {"answer": hindi if hi else en, "language": "hi" if hi else "en", "data": data}

    # Hindi and English intent aliases. Keep the underlying metrics live and factual.
    compliance_terms = r"compliance|अनुपालन|कम्प्लायंस|अनुपालन प्रतिशत"
    violation_terms = r"open violation|pending violation|how many violation|violations?\b|खुली? उल्लंघन|लंबित उल्लंघन|कितने उल्लंघन|उल्लंघन"
    reminder_terms = r"reminder|deadline|due|overdue|expir|रिमाइंडर|अनुस्मारक|समय.?सीमा|अंतिम तिथि|बकाया|देय"
    grievance_terms = r"grievance|complaint|शिकायत|शिकायतें|शिकायतों"
    risk_terms = r"risk|जोखिम|खतरा|जोखिम स्कोर"

    if re.search(compliance_terms, q, re.I):
        metrics = _compute_live_compliance(mine, db)
        return answer(
            f"Live compliance score for {scope_en} is {metrics['compliance_score']}% — {metrics['open_count']} open violation(s), {metrics['open_critical']} critical, {metrics['overdue']} overdue.",
            f"{scope_hi} का वर्तमान अनुपालन स्कोर {metrics['compliance_score']}% है। {metrics['open_count']} उल्लंघन खुले हैं, जिनमें {metrics['open_critical']} गंभीर हैं और {metrics['overdue']} की समय-सीमा बीत चुकी है।",
            metrics)

    if re.search(violation_terms, q, re.I):
        query = db.query(Violation).filter(Violation.status == ViolationStatus.OPEN)
        if mine != "ALL":
            query = query.filter(Violation.mine_name.like(f"{mine.split(' ')[0]}%"))
        n = query.count()
        return answer(f"There are currently {n} open violation(s) at {scope_en}.",
                      f"{scope_hi} में अभी {n} उल्लंघन खुले हैं।", {"open_violations": n})

    if re.search(reminder_terms, q, re.I):
        query = db.query(Reminder).filter(Reminder.acknowledged == False)
        if mine != "ALL":
            query = query.filter(Reminder.mine_name.like(f"{mine.split(' ')[0]}%"))
        rows = query.all()
        overdue = sum(1 for r in rows if r.severity == "OVERDUE")
        critical = sum(1 for r in rows if r.severity == "CRITICAL")
        return answer(f"{len(rows)} pending reminder(s) for {scope_en} — {overdue} overdue, {critical} due within 24 hours.",
                      f"{scope_hi} के लिए {len(rows)} अनुस्मारक लंबित हैं। {overdue} की समय-सीमा बीत चुकी है और {critical} अगले 24 घंटों में देय हैं।",
                      {"pending": len(rows), "overdue": overdue, "critical": critical})

    if re.search(grievance_terms, q, re.I):
        query = db.query(Grievance)
        if mine != "ALL":
            query = query.filter(Grievance.mine_name.like(f"{mine.split(' ')[0]}%"))
        rows = query.all()
        open_g = sum(1 for g in rows if g.status in (GrievanceStatus.SUBMITTED, GrievanceStatus.ROUTED, GrievanceStatus.IN_PROGRESS))
        return answer(f"{open_g} open grievance(s) out of {len(rows)} total at {scope_en}.",
                      f"{scope_hi} में कुल {len(rows)} शिकायतों में से {open_g} अभी लंबित हैं।",
                      {"open": open_g, "total": len(rows)})

    if re.search(risk_terms, q, re.I):
        if mine != "ALL":
            m = db.query(Mine).filter(Mine.name == mine).first()
            if m:
                return answer(f"{mine} has an AI Composite Risk Score of {m.risk_score:.1f} / 100.",
                              f"{mine} का AI समग्र जोखिम स्कोर 100 में से {m.risk_score:.1f} है।",
                              {"risk_score": m.risk_score})
        mines = db.query(Mine).order_by(Mine.risk_score.desc()).all()
        top = mines[0] if mines else None
        if not top:
            return answer("No mine data available.", "खदान का कोई डेटा उपलब्ध नहीं है।", {"mines": []})
        return answer(f"Highest-risk mine right now is {top.name} at {top.risk_score:.1f}/100.",
                      f"इस समय सबसे अधिक जोखिम वाली खदान {top.name} है। इसका जोखिम स्कोर 100 में से {top.risk_score:.1f} है।",
                      {"mines": [{"name": m.name, "risk_score": m.risk_score} for m in mines]})

    return answer(
        "I can help with compliance %, open violations, reminders and deadlines, grievances, and mine risk scores. Try: ‘compliance’, ‘open violations’, or ‘overdue reminders at Jharia’.",
        "मैं अनुपालन प्रतिशत, खुले उल्लंघन, अनुस्मारक और समय-सीमा, शिकायतों तथा खदान के जोखिम स्कोर की जानकारी दे सकता हूँ। पूछें: ‘अनुपालन कितना है?’, ‘कितने उल्लंघन खुले हैं?’ या ‘झरिया में कितने अनुस्मारक लंबित हैं?’",
        None)
