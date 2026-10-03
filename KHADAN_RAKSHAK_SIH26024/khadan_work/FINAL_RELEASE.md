# KHADAN RAKSHAK — Final Web Release (SIH26024)

This package implements the final enhancement plan supplied for KHADAN RAKSHAK.

## Major final upgrades
- Strict role screen gating for all five role classes.
- Mine-manager and supervisor server-side mine isolation across analytics, GIS, environmental, production, labour, grievances, reminders and reports.
- DGMS Central Directorate retains consolidated multi-mine access, including Corporate Risk Index.
- Fixer Screen 7: camera capture, upload, drag/drop, backend storage, sample proof, five-point statutory review and backend closeout.
- Backend-connected Form IV submission, Form VII assignment, supervisor verification, escalation alerts and stoppage acknowledgement.
- WebSocket-driven refresh across operational and governance screens.
- Dual-model ML risk engine with canonical five mine names.
- Real PIL-based Before/After computer-vision comparison with structural, histogram and edge metrics.
- Multi-path OCR: Tesseract, PDF text extraction, and intelligent fallback parser; one-click sample statutory documents.
- Reports and audit trail scoped to the active mine for mine-scoped roles.
- Added `backend/test_final.py` release smoke suite.

## Run locally
1. `cd backend`
2. `pip install -r requirements.txt`
3. `python run_server.py`
4. Open `frontend/index.html` in a browser.

The backend seeds its SQLite database automatically on first startup.

## Verification performed
- `python backend/test_backend.py` — all existing backend workflow checks passed.
- `python backend/test_final.py` — final isolation/OCR/CV/RBAC smoke suite passed.
- `node --check frontend/app.js`
- `node --check frontend/live-integration.js`
- `node --check frontend/phase3.js`

ML model files may emit scikit-learn/XGBoost version compatibility warnings when loaded under a different library version; these are warnings from the serialized model metadata and did not cause inference/test failures in the release environment.
