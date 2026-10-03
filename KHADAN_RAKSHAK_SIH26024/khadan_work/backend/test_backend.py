"""
Automated Test Suite for KHADAN RAKSHAK Backend (All 11 Screen API Endpoints & ML Engine)
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.ml.feature_extractor import extract_mine_features
from app.ml.risk_engine import calculate_mine_risk_score, predict_hazard_recurrence
from app.ml.cv_pipeline import verify_ppe_compliance_stub, verify_rectification_photo_stub

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("STARTING KHADAN RAKSHAK BACKEND AUTOMATED TEST SUITE")
    print("=" * 70)

    from app.seed_data import seed_database
    seed_database()

    # Clear red alerts for clean idempotent test run
    db_clean = SessionLocal()
    from app.models.red_alert import RedAlert
    db_clean.query(RedAlert).delete()
    db_clean.commit()
    db_clean.close()

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check Passed: API is OPERATIONAL")

    # 2. Screen 1: Auth Login & Mines
    res_login = client.post("/api/v1/auth/login", json={
        "username": "rajesh.sharma",
        "password": "Koyla@2026",
        "mine_name": "BCCL - Jharia Colliery"
    })
    assert res_login.status_code == 200, f"Inspector Login failed: {res_login.text}"
    login_data = res_login.json()
    assert login_data["user"]["role"] == "worker"
    assert login_data["default_screen"] == 2
    print(f"[PASS] Screen 1: Inspector Login Passed -> {login_data['user']['full_name']} (Default Screen {login_data['default_screen']})")

    res_manager = client.post("/api/v1/auth/login", json={
        "username": "vk.mehta",
        "password": "Mehta@2026"
    })
    assert res_manager.status_code == 200
    assert res_manager.json()["user"]["role"] == "manager"
    assert res_manager.json()["default_screen"] == 9
    print("[PASS] Screen 1: Manager Login Passed (Default Screen 9)")

    res_mines = client.get("/api/v1/auth/mines")
    assert res_mines.status_code == 200
    mines = res_mines.json()
    assert len(mines) >= 5
    print(f"[PASS] Screen 1: Listed {len(mines)} active CIL coal mines")

    # 3. Screen 2: Recent Inspections
    res_recent = client.get("/api/v1/inspections/recent")
    assert res_recent.status_code == 200
    print(f"[PASS] Screen 2: Fetched {len(res_recent.json())} past Form IV inspections")

    # 4. Screen 3: 10-Item Statutory Checklist
    res_checklist = client.get("/api/v1/inspections/checklists/default")
    assert res_checklist.status_code == 200
    items = res_checklist.json()
    assert len(items) == 10
    print("[PASS] Screen 3: Successfully loaded 10 DGMS statutory checklist parameters")

    # 5. Screen 4: Submit Inspection & Auto-Generate Violations
    test_insp_id = f"INSP-TEST-2026-{datetime.now().strftime('%H%M%S')}"
    checklist_payload = []
    for item in items:
        if item["item_number"] in (1, 3): # 2 failures
            checklist_payload.append({
                "item_id": item["id"],
                "status": "fail",
                "severity": "Critical" if item["item_number"] == 1 else "Major",
                "notes": f"Simulated test defect for {item['title']}",
                "gps_coordinates": "23.7508 N, 86.4132 E"
            })
        else:
            checklist_payload.append({
                "item_id": item["id"],
                "status": "pass",
                "severity": None,
                "notes": "Compliant"
            })

    res_submit = client.post(f"/api/v1/inspections/{test_insp_id}/submit", json={
        "inspection_id": test_insp_id,
        "mine_name": "BCCL - Jharia Colliery",
        "inspector_name": "Rajesh Kumar Sharma",
        "shift": "Shift 1",
        "location_details": "Test Underground Panel",
        "statutory_attestation": True,
        "results": checklist_payload
    })
    assert res_submit.status_code == 200, f"Submit failed: {res_submit.text}"
    submit_data = res_submit.json()
    assert submit_data["compliance_score"] == 80.0
    assert len(submit_data["open_violations_created"]) == 2
    new_viols = submit_data["open_violations_created"]
    print(f"[PASS] Screen 4: Inspection submitted (80.0% compliance) -> Created {len(new_viols)} open violations: {new_viols}")

    # 6. Screen 5: List Fixers & Assign Actions
    res_fixers = client.get("/api/v1/actions/users/fixers")
    assert res_fixers.status_code == 200
    fixers = res_fixers.json()
    assert len(fixers) > 0
    print(f"[PASS] Screen 5: Loaded {len(fixers)} qualified remedial officers")

    deadline_iso = (datetime.now() + timedelta(days=2)).isoformat()
    res_assign = client.post("/api/v1/actions/assign", json={
        "inspection_id": test_insp_id,
        "actions": [
            {
                "violation_id": new_viols[0],
                "assigned_to": "Anil Verma (Ventilation Officer)",
                "deadline": deadline_iso,
                "instructions": "Calibrate methane sensor immediately."
            }
        ]
    })
    assert res_assign.status_code == 200
    print("[PASS] Screen 5: Successfully dispatched Form VII action orders")

    # 7. Screen 6: My Actions Queue
    res_my_actions = client.get("/api/v1/actions/my-actions?assignee=Anil")
    assert res_my_actions.status_code == 200
    actions_list = res_my_actions.json()
    assert len(actions_list) > 0
    target_viol_id = actions_list[0]["id"]
    print(f"[PASS] Screen 6: Fixer action queue retrieved ({len(actions_list)} items). Selected: {target_viol_id}")

    # 8. Screen 7: Close Out Violation
    res_close = client.post(f"/api/v1/actions/{target_viol_id}/close", json={
        "after_photo_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500",
        "fix_remarks": "Replaced sensor module and tested zero-drift."
    })
    assert res_close.status_code == 200
    assert res_close.json()["status"] == "PENDING_VERIFICATION"
    print(f"[PASS] Screen 7: Violation {target_viol_id} closed out with 'After' photo -> PENDING_VERIFICATION")

    # 9. Screen 8: Supervisor Verification (Approve)
    res_pending = client.get("/api/v1/verifications/pending")
    assert res_pending.status_code == 200
    print(f"[PASS] Screen 8: Loaded {len(res_pending.json())} items awaiting supervisor clearance")

    res_review = client.post(f"/api/v1/verifications/{target_viol_id}/review", json={
        "decision": "APPROVE",
        "supervisor_remarks": "Verified calibration certificate. Approved under CMR 2017."
    })
    assert res_review.status_code == 200
    assert res_review.json()["new_status"] == "CLOSED"
    print(f"[PASS] Screen 8: Supervisor Approved violation {target_viol_id} -> CLOSED")

    # 10. DGMS Officer Statutory Alert Workflow (Inspection -> Alert Fixer if action not taken)
    # Pick an OPEN violation where action has not been taken
    open_viols_res = client.get("/api/v1/analytics/violations?action_status=ACTION_NOT_TAKEN")
    assert open_viols_res.status_code == 200
    open_items = open_viols_res.json()
    assert len(open_items) > 0
    target_alert_viol = open_items[0]["id"]

    res_alert = client.post(f"/api/v1/actions/{target_alert_viol}/dgms-alert", json={
        "officer_name": "Dr. A. Roy (DGMS Central Directorate)",
        "alert_level": "URGENT_NOTICE",
        "statutory_directive": "CMR Reg 104 Directive: Immediate tell-tale extensometer inspection and roof bolt re-torque required within 24 hours."
    })
    assert res_alert.status_code == 200, f"DGMS alert failed: {res_alert.text}"
    alert_resp = res_alert.json()
    assert alert_resp["dgms_alert_sent"] == True
    print(f"[PASS] DGMS Officer Action Inspection: Issued Statutory Alert on {target_alert_viol} -> Sent to {alert_resp['assigned_fixer']}")

    # Verify Supervisor Role is FORBIDDEN from issuing fixer alerts
    res_sup_alert = client.post(f"/api/v1/actions/{target_alert_viol}/alert", json={
        "sender_role": "supervisor",
        "sender_name": "S. Mukherjee (Shift Supervisor)",
        "alert_level": "URGENT_NOTICE",
        "statutory_directive": "Unauthorized supervisor alert"
    })
    assert res_sup_alert.status_code == 403, f"Expected 403 for supervisor alert, got {res_sup_alert.status_code}"
    print(f"[PASS] Access Control Verified: Supervisor role is forbidden (HTTP 403) from issuing fixer alerts")

    # Verify Fixer Active Alerts Queue
    res_active_alerts = client.get("/api/v1/actions/alerts/active")
    assert res_active_alerts.status_code == 200
    assert any(v["id"] == target_alert_viol for v in res_active_alerts.json())
    print(f"[PASS] Fixer Queue: Active DGMS Alerts received and highlighted ({len(res_active_alerts.json())} escalated)")

    # 11. Screen 9: Executive Analytics Overview
    res_overview = client.get("/api/v1/analytics/overview?mine=BCCL")
    assert res_overview.status_code == 200
    overview = res_overview.json()
    assert "open_violations" in overview
    assert "trend_history" in overview
    print(f"[PASS] Screen 9: Executive Dashboard KPIs calculated (Open: {overview['open_violations']}, Compliance: {overview['compliance_pct']}%)")

    # 11. Screen 10: Master Violations Table Search & Filter
    res_table = client.get("/api/v1/analytics/violations?mine=ALL&status=ALL")
    assert res_table.status_code == 200
    table_records = res_table.json()
    print(f"[PASS] Screen 10: Master Violations Table retrieved {len(table_records)} records")

    # Screen 12: Closed Violations in Past 7 Days
    res_closed_7d = client.get("/api/v1/analytics/closed-violations-last-7-days?mine=ALL")
    assert res_closed_7d.status_code == 200
    closed_7d = res_closed_7d.json()
    assert len(closed_7d) >= 1
    print(f"[PASS] Screen 12: Closed Violations (Past 7 Days) retrieved {len(closed_7d)} verified records")

    # 12. Screen 11: Multi-Mine Corporate Risk Drill-Down
    res_drilldown = client.get("/api/v1/mines/drill-down")
    assert res_drilldown.status_code == 200
    ranked_mines = res_drilldown.json()
    assert len(ranked_mines) >= 5
    top_mine = ranked_mines[0]
    print(f"[PASS] Screen 11: Corporate Risk Index calculated -> Top Risk: {top_mine['name']} (Score: {top_mine['risk_score']}, Level: {top_mine['risk_level']})")

    # 13. Test DGMS & Mine Manager Red Alert on Closed Violation & 28-Day Suspension Threshold (>3 Red Alerts)
    # Pick a closed violation
    closed_item_id = closed_7d[0]["id"]
    res_red_1 = client.post(f"/api/v1/actions/{closed_item_id}/red-alert", json={
        "officer_name": "Dr. A. Roy (DGMS Central Directorate)",
        "sender_role": "corporate",
        "reason": "Substandard roof bolt anchorage observed upon re-inspection. Work insufficient.",
        "manager_name": "V. K. Mehta"
    })
    assert res_red_1.status_code == 200, f"Red alert 1 failed: {res_red_1.text}"
    ra1 = res_red_1.json()
    assert ra1["status"] == "OPEN"
    assert ra1["red_alerts_in_28_days"] >= 1
    assert ra1["is_suspended"] == False
    print(f"[PASS] DGMS Red Alert #1 issued on {closed_item_id} -> Re-opened to OPEN (Count: {ra1['red_alerts_in_28_days']}/3)")

    # Test Mine Manager issuing Red Alert #2
    res_red_2 = client.post(f"/api/v1/actions/{closed_item_id}/red-alert", json={
        "officer_name": "V. K. Mehta (Colliery Agent / Mine Manager)",
        "sender_role": "manager",
        "reason": "Internal manager review: Ventilation auxiliary ducting fix is leaking. Insufficient work done.",
        "manager_name": "V. K. Mehta"
    })
    assert res_red_2.status_code == 200
    ra2 = res_red_2.json()
    assert ra2["status"] == "OPEN"
    print(f"[PASS] Mine Manager Red Alert #2 successfully issued by V. K. Mehta (Count: {ra2['red_alerts_in_28_days']}/3)")

    # Issue alerts #3 and #4 to trigger >3 threshold in 28 days
    client.post(f"/api/v1/actions/{target_alert_viol}/red-alert", json={
        "officer_name": "Dr. A. Roy", "sender_role": "corporate", "reason": "Deficiency alert #3", "manager_name": "V. K. Mehta"
    })
    res_red_4 = client.post(f"/api/v1/actions/{target_alert_viol}/red-alert", json={
        "officer_name": "Dr. A. Roy", "sender_role": "corporate", "reason": "Deficiency alert #4 - Exceeds 3 alerts in 28 days", "manager_name": "V. K. Mehta"
    })
    assert res_red_4.status_code == 200
    ra4 = res_red_4.json()
    assert ra4["red_alerts_in_28_days"] > 3
    assert ra4["is_suspended"] == True
    assert ra4["manager_suspended_days"] == 28
    assert ra4["mine_stopped_days"] == 14
    print(f"[PASS] Statutory Rule Verified: >3 Red Alerts in 28 days -> Manager Suspended for {ra4['manager_suspended_days']} days, Mine Stopped for {ra4['mine_stopped_days']} days!")

    # 14. Test Role-Based Mine Scoping (Supervisor & Manager vs DGMS)
    # Manager querying with user_mine
    res_mgr_scope = client.get("/api/v1/analytics/violations?user_role=manager&user_mine=BCCL%20-%20Jharia%20Colliery&mine=ALL")
    assert res_mgr_scope.status_code == 200
    mgr_viols = res_mgr_scope.json()
    assert all("BCCL" in v["mine_name"] for v in mgr_viols)
    print(f"[PASS] Mine Scoping Verified: Mine Manager isolated strictly to BCCL ({len(mgr_viols)} violations)")

    # Supervisor querying with user_mine
    res_sup_scope = client.get("/api/v1/analytics/violations?user_role=supervisor&user_mine=BCCL%20-%20Jharia%20Colliery&mine=ALL")
    assert res_sup_scope.status_code == 200
    sup_viols = res_sup_scope.json()
    assert all("BCCL" in v["mine_name"] for v in sup_viols)
    print(f"[PASS] Mine Scoping Verified: Supervisor isolated strictly to BCCL ({len(sup_viols)} violations)")

    # DGMS Officer querying all mines
    res_dgms_scope = client.get("/api/v1/analytics/violations?user_role=corporate&mine=ALL")
    assert res_dgms_scope.status_code == 200
    dgms_viols = res_dgms_scope.json()
    assert len(dgms_viols) >= len(mgr_viols)
    print(f"[PASS] DGMS Central Access Verified: DGMS officer retrieves all {len(dgms_viols)} violations across all mines")

    # 15. Test Automatic 24-Hour Impending Deadline Alerts to Fixers
    res_deadline_alerts = client.get("/api/v1/actions/alerts/deadline-warnings")
    assert res_deadline_alerts.status_code == 200
    warnings = res_deadline_alerts.json()
    print(f"[PASS] 24-Hour Impending Deadline Alert Monitor: Flagged {len(warnings)} urgent tasks approaching deadline")

    # 13. ML Pipeline Layer Execution
    db = SessionLocal()
    try:
        features = extract_mine_features("BCCL - Jharia Colliery", db)
        assert "feature_vector" in features
        score, tier = calculate_mine_risk_score(features)
        recurrence = predict_hazard_recurrence("Strata Support", score)
        cv_ppe = verify_ppe_compliance_stub("test_ppe.jpg")
        cv_fix = verify_rectification_photo_stub("before.jpg", "after.jpg")

        print(f"[PASS] ML Feature Extractor: Extracted {len(features['feature_vector'])}-dimension tabular vector for {features['mine_name']}")
        print(f"[PASS] ML Risk Engine: Composite Score = {score}/100, Tier = {tier}")
        print(f"[PASS] ML Recurrence Model: Strata recurrence prob = {recurrence['recurrence_probability']}")
        print(f"[PASS] ML Computer Vision: PPE Check Status = {cv_ppe['status']}, Fix Diff = {cv_fix['rectification_confidence']}")
    finally:
        db.close()

    print("=" * 70)
    print("ALL 11 SCREEN API ENDPOINTS & ML PIPELINE TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
