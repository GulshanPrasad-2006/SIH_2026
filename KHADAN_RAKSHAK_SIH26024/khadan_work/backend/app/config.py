import os
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def _resolve_upload_dir() -> Path:
    env_dir = os.getenv("UPLOAD_DIR")
    if env_dir:
        p = Path(env_dir)
        try:
            p.mkdir(parents=True, exist_ok=True)
            return p
        except Exception:
            pass
    # Try BASE_DIR / uploads
    default_dir = BASE_DIR / "uploads"
    try:
        default_dir.mkdir(parents=True, exist_ok=True)
        # Test write
        test_file = default_dir / ".write_check"
        test_file.touch()
        test_file.unlink()
        return default_dir
    except Exception:
        # Fall back to /tmp
        tmp_dir = Path(tempfile.gettempdir()) / "khadan_uploads"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        return tmp_dir

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "KHADAN RAKSHAK Statutory Compliance API")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'khadan_rakshak.db'}")
    
    # Uploads
    UPLOAD_DIR: Path = _resolve_upload_dir()
    
    # JWT / Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "khadan-rakshak-dgms-sih-2026-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

settings = Settings()
