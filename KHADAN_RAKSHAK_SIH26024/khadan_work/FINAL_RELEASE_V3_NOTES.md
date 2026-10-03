# KHADAN RAKSHAK — Final Release V3 Notes

## GIS / Screen 17
- Replaced external OpenStreetMap tile dependency with the offline DGMS paper-map renderer.
- DGMS Central Officer now has an explicit `Consolidated View — All 5 Mines` option plus each individual colliery.
- Consolidated DGMS map loads all GPS-tagged violations across the permitted mines.
- Mine-level views load every GPS-tagged violation for that mine, across Critical, Major and Minor severity.
- Violation status is retained on the map: OPEN, PENDING_VERIFICATION and CLOSED.
- Active violations use severity-specific markers; closed violations use a muted marker.
- Map summary reports violation counts by severity and, for DGMS, number of mines in view.
- Mine Manager remains strictly locked to the manager's assigned mine at both frontend and backend.

## Verification
- JavaScript syntax check: PASS
- Python syntax check: PASS
- Existing final-release smoke suite: PASS
- DGMS `/gis/mines?mine=ALL`: 5 mines returned
- DGMS `/gis/violations?mine=ALL`: all available GPS-tagged violation records returned, including Critical/Major/Minor and all statuses
- Jharia Manager `/gis/mines?mine=ALL`: 1 mine returned (Jharia)
- Jharia Manager `/gis/violations?mine=ALL`: only Jharia records returned
