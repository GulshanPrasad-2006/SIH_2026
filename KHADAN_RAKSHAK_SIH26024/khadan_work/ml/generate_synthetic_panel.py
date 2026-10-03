"""
Synthetic Panel Generator for SIH-26024 Coal Mine Risk Modeling
Generates 70 coal mines over 60-150 weeks of simulated inspection & safety records (~6,200 snapshots).
Adheres strictly to the schema (mine_id, mine_name, subsidiary, gassy_category, depth, etc.)
with a latent hazard random walk and realistic observed safety metrics.
"""

import os
import math
import random
import numpy as np
import pandas as pd
from pathlib import Path

RANDOM_STATE = 42
random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

SUBSIDIARIES = [
    ("Bharat Coking Coal Limited (BCCL)", "Dhanbad, Jharkhand"),
    ("South Eastern Coalfields Ltd (SECL)", "Korba, Chhattisgarh"),
    ("Northern Coalfields Ltd (NCL)", "Singrauli, MP / UP"),
    ("Eastern Coalfields Ltd (ECL)", "Asansol, West Bengal"),
    ("Central Coalfields Ltd (CCL)", "Chatra, Jharkhand"),
    ("Western Coalfields Ltd (WCL)", "Nagpur, Maharashtra"),
    ("Mahanadi Coalfields Ltd (MCL)", "Jharsuguda, Odisha")
]

MINE_TYPES = ["Underground", "Opencast", "Underground Deep Seam"]
GASSY_CATEGORIES = ["Degree I", "Degree II Gassy", "Degree III Gassy"]

def generate_panel_data(n_mines=70, output_path=None):
    if output_path is None:
        output_path = Path(__file__).resolve().parent / "data" / "synthetic_mine_panel.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    
    for mine_id in range(1, n_mines + 1):
        subsidiary, zone = random.choice(SUBSIDIARIES)
        mine_type = random.choice(MINE_TYPES)
        gassy_cat = random.choice(GASSY_CATEGORIES)
        
        # Depth in meters based on mine type
        if "Underground" in mine_type:
            depth_m = random.randint(150, 420)
        else:
            depth_m = random.randint(40, 120)
            
        gassy_deg_num = 3 if "III" in gassy_cat else 2 if "II" in gassy_cat else 1
        
        # Persistent unobserved latent management/experience factor (-1.0 to 1.0)
        latent_mgmt_quality = np.random.normal(0.0, 0.4)
        
        # Base inherent hazard anchored on static attributes
        base_hazard = 0.35 + (depth_m / 1000.0) * 0.4 + (gassy_deg_num * 0.08) - (latent_mgmt_quality * 0.25)
        base_hazard = np.clip(base_hazard, 0.15, 0.85)

        # Weeks of history (60 to 150 weeks)
        n_weeks = random.randint(60, 150)
        
        # Mean-reverting random walk for latent hazard
        latent_hazard = base_hazard
        weeks_since_last_crit = 12
        
        for w in range(1, n_weeks + 1):
            # Ornstein-Uhlenbeck style mean reversion: drift towards base_hazard + random shock
            shock = np.random.normal(0.0, 0.08)
            latent_hazard = 0.85 * latent_hazard + 0.15 * base_hazard + shock
            latent_hazard = float(np.clip(latent_hazard, 0.05, 0.98))
            
            # Observed proxy features derived with realistic noise
            # Higher hazard -> more violations, lower compliance, more criticals
            expected_viols = latent_hazard * 7.5
            total_violations = int(np.random.poisson(max(expected_viols, 0.5)))
            
            if total_violations > 0:
                # Probability of a violation being critical rises with hazard & gassy degree
                p_crit = min(0.05 + (latent_hazard * 0.35) + (gassy_deg_num * 0.05), 0.70)
                critical_viols = int(np.random.binomial(total_violations, p_crit))
                p_major = min(0.30 + (latent_hazard * 0.30), 0.75)
                remaining = max(total_violations - critical_viols, 0)
                major_viols = int(np.random.binomial(remaining, p_major))
                minor_viols = max(remaining - major_viols, 0)
            else:
                critical_viols = 0
                major_viols = 0
                minor_viols = 0
                
            critical_ratio = (critical_viols / total_violations) if total_violations > 0 else 0.0
            
            # Overdue actions
            p_overdue = min(0.05 + (latent_hazard * 0.30) - (latent_mgmt_quality * 0.1), 0.60)
            p_overdue = max(p_overdue, 0.0)
            overdue_count = int(np.random.binomial(total_violations, p_overdue)) if total_violations > 0 else 0
            overdue_rate = (overdue_count / total_violations) if total_violations > 0 else 0.0
            
            # Compliance score (70% - 100%)
            comp_score = 100.0 - (total_violations * 2.5) - (critical_viols * 6.0) + np.random.normal(0, 1.5)
            comp_score = float(np.clip(comp_score, 60.0, 100.0))
            
            # Mean time to fix (hours)
            mttf = 18.0 + (latent_hazard * 45.0) - (latent_mgmt_quality * 12.0) + np.random.normal(0, 4.0)
            mttf = float(np.clip(mttf, 6.0, 120.0))
            
            # Physical sensor proxies
            methane_ch4 = max(0.05 + (gassy_deg_num * 0.12) + (latent_hazard * 0.35) + np.random.normal(0, 0.04), 0.02)
            dust_ppm = max(0.8 + (latent_hazard * 2.2) + np.random.normal(0, 0.2), 0.2)
            strata_mm = max((depth_m / 100.0) * 0.8 + (latent_hazard * 4.5) + np.random.normal(0, 0.5), 0.1)

            if critical_viols > 0:
                weeks_since_last_crit = 0
            else:
                weeks_since_last_crit += 1

            rows.append({
                "mine_id": mine_id,
                "mine_name": f"Mine {mine_id:03d} ({subsidiary.split()[0]})",
                "subsidiary": subsidiary,
                "zone": zone,
                "mine_type": mine_type,
                "gassy_category": gassy_cat,
                "gassy_degree_num": gassy_deg_num,
                "depth_meters": depth_m,
                "week_num": w,
                "total_violations": total_violations,
                "critical_violations": critical_viols,
                "major_violations": major_viols,
                "minor_violations": minor_viols,
                "critical_ratio": round(critical_ratio, 4),
                "overdue_count": overdue_count,
                "overdue_rate": round(overdue_rate, 4),
                "compliance_score": round(comp_score, 2),
                "mean_time_to_fix_hours": round(mttf, 2),
                "methane_ch4_pct": round(methane_ch4, 4),
                "dust_ppm": round(dust_ppm, 3),
                "strata_tell_tale_mm": round(strata_mm, 2),
                "weeks_since_last_critical": weeks_since_last_crit,
                "latent_hazard": round(latent_hazard, 4)
            })

    df = pd.DataFrame(rows)

    # Establish Ground Truth is_high_risk: Top 30% of latent hazard distribution
    hazard_cutoff = df["latent_hazard"].quantile(0.70)
    df["is_high_risk"] = (df["latent_hazard"] >= hazard_cutoff).astype(int)

    df.to_csv(output_path, index=False)
    print(f"Generated synthetic panel: {len(df)} records across {n_mines} mines.")
    print(f"High risk prevalence: {df['is_high_risk'].mean():.1%} (cutoff >= {hazard_cutoff:.3f})")
    print(f"Saved to: {output_path}")
    return df

if __name__ == "__main__":
    generate_panel_data()
