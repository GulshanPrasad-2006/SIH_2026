"""
Production Inference Engine for SATARK-KOYLA Coal Mine Risk Prediction
Loads exported Hybrid IF + RF model and provides real-time risk scoring,
anomaly detection, and factor attribution for the backend API and frontend dashboards.
"""

import json
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

from feature_engineering import extract_single_mine_features, ENGINEERED_FEATURE_NAMES

class MineRiskPredictor:
    def __init__(self, models_dir: Path = None):
        if models_dir is None:
            models_dir = Path(__file__).resolve().parent / "models"
        
        self.models_dir = models_dir
        self.iso_model = None
        self.rf_model = None
        self.metadata = None
        self.optimal_threshold = 0.38
        self._load_models()

    def _load_models(self):
        iso_path = self.models_dir / "isolation_forest.joblib"
        rf_path = self.models_dir / "hybrid_rf_model.joblib"
        meta_path = self.models_dir / "pipeline_metadata.json"

        if iso_path.exists() and rf_path.exists() and meta_path.exists():
            try:
                self.iso_model = joblib.load(iso_path)
                self.rf_model = joblib.load(rf_path)
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)
                self.optimal_threshold = self.metadata.get("optimal_threshold", 0.38)
                self.is_loaded = True
            except Exception as e:
                print(f"Warning: Failed to load serialized models: {e}. Using calibrated heuristic.")
                self.is_loaded = False
        else:
            self.is_loaded = False

    def predict(self, mine_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end inference on a single mine snapshot dictionary.
        Returns risk score (0-100), risk tier, anomaly score, and top contributing factors.
        """
        feat_dict = extract_single_mine_features(mine_data)

        if self.is_loaded:
            # Build feature vector in exact order
            raw_vec = [feat_dict[col] for col in ENGINEERED_FEATURE_NAMES]
            X_raw = np.array([raw_vec])

            # Anomaly score from Isolation Forest
            anomaly_score = float(-self.iso_model.decision_function(X_raw)[0])
            X_hybrid = np.column_stack([X_raw, [[anomaly_score]]])

            # Probability of high risk from Random Forest
            prob_high_risk = float(self.rf_model.predict_proba(X_hybrid)[0, 1])
            is_high_risk = bool(prob_high_risk >= self.optimal_threshold)

            # Continuous statutory risk score (0 - 100)
            risk_score = round(prob_high_risk * 100.0, 1)
        else:
            # Calibrated fallback if model files are not yet generated
            viols = feat_dict["total_violations"]
            crits = feat_dict["critical_violations"]
            overdue_r = feat_dict["overdue_rate"]
            comp = feat_dict["compliance_score"]
            anomaly_score = 0.12 if crits > 1 else 0.04

            calc = (viols * 6.5) + (crits * 18.0) + (overdue_r * 25.0) + max(100.0 - comp, 0.0) * 0.8
            risk_score = round(min(max(calc, 12.0), 96.0), 1)
            prob_high_risk = risk_score / 100.0
            is_high_risk = prob_high_risk >= self.optimal_threshold

        # Safety tier classification
        if risk_score >= 70.0:
            tier = "HIGH RISK"
        elif risk_score >= 40.0:
            tier = "MODERATE RISK"
        else:
            tier = "SAFE / LOW RISK"

        # Explainability: Top Contributing Risk Factors
        top_factors = self._identify_top_risk_factors(feat_dict, anomaly_score)

        return {
            "mine_name": mine_data.get("name") or mine_data.get("mine_name") or "Colliery Unit",
            "risk_score": risk_score,
            "risk_tier": tier,
            "is_high_risk": is_high_risk,
            "high_risk_probability": round(prob_high_risk, 3),
            "anomaly_score": round(anomaly_score, 4),
            "decision_threshold": self.optimal_threshold,
            "top_risk_factors": top_factors,
            "model_version": self.metadata.get("model_version", "hybrid_rf_if_v1") if self.metadata else "hybrid_rf_if_v1",
            "statutory_recommendation": (
                "Immediate DGMS statutory review and daily shift audit required."
                if risk_score >= 70.0
                else "Bi-weekly ventilation and strata monitoring recommended."
                if risk_score >= 40.0
                else "Standard routine shift compliance inspection sufficient."
            )
        }

    def _identify_top_risk_factors(self, feat_dict: Dict[str, Any], anomaly_score: float) -> List[str]:
        factors = []
        if feat_dict["critical_violations"] >= 2:
            factors.append(f"{feat_dict['critical_violations']} Critical Violations active (immediate danger)")
        elif feat_dict["critical_violations"] == 1:
            factors.append("Active Critical Violation requiring 24h remediation")

        if feat_dict["overdue_rate"] > 0.30:
            factors.append(f"High statutory overdue action rate ({feat_dict['overdue_rate']:.0%})")

        if feat_dict["methane_ch4_pct"] > 0.40:
            factors.append(f"Elevated return airway methane concentration ({feat_dict['methane_ch4_pct']:.2f}% CH4)")

        if feat_dict["strata_tell_tale_mm"] > 3.0:
            factors.append(f"Significant roof bed separation recorded ({feat_dict['strata_tell_tale_mm']:.1f} mm tell-tale)")

        if feat_dict["compliance_trend"] < -2.0:
            factors.append("Downward 13-week compliance trajectory observed")

        if anomaly_score > 0.15:
            factors.append("Isolation Forest detected operational outlier anomaly")

        if not factors:
            factors.append("All physical parameters within statutory green thresholds")

        return factors[:3]

# Default singleton instance
predictor = MineRiskPredictor()

if __name__ == "__main__":
    sample = {
        "mine_name": "BCCL - Jharia Colliery",
        "total_violations": 4,
        "critical_violations": 2,
        "overdue_rate": 0.33,
        "compliance_score": 88.5,
        "depth_meters": 310,
        "gassy_degree_num": 3
    }
    pred = predictor.predict(sample)
    print("Inference Test Result:")
    for k, v in pred.items():
        print(f"  {k}: {v}")
