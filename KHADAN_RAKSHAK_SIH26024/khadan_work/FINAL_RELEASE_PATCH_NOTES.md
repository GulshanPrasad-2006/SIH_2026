# KHADAN RAKSHAK Final Release Patch Notes

## Final GIS + RBAC hardening

- Replaced the OpenStreetMap/Leaflet tile dependency on Screen 17 with a self-contained offline DGMS Field Paper Map rendered as SVG. The page no longer fails with OpenStreetMap `403 Access blocked` tile panels.
- DGMS Central Directorate users can select `ALL` or any of the five canonical collieries and see consolidated mine markers.
- Mine Managers are hard-locked to their assigned colliery in the Screen 17 selector and backend GIS endpoints.
- Open GPS-tagged violation markers on the paper map are restricted to the manager's own mine.
- Screen 15 recurring-violation analytics now passes role/mine scope to the backend and applies a frontend defense-in-depth filter.
- Screen 15 anomaly analytics is similarly mine-scoped for managers/supervisors while remaining consolidated for DGMS.
- Recurring and anomaly backend queries use exact canonical mine matching to prevent cross-colliery leakage.

## Verification

- Python syntax checks: PASS
- JavaScript syntax checks (`app.js`, `phase3.js`): PASS
- Manager GIS `ALL` request: returned only BCCL - Jharia Colliery
- DGMS GIS `ALL` request: returned all 5 canonical collieries
- Manager GIS violations: returned only BCCL - Jharia Colliery
- Manager recurring analytics `ALL` request: server-side scope enforced
- Manager anomaly analytics `ALL` request: returned only BCCL - Jharia Colliery
- DGMS recurring analytics remains consolidated
- Existing final smoke suite: PASS
