import os
import uuid
import shutil
import tempfile
import base64
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

def save_uploaded_photo(file: UploadFile, prefix: str = "proof") -> str:
    """
    Saves an uploaded photo to the uploads directory.
    Falls back gracefully to temp directory or base64 data URI in serverless/read-only environments.
    """
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    if not file_ext:
        file_ext = ".jpg"
    
    unique_filename = f"{prefix}_{uuid.uuid4().hex[:10]}{file_ext}"
    
    file_bytes = file.file.read()

    # Try configured upload dir, then /tmp/uploads, then system temp
    target_dirs = [
        settings.UPLOAD_DIR,
        Path("/tmp/uploads"),
        Path(tempfile.gettempdir()) / "uploads"
    ]

    for target_dir in target_dirs:
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / unique_filename
            with open(target_path, "wb") as buffer:
                buffer.write(file_bytes)
            return f"/uploads/{unique_filename}"
        except Exception:
            continue

    # Absolute fallback: return Base64 Data URI if disk writes are completely blocked
    mime = "image/png" if file_ext.lower() == ".png" else "image/jpeg"
    b64 = base64.b64encode(file_bytes).decode("utf-8")
    return f"data:{mime};base64,{b64}"
