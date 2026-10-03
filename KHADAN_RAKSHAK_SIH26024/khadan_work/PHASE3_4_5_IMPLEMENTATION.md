# KHADAN RAKSHAK — Phase 3, 4 & 5 Implementation Notes

This document covers everything added on top of `PHASE1_PHASE2_IMPLEMENTATION.md`.

## Phase 3 — Close the Digital-Governance Loop

| Module | Backend | Frontend |
|---|---|---|
| Grievance Handling | `models/grievance.py`, `schemas/grievance.py`, `api/v1/grievances.py` | Screen 16 |
| Reminders & Escalation Engine | `models/reminder.py`, `api/v1/reminders.py` | Screen 19 |
| GIS Map View | `Mine.latitude/longitude`, `api/v1/gis.py` | Screen 17 (Leaflet) |
| Automated Report Generation | `api/v1/reports.py` (reportlab) | Screen 18 |

**Reminder Engine**: `scan_and_generate_reminders()` in `api/v1/reminders.py` is idempotent
(keyed on `target_type` + `target_id`) and scans three sources — open violation deadlines,
contractor license expiries (≤30 days), and environmental Consent-to-Operate expiries
(≤45 days). It runs once at backend boot (`main.py` startup event) and on-demand via
`GET /api/v1/reminders/scan`. A production deployment should call the same function from a
periodic scheduler (APScheduler / cron) instead of only boot + manual triggers.

**Report Generation**: `GET /api/v1/reports/form-vii/{violation_id}` and
`GET /api/v1/reports/monthly-summary?mine=...` stream PDFs built with `reportlab` — no
system dependency required, unlike wkhtmltopdf/weasyprint-based approaches.

## Phase 4 — Differentiators

| Module | Backend | Frontend |
|---|---|---|
| OCR Document Digitization | `api/v1/ocr.py` (pytesseract) | Screen 18 |
| Blockchain-Style Audit Trail | `models/audit_log.py`, `utils/audit.py`, `api/v1/audit.py` | Screen 18 |
| Conversational Interface | `api/v1/chat.py` | Floating widget, all screens |
| Functional Hindi i18n | — | `frontend/phase3.js` (`KHADAN_TRANSLATIONS`) |

**OCR**: requires the `tesseract-ocr` system binary. Install with:
```bash
# Linux
sudo apt-get install -y tesseract-ocr
# macOS
brew install tesseract
```
If the binary isn't found, `POST /api/v1/ocr/digitize` returns `ocr_engine_available: false`
with clear install instructions instead of faking a result — check `GET /api/v1/ocr/status`.

**Audit Trail**: every entry hashes `entity_type|entity_id|action|actor|summary|prev_hash|timestamp`
with SHA-256, chained onto the previous entry's hash (`utils/audit.py::write_audit`). Any
inserted/deleted/reordered entry breaks the chain, detectable via `GET /api/v1/audit/verify`.
Wired into: grievances (create/route/resolve), reminders (acknowledge/escalate), reports
(generation), OCR (digitization), and the Phase 1/2 statutory checkpoints — inspection
submission, corrective-action assignment, red alerts, violation closure, and supervisor
verification.

**Chatbot**: rule-based, not an LLM call — works fully offline, which matters for a
DGMS statutory system that may run air-gapped. Answers compliance %, open violations,
reminders/deadlines, grievances, and risk-score questions using the same live-computed
functions the dashboards call.

## Phase 5 — App Build (Not Included)

Out of scope for this pass: a native/React Native/Flutter rebuild of screens 2, 4, 5, 7, 8
(shift desk, checklist, submit, fixer queue, close-out) plus offline-first sync, native
camera/GPS, and push notifications. The backend API is already shaped for this — every
Phase 1–4 endpoint is platform-agnostic JSON/REST, so a mobile client can consume it
directly without backend changes.

## Data & Integration Notes

- `Mine` now carries `latitude`/`longitude`, seeded with each colliery's real coordinates.
- Seed data adds 5 grievances (spanning SUBMITTED → RESOLVED), 5 reminders, and genesis
  audit-trail entries for all 5 mines. The reminder queue then grows for real on every
  backend boot from actual violation/contractor/environmental data — the seeded rows are a
  demo floor, not the whole picture.
- All new routers are mounted under the existing `/api/v1` prefix (see `api/v1/__init__.py`),
  so `frontend/live-integration.js`'s existing `API_BASE` needs no changes.
- CORS now exposes `Content-Disposition` so the browser can read the real filename when
  downloading generated PDFs.
- `frontend/phase3.js` loads after `app.js`/`live-integration.js` and wraps `switchScreen()`
  and `refreshPhase1ScreenIfActive()` rather than editing those files, to keep the diff
  against Phase 1/2 minimal and auditable.

## Bug Fixes (post-initial-release)

Two real issues were found and fixed after the first Phase 3/4 pass:

1. **New tables never seeded on a re-launch.** `seed_database()` early-returns once
   30+ users already exist (so restarting the backend doesn't wipe real activity) — but
   that early-return used to skip the grievances/reminders/audit-log seeding too, since it
   sat at the very end of the same function. If you'd already run an earlier build once
   (creating `backend/khadan_rakshak.db`), the new Phase 3 screens would come up empty even
   though the tables and API worked fine. Fixed by extracting that seeding into
   `seed_phase3_extension(db, mine_names)`, called from **both** the early-return path and
   the end of a full fresh seed. Each of its three sections (grievances, reminders, audit
   log) independently checks its own row count and no-ops if already populated, so it's
   always safe to call.
2. **A missing `reportlab` install could crash the whole backend, not just reports.**
   `api/v1/reports.py` imported `reportlab` at module top-level; since `api/v1/__init__.py`
   loads every router unconditionally at startup, a missing package there would raise
   `ImportError` and take the entire FastAPI app down before it could serve *anything* —
   including screens that have nothing to do with reports. Fixed by wrapping the import in
   `try/except` (matching how OCR already handles a missing Tesseract binary), guarding
   every module-level object that depended on it — including a function default argument
   that was evaluated at *definition* time, not call time — and returning a clean HTTP 503
   with install instructions instead. Check `GET /api/v1/reports/status` to see whether
   reportlab loaded.

**If you're updating an existing checkout rather than starting fresh:** delete
`backend/khadan_rakshak.db` and re-run `pip install -r backend/requirements.txt` before
starting the server, to be safe — though as of this fix, neither should strictly be
necessary anymore.

### 3. Correct start command (this one was a docs mistake, not a code bug)

**Run the backend with:**
```bash
cd backend
pip install -r requirements.txt
python run_server.py
```
**Not** `python -m app.main` — `app/main.py` has no `if __name__ == "__main__":` block of
its own by design (it's meant to be imported by `run_server.py`, which does the actual
`uvicorn.run(...)` call with the reload flag and startup banner). Running it as a module
directly just imports the file and exits without ever binding port 8000 — the FastAPI
`@app.on_event("startup")` handler that seeds the database never even fires, because it
only runs when a real ASGI server drives the app. If your frontend shows "Could not reach
backend at http://127.0.0.1:8000/api/v1. Is it running?", first check this: is a `uvicorn`
process actually printing "Application startup complete" in a terminal? If not, that's the
whole problem — start it with the command above.

As a safety net, `app/main.py` now also has its own `if __name__ == "__main__":` block, so
`python app/main.py` (run from inside `backend/`) works too — but `python run_server.py`
remains the documented, correct way to start it.

## Known Limitations

- Not boot-tested against a live server in this environment (sandboxed, no network to
  install FastAPI); verified via `py_compile` / `node --check` on every touched file.
  Run `pip install -r backend/requirements.txt && python -m app.main` locally before a
  live demo.
- OCR needs the Tesseract system binary installed separately (see above).
- Phase 5 (native app) is not implemented — see above.
