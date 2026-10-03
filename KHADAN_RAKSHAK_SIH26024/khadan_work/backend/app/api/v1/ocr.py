"""Robust statutory document digitisation for KHADAN RAKSHAK."""
import io, re, shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.file_storage import save_uploaded_photo
from app.utils.audit import write_audit

router = APIRouter(prefix="/ocr", tags=["Phase 4: OCR Document Digitization"])
_TESSERACT_AVAILABLE = None


def _check_tesseract():
    global _TESSERACT_AVAILABLE
    if _TESSERACT_AVAILABLE is not None:
        return _TESSERACT_AVAILABLE
    try:
        import pytesseract
        # Explicit PATH + common Windows locations; get_tesseract_version is the real check.
        candidates = [shutil.which("tesseract"), r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]
        for c in candidates:
            if c and Path(c).exists():
                pytesseract.pytesseract.tesseract_cmd = c
                break
        pytesseract.get_tesseract_version()
        _TESSERACT_AVAILABLE = True
    except Exception:
        _TESSERACT_AVAILABLE = False
    return _TESSERACT_AVAILABLE

_PATTERNS = {
    "license_number": re.compile(r"(?:\bLICENSE\s+NO\.?|\bCIL-LIC)[\s:#-]*([A-Z0-9][A-Z0-9\-/]{4,30})", re.I),
    "date": re.compile(r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b"),
    "regulation": re.compile(r"\b(?:CMR|Reg(?:ulation)?)[\s\.:#]*(\d{1,4}[A-Za-z]?)", re.I),
    "amount": re.compile(r"\b(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d+)?)", re.I),
    "certificate_number": re.compile(r"\b(?:CERTIFICATE|CERT|CTO)[\s\-:#]*(?:NO\.?\s*)?([A-Z0-9\-/]{4,30})", re.I),
}


def _extract_fields(text: str, document_type: str = "GENERIC") -> dict:
    fields = {}
    for key, pattern in _PATTERNS.items():
        m = pattern.search(text or "")
        if m:
            fields[key] = m.group(1).strip()
    dates = _PATTERNS["date"].findall(text or "")
    if dates:
        fields["all_dates_found"] = dates
    # Statutory document-specific semantic flags
    upper = (text or "").upper()
    if document_type == "CONTRACTOR_LICENSE":
        fields["document_class"] = "Contractor Licence"
        fields["compliance_status"] = "COMPLIANT" if "VALID" in upper or "APPROVED" in upper else "REVIEW REQUIRED"
    elif document_type == "INSPECTION_REGISTER":
        fields["document_class"] = "Form IV / Inspection Register"
        fields["compliance_status"] = "FAILURES DETECTED" if "FAIL" in upper or "NON-COMPLIANT" in upper else "REVIEW REQUIRED"
    elif document_type == "CTO_CERTIFICATE":
        fields["document_class"] = "Consent to Operate Certificate"
        fields["compliance_status"] = "APPROVED" if "APPROVED" in upper or "VALID" in upper else "REVIEW REQUIRED"
    return fields


def _extract_pdf_text(raw_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(raw_bytes))
        return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception:
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
                return "\n".join((p.extract_text() or "") for p in pdf.pages).strip()
        except Exception:
            return ""


def _fallback_text(document_type: str, filename: str) -> str:
    templates = {
        "CONTRACTOR_LICENSE": "Fallback statutory parser: Contractor Licence document received. Optical engine unavailable. Fields requiring visual confirmation: licence number, validity date, contractor name, regulatory approval status.",
        "INSPECTION_REGISTER": "Fallback statutory parser: Form IV Inspection Register received. Optical engine unavailable. Fields requiring visual confirmation: inspection date, inspector, mine, CMR regulation references, pass/fail results.",
        "CTO_CERTIFICATE": "Fallback statutory parser: Consent-to-Operate certificate received. Optical engine unavailable. Fields requiring visual confirmation: certificate number, issue/expiry date, consent authority, approval conditions.",
        "GENERIC": "Fallback statutory parser: document received. Optical engine unavailable; visual confirmation is required for fields not embedded in file metadata.",
    }
    return templates.get(document_type, templates["GENERIC"]) + f" Source file: {filename or 'uploaded document'}."


def _sample_pdf(document_type: str) -> bytes:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 15); c.drawString(50, 800, "KHADAN RAKSHAK — SAMPLE STATUTORY DOCUMENT")
    c.setFont("Helvetica", 11)
    if document_type == "CONTRACTOR_LICENSE":
        lines = ["CONTRACTOR LICENCE", "LICENSE NO: CIL-LIC/2026/BR-00421", "DATE: 12/09/2026", "VALID UNTIL: 11/09/2027", "STATUS: VALID / APPROVED", "CMR Reg 104"]
    elif document_type == "INSPECTION_REGISTER":
        lines = ["FORM IV — INSPECTION REGISTER", "INSPECTION DATE: 18/09/2026", "INSPECTOR: Rajesh Kumar Sharma", "REGULATION: CMR Reg 130", "RESULT: PASS", "STATUS: APPROVED"]
    else:
        lines = ["CONSENT TO OPERATE CERTIFICATE", "CERTIFICATE NO: CTO/JH/2026/8812", "DATE: 01/08/2026", "VALID UNTIL: 31/07/2027", "STATUS: APPROVED", "CMR Reg 176"]
    y=760
    for line in lines:
        c.drawString(65,y,line); y-=28
    c.save(); return buf.getvalue()


@router.get("/sample/{document_type}")
def sample_document(document_type: str):
    document_type = document_type.upper()
    if document_type not in {"CONTRACTOR_LICENSE","INSPECTION_REGISTER","CTO_CERTIFICATE"}:
        raise HTTPException(status_code=400, detail="Unsupported sample document type")
    return StreamingResponse(io.BytesIO(_sample_pdf(document_type)), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="sample_{document_type.lower()}.pdf"'})


@router.post("/digitize")
async def digitize_document(file: UploadFile = File(...), document_type: str = Form("GENERIC"), mine_name: Optional[str] = Form(None), db: Session = Depends(get_db)):
    raw_bytes = await file.read()
    if len(raw_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Document exceeds 12 MB upload limit")
    stored_path = None
    try:
        file.file.seek(0); stored_path = save_uploaded_photo(file, prefix="ocr_doc")
    except Exception:
        pass

    filename = file.filename or "document"
    is_pdf = (file.content_type == "application/pdf") or filename.lower().endswith(".pdf")
    raw_text = _extract_pdf_text(raw_bytes) if is_pdf else ""
    engine = "PDF_TEXT_EXTRACTOR" if raw_text else None

    if not raw_text and _check_tesseract() and not is_pdf:
        try:
            import pytesseract
            from PIL import Image, ImageOps, ImageEnhance
            image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            # Gentle preprocessing improves photographed statutory pages without changing content.
            image = ImageOps.autocontrast(ImageEnhance.Sharpness(image).enhance(1.25))
            raw_text = pytesseract.image_to_string(image, config="--psm 6").strip()
            engine = "TESSERACT"
        except Exception as exc:
            engine = f"TESSERACT_ERROR: {type(exc).__name__}"

    if not raw_text:
        raw_text = _fallback_text(document_type, filename)
        engine = engine or "INTELLIGENT_FALLBACK"

    fields = _extract_fields(raw_text, document_type)
    write_audit(db, "OCR_DOCUMENT", stored_path or filename, "DIGITIZED", actor="OCR Engine", mine_name=mine_name, payload_summary=f"{document_type} via {engine}; {len(fields)} field(s) extracted")
    return {"ocr_engine_available": _check_tesseract(), "engine_used": engine, "document_type": document_type, "mine_name": mine_name, "stored_file": stored_path, "raw_text": raw_text, "extracted_fields": fields, "digitized_at": datetime.now().isoformat()}


@router.get("/status")
def ocr_status():
    return {"tesseract_available": _check_tesseract(), "pdf_text_extractor_available": True, "fallback_parser_available": True}
