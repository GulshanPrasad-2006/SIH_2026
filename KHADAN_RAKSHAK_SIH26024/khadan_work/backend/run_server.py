"""
Launcher script for KHADAN RAKSHAK FastAPI Backend Server
"""
import sys
import os
import uvicorn
from pathlib import Path

# Add backend directory to sys.path so app can be imported
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("=" * 70)
    print("  KHADAN RAKSHAK: Statutory Coal Mine Safety & Compliance System")
    print("  Ministry of Coal | SIH-26024 Backend Server")
    print("=" * 70)
    print("  - API Documentation:   http://127.0.0.1:8000/docs")
    print("  - Alternative ReDoc:   http://127.0.0.1:8000/redoc")
    print("  - Root Health Check:   http://127.0.0.1:8000/")
    print("=" * 70)
    
    port = int(os.environ.get("KHADAN_PORT", "8000"))
    print(f"  - Website/API:          http://127.0.0.1:{port}/")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        # Only watch the source code — NOT the whole backend/ dir.
        # Without this, every SQLite write to khadan_rakshak.db (and every
        # file saved to uploads/) is seen as a "code change", which restarts
        # the server, drops all open WebSocket connections, and refuses
        # in-flight HTTP requests.
        reload_dirs=[str(backend_dir / "app")],
        reload_excludes=[
            "*.db",
            "*.db-journal",
            "*.sqlite",
            "*.sqlite3",
            "uploads/*",
            "data/*",
        ],
    )
