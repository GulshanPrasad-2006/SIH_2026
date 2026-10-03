"""
ML Dataset Builder — SIH 26024
Combines:
  1. 6 real mines (mines_extracted.csv)
  2. 75 synthetic mines (statistically grounded augmentation)
  3. SANKET state-level safety features (joined on state)
  4. SANKET accident cause features (joined on mine_type)

Output:
  ml_dataset_final.csv  — 81 rows, ready for XGBoost
"""

import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)

# ─────────────────────────────────────────────
# 1. LOAD REAL DATA
# ─────────────────────────────────────────────

real_df = pd.read_csv("/home/claude/mines_extracted.csv")
sanket_state = pd.read_csv("/home/claude/sanket_outputs/state_year_safety_features.csv")
sanket_cause = pd.read_csv("/home/claude/sanket_outputs/causewise_fatal_trend.csv")

# Use most recent year (2022) for state safety features
state_features_2022 = sanket_state[sanket_state["year"] == 2022].copy()
state_features_2022 = state_features_2022.rename(columns={
    "total_accidents":      "state_accidents_2022",
    "total_killed":         "state_killed_2022",
    "fatality_rate":        "state_fatality_rate",
    "oc_accidents":         "state_oc_accidents",
    "ug_accidents":         "state_ug_accidents",
    "roof_fall_accidents":  "state_roof_fall_accidents",
    "transport_accidents":  "state_transport_accidents",
    "fire_gas_accidents":   "state_fire_gas_accidents",
})
state_features_2022 = state_features_2022.drop(columns=["year"])

# Cause-wise average fatalities (2016-2022) — mine type risk profile
cause_avg = (
    sanket_cause
    .groupby("cause")["fatalities"]
    .mean()
    .reset_index()
    .rename(columns={"fatalities": "avg_fatalities_by_cause"})
)

# ─────────────────────────────────────────────
# 2. DEFINE REALISTIC PARAMETER DISTRIBUTIONS
#    Based on real mine ranges observed in 6 PDFs
#    + CMPDI published coalfield statistics
# ─────────────────────────────────────────────

COALFIELDS = {
    "West Bokaro Coalfield":     {"state": "Jharkhand",      "weight": 0.20},
    "North Karanpura Coalfield": {"state": "Jharkhand",      "weight": 0.15},
    "East Bokaro Coalfield":     {"state": "Jharkhand",      "weight": 0.10},
    "Jharia Coalfield":          {"state": "Jharkhand",      "weight": 0.10},
    "Raniganj Coalfield":        {"state": "West Bengal",    "weight": 0.08},
    "Sohagpur Coalfield":        {"state": "Madhya Pradesh", "weight": 0.08},
    "Korba Coalfield":           {"state": "Chhattisgarh",   "weight": 0.08},
    "Talcher Coalfield":         {"state": "Orissa",         "weight": 0.07},
    "Ib Valley Coalfield":       {"state": "Orissa",         "weight": 0.05},
    "Singrauli Coalfield":       {"state": "Madhya Pradesh", "weight": 0.05},
    "Wardha Valley Coalfield":   {"state": "Maharashtra",    "weight": 0.04},
}

coalfield_names   = list(COALFIELDS.keys())
coalfield_weights = [COALFIELDS[c]["weight"] for c in coalfield_names]

# Risk profile per coalfield — clearance approval probability
# Based on historical patterns: older allocations more likely approved
CLEARANCE_PROFILES = {
    "West Bokaro Coalfield":     {"mp": 0.55, "fc": 0.35, "ec": 0.40, "ml": 0.35},
    "North Karanpura Coalfield": {"mp": 0.60, "fc": 0.45, "ec": 0.50, "ml": 0.45},
    "East Bokaro Coalfield":     {"mp": 0.50, "fc": 0.30, "ec": 0.35, "ml": 0.30},
    "Jharia Coalfield":          {"mp": 0.70, "fc": 0.55, "ec": 0.60, "ml": 0.55},
    "Raniganj Coalfield":        {"mp": 0.65, "fc": 0.50, "ec": 0.55, "ml": 0.50},
    "Sohagpur Coalfield":        {"mp": 0.45, "fc": 0.60, "ec": 0.40, "ml": 0.35},
    "Korba Coalfield":           {"mp": 0.55, "fc": 0.40, "ec": 0.50, "ml": 0.45},
    "Talcher Coalfield":         {"mp": 0.75, "fc": 0.65, "ec": 0.70, "ml": 0.65},
    "Ib Valley Coalfield":       {"mp": 0.60, "fc": 0.50, "ec": 0.55, "ml": 0.50},
    "Singrauli Coalfield":       {"mp": 0.65, "fc": 0.55, "ec": 0.60, "ml": 0.55},
    "Wardha Valley Coalfield":   {"mp": 0.50, "fc": 0.40, "ec": 0.45, "ml": 0.40},
}

# ─────────────────────────────────────────────
# 3. GENERATE SYNTHETIC MINES
# ─────────────────────────────────────────────

def sample_clearance_status(prob_approved):
    """
    Returns a normalised clearance status.
    prob_approved: base probability of APPROVED
    Remaining split between PENDING (60%) and NOT_APPLIED (40%) of failures
    """
    r = np.random.random()
    if r < prob_approved:
        return "APPROVED"
    elif r < prob_approved + (1 - prob_approved) * 0.35:
        return "IN_PRINCIPLE"
    elif r < prob_approved + (1 - prob_approved) * 0.70:
        return "PENDING"
    else:
        return "NOT_APPLIED"


def generate_synthetic_mine(idx):
    # Sample coalfield
    cf = np.random.choice(coalfield_names, p=coalfield_weights)
    state = COALFIELDS[cf]["state"]
    profile = CLEARANCE_PROFILES[cf]

    # --- Geological features ---
    geo_area    = np.random.lognormal(mean=1.5, sigma=0.8)   # sq km, log-normal → right skew
    geo_area    = float(np.clip(geo_area, 0.5, 50.0))

    total_geo   = np.random.lognormal(mean=4.0, sigma=1.0)   # Mt
    total_geo   = float(np.clip(total_geo, 5.0, 1800.0))

    extract_pct = np.random.uniform(0.05, 0.65)              # extractable % of geological
    total_ext   = round(total_geo * extract_pct, 3)

    strip_ratio = float(np.clip(np.random.lognormal(mean=1.6, sigma=0.5), 1.5, 20.0))
    total_ob    = round(total_ext * strip_ratio, 2)

    project_area    = geo_area * 100 * np.random.uniform(0.8, 1.4)   # Ha
    forest_pct      = np.random.beta(2, 4)                            # skewed low
    forest_area     = round(project_area * forest_pct, 2)
    non_forest_area = round(project_area - forest_area, 2)
    mining_lease_ha = round(project_area * np.random.uniform(0.6, 0.95), 2)

    borehole_density = float(np.clip(np.random.normal(15, 5), 5, 35))
    total_boreholes  = int(borehole_density * geo_area)

    target_capacity  = float(np.clip(np.random.lognormal(mean=0.8, sigma=0.7), 0.3, 15.0))

    # Mine type: large stripping ratio + low forest → likely OC
    mine_type = "Opencast" if strip_ratio < 8 and forest_pct < 0.6 else "Underground"

    # Exploration status
    exploration_status = np.random.choice(
        ["Explored", "Partially Explored", "Additional drilling required"],
        p=[0.50, 0.30, 0.20]
    )

    # --- Clearance statuses ---
    # Forest clearance N/A if no forest area
    if forest_area < 5.0:
        fc_status = "NOT_APPLICABLE"
    else:
        fc_status = sample_clearance_status(profile["fc"])

    mp_status = sample_clearance_status(profile["mp"])
    ec_status = sample_clearance_status(profile["ec"])
    ml_status = sample_clearance_status(profile["ml"])

    # Land acquisition follows mining lease
    la_status = "APPROVED" if ml_status == "APPROVED" else sample_clearance_status(profile["ml"] * 0.8)

    # PAFs — proportional to project area
    num_pafs = int(np.clip(np.random.exponential(scale=50), 0, 800))

    return {
        "source_file":                  f"SYNTHETIC_{idx:03d}",
        "mine_name":                    f"Synthetic Mine {idx:03d}",
        "coalfield":                    cf,
        "state":                        state,
        "geological_block_area_sqkm":   round(geo_area, 3),
        "mining_lease_area_ha":         mining_lease_ha,
        "project_area_ha":              round(project_area, 2),
        "forest_area_ha":               forest_area,
        "non_forest_area_ha":           non_forest_area,
        "exploration_status":           exploration_status,
        "borehole_density":             round(borehole_density, 1),
        "total_boreholes":              total_boreholes,
        "total_geological_reserve_mt":  round(total_geo, 3),
        "total_extractable_reserve_mt": total_ext,
        "stripping_ratio":              round(strip_ratio, 2),
        "total_ob_mcum":                total_ob,
        "target_capacity_mty":          round(target_capacity, 2),
        "num_pafs":                     num_pafs,
        "mine_type":                    mine_type,
        "mining_plan_status":           mp_status,
        "forest_clearance_status":      fc_status,
        "env_clearance_status":         ec_status,
        "mining_lease_status":          ml_status,
        "land_acquisition_status":      la_status,
        "is_synthetic":                 True,
    }


print("Generating 75 synthetic mines...")
synthetic_records = [generate_synthetic_mine(i + 1) for i in range(75)]
synthetic_df = pd.DataFrame(synthetic_records)

# ─────────────────────────────────────────────
# 4. CLEAN & ALIGN REAL MINES
# ─────────────────────────────────────────────

# Infer mine_type from real mines (OC if stripping_ratio < 8, UG otherwise)
def infer_mine_type(row):
    sr = row.get("stripping_ratio")
    name = str(row.get("mine_name", "")).upper()
    if "UG" in name or "UNDERGROUND" in name or "INCLINE" in name:
        return "Underground"
    if sr and float(sr) < 8:
        return "Opencast"
    return "Opencast"   # default — most of the 6 real mines are OC

real_clean = real_df[[
    "source_file", "mine_name", "coalfield", "state",
    "geological_block_area_sqkm", "mining_lease_area_ha", "project_area_ha",
    "forest_area_ha", "non_forest_area_ha", "exploration_status",
    "borehole_density", "total_boreholes",
    "total_geological_reserve_mt", "total_extractable_reserve_mt",
    "stripping_ratio", "total_ob_mcum", "target_capacity_mty", "num_pafs",
    "mining_plan_status", "forest_clearance_status",
    "env_clearance_status", "mining_lease_status", "land_acquisition_status",
]].copy()

real_clean["mine_type"]    = real_clean.apply(infer_mine_type, axis=1)
real_clean["is_synthetic"] = False

# Fix state name for Orissa → Odisha (matches SANKET)
real_clean["state"] = real_clean["state"].replace({"Orissa": "Odisha"})

# ─────────────────────────────────────────────
# 5. COMBINE REAL + SYNTHETIC
# ─────────────────────────────────────────────

combined = pd.concat([real_clean, synthetic_df], ignore_index=True)
print(f"Combined: {len(combined)} rows ({len(real_clean)} real + {len(synthetic_df)} synthetic)")

# ─────────────────────────────────────────────
# 6. FEATURE ENGINEERING
# ─────────────────────────────────────────────

# 6a. Clearance encoding
STATUS_SCORE = {
    "APPROVED":       2,
    "IN_PRINCIPLE":   1,
    "PENDING":        0,
    "NOT_APPROVED":   0,
    "NOT_APPLIED":    0,
    "NOT_APPLICABLE": 2,   # not required = no barrier
    "UNKNOWN":        0,
}

for col in ["mining_plan_status", "forest_clearance_status",
            "env_clearance_status", "mining_lease_status"]:
    combined[col + "_enc"] = combined[col].map(STATUS_SCORE).fillna(0).astype(int)

# 6b. Compliance score (0–100)
clearance_cols_enc = [
    "mining_plan_status_enc", "forest_clearance_status_enc",
    "env_clearance_status_enc", "mining_lease_status_enc"
]
combined["compliance_score"] = (
    combined[clearance_cols_enc].sum(axis=1) / (len(clearance_cols_enc) * 2) * 100
).round(1)

# 6c. Clearances pending count
def count_pending(row):
    count = 0
    for col in ["mining_plan_status", "forest_clearance_status",
                "env_clearance_status", "mining_lease_status"]:
        if row[col] in ("PENDING", "NOT_APPROVED", "NOT_APPLIED", "UNKNOWN"):
            count += 1
    return count

combined["clearances_pending"] = combined.apply(count_pending, axis=1)

# 6d. Risk level label
def assign_risk(score):
    if score >= 75:   return "Low"
    elif score >= 50: return "Medium"
    elif score >= 25: return "High"
    else:             return "Critical"

combined["risk_level"] = combined["compliance_score"].apply(assign_risk)

# Risk level encoded for ML
RISK_ENC = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
combined["risk_level_enc"] = combined["risk_level"].map(RISK_ENC)

# 6e. Derived geological features
combined["extraction_efficiency"] = (
    combined["total_extractable_reserve_mt"] / combined["total_geological_reserve_mt"]
).round(4)

combined["forest_pct"] = (
    combined["forest_area_ha"] / combined["project_area_ha"]
).round(4)

combined["mine_size_category"] = pd.cut(
    combined["total_geological_reserve_mt"],
    bins=[0, 50, 200, 500, 99999],
    labels=["Small", "Medium", "Large", "Giant"]
)

combined["exploration_complete"] = combined["exploration_status"].str.lower().str.contains(
    "explored"
).fillna(False).astype(int)

combined["mine_type_enc"] = (combined["mine_type"] == "Underground").astype(int)

# 6f. Coalfield encoding (frequency encoding — robust for small datasets)
cf_freq = combined["coalfield"].value_counts(normalize=True).to_dict()
combined["coalfield_freq_enc"] = combined["coalfield"].map(cf_freq).round(4)

# ─────────────────────────────────────────────
# 7. JOIN SANKET STATE SAFETY FEATURES
# ─────────────────────────────────────────────

print("Joining SANKET state safety features...")

# States in our dataset vs states in SANKET
our_states   = set(combined["state"].unique())
sanket_states = set(state_features_2022["state"].unique())
print(f"  Our states:    {sorted(our_states)}")
print(f"  SANKET states: {sorted(sanket_states)}")

# Manual mapping for states not directly in SANKET 2022
STATE_FALLBACK = {
    "West Bengal": "West Bengal",
    "Maharashtra": "Maharashtra",
    # States present in both → direct join
}

combined = combined.merge(
    state_features_2022,
    on="state",
    how="left"
)

# Fill missing state safety features with national averages from SANKET
nat_avg = state_features_2022.select_dtypes(include="number").mean()
safety_cols = [
    "state_accidents_2022", "state_killed_2022", "state_fatality_rate",
    "state_oc_accidents", "state_ug_accidents",
    "state_roof_fall_accidents", "state_transport_accidents", "state_fire_gas_accidents"
]
for col in safety_cols:
    if col in combined.columns:
        combined[col] = combined[col].fillna(nat_avg.get(col.replace("state_", "").replace("_2022", ""), 0))

print(f"  Nulls after join: {combined[safety_cols].isnull().sum().sum()}")

# ─────────────────────────────────────────────
# 8. FINAL ML FEATURE SET
# ─────────────────────────────────────────────

ML_FEATURES = [
    # Geological
    "geological_block_area_sqkm",
    "total_geological_reserve_mt",
    "total_extractable_reserve_mt",
    "extraction_efficiency",
    "stripping_ratio",
    "total_ob_mcum",
    "forest_area_ha",
    "non_forest_area_ha",
    "forest_pct",
    "project_area_ha",
    "borehole_density",
    "target_capacity_mty",
    "exploration_complete",
    "mine_type_enc",
    "coalfield_freq_enc",

    # Clearance (encoded)
    "mining_plan_status_enc",
    "forest_clearance_status_enc",
    "env_clearance_status_enc",
    "mining_lease_status_enc",
    "clearances_pending",

    # SANKET safety features
    "state_accidents_2022",
    "state_killed_2022",
    "state_fatality_rate",
    "state_oc_accidents",
    "state_ug_accidents",
    "state_roof_fall_accidents",
    "state_transport_accidents",
    "state_fire_gas_accidents",
]

# TARGET
TARGET = "risk_level_enc"

# ─────────────────────────────────────────────
# 9. SAVE OUTPUTS
# ─────────────────────────────────────────────

# Full dataset (all columns) — for inspection
out_full = Path("/home/claude/ml_dataset_full.csv")
combined.to_csv(out_full, index=False)

# ML-ready dataset (features + target only)
ml_ready = combined[ML_FEATURES + [TARGET, "risk_level", "mine_name",
                                    "state", "coalfield", "is_synthetic"]].copy()

# Drop rows where too many ML features are null (> 30% missing)
null_thresh = int(0.30 * len(ML_FEATURES))
ml_ready_clean = ml_ready.dropna(thresh=len(ml_ready.columns) - null_thresh)

# Fill remaining nulls with median
for col in ML_FEATURES:
    if ml_ready_clean[col].dtype in [float, int]:
        ml_ready_clean[col] = ml_ready_clean[col].fillna(ml_ready_clean[col].median())

out_ml = Path("/home/claude/ml_dataset_final.csv")
ml_ready_clean.to_csv(out_ml, index=False)

# ─────────────────────────────────────────────
# 10. SUMMARY REPORT
# ─────────────────────────────────────────────

print("\n" + "="*60)
print("DATASET BUILD SUMMARY")
print("="*60)
print(f"  Total rows:            {len(ml_ready_clean)}")
print(f"  Real mines:            {ml_ready_clean['is_synthetic'].eq(False).sum()}")
print(f"  Synthetic mines:       {ml_ready_clean['is_synthetic'].eq(True).sum()}")
print(f"  ML features:           {len(ML_FEATURES)}")
print(f"  Target classes:        {ml_ready_clean['risk_level'].value_counts().to_dict()}")
print(f"  Null cells remaining:  {ml_ready_clean[ML_FEATURES].isnull().sum().sum()}")
print()
print("Risk level distribution:")
dist = ml_ready_clean["risk_level"].value_counts()
for level, count in dist.items():
    bar = "█" * count
    print(f"  {level:<10} {count:>3}  {bar}")
print()
print("State distribution:")
print(ml_ready_clean["state"].value_counts().to_string())
print()
print(f"Files saved:")
print(f"  {out_full}  (full, all columns)")
print(f"  {out_ml}    (ML-ready, {len(ML_FEATURES)} features + target)")
print("="*60)
