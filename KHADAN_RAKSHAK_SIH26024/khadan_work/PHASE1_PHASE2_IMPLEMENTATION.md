# KHADAN RAKSHAK — Phase 1 & Phase 2 Implementation Notes

This update adds the Phase 1 (new compliance domains) and Phase 2 (real
analytics) modules from the implementation plan, wires them to the
already-mature FastAPI backend, and adds a WebSocket live-update layer so
actions taken by one role show up for every other connected session in
real time.

## What was added

**Backend — Phase 1 (new compliance domains)**
- `app/models/environmental.py`, `production.py`, `attendance.py`, `contractor.py` — new tables
- `app/schemas/environmental.py`, `production.py`, `labour.py` — request/response schemas
- `app/api/v1/environmental.py` → `/api/v1/environmental/*`
- `app/api/v1/production.py` → `/api/v1/production/*`
- `app/api/v1/labour.py` → `/api/v1/labour/*` (attendance + contractor management)
- Seed data for all four, across all 5 mines, in `seed_data.py`

**Backend — Phase 2 (AI/analytics made real)**
- `GET /api/v1/analytics/recurring-violations` — same regulation/title repeating across shifts/mines
- `GET /api/v1/analytics/anomalies` — mines whose open-violation load deviates from their own historical baseline

**Live-update layer**
- `app/ws/manager.py` — WebSocket `ConnectionManager` + `broadcast_event()` helper
- `/ws/live` endpoint (registered in `main.py`)
- Wired into every mutating endpoint: inspection submit, action assign, fixer/DGMS alert, red alert, stoppage warning + acknowledgment, close-out, supervisor verification, and all four new Phase 1 endpoints

**Frontend**
- `frontend/live-integration.js` (new, loads before `app.js`) — defines `API_BASE` (was previously undefined dead code), `apiGet`/`apiPost` helpers, and the WebSocket client with auto-reconnect. This also fixes the existing `fetchAndUpdateComplianceKPI()` function, which was already written to call the real backend but silently failed every time because `API_BASE` didn't exist anywhere in the project.
- Screens 13–15 added to `index.html` + rendering logic in `app.js`:
  - **Screen 13** — Environmental & Production Compliance
  - **Screen 14** — Labour & Contractor Governance
  - **Screen 15** — Recurring Violations & Anomaly Analytics
- New screens are gated to `manager` and `corporate` roles only, per the officials-centric web strategy — added to their `ROLE_CONFIGS` tabs.

## What's still local-mock (deliberately, for now)

Screens 2, 4, 5, 7, 8 (shift desk, checklist, submission, fixer queue,
close-out photo upload) still run on the local `store` JS object rather
than posting to the real backend. This wasn't an oversight — per your own
platform-split decision, these are the field-inspector/fixer flows that
are the **app's** primary responsibility, not the website's. Wiring them
to the backend now would mean building throwaway web UI for flows that
are about to be rebuilt for the app anyway. When you start the app build,
that's the natural point to make these calls real (the backend endpoints
already exist and were tested — see below).

Grievance Handling (originally scoped as Phase 3, not Phase 1/2) is not
included in this pass.

## What was actually tested

I don't have a way to run a real browser against a locally-started server
in this environment (sandbox networking isolates headless-browser
processes from the shell), so testing was done at two levels:

1. **Backend, fully live-tested**: server boots clean, seed data loads
   without error, all 3 new routers respond correctly, both new analytics
   endpoints return correct data, and — critically — the *entire existing
   mutating chain* (dgms-alert → assign → close → verify) was re-tested
   end-to-end after converting those functions to `async def` and still
   returns 200 OK with no tracebacks. The WebSocket layer was verified
   with a real Python WebSocket client that received a live broadcast
   the instant a POST request hit `/environmental/records` from a
   separate connection — this is the actual mechanism, proven working,
   not just code that looks plausible.
2. **Frontend, statically verified**: both new/modified JS files pass
   `node --check` (valid syntax), HTML section tags are balanced, and
   every new function call (`showLiveToast`, `fetchAndUpdateComplianceKPI`,
   `renderScreen10ViolationsTable`, etc.) was cross-checked against its
   actual existing signature in `app.js`. I have **not** visually
   confirmed the new screens render correctly in a live browser — please
   check that when you run it locally, especially the Tailwind class
   combinations on the new KPI cards and tables.

## How to run

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python run_server.py
```
Runs on `http://127.0.0.1:8000`. Docs at `/docs`. Deletes and reseeds
`khadan_rakshak.db` on every fresh start (per existing project behavior).

**Frontend:**
```bash
cd frontend
python3 -m http.server 8080
```
Open `http://127.0.0.1:8080/index.html`. It talks to the backend at
`http://127.0.0.1:8000/api/v1` by default. To point it at a deployed
backend instead, add this line to `index.html` *before* the
`live-integration.js` script tag:
```html
<script>window.KHADAN_API_BASE = "https://your-deployed-backend.com/api/v1";</script>
```

**To see the live cross-role updates in action:** open the site in two
browser tabs, log into one as a Mine Manager and hit `/docs` on the
backend in a third tab to fire a POST against, e.g.,
`/api/v1/environmental/records` — both open tabs will show a live toast
and (if on screen 13) refresh automatically.

## Suggested next step

Wire screens 2/4/5/7/8 to the real backend as part of the app build (the
endpoints — `/inspections/*`, `/actions/assign`, `/actions/{id}/close` —
already exist and are tested), or continue on the website with Grievance
Handling (Phase 3) if you want that on web first.
