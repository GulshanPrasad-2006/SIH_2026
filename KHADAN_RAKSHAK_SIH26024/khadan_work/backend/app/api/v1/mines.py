from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.mine import Mine
from app.schemas.analytics import MineDrilldownOut
from app.ml.feature_extractor import extract_mine_features
from app.ml.risk_engine import calculate_mine_risk_score, get_detailed_mine_risk_profile

router = APIRouter(prefix="/mines", tags=["Screen 11: Corporate Mine Health & Risk Index"])

@router.get("/drill-down", response_model=List[MineDrilldownOut])
def get_mines_drilldown(db: Session = Depends(get_db)):
    """
    Screen 11: Multi-mine subsidiary ranking with dynamic AI Risk Scoring Index.
    Integrates the production Hybrid Isolation Forest + Random Forest model.
    """
    mines = db.query(Mine).all()
    results = []

    for m in mines:
        features = extract_mine_features(m.name, db)
        features["depth_meters"] = int(m.depth.replace("m", "")) if m.depth and "m" in m.depth else 250
        features["gassy_degree_num"] = 3 if "III" in m.gassy_category else 2 if "II" in m.gassy_category else 1
        features["mine_type"] = m.mine_type

        # Call the Hybrid ML Risk Predictor
        diag = get_detailed_mine_risk_profile(features)
        computed_score = diag["risk_score"]
        tier = diag["risk_tier"]
        anomaly_score = diag.get("anomaly_score", 0.05)
        top_factors = diag.get("top_risk_factors", [])

        # Update cached risk score on model
        m.risk_score = computed_score

        results.append(MineDrilldownOut(
            id=m.id,
            name=m.name,
            subsidiary=m.subsidiary,
            zone=m.zone,
            mine_type=m.mine_type,
            depth=m.depth,
            gassy_category=m.gassy_category,
            risk_score=computed_score,
            risk_level=tier,
            compliance_rate=m.compliance_rate,
            open_violations=features["open_violations"],
            critical_violations=features["critical_count"],
            last_audit="Recent Shift Audit",
            anomaly_score=anomaly_score,
            top_risk_factors=top_factors
        ))

    db.commit()
    return sorted(results, key=lambda x: x.risk_score, reverse=True)

@router.get("/{mine_id}", response_model=MineDrilldownOut)
def get_mine_by_id(mine_id: int, db: Session = Depends(get_db)):
    """
    Fetches detailed risk profile for a specific coal mine.
    """
    m = db.query(Mine).filter(Mine.id == mine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mine not found")

    features = extract_mine_features(m.name, db)
    features["depth_meters"] = int(m.depth.replace("m", "")) if m.depth and "m" in m.depth else 250
    features["gassy_degree_num"] = 3 if "III" in m.gassy_category else 2 if "II" in m.gassy_category else 1
    features["mine_type"] = m.mine_type

    diag = get_detailed_mine_risk_profile(features)

    return MineDrilldownOut(
        id=m.id,
        name=m.name,
        subsidiary=m.subsidiary,
        zone=m.zone,
        mine_type=m.mine_type,
        depth=m.depth,
        gassy_category=m.gassy_category,
        risk_score=diag["risk_score"],
        risk_level=diag["risk_tier"],
        compliance_rate=m.compliance_rate,
        open_violations=features["open_violations"],
        critical_violations=features["critical_count"],
        last_audit="Recent Shift Audit",
        anomaly_score=diag.get("anomaly_score", 0.05),
        top_risk_factors=diag.get("top_risk_factors", [])
    )
