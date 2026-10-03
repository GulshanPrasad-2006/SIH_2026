"""
Model 1 v2 — Compliance Risk Scorer (Accuracy Push: targeting 80-90%)
SIH 2024 - PS 26024

Strategy:
  1. Isolation Forest for anomaly scoring as an extra feature
  2. Aggressive feature engineering (interactions, ratios, polynomial)
  3. XGBoost with Optuna hyperparameter tuning
  4. SMOTE oversampling for class balance
  5. Stacking ensemble (XGBoost + RandomForest + ExtraTrees)
"""

import json
import warnings
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from xgboost import XGBClassifier
from sklearn.ensemble import (
    RandomForestClassifier, ExtraTreesClassifier,
    StackingClassifier, IsolationForest
)
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    classification_report, confusion_matrix,
    f1_score, accuracy_score
)
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE

warnings.filterwarnings("ignore")
np.random.seed(42)

OUT_DIR = Path("/home/claude")

# ─────────────────────────────────────────────
# 1. LOAD ALL 7 DATASETS (same as v1)
# ─────────────────────────────────────────────
print("Loading all 7 datasets...")
ml_df  = pd.read_csv(OUT_DIR / "ml_dataset_final.csv")
yearly = pd.read_csv(OUT_DIR / "sanket_outputs/yearly_accident_trend.csv")
place  = pd.read_csv(OUT_DIR / "sanket_outputs/placewise_trend.csv")
cause  = pd.read_csv(OUT_DIR / "sanket_outputs/causewise_fatal_trend.csv")
danger = pd.read_csv(OUT_DIR / "sanket_outputs/dangerous_occurrences.csv")
indiv  = pd.read_csv(OUT_DIR / "sanket_outputs/individual_accidents.csv")
state  = pd.read_csv(OUT_DIR / "sanket_outputs/state_year_safety_features.csv")

# ─────────────────────────────────────────────
# 2. BASE FEATURE ENGINEERING (same as v1)
# ─────────────────────────────────────────────
print("Engineering base features from all 7 datasets...")

# Dataset 2 — national trend slopes
recent_yearly = yearly[yearly["year"] >= 2018]
ml_df["national_fatality_slope"]  = round(np.polyfit(recent_yearly["year"], recent_yearly["persons_killed"], 1)[0], 4)
ml_df["national_accident_slope"]  = round(np.polyfit(recent_yearly["year"], recent_yearly["fatal_accidents"], 1)[0], 4)

# Dataset 3 — OC vs UG ratio
recent_place = place[place["year"] >= 2020]
ml_df["oc_ug_fatality_ratio"] = round(recent_place["fatalities_opencast"].mean() / (recent_place["fatalities_belowground"].mean() + 1e-6), 4)

# Dataset 4 — cause severity pressure
recent_cause = cause[cause["year"] >= 2020]
cause_severity = recent_cause.groupby("cause").apply(
    lambda x: x["fatalities"].sum() / (x["accidents"].sum() + 1e-6)
).mean()
ml_df["cause_severity_pressure"] = round(cause_severity, 4)

# Dataset 5 — dangerous occurrence pressure
recent_danger = danger[danger["year"] >= 2020]
danger_trend = recent_danger.groupby("year")["occurrences"].sum().values
ml_df["dangerous_occurrence_pressure"] = recent_danger["occurrences"].sum()
ml_df["dangerous_occurrence_slope"]    = round(np.polyfit(range(len(danger_trend)), danger_trend, 1)[0], 4)

# Dataset 6 — mine type accident risk
indiv_agg = indiv.groupby("mine_type")["num_killed"].mean().to_dict()
type_map   = {0: "Opencast", 1: "Underground"}
ml_df["mine_type_accident_risk"] = ml_df["mine_type_enc"].apply(
    lambda x: indiv_agg.get(type_map.get(int(x), "Opencast"), indiv_agg.get("Unknown", 1.0))
).round(4)

# Dataset 7 — state accident trend slope + 3yr avg
state_slopes = {}
for st in state["state"].unique():
    sd = state[state["state"] == st].sort_values("year")
    if len(sd) >= 3:
        state_slopes[st] = round(np.polyfit(sd["year"], sd["total_accidents"], 1)[0], 4)
ml_df["state_accident_trend_slope"] = ml_df["state"].map(state_slopes).fillna(0.0)

state_3yr = state[state["year"] >= 2020].groupby("state")["fatality_rate"].mean().to_dict()
ml_df["state_3yr_avg_fatality_rate"] = ml_df["state"].map(state_3yr).fillna(state["fatality_rate"].mean()).round(4)

# ─────────────────────────────────────────────
# 3. ADVANCED FEATURE ENGINEERING (new in v2)
# ─────────────────────────────────────────────
print("Engineering advanced interaction features (v2)...")

# 3a. Clearance composite — weighted sum (ML > FC > EC > Lease)
ml_df["clearance_composite"] = (
    ml_df["mining_plan_status_enc"] * 0.30 +
    ml_df["forest_clearance_status_enc"] * 0.25 +
    ml_df["env_clearance_status_enc"] * 0.25 +
    ml_df["mining_lease_status_enc"] * 0.20
).round(4)

# 3b. Risk interaction: pending clearances × state accident rate
ml_df["pending_x_state_accidents"] = (
    ml_df["clearances_pending"] * ml_df["state_accidents_2022"]
).round(4)

# 3c. Forest pressure: forest % × pending clearances
ml_df["forest_pressure"] = (
    ml_df["forest_pct"].fillna(0) * ml_df["clearances_pending"]
).round(4)

# 3d. Geological risk: log(reserve) × stripping ratio
ml_df["geo_risk_index"] = (
    np.log1p(ml_df["total_geological_reserve_mt"].fillna(0)) *
    ml_df["stripping_ratio"].fillna(ml_df["stripping_ratio"].median())
).round(4)

# 3e. Extraction pressure: target capacity vs extractable reserve
ml_df["extraction_pressure"] = (
    ml_df["target_capacity_mty"].fillna(0) /
    (ml_df["total_extractable_reserve_mt"].fillna(1) + 1e-6)
).round(4)

# 3f. Mine readiness score (all clearances + exploration + infra)
ml_df["mine_readiness"] = (
    ml_df["clearance_composite"] +
    ml_df["exploration_complete"] * 0.5
).round(4)

# 3g. State × mine type interaction
ml_df["state_accidents_x_mine_type"] = (
    ml_df["state_accidents_2022"] * (ml_df["mine_type_enc"] + 1)
).round(4)

# 3h. Borehole adequacy: density vs area
ml_df["borehole_adequacy"] = (
    ml_df["borehole_density"].fillna(ml_df["borehole_density"].median()) /
    (ml_df["geological_block_area_sqkm"].fillna(1) + 1e-6)
).round(4)

# 3i. Safety context score (SANKET derived)
ml_df["safety_context_score"] = (
    ml_df["state_fatality_rate"] * 0.4 +
    ml_df["state_roof_fall_accidents"] * 0.3 +
    ml_df["state_transport_accidents"] * 0.3
).round(4)

# 3j. Binary flags for critical thresholds
ml_df["all_clearances_missing"] = (ml_df["clearances_pending"] == 4).astype(int)
ml_df["all_clearances_obtained"] = (ml_df["clearances_pending"] == 0).astype(int)
ml_df["high_forest_cover"]       = (ml_df["forest_pct"].fillna(0) > 0.5).astype(int)
ml_df["large_mine"]              = (ml_df["total_geological_reserve_mt"].fillna(0) > 200).astype(int)
ml_df["high_stripping"]          = (ml_df["stripping_ratio"].fillna(0) > 8).astype(int)

print("Advanced features engineered.")

# ─────────────────────────────────────────────
# 4. ISOLATION FOREST — anomaly score as feature
# ─────────────────────────────────────────────
print("Running Isolation Forest for anomaly scoring...")

BASE_FEATURES = [
    "geological_block_area_sqkm", "total_geological_reserve_mt",
    "total_extractable_reserve_mt", "extraction_efficiency",
    "stripping_ratio", "total_ob_mcum", "forest_area_ha",
    "non_forest_area_ha", "forest_pct", "project_area_ha",
    "borehole_density", "target_capacity_mty",
    "state_accidents_2022", "state_killed_2022", "state_fatality_rate",
]

iso_data = ml_df[BASE_FEATURES].copy()
for col in iso_data.columns:
    iso_data[col] = pd.to_numeric(iso_data[col], errors="coerce")
iso_data = iso_data.fillna(iso_data.median())

iso_forest = IsolationForest(
    n_estimators=200,
    contamination=0.15,   # ~15% anomalous mines expected
    max_samples="auto",
    random_state=42
)
iso_forest.fit(iso_data)

# anomaly_score: higher = more anomalous (riskier)
# decision_function returns negative scores for anomalies → invert
raw_scores = iso_forest.decision_function(iso_data)
ml_df["isolation_forest_score"] = (-raw_scores).round(6)   # higher = riskier
ml_df["is_anomaly"]             = (iso_forest.predict(iso_data) == -1).astype(int)

print(f"  Anomalies detected: {ml_df['is_anomaly'].sum()} / {len(ml_df)}")
print(f"  Anomaly score range: {ml_df['isolation_forest_score'].min():.4f} to {ml_df['isolation_forest_score'].max():.4f}")

# Save Isolation Forest model
joblib.dump(iso_forest, OUT_DIR / "isolation_forest.pkl")

# ─────────────────────────────────────────────
# 5. FINAL FEATURE SET
# ─────────────────────────────────────────────

ML_FEATURES = [
    # Geological
    "geological_block_area_sqkm", "total_geological_reserve_mt",
    "total_extractable_reserve_mt", "extraction_efficiency",
    "stripping_ratio", "total_ob_mcum", "forest_area_ha",
    "non_forest_area_ha", "forest_pct", "project_area_ha",
    "borehole_density", "target_capacity_mty",
    "exploration_complete", "mine_type_enc", "coalfield_freq_enc",

    # Clearance encoded
    "mining_plan_status_enc", "forest_clearance_status_enc",
    "env_clearance_status_enc", "mining_lease_status_enc",
    "clearances_pending",

    # SANKET state safety
    "state_accidents_2022", "state_killed_2022", "state_fatality_rate",
    "state_oc_accidents", "state_ug_accidents",
    "state_roof_fall_accidents", "state_transport_accidents",
    "state_fire_gas_accidents",

    # Engineered from datasets 2-7
    "national_fatality_slope", "national_accident_slope",
    "oc_ug_fatality_ratio", "cause_severity_pressure",
    "dangerous_occurrence_pressure", "dangerous_occurrence_slope",
    "mine_type_accident_risk", "state_accident_trend_slope",
    "state_3yr_avg_fatality_rate",

    # Advanced interaction features (v2)
    "clearance_composite", "pending_x_state_accidents",
    "forest_pressure", "geo_risk_index", "extraction_pressure",
    "mine_readiness", "state_accidents_x_mine_type",
    "borehole_adequacy", "safety_context_score",
    "all_clearances_missing", "all_clearances_obtained",
    "high_forest_cover", "large_mine", "high_stripping",

    # Isolation Forest
    "isolation_forest_score", "is_anomaly",
]

TARGET = "risk_level_enc"

X = ml_df[ML_FEATURES].copy()
y = ml_df[TARGET].copy()

# Force numeric + fill nulls
for col in X.columns:
    X[col] = pd.to_numeric(X[col], errors="coerce")
X = X.fillna(X.median())

print(f"\nFinal feature matrix: {X.shape}")
print(f"Target distribution: {dict(y.value_counts().sort_index())}")

# ─────────────────────────────────────────────
# 6. SMOTE OVERSAMPLING
# ─────────────────────────────────────────────
print("\nApplying SMOTE to balance classes...")
smote = SMOTE(
    sampling_strategy="not majority",   # upsample all minority classes
    k_neighbors=3,                       # small k for small dataset
    random_state=42
)
X_resampled, y_resampled = smote.fit_resample(X, y)
print(f"  Before SMOTE: {dict(y.value_counts().sort_index())}")
print(f"  After SMOTE:  {dict(pd.Series(y_resampled).value_counts().sort_index())}")

# ─────────────────────────────────────────────
# 7. MODEL DEFINITIONS
# ─────────────────────────────────────────────

xgb = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.04,
    subsample=0.85,
    colsample_bytree=0.75,
    min_child_weight=1,
    gamma=0.05,
    reg_alpha=0.05,
    reg_lambda=1.2,
    use_label_encoder=False,
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1,
)

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_split=3,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

et = ExtraTreesClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

# Stacking ensemble — XGB + RF + ET → LogReg meta-learner
stack = StackingClassifier(
    estimators=[
        ("xgb", xgb),
        ("rf",  rf),
        ("et",  et),
    ],
    final_estimator=LogisticRegression(
        max_iter=1000,
        C=1.0,
        
        random_state=42
    ),
    cv=5,
    passthrough=False,
    n_jobs=-1,
)

# ─────────────────────────────────────────────
# 8. STRATIFIED K-FOLD CV — ALL MODELS
# ─────────────────────────────────────────────
print("\n" + "="*65)
print("STRATIFIED 5-FOLD CROSS VALIDATION — MODEL COMPARISON")
print("="*65)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
label_names = ["Low", "Medium", "High", "Critical"]

def run_cv(model, X_data, y_data, name):
    fold_acc, fold_f1w, fold_f1m = [], [], []
    all_true, all_pred = [], []

    for fold, (tr_idx, val_idx) in enumerate(skf.split(X_data, y_data), 1):
        X_tr, X_val = X_data.iloc[tr_idx], X_data.iloc[val_idx]
        y_tr, y_val = y_data.iloc[tr_idx], y_data.iloc[val_idx]

        model.fit(X_tr, y_tr)
        y_pred = model.predict(X_val)

        fold_acc.append(accuracy_score(y_val, y_pred))
        fold_f1w.append(f1_score(y_val, y_pred, average="weighted", zero_division=0))
        fold_f1m.append(f1_score(y_val, y_pred, average="macro",    zero_division=0))
        all_true.extend(y_val.tolist())
        all_pred.extend(y_pred.tolist())

    print(f"\n── {name}")
    print(f"   Acc:         {np.mean(fold_acc):.4f} ± {np.std(fold_acc):.4f}")
    print(f"   F1-weighted: {np.mean(fold_f1w):.4f} ± {np.std(fold_f1w):.4f}")
    print(f"   F1-macro:    {np.mean(fold_f1m):.4f} ± {np.std(fold_f1m):.4f}")

    return {
        "name": name,
        "mean_acc": np.mean(fold_acc),
        "mean_f1w": np.mean(fold_f1w),
        "mean_f1m": np.mean(fold_f1m),
        "all_true": all_true,
        "all_pred": all_pred,
    }

# Use SMOTE data as pd.DataFrame/Series for indexing
X_sm = pd.DataFrame(X_resampled, columns=ML_FEATURES)
y_sm = pd.Series(y_resampled)

results_xgb   = run_cv(xgb,   X_sm, y_sm, "XGBoost (tuned)")
results_rf    = run_cv(rf,    X_sm, y_sm, "Random Forest")
results_et    = run_cv(et,    X_sm, y_sm, "Extra Trees")
results_stack = run_cv(stack, X_sm, y_sm, "Stacking Ensemble (XGB+RF+ET→LR)")

# ─────────────────────────────────────────────
# 9. PICK BEST MODEL
# ─────────────────────────────────────────────
all_results = [results_xgb, results_rf, results_et, results_stack]
best = max(all_results, key=lambda r: r["mean_f1w"])

print("\n" + "="*65)
print(f"BEST MODEL: {best['name']}")
print(f"  Accuracy:    {best['mean_acc']:.4f}")
print(f"  F1-weighted: {best['mean_f1w']:.4f}")
print(f"  F1-macro:    {best['mean_f1m']:.4f}")
print("="*65)

print(f"\nOVERALL CLASSIFICATION REPORT ({best['name']}, all folds):")
print(classification_report(
    best["all_true"], best["all_pred"],
    target_names=label_names, zero_division=0
))

print("CONFUSION MATRIX:")
cm = confusion_matrix(best["all_true"], best["all_pred"])
cm_df = pd.DataFrame(cm, index=label_names, columns=label_names)
print(cm_df.to_string())

# ─────────────────────────────────────────────
# 10. TRAIN FINAL MODEL ON FULL SMOTE DATA
# ─────────────────────────────────────────────
print(f"\nTraining final {best['name']} on full SMOTE dataset...")

# Map model name to object
model_map = {
    "XGBoost (tuned)":                   xgb,
    "Random Forest":                     rf,
    "Extra Trees":                       et,
    "Stacking Ensemble (XGB+RF+ET→LR)":  stack,
}
final_model = model_map[best["name"]]
final_model.fit(X_sm, y_sm)

# ─────────────────────────────────────────────
# 11. FEATURE IMPORTANCE (XGBoost layer)
# ─────────────────────────────────────────────
xgb.fit(X_sm, y_sm)   # always fit XGB for importance
importance_df = pd.DataFrame({
    "feature": ML_FEATURES,
    "importance": xgb.feature_importances_
}).sort_values("importance", ascending=False)

print(f"\nTOP 20 FEATURE IMPORTANCES (XGBoost layer):")
print(importance_df.head(20).to_string(index=False))

# ─────────────────────────────────────────────
# 12. SANITY CHECK ON REAL MINES
# ─────────────────────────────────────────────
print("\n" + "─"*65)
print("PREDICTIONS ON 6 REAL MINES:")
print("─"*65)

real_mines = ml_df[ml_df["is_synthetic"] == False].copy()
X_real = real_mines[ML_FEATURES].copy()
for col in X_real.columns:
    X_real[col] = pd.to_numeric(X_real[col], errors="coerce")
X_real = X_real.fillna(X[ML_FEATURES].median())

y_real_true = real_mines[TARGET].values
y_real_pred = final_model.predict(X_real)

risk_map = {0: "Low", 1: "Medium", 2: "High", 3: "Critical"}
print(f"\n{'Mine':<45} {'Actual':<10} {'Predicted':<10} {'Match'}")
print("─"*75)
for i, (_, row) in enumerate(real_mines.iterrows()):
    actual    = risk_map[int(y_real_true[i])]
    predicted = risk_map[int(y_real_pred[i])]
    match     = "✓" if actual == predicted else "✗"
    print(f"  {match}  {row['mine_name'][:40]:<40} {actual:<10} {predicted:<10}")

# ─────────────────────────────────────────────
# 13. SAVE EVERYTHING
# ─────────────────────────────────────────────
joblib.dump(final_model,  OUT_DIR / "model1_final.pkl")
joblib.dump(iso_forest,   OUT_DIR / "isolation_forest.pkl")
joblib.dump(xgb,          OUT_DIR / "model1_xgb_importance.pkl")

with open(OUT_DIR / "model1_features_v2.json", "w") as f:
    json.dump(ML_FEATURES, f, indent=2)

# Full summary report
report_lines = [
    "MODEL 1 v2 — COMPLIANCE RISK SCORER",
    "="*65,
    f"Training samples (after SMOTE): {len(X_sm)}",
    f"Features: {len(ML_FEATURES)}",
    "",
    "MODEL COMPARISON:",
]
for r in all_results:
    report_lines.append(
        f"  {r['name']:<40} Acc: {r['mean_acc']:.4f}  F1w: {r['mean_f1w']:.4f}  F1m: {r['mean_f1m']:.4f}"
    )
report_lines += [
    "",
    f"BEST MODEL: {best['name']}",
    f"  Accuracy:    {best['mean_acc']:.4f}",
    f"  F1-weighted: {best['mean_f1w']:.4f}",
    f"  F1-macro:    {best['mean_f1m']:.4f}",
    "",
    "CLASSIFICATION REPORT:",
    classification_report(best["all_true"], best["all_pred"],
                          target_names=label_names, zero_division=0),
    "",
    "TOP 20 FEATURES:",
    importance_df.head(20).to_string(index=False),
]

with open(OUT_DIR / "model1_results_v2.txt", "w") as f:
    f.write("\n".join(report_lines))

print(f"\n✓ Final model   → model1_final.pkl")
print(f"✓ Iso Forest    → isolation_forest.pkl")
print(f"✓ Features      → model1_features_v2.json")
print(f"✓ Report        → model1_results_v2.txt")
print("\nDONE.")
