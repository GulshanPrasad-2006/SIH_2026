# KHADAN RAKSHAK — Backend

FastAPI backend powering all 11 screens of the KHADAN RAKSHAK coal mine compliance system.

## Quick Start
```bash
cd backend
pip install -r requirements.txt
python run_server.py
# API live at http://127.0.0.1:8000
# Swagger docs at http://127.0.0.1:8000/docs
```

## Environment
Copy `.env.example` to `.env` and configure:
```
PROJECT_NAME=KHADAN RAKSHAK
API_V1_STR=/api/v1
DATABASE_URL=sqlite:///./khadan_rakshak.db
UPLOAD_DIR=./uploads
```

## Project Structure
```
backend/
├── app/
│   ├── api/v1/         # 11 screen endpoints
│   ├── ml/             # Dual-model AI risk engine
│   │   ├── risk_engine.py       # Model A (RF+IF) + Model B (XGBoost) blend
│   │   └── feature_extractor.py # Live DB + geological context features
│   ├── models/         # SQLAlchemy ORM
│   ├── schemas/        # Pydantic validation
│   └── seed_data.py    # Demo data seeder
├── data/               # SANKET DGMS datasets
└── requirements.txt
```

## ML Architecture
The risk engine uses a **dual-model scoring system**:

| Model | Type | Accuracy | Input |
|-------|------|----------|-------|
| Model A | Hybrid RF + Isolation Forest | 92.7% | Live violation/compliance signals |
| Model B | XGBoost + SMOTE | 97.86% | Regulatory clearances + SANKET DGMS |

**Final score = 0.55 × Model A + 0.45 × Model B**

Model artifacts are loaded from `../ml/models/` at startup.

## Screen → Endpoint Map
| Screen | Endpoint |
|--------|----------|
| 1 Login | POST /api/v1/auth/login |
| 2 Inspections | GET /api/v1/inspections/recent |
| 3 Checklist | GET /api/v1/checklists/default |
| 4 Submit | POST /api/v1/inspections/{id}/submit |
| 5 Assign | POST /api/v1/actions/assign |
| 6 My Actions | GET /api/v1/actions/my-actions |
| 7 Close | POST /api/v1/actions/{id}/close |
| 8 Verify | POST /api/v1/verifications/{id}/review |
| 9 Dashboard | GET /api/v1/analytics/overview |
| 10 Violations | GET /api/v1/analytics/violations |
| 11 Drill-down | GET /api/v1/mines/drill-down |


## One-click local launch (recommended)

From the project root on Windows, double-click `START_KHADAN_RAKSHAK.bat`. It starts FastAPI on port 8000 and opens the bundled frontend at `http://127.0.0.1:8000/`. The frontend now resolves the API host automatically, so you no longer need a separate Live Server instance.
