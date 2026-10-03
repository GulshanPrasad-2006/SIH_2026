# KHADAN RAKSHAK — SIH26024 GIS V5 Final Release Notes

## GIS V5 fixes

### 1. More spread-out field map
- Screen 17 map canvas increased from 560px to 720px.
- Single-mine views use a tighter local geographic extent so the mine and its field violations occupy the map instead of being compressed into a small cluster.
- Coordinate grid density increased for easier field-zone reading.
- Real GPS coordinates remain authoritative: violation markers stay at their recorded coordinates.
- Only callout labels are offset with leader lines to prevent labels from overlapping nearby violations.

### 2. Severity filtering
- Severity values are normalized case-insensitively and support SQLAlchemy enum representations.
- Critical, Major and Minor filters now correctly match backend values.
- Summary shows both displayed counts and total counts for each severity.

### 3. Status filtering
- OPEN, PENDING_VERIFICATION and CLOSED are normalized before filtering.
- Status filtering is applied after role/mine scope filtering.
- Dropdown selection is preserved during rerenders.

### 4. Control reliability
- GIS mine/severity/status controls have explicit `change` listeners in addition to inline handlers.
- This prevents stale controls after live refreshes and rerenders.

### 5. Scope remains enforced
- Mine Manager: assigned mine only.
- DGMS Officer: consolidated view or any individual mine.
- Backend remains authoritative for scope enforcement.

## Verification
- `node --check frontend/phase3.js` — PASS
- `node --check frontend/app.js` — PASS
- `python -m py_compile backend/app/api/v1/gis.py` — PASS
- `python backend/test_final.py` — PASS
