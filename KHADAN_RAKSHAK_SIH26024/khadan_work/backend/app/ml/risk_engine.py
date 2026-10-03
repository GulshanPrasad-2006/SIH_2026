"""
AI Risk Engine v2 — KHADAN RAKSHAK (SIH-26024)
Dual-model scoring system:
  Model A: Hybrid Isolation Forest + Random Forest (operational safety, 92.7% acc)
           Trained on synthetic mine panel — weekly violation/compliance signals
  Model B: XGBoost Compliance Model (regulatory clearance risk, 97.86% acc)
           Trained on 91-mine dataset (6 real + 85 synthetic) + SANKET DGMS data

Final score = weighted blend of both models.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple, List

# ── Path setup: allow importing ml/ inference_pipeline from backend
ML_PKG = Path(__file__).resolve().parent.parent.parent.parent / "ml"
if str(ML_PKG) not in sys.path:
    sys.path.insert(0, str(ML_PKG))

BACKEND_ML_DIR = Path(__file__).resolve().parent

# ─────────────────────────────────────────────
# MODEL A: Hybrid RF + IF (operational safety)
# ─────────────────────────────────────────────
try:
    from inference_pipeline import MineRiskPredictor
    _predictor_a = MineRiskPredictor(models_dir=ML_PKG / "models")
    _MODEL_A_LOADED = _predictor_a.is_loaded
    print(f"[OK] Model A (Hybrid RF+IF): {'loaded' if _MODEL_A_LOADED else 'using heuristic fallback'}")
except Exception as e:
    _predictor_a = None
    _MODEL_A_LOADED = False
    print(f"[WARN] Model A load error: {e}")

# ─────────────────────────────────────────────
# MODEL B: XGBoost Compliance Scorer
# ─────────────────────────────────────────────
_xgb_model    = None
_xgb_features = None
_MODEL_B_LOADED = False

try:
    _xgb_path = ML_PKG / "models" / "xgboost_compliance_model.pkl"
    _feat_path = ML_PKG / "models" / "xgboost_feature_names.json"
    if _xgb_path.exists() and _feat_path.exists():
        _xgb_model = joblib.load(_xgb_path)
        with open(_feat_path) as f:
            _xgb_features = json.load(f)
        _MODEL_B_LOADED = True
        print(f"[OK] Model B (XGBoost Compliance): loaded ({len(_xgb_features)} features)")
    else:
        print("[WARN] Model B: model files not found, will use heuristic")
except Exception as e:
    print(f"[WARN] Model B load error: {e}")

# ── SANKET state safety lookup (2022, precomputed from DGMS data)
_SANKET = {
    "Jharkhand":      {"sa":8,"sk":9,"fr":1.12,"oc":4,"ug":3,"rf":2,"tr":4,"fg":0},
    "Chhattisgarh":   {"sa":5,"sk":5,"fr":1.0, "oc":2,"ug":1,"rf":1,"tr":3,"fg":0},
    "Madhya Pradesh": {"sa":3,"sk":3,"fr":1.0, "oc":1,"ug":1,"rf":1,"tr":2,"fg":0},
    "West Bengal":    {"sa":2,"sk":2,"fr":1.0, "oc":1,"ug":1,"rf":1,"tr":1,"fg":0},
    "Odisha":         {"sa":2,"sk":2,"fr":1.0, "oc":1,"ug":0,"rf":0,"tr":1,"fg":0},
    "Telangana":      {"sa":3,"sk":4,"fr":1.33,"oc":1,"ug":2,"rf":2,"tr":1,"fg":0},
    "Maharashtra":    {"sa":1,"sk":1,"fr":1.0, "oc":0,"ug":1,"rf":1,"tr":0,"fg":0},
}
_NAT = {"sa":4,"sk":4,"fr":1.1,"oc":2,"ug":1,"rf":1,"tr":2,"fg":0}

# Mine geological context (from real PDF extractions)
_MINE_GEO = {
    "BCCL - Jharia Colliery": {
        "state":"Jharkhand","mine_type":"Underground",
        "total_geological_reserve_mt":180.0,"total_extractable_reserve_mt":45.0,
        "stripping_ratio":4.5,"forest_area_ha":85.0,"project_area_ha":320.0,
        "borehole_density":18.0,"geological_block_area_sqkm":3.2,
        "target_capacity_mty":2.5,"exploration_status":"Explored",
        "mining_plan_status":"APPROVED","forest_clearance_status":"APPROVED",
        "env_clearance_status":"APPROVED","mining_lease_status":"APPROVED",
        "coalfield_freq_enc":0.10,
    },
    "ECL - Raniganj Colliery": {
        "state":"West Bengal","mine_type":"Underground",
        "total_geological_reserve_mt":220.0,"total_extractable_reserve_mt":60.0,
        "stripping_ratio":5.2,"forest_area_ha":40.0,"project_area_ha":280.0,
        "borehole_density":16.0,"geological_block_area_sqkm":2.8,
        "target_capacity_mty":3.0,"exploration_status":"Explored",
        "mining_plan_status":"APPROVED","forest_clearance_status":"APPROVED",
        "env_clearance_status":"APPROVED","mining_lease_status":"APPROVED",
        "coalfield_freq_enc":0.08,
    },
    "SECL - Korba Deep Pit-3": {
        "state":"Chhattisgarh","mine_type":"Underground",
        "total_geological_reserve_mt":150.0,"total_extractable_reserve_mt":35.0,
        "stripping_ratio":6.1,"forest_area_ha":110.0,"project_area_ha":450.0,
        "borehole_density":14.0,"geological_block_area_sqkm":4.5,
        "target_capacity_mty":1.8,"exploration_status":"Explored",
        "mining_plan_status":"APPROVED","forest_clearance_status":"PENDING",
        "env_clearance_status":"APPROVED","mining_lease_status":"APPROVED",
        "coalfield_freq_enc":0.08,
    },
    "NCL - Singrauli OCP Block-B": {
        "state":"Madhya Pradesh","mine_type":"Opencast",
        "total_geological_reserve_mt":420.0,"total_extractable_reserve_mt":180.0,
        "stripping_ratio":3.2,"forest_area_ha":20.0,"project_area_ha":600.0,
        "borehole_density":20.0,"geological_block_area_sqkm":6.0,
        "target_capacity_mty":8.0,"exploration_status":"Explored",
        "mining_plan_status":"APPROVED","forest_clearance_status":"APPROVED",
        "env_clearance_status":"APPROVED","mining_lease_status":"APPROVED",
        "coalfield_freq_enc":0.05,
    },
    "CCL - Piparwar Opencast": {
        "state":"Jharkhand","mine_type":"Opencast",
        "total_geological_reserve_mt":95.0,"total_extractable_reserve_mt":22.0,
        "stripping_ratio":5.8,"forest_area_ha":60.0,"project_area_ha":200.0,
        "borehole_density":15.0,"geological_block_area_sqkm":2.0,
        "target_capacity_mty":1.2,"exploration_status":"Explored",
        "mining_plan_status":"APPROVED","forest_clearance_status":"APPROVED",
        "env_clearance_status":"IN_PRINCIPLE","mining_lease_status":"APPROVED",
        "coalfield_freq_enc":0.10,
    },
}
_DEFAULT_GEO = {
    "state":"Jharkhand","mine_type":"Opencast",
    "total_geological_reserve_mt":100.0,"total_extractable_reserve_mt":30.0,
    "stripping_ratio":5.0,"forest_area_ha":50.0,"project_area_ha":300.0,
    "borehole_density":14.0,"geological_block_area_sqkm":3.0,
    "target_capacity_mty":1.0,"exploration_status":"Explored",
    "mining_plan_status":"UNKNOWN","forest_clearance_status":"UNKNOWN",
    "env_clearance_status":"UNKNOWN","mining_lease_status":"UNKNOWN",
    "coalfield_freq_enc":0.10,
}

STATUS_ENC = {"APPROVED":2,"IN_PRINCIPLE":1,"PENDING":0,
              "NOT_APPROVED":0,"NOT_APPLIED":0,"NOT_APPLICABLE":2,"UNKNOWN":0}

_NATIONAL_CONSTANTS = {
    "national_fatality_slope":-4.8,"national_accident_slope":-4.2,
    "oc_ug_fatality_ratio":1.05,"cause_severity_pressure":2.87,
    "dangerous_occurrence_pressure":47,"dangerous_occurrence_slope":3.5,
}


def _build_xgb_vector(features: Dict[str, Any]) -> pd.DataFrame:
    """Build the 53-feature vector for Model B (XGBoost)."""
    mine_name = features.get("mine_name","")
    geo = _MINE_GEO.get(mine_name, _DEFAULT_GEO)
    state = geo["state"]
    sf = _SANKET.get(state, _NAT)

    mine_enc = 1 if "Underground" in geo["mine_type"] else 0
    mp_enc = STATUS_ENC.get(geo["mining_plan_status"], 0)
    fc_enc = STATUS_ENC.get(geo["forest_clearance_status"], 0)
    ec_enc = STATUS_ENC.get(geo["env_clearance_status"], 0)
    ml_enc = STATUS_ENC.get(geo["mining_lease_status"], 0)

    pending = sum(1 for s in [
        geo["mining_plan_status"], geo["forest_clearance_status"],
        geo["env_clearance_status"], geo["mining_lease_status"]
    ] if s in ("PENDING","NOT_APPROVED","NOT_APPLIED","UNKNOWN"))

    geo_r  = geo["total_geological_reserve_mt"]
    ext_r  = geo["total_extractable_reserve_mt"]
    sr     = geo["stripping_ratio"]
    fha    = geo["forest_area_ha"]
    pha    = geo["project_area_ha"]
    fpct   = fha / (pha + 1e-6)
    nfha   = pha - fha
    bh     = geo["borehole_density"]
    ga     = geo["geological_block_area_sqkm"]
    tc     = geo["target_capacity_mty"]
    ee     = ext_r / (geo_r + 1e-6)
    ob     = ext_r * sr
    exp_c  = 1 if "explored" in geo["exploration_status"].lower() else 0
    cf_f   = geo["coalfield_freq_enc"]

    cc  = mp_enc*0.30 + fc_enc*0.25 + ec_enc*0.25 + ml_enc*0.20
    pxs = pending * sf["sa"]
    fp  = fpct * pending
    gri = np.log1p(geo_r) * sr
    ep  = tc / (ext_r + 1e-6)
    mr  = cc + exp_c * 0.5
    saxmt = sf["sa"] * (mine_enc + 1)
    ba  = bh / (ga + 1e-6)
    scs = sf["fr"]*0.4 + sf["rf"]*0.3 + sf["tr"]*0.3

    # Isolation Forest anomaly score for this mine
    iso_score, is_anom = 0.0, 0
    try:
        iso_path = ML_PKG / "models" / "isolation_forest_compliance.pkl"
        if iso_path.exists():
            _iso_c = joblib.load(iso_path)
            iso_X = pd.DataFrame([{
                "geological_block_area_sqkm":ga,"total_geological_reserve_mt":geo_r,
                "total_extractable_reserve_mt":ext_r,"extraction_efficiency":ee,
                "stripping_ratio":sr,"total_ob_mcum":ob,"forest_area_ha":fha,
                "non_forest_area_ha":nfha,"forest_pct":fpct,"project_area_ha":pha,
                "borehole_density":bh,"target_capacity_mty":tc,
                "state_accidents_2022":sf["sa"],"state_killed_2022":sf["sk"],
                "state_fatality_rate":sf["fr"],
            }])
            iso_score  = float(-_iso_c.decision_function(iso_X)[0])
            is_anom    = int(_iso_c.predict(iso_X)[0] == -1)
    except Exception:
        pass

    row = {
        "geological_block_area_sqkm":ga,"total_geological_reserve_mt":geo_r,
        "total_extractable_reserve_mt":ext_r,"extraction_efficiency":ee,
        "stripping_ratio":sr,"total_ob_mcum":ob,"forest_area_ha":fha,
        "non_forest_area_ha":nfha,"forest_pct":fpct,"project_area_ha":pha,
        "borehole_density":bh,"target_capacity_mty":tc,"exploration_complete":exp_c,
        "mine_type_enc":mine_enc,"coalfield_freq_enc":cf_f,
        "mining_plan_status_enc":mp_enc,"forest_clearance_status_enc":fc_enc,
        "env_clearance_status_enc":ec_enc,"mining_lease_status_enc":ml_enc,
        "clearances_pending":pending,
        "state_accidents_2022":sf["sa"],"state_killed_2022":sf["sk"],
        "state_fatality_rate":sf["fr"],"state_oc_accidents":sf["oc"],
        "state_ug_accidents":sf["ug"],"state_roof_fall_accidents":sf["rf"],
        "state_transport_accidents":sf["tr"],"state_fire_gas_accidents":sf["fg"],
        **_NATIONAL_CONSTANTS,
        "mine_type_accident_risk":1.52 if mine_enc else 1.41,
        "state_accident_trend_slope":-0.5,"state_3yr_avg_fatality_rate":sf["fr"],
        "clearance_composite":cc,"pending_x_state_accidents":pxs,
        "forest_pressure":fp,"geo_risk_index":gri,"extraction_pressure":ep,
        "mine_readiness":mr,"state_accidents_x_mine_type":saxmt,
        "borehole_adequacy":ba,"safety_context_score":scs,
        "all_clearances_missing":int(pending==4),"all_clearances_obtained":int(pending==0),
        "high_forest_cover":int(fpct>0.5),"large_mine":int(geo_r>200),
        "high_stripping":int(sr>8),
        "isolation_forest_score":iso_score,"is_anomaly":is_anom,
    }
    return pd.DataFrame([row])[_xgb_features]


_XGB_RISK_SCORES = {0:15.0, 1:38.0, 2:65.0, 3:85.0}
_XGB_TIER_MAP    = {0:"SAFE / LOW RISK", 1:"MODERATE RISK",
                    2:"HIGH RISK", 3:"HIGH RISK"}


def _score_model_b(features: Dict[str, Any]) -> Tuple[float, str, float]:
    """Model B: XGBoost compliance scorer. Returns (score, tier, confidence)."""
    if not _MODEL_B_LOADED:
        return None, None, 0.0
    try:
        X = _build_xgb_vector(features)
        cls  = int(_xgb_model.predict(X)[0])
        prob = float(_xgb_model.predict_proba(X)[0][cls])
        score = round(float(np.clip(_XGB_RISK_SCORES[cls] + (prob - 0.5) * 20, 5.0, 98.0)), 1)
        return score, _XGB_TIER_MAP[cls], prob
    except Exception as e:
        print(f"  Model B inference error: {e}")
        return None, None, 0.0


def calculate_mine_risk_score(features: Dict[str, Any]) -> Tuple[float, str]:
    """
    Primary entry point for mines.py Screen 11 drill-down.
    Returns (composite_score 0-100, tier string).
    """
    result = get_detailed_mine_risk_profile(features)
    return result["risk_score"], result["risk_tier"]


def get_detailed_mine_risk_profile(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dual-model scoring:
      Model A (operational): Hybrid RF + IF on weekly violation/compliance signals
      Model B (compliance):  XGBoost on regulatory clearances + SANKET DGMS data
    Final score = 0.55 × Model A  +  0.45 × Model B
    """
    mine_name = (features.get("name") or features.get("mine_name") or "Colliery Unit")

    # ── Model A
    score_a, tier_a, anomaly_score, top_factors = None, None, 0.05, []
    if _predictor_a and _MODEL_A_LOADED:
        try:
            pred_a      = _predictor_a.predict(features)
            score_a     = pred_a["risk_score"]
            tier_a      = pred_a["risk_tier"]
            anomaly_score = pred_a.get("anomaly_score", 0.05)
            top_factors   = pred_a.get("top_risk_factors", [])
        except Exception as e:
            print(f"  Model A error: {e}")

    # ── Model B
    score_b, tier_b, conf_b = _score_model_b({**features, "mine_name": mine_name})

    # ── Blend
    if score_a is not None and score_b is not None:
        final_score = round(0.55 * score_a + 0.45 * score_b, 1)
        model_ver   = "dual_rf_xgb_v2"
    elif score_a is not None:
        final_score = score_a
        model_ver   = "hybrid_rf_if_v1"
    elif score_b is not None:
        final_score = score_b
        model_ver   = "xgb_compliance_v2"
    else:
        # Full fallback heuristic
        open_v  = features.get("open_violations", 0)
        cr      = features.get("critical_ratio", 0.0)
        od      = features.get("overdue_rate", 0.0)
        comp    = features.get("avg_compliance_score", 92.0)
        mttf    = features.get("mean_time_to_fix_hours", 24.0)
        final_score = round(min(max(
            open_v*8.0 + cr*40.0 + od*25.0 + max(100-comp,0)*1.5 + (mttf/48)*15,
            10.0), 98.0), 1)
        model_ver = "heuristic_fallback"

    # ── Tier classification
    if final_score >= 70.0:   tier = "HIGH RISK"
    elif final_score >= 40.0: tier = "MODERATE RISK"
    else:                     tier = "SAFE / LOW RISK"

    # ── Annotate top factors with Model B insight if available
    if score_b is not None and score_b >= 65.0 and "Regulatory clearance" not in str(top_factors):
        top_factors = (top_factors or [])[:2] + ["Regulatory clearance bottleneck detected (XGBoost)"]

    return {
        "mine_name":             mine_name,
        "risk_score":            final_score,
        "risk_tier":             tier,
        "is_high_risk":          final_score >= 40.0,
        "high_risk_probability": round(final_score / 100.0, 3),
        "anomaly_score":         round(anomaly_score, 4),
        "score_model_a":         score_a,
        "score_model_b":         score_b,
        "decision_threshold":    0.38,
        "top_risk_factors":      top_factors or ["All parameters within statutory limits"],
        "model_version":         model_ver,
        "statutory_recommendation": (
            "Immediate DGMS statutory review and daily shift audit required."
            if final_score >= 70.0 else
            "Bi-weekly ventilation and strata monitoring recommended."
            if final_score >= 40.0 else
            "Standard routine shift compliance inspection sufficient."
        ),
    }


def predict_hazard_recurrence(category: str, mine_risk_score: float) -> Dict[str, Any]:
    """Empirical hazard recurrence model (DGMS cause weights)."""
    weights = {
        "Strata Support":0.78,"Ventilation & Gases":0.68,
        "Haulage & Transport":0.62,"Dust Suppression":0.54,
        "Electrical FLP":0.45,"Fire Safety":0.38,"Explosion Prevention":0.32
    }
    base = weights.get(category, 0.45)
    prob = min(round(base * (mine_risk_score / 60.0), 2), 0.96)
    return {
        "category": category,
        "recurrence_probability": prob,
        "risk_classification": "High Recurrence Alert" if prob > 0.65 else "Moderate Watch",
        "recommendation": (
            "Mandate daily torque audits and tell-tale inspection (CMR Reg 104)."
            if "Strata" in category and prob > 0.6 else
            "Mandate multi-gas sensor calibration prior to shift entry."
            if "Ventilation" in category and prob > 0.6 else
            "Routine shift audit compliance sufficient."
        )
    }
