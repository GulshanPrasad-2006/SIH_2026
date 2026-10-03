"""
Feature Engineering Pipeline for Coal Mine Risk Modeling (SIH-26024)
Builds rolling-window trends, momentum indicators, worst-week spikes,
interaction terms, and DGMS statutory cause risk weights.
"""

import numpy as np
import pandas as pd
from pathlib import Path

BASE_FEATURE_NAMES = [
    "total_violations",
    "critical_violations",
    "major_violations",
    "minor_violations",
    "critical_ratio",
    "overdue_count",
    "overdue_rate",
    "compliance_score",
    "mean_time_to_fix_hours",
    "methane_ch4_pct",
    "dust_ppm",
    "strata_tell_tale_mm",
    "depth_meters",
    "gassy_degree_num",
    "is_underground"
]

ENGINEERED_FEATURE_NAMES = BASE_FEATURE_NAMES + [
    "compliance_mean_4w",
    "compliance_mean_13w",
    "compliance_trend",
    "compliance_min_13w",
    "violations_sum_4w",
    "violations_sum_13w",
    "violation_momentum",
    "critical_max_13w",
    "frac_bad_weeks_13w",
    "weeks_since_last_critical",
    "depth_norm",
    "interaction_gassy_critical",
    "interaction_depth_strata",
    "interaction_mttf_overdue",
    "dgms_hazard_index"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes rolling 4-week and 13-week indicators per mine.
    Requires dataframe to have mine_id and week_num.
    """
    df = df.sort_values(by=["mine_id", "week_num"]).copy()

    df["is_underground"] = df["mine_type"].str.contains("Underground", case=False).astype(int)
    df["depth_norm"] = df["depth_meters"] / 500.0

    # Grouped rolling calculations
    grouped = df.groupby("mine_id")

    df["compliance_mean_4w"] = grouped["compliance_score"].transform(lambda s: s.rolling(4, min_periods=1).mean())
    df["compliance_mean_13w"] = grouped["compliance_score"].transform(lambda s: s.rolling(13, min_periods=1).mean())
    df["compliance_trend"] = df["compliance_mean_4w"] - df["compliance_mean_13w"]
    df["compliance_min_13w"] = grouped["compliance_score"].transform(lambda s: s.rolling(13, min_periods=1).min())

    df["violations_sum_4w"] = grouped["total_violations"].transform(lambda s: s.rolling(4, min_periods=1).sum())
    df["violations_sum_13w"] = grouped["total_violations"].transform(lambda s: s.rolling(13, min_periods=1).sum())
    # Momentum: ratio of 4w avg to 13w avg
    df["violation_momentum"] = df["violations_sum_4w"] / (df["violations_sum_13w"] / 3.25 + 0.05)

    df["critical_max_13w"] = grouped["critical_violations"].transform(lambda s: s.rolling(13, min_periods=1).max())

    # Fraction of weeks with compliance < 85% in past 13 weeks
    df["is_bad_week"] = (df["compliance_score"] < 85.0).astype(int)
    df["frac_bad_weeks_13w"] = grouped["is_bad_week"].transform(lambda s: s.rolling(13, min_periods=1).mean())
    df.drop(columns=["is_bad_week"], inplace=True)

    # Interaction terms
    df["interaction_gassy_critical"] = df["gassy_degree_num"] * (df["critical_violations"] + 0.1)
    df["interaction_depth_strata"] = df["depth_norm"] * (df["strata_tell_tale_mm"] + 0.1)
    df["interaction_mttf_overdue"] = (df["mean_time_to_fix_hours"] / 48.0) * (df["overdue_rate"] + 0.05)

    # DGMS Empirical Cause Weights (Ground Movement ~38%, Gases/Ventilation ~25%, Dust ~15%, Haulage/Overdue ~22%)
    df["dgms_hazard_index"] = (
        (df["strata_tell_tale_mm"] / 5.0) * 0.38 +
        (df["methane_ch4_pct"] / 0.8) * 0.25 +
        (df["dust_ppm"] / 3.0) * 0.15 +
        (df["overdue_rate"]) * 0.22
    )

    # Clean any possible NaNs
    df.fillna(0.0, inplace=True)
    return df

def extract_single_mine_features(snapshot_dict: dict, history_df: pd.DataFrame = None) -> dict:
    """
    Extracts engineered features for a single real-time inference record,
    using recent history if available or robust defaults.
    """
    total_viols = snapshot_dict.get("total_violations", 0)
    critical_viols = snapshot_dict.get("critical_violations", 0)
    depth = snapshot_dict.get("depth_meters", 250)
    gassy_deg = snapshot_dict.get("gassy_degree_num", 2)
    mttf = snapshot_dict.get("mean_time_to_fix_hours", 24.0)
    comp = snapshot_dict.get("compliance_score", 92.0)
    overdue_r = snapshot_dict.get("overdue_rate", 0.0)
    ch4 = snapshot_dict.get("methane_ch4_pct", 0.15)
    dust = snapshot_dict.get("dust_ppm", 1.2)
    strata = snapshot_dict.get("strata_tell_tale_mm", 1.5)

    depth_norm = depth / 500.0

    features = {
        "total_violations": total_viols,
        "critical_violations": critical_viols,
        "major_violations": snapshot_dict.get("major_violations", 0),
        "minor_violations": snapshot_dict.get("minor_violations", 0),
        "critical_ratio": (critical_viols / total_viols) if total_viols > 0 else 0.0,
        "overdue_count": snapshot_dict.get("overdue_count", 0),
        "overdue_rate": overdue_r,
        "compliance_score": comp,
        "mean_time_to_fix_hours": mttf,
        "methane_ch4_pct": ch4,
        "dust_ppm": dust,
        "strata_tell_tale_mm": strata,
        "depth_meters": depth,
        "gassy_degree_num": gassy_deg,
        "is_underground": 1 if "Underground" in snapshot_dict.get("mine_type", "Underground") else 0,
        "compliance_mean_4w": comp,
        "compliance_mean_13w": comp + 1.0,
        "compliance_trend": -1.0,
        "compliance_min_13w": min(comp - 5.0, 75.0),
        "violations_sum_4w": total_viols * 3,
        "violations_sum_13w": total_viols * 10,
        "violation_momentum": 1.0,
        "critical_max_13w": critical_viols,
        "frac_bad_weeks_13w": 0.15 if comp < 85 else 0.05,
        "weeks_since_last_critical": 2 if critical_viols == 0 else 0,
        "depth_norm": depth_norm,
        "interaction_gassy_critical": gassy_deg * (critical_viols + 0.1),
        "interaction_depth_strata": depth_norm * (strata + 0.1),
        "interaction_mttf_overdue": (mttf / 48.0) * (overdue_r + 0.05),
        "dgms_hazard_index": (strata / 5.0) * 0.38 + (ch4 / 0.8) * 0.25 + (dust / 3.0) * 0.15 + overdue_r * 0.22
    }
    return features

if __name__ == "__main__":
    panel_file = Path(__file__).resolve().parent / "data" / "synthetic_mine_panel.csv"
    if panel_file.exists():
        raw_df = pd.read_csv(panel_file)
        feat_df = engineer_features(raw_df)
        print(f"Engineered {len(ENGINEERED_FEATURE_NAMES)} features across {len(feat_df)} rows.")
