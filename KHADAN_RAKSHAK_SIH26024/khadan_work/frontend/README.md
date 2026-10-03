# KHADAN RAKSHAK — Frontend

## Stack
Plain HTML + Tailwind CSS (CDN) + Chart.js + FontAwesome

## Setup
No build step required. Open `index.html` directly in a browser, or serve with any static server:
```bash
npx serve .
# or
python -m http.server 8080
```

## Configuration
The backend API base URL is set at the top of `app.js`:
```js
const API_BASE = "http://127.0.0.1:8000/api/v1";
```
Change this to your deployed backend URL before production.

## Screens
| Screen | Role | Description |
|--------|------|-------------|
| 1  | All      | Login & Mine Selection |
| 2  | Worker   | Start Inspection Home |
| 3  | Worker   | Interactive 10-Item CMR 2017 Checklist |
| 4  | Worker   | Review & Submit |
| 5  | Officer  | Assign Corrective Actions |
| 6  | Fixer    | My Assigned Actions |
| 7  | Fixer    | Close Out Violation |
| 8  | Supervisor | Verify Before/After Photos |
| 9  | Manager  | Executive Dashboard + KPI Charts |
| 10 | Manager  | Violations Audit Table |
| 11 | Corporate| Mine Drill-down + AI Risk Scores |

## Demo Credentials
| Username | Password | Role |
|----------|----------|------|
| rajesh.sharma | Koyla@2026 | Field Worker |
| vk.mehta | Mehta@2026 | Manager |
| anil.verma | Verma@2026 | Fixer |
| s.mukherjee | Mukh@2026 | Supervisor |
| a.roy | Roy@2026 | Corporate |
