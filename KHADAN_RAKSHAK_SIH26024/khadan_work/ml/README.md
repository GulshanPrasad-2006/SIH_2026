# SATARK-KOYLA — ML Pipeline

Complete ML pipeline for coal mine safety and compliance risk prediction (SIH-26024).

## Models

### Model A — Hybrid RF + Isolation Forest (Operational Safety)
- **Accuracy**: 92.7% | **ROC-AUC**: 0.98 | **Recall**: 92.3%
- **Input**: Weekly violation velocity, compliance trends, MTTF, methane/dust/strata sensors
- **Target**: Binary `is_high_risk` classification
- **Files**: `models/hybrid_rf_model.joblib`, `models/isolation_forest.joblib`

### Model B — XGBoost Compliance Scorer (Regulatory Risk)
- **Accuracy**: 97.86% | **F1-weighted**: 97.75%
- **Input**: 53 features — clearance statuses, geological data, SANKET DGMS safety context
- **Target**: 4-class risk level (Low / Medium / High / Critical)
- **Files**: `models/xgboost_compliance_model.pkl`, `models/xgboost_feature_names.json`

## Datasets (all in `data/`)

| File | Source | Rows | Description |
|------|--------|------|-------------|
| `ml_dataset_final.csv` | Real PDFs + synthetic | 91 | Primary training set for Model B |
| `synthetic_mine_panel.csv` | Generated | 70 mines × 52 weeks | Training set for Model A |
| `individual_accidents.csv` | SANKET/DGMS | 328 | Fatal accident records 2016-2022 |
| `yearly_accident_trend.csv` | SANKET/DGMS | 26 | National fatality trend 1997-2022 |
| `state_year_safety_features.csv` | SANKET/DGMS | 59 | State-level safety features |
| `causewise_fatal_trend.csv` | SANKET/DGMS | 170 | Cause × year breakdown |
| `dangerous_occurrences.csv` | SANKET/DGMS | 180 | Dangerous occurrence types |
| `dgms_fatal_accidents_2016_2022.csv` | DGMS | - | Individual fatal accidents |

## Quick Start

### Retrain Model B (XGBoost)
```bash
cd ml
pip install -r requirements.txt
python build_dataset.py          # rebuilds ml_dataset_final.csv
python train_xgboost_compliance.py  # trains + saves model
```

### Retrain Model A (Hybrid RF+IF)
```bash
python run_all.py                # generates panel, runs all 8 experiments, exports model
```

### Run Inference
```python
from inference_pipeline import MineRiskPredictor
predictor = MineRiskPredictor()
result = predictor.predict({
    "mine_name": "BCCL - Jharia Colliery",
    "total_violations": 4,
    "critical_violations": 2,
    "overdue_rate": 0.33,
    "compliance_score": 88.5,
    "depth_meters": 310,
    "gassy_degree_num": 3
})
print(result["risk_score"], result["risk_tier"])
```

## Feature Engineering
- **Rolling windows**: 4-week and 13-week compliance/violation trends
- **Momentum indicators**: Violation acceleration ratio
- **Interaction terms**: Gassy degree × critical violations, depth × strata tell-tale
- **DGMS hazard index**: Weighted cause risk from 10-year accident data
- **SANKET state features**: State-level fatality rates, cause distributions (2022)
- **Isolation Forest anomaly score**: Unsupervised outlier detection as supervised feature

## Experiment Results (Model A variants)
| Approach | Accuracy | Recall | F1 | ROC-AUC |
|----------|----------|--------|----|---------|
| Baseline (always Low) | 64.5% | 0% | 0.0 | - |
| RF basic features | 92.2% | 87.9% | 0.89 | 0.979 |
| RF engineered features | 92.5% | 91.1% | 0.90 | 0.978 |
| **Hybrid RF+IF tuned threshold** | **92.7%** | **92.3%** | **0.90** | **0.978** |
