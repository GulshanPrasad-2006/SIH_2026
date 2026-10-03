from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.inspections import router as inspections_router
from app.api.v1.actions import router as actions_router
from app.api.v1.verifications import router as verifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.mines import router as mines_router
from app.api.v1.environmental import router as environmental_router
from app.api.v1.production import router as production_router
from app.api.v1.labour import router as labour_router
from app.api.v1.grievances import router as grievances_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.gis import router as gis_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ocr import router as ocr_router
from app.api.v1.audit import router as audit_router
from app.api.v1.chat import router as chat_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(inspections_router)
api_router.include_router(actions_router)
api_router.include_router(verifications_router)
api_router.include_router(analytics_router)
api_router.include_router(mines_router)
api_router.include_router(environmental_router)
api_router.include_router(production_router)
api_router.include_router(labour_router)
api_router.include_router(grievances_router)
api_router.include_router(reminders_router)
api_router.include_router(gis_router)
api_router.include_router(reports_router)
api_router.include_router(ocr_router)
api_router.include_router(audit_router)
api_router.include_router(chat_router)
