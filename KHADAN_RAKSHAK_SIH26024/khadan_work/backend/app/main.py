from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.api.v1 import api_router
from app.seed_data import seed_database
from app.ws.manager import manager
from app.database import SessionLocal
from app.api.v1.reminders import scan_and_generate_reminders

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## KHADAN RAKSHAK Statutory Compliance & Governance API (SIH-26024)
    **Ministry of Coal & Directorate General of Mines Safety (DGMS)**
    
    Powers the complete 11-Screen compliance workflow:
    - **Screens 1-5**: Field-Worker Inspection App (Login, Checklist, Form IV, Corrective Order Assignment)
    - **Screens 6-8**: Corrective Action & Supervisor Verification Workflow (Form VII / Form VII-A)
    - **Screens 9-11**: Executive Safety Dashboard, Master Violations Audit Table, and Corporate AI Risk Map
    - **ML Pipeline Layer**: Tabular Risk Scoring, Recurrence Prediction & Computer Vision Hooks
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Phase 3: lets the frontend read the real filename off the
    # Content-Disposition header when downloading generated PDF reports
    # (browsers hide response headers from JS by default unless exposed).
    expose_headers=["Content-Disposition"],
)

# Mount static uploads directory for serving photographic evidence
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve the bundled frontend from the same FastAPI process. This removes the
# fragile two-server setup (Live Server + FastAPI) that caused the browser to
# show "Could not reach backend" whenever port 8000 was not running.
frontend_path = Path(__file__).resolve().parents[2] / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")


@app.websocket("/ws/live")
async def websocket_live_updates(websocket: WebSocket):
    """
    Live cross-role update channel. Every open browser tab connects here once.
    Any mutating API call anywhere in the backend broadcasts a small JSON
    event through this socket (see app/ws/manager.py), so an action taken by
    the Mine Manager, DGMS Officer, Fixer, or anyone else shows up live for
    every other connected tab without a manual refresh.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Frontend sends periodic pings to keep the connection alive;
            # content is ignored — this is a push-only channel.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.on_event("startup")
def on_startup():
    """Initializes and seeds database on server launch if unpopulated."""
    print("KHADAN RAKSHAK Backend Server Starting...")
    seed_database()

    # Phase 3: run one reminder-engine scan at boot so the queue reflects
    # current DB state immediately (a production deployment would also
    # call this on a periodic schedule, e.g. via APScheduler or cron).
    db = SessionLocal()
    try:
        result = scan_and_generate_reminders(db)
        print(f"Reminder engine: {result['created']} new, {result['updated']} updated on boot scan.")
    except Exception as e:
        print(f"Reminder engine boot scan failed (non-fatal): {e}")
    finally:
        db.close()

@app.get("/", tags=["Health & Status"])
def root():
    return {
        "system": "KHADAN RAKSHAK Statutory Coal Mine Compliance API",
        "ministry": "Ministry of Coal, Government of India",
        "regulations": "Coal Mines Regulations (CMR), 2017",
        "status": "OPERATIONAL",
        "swagger_docs": "/docs",
        "redoc": "/redoc",
        "api_v1": settings.API_V1_STR
    }


# Safety net: the documented, correct way to start this backend is
# `python run_server.py` from the backend/ directory (see backend/README.md).
# This block exists ONLY so that if someone instead runs `python app/main.py`
# or `python -m app.main` directly, a server still starts on 127.0.0.1:8000
# instead of silently doing nothing (importing the module, defining `app`,
# and exiting without ever binding a port) — which is exactly what happens
# without this block, and is a common source of "Could not reach backend"
# errors on the frontend that have nothing to do with the API code itself.
if __name__ == "__main__":
    import uvicorn
    print("NOTE: starting via 'python app/main.py' — prefer 'python run_server.py' from backend/.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
