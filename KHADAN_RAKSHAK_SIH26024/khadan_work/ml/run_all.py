"""
Master Execution Script for SIH-26024 Coal Mine Safety Risk Machine Learning Pipeline
Executes panel generation, feature engineering, model benchmarking across all 8 variants,
trains the production hybrid pipeline, exports artifacts, and runs sample inference.
"""

import sys
from pathlib import Path

ml_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(ml_dir))

from generate_synthetic_panel import generate_panel_data
from feature_engineering import engineer_features
from model_experiments import run_experiments
from train_and_export_model import train_and_export
from inference_pipeline import MineRiskPredictor

def main():
    print("=" * 80)
    print("  SIH-26024 COAL MINE RISK MODEL & FEATURE ENGINEERING PIPELINE")
    print("  Hybrid Isolation Forest + Random Forest Architecture")
    print("=" * 80)

    # 1. Generate Synthetic Panel Data
    print("\n[Step 1/4] Generating Synthetic Panel History (70 Mines, ~6,200 Snapshots)...")
    generate_panel_data()

    # 2. Run All Model Experiments & Threshold Tuning
    print("\n[Step 2/4] Running Benchmark Experiments (Variants 0 through 8)...")
    exp_results = run_experiments()

    # 3. Train & Export Production Hybrid Model
    print("\n[Step 3/4] Training Production Model & Serializing Artifacts...")
    metadata = train_and_export()

    # 4. Test Production Real-Time Inference
    print("\n[Step 4/4] Verifying Real-Time Production Inference Pipeline...")
    predictor = MineRiskPredictor()

    test_mines = [
        {
            "name": "BCCL - Jharia Underground Colliery",
            "total_violations": 4,
            "critical_violations": 2,
            "major_violations": 1,
            "minor_violations": 1,
            "overdue_count": 2,
            "overdue_rate": 0.50,
            "compliance_score": 82.5,
            "mean_time_to_fix_hours": 36.0,
            "depth_meters": 310,
            "gassy_degree_num": 3,
            "methane_ch4_pct": 0.44,
            "strata_tell_tale_mm": 3.8,
            "mine_type": "Underground"
        },
        {
            "name": "NCL - Singrauli OCP Block-B",
            "total_violations": 1,
            "critical_violations": 0,
            "major_violations": 0,
            "minor_violations": 1,
            "overdue_count": 0,
            "overdue_rate": 0.0,
            "compliance_score": 97.4,
            "mean_time_to_fix_hours": 14.0,
            "depth_meters": 90,
            "gassy_degree_num": 1,
            "methane_ch4_pct": 0.04,
            "strata_tell_tale_mm": 0.4,
            "mine_type": "Opencast"
        }
    ]

    for m in test_mines:
        pred = predictor.predict(m)
        print(f"\n>> Colliery: {pred['mine_name']}")
        print(f"   Risk Score:      {pred['risk_score']} / 100 ({pred['risk_tier']})")
        print(f"   Anomaly Score:   {pred['anomaly_score']} (Isolation Forest)")
        print(f"   High Risk Flag:  {pred['is_high_risk']} (Prob: {pred['high_risk_probability']:.1%})")
        print(f"   Top Risk Factors:{', '.join(pred['top_risk_factors'])}")
        print(f"   Action Direct:   {pred['statutory_recommendation']}")

    print("\n" + "=" * 80)
    print("  ALL PIPELINE STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
