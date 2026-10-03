"""
Realistic DGMS & Coal Mines Regulations (CMR 2017) Seed Script
Populates the database with:
- 5 Major Coal Mines across CIL Subsidiaries
- 36 Pre-Configured Accounts:
    * 5 Mine Managers (1 per mine)
    * 5 Field Safety Inspectors (1 per mine)
    * 5 Shift Supervisors (1 per mine)
    * 20 Action Fixers (4 domain specialists per mine x 5 mines)
    * 1 DGMS Central Directorate Officer
- 10 Statutory DGMS Checklist Items
- Initial Past Inspections for each mine
- Seeded Violations matching the 4 specialized fixer disciplines per mine
"""

from datetime import datetime, timedelta
from app.database import engine, SessionLocal, Base
from app.models.user import User, UserRole
from app.models.mine import Mine
from app.models.inspection import ChecklistItem, Inspection, ChecklistResult
from app.models.violation import Violation, ViolationSeverity, ViolationStatus
from app.models.action import CorrectiveAction
from app.models.red_alert import RedAlert
from app.models.environmental import EnvironmentalRecord
from app.models.production import ProductionRecord
from app.models.attendance import AttendanceRecord
from app.models.contractor import Contractor
from app.models.grievance import Grievance, GrievanceStatus
from app.models.reminder import Reminder
from app.models.audit_log import AuditLog, GENESIS_HASH, compute_entry_hash

def seed_phase3_extension(db, mine_names):
    """
    Idempotently ensures the Phase 3/4 tables (grievances, reminders,
    audit_log) carry demo data, independent of whether the core Phase 1/2
    dataset (users, mines, inspections, violations, ...) was just freshly
    seeded or already existed from an earlier run of this project.

    Why this exists: `seed_database()` below early-returns once 30+ users
    already exist in the DB (so re-launching the backend doesn't wipe real
    activity). Before this helper, that early-return also skipped the
    Phase 3/4 seeding block entirely -- so anyone who had already run the
    Phase 1/2 build and then dropped in the Phase 3/4 code would boot up
    with empty Grievances / Reminders / Audit Trail screens, even though
    the tables and API were otherwise fully wired. Calling this helper
    from BOTH branches of seed_database() (the "already seeded" early
    return AND the very end of a full fresh seed) closes that gap, and
    each of the three sections below independently no-ops if its table
    already has rows -- so it's always safe to call.
    """
    now = datetime.now()

    # -----------------------------------------------------------
    # PHASE 3: Grievances Seed Data (skipped if already populated)
    # -----------------------------------------------------------
    if db.query(Grievance).count() > 0:
        print("Grievances already present — skipping grievance seed.")
        grievances = []
        _skip_grievances = True
    else:
        _skip_grievances = False
        print("Seeding Phase 3 module: Grievances...")

    grievance_seed = [] if _skip_grievances else [
        (0, "R. Kumar", "Face Worker", "Wages", GrievanceStatus.RESOLVED,
         "Delayed overtime wage credit for Shift 1, week of 25 Aug.", "Mine Manager",
         "Verified with accounts; overtime arrears credited on 02 Sep. Payslip reissued.", "V. K. Mehta"),
        (1, "S. Yadav", "Contractor Labour", "Welfare Facilities", GrievanceStatus.IN_PROGRESS,
         "Drinking water cooler at Pit-3 rest shelter non-functional for over a week.", "A. K. Rathore", None, None),
        (2, "Anonymous", "Face Worker", "Safety", GrievanceStatus.ROUTED,
         "PPE (safety helmets) issued are past their rated service life; requesting replacement stock.",
         "R. K. Srivastava", None, None),
        (3, "M. Ansari", "Face Worker", "Working Hours", GrievanceStatus.SUBMITTED, None, None, None, None),
        (4, "T. Oraon", "Contractor Labour", "Harassment", GrievanceStatus.SUBMITTED, None, None, None, None),
    ]
    grievances = []
    for idx, name, desig, category, status, extra_desc, assigned, notes, resolver in grievance_seed:
        mine_name = mine_names[idx]
        is_anon = name == "Anonymous"
        desc_map = {
            "Wages": "Delayed overtime wage credit for Shift 1.",
            "Welfare Facilities": "Drinking water facility at rest shelter non-functional.",
            "Safety": "PPE stock past rated service life; requesting replacement.",
            "Working Hours": "Roster shows back-to-back double shifts without statutory rest gap.",
            "Harassment": "Verbal harassment by shift contractor supervisor; requesting confidential review.",
        }
        g = Grievance(
            id=f"GRV-2026-{idx+1:04d}-{100+idx}",
            mine_name=mine_name,
            submitted_by="Anonymous Worker" if is_anon else name,
            submitted_by_designation=desig,
            category=category,
            description=extra_desc or desc_map.get(category, "Grievance filed via field app."),
            is_anonymous="YES" if is_anon else "NO",
            status=status,
            assigned_to=assigned,
            priority="HIGH" if category == "Harassment" else ("HIGH" if category == "Safety" else "NORMAL"),
            resolution_notes=notes,
            resolved_by=resolver,
            resolved_at=now - timedelta(days=2) if status == GrievanceStatus.RESOLVED else None,
            created_at=now - timedelta(days=6 - idx),
        )
        grievances.append(g)
    db.add_all(grievances)
    db.commit()

    # -----------------------------------------------------------
    # PHASE 3: Reminders Seed Data (skipped if already populated —
    # the live /reminders/scan on every backend boot regenerates real
    # ones from actual violations/contractors/environmental records
    # anyway, this is just a demo floor for a brand-new database)
    # -----------------------------------------------------------
    if db.query(Reminder).count() > 0:
        print("Reminders already present — skipping reminder seed.")
    else:
        print("Seeding Phase 3 module: Reminders...")
        reminders = []
        for idx, mine_name in enumerate(mine_names):
            due = now + timedelta(hours=[6, 20, 60, 240, -18][idx])
            sev = "CRITICAL" if idx == 0 else ("WARNING" if idx == 1 else ("NORMAL" if idx == 3 else ("OVERDUE" if idx == 4 else "WARNING")))
            reminders.append(Reminder(
                target_type="VIOLATION_DEADLINE",
                target_id=f"SEED-{idx}",
                mine_name=mine_name,
                title=f"Corrective action deadline approaching — {mine_name.split(' - ')[-1]}",
                detail="Statutory 72-hour rectification window.",
                due_at=due,
                severity=sev,
                channel="IN_APP",
                notified_at=now,
            ))
        db.add_all(reminders)
        db.commit()

    # -----------------------------------------------------------
    # PHASE 4: Genesis Audit Trail Entries (skipped if already populated)
    # -----------------------------------------------------------
    if db.query(AuditLog).count() > 0:
        print("Audit trail already present — skipping audit genesis seed.")
    else:
        print("Seeding Phase 4: hash-chained audit trail genesis entries...")
        prev_hash = GENESIS_HASH
        audit_rows = []
        for idx, mine_name in enumerate(mine_names):
            ts = (now - timedelta(days=5 - idx)).isoformat()
            summary = f"System initialization & statutory baseline recorded for {mine_name}"
            h = compute_entry_hash("MINE", mine_name, "BASELINE_RECORDED", "System", summary, prev_hash, ts)
            audit_rows.append(AuditLog(
                entity_type="MINE", entity_id=mine_name, action="BASELINE_RECORDED",
                actor="System", mine_name=mine_name, payload_summary=summary,
                payload_hash=h, prev_hash=prev_hash,
                created_at=now - timedelta(days=5 - idx),
            ))
            prev_hash = h
        db.add_all(audit_rows)
        db.commit()

    print("Phase 3/4 extension data (grievances, reminders, audit trail) is present.")

MINE_NAMES = [
    "BCCL - Jharia Colliery",
    "SECL - Korba Deep Pit-3",
    "NCL - Singrauli OCP Block-B",
    "ECL - Raniganj Colliery",
    "CCL - Piparwar Opencast"
]


def seed_database(force_reseed: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if not force_reseed and db.query(User).count() >= 30:
            print("Database already contains complete 36-user dataset. Skipping duplicate seeding.")
            # Even when the core Phase 1/2 dataset already exists (e.g. this
            # is a re-launch on top of a DB created by an earlier version of
            # this project), make sure the Phase 3/4 tables still get their
            # demo data — see seed_phase3_extension()'s docstring for why.
            seed_phase3_extension(db, MINE_NAMES)
            return

        if force_reseed or db.query(User).first():
            print("Purging existing data for clean re-seed...")
            db.query(RedAlert).delete()
            db.query(CorrectiveAction).delete()
            db.query(ChecklistResult).delete()
            db.query(Violation).delete()
            db.query(Inspection).delete()
            db.query(ChecklistItem).delete()
            db.query(EnvironmentalRecord).delete()
            db.query(ProductionRecord).delete()
            db.query(AttendanceRecord).delete()
            db.query(Contractor).delete()
            db.query(Grievance).delete()
            db.query(Reminder).delete()
            db.query(AuditLog).delete()
            db.query(User).delete()
            db.query(Mine).delete()
            db.commit()

        print("Seeding 5 CIL Coal Mines & Risk Profiles...")
        mines = [
            Mine(
                name="BCCL - Jharia Colliery",
                subsidiary="Bharat Coking Coal Limited (BCCL)",
                zone="Dhanbad, Jharkhand",
                mine_type="Underground (Seam V/VI)",
                depth="310m",
                gassy_category="Degree III Gassy",
                latitude=23.7508,
                longitude=86.4132,
                risk_score=78.0,
                compliance_rate=88.5,
                open_violations_count=4,
                critical_violations_count=2
            ),
            Mine(
                name="SECL - Korba Deep Pit-3",
                subsidiary="South Eastern Coalfields Ltd (SECL)",
                zone="Korba, Chhattisgarh",
                mine_type="Underground (Pit-3)",
                depth="240m",
                gassy_category="Degree II Gassy",
                latitude=22.3595,
                longitude=82.7501,
                risk_score=62.0,
                compliance_rate=93.0,
                open_violations_count=2,
                critical_violations_count=0
            ),
            Mine(
                name="NCL - Singrauli OCP Block-B",
                subsidiary="Northern Coalfields Ltd (NCL)",
                zone="Singrauli, MP / UP",
                mine_type="Opencast Heavy Project",
                depth="90m",
                gassy_category="Degree I",
                latitude=24.1994,
                longitude=82.6752,
                risk_score=24.0,
                compliance_rate=97.4,
                open_violations_count=1,
                critical_violations_count=0
            ),
            Mine(
                name="ECL - Raniganj Colliery",
                subsidiary="Eastern Coalfields Ltd (ECL)",
                zone="Asansol, West Bengal",
                mine_type="Underground (Incline 4)",
                depth="185m",
                gassy_category="Degree III Gassy",
                latitude=23.6167,
                longitude=87.1333,
                risk_score=71.0,
                compliance_rate=89.2,
                open_violations_count=3,
                critical_violations_count=1
            ),
            Mine(
                name="CCL - Piparwar Opencast",
                subsidiary="Central Coalfields Ltd (CCL)",
                zone="Chatra, Jharkhand",
                mine_type="Opencast Coal Washery",
                depth="65m",
                gassy_category="Degree I",
                latitude=23.85,
                longitude=85.1667,
                risk_score=31.0,
                compliance_rate=98.1,
                open_violations_count=1,
                critical_violations_count=0
            )
        ]
        db.add_all(mines)
        db.flush()

        print("Seeding 36 Realistic Accounts (5 Managers, 5 Inspectors, 5 Supervisors, 20 Fixers, 1 DGMS Corporate)...")
        users = []

        # 1. DGMS Corporate Officer
        users.append(User(
            username="dgms.officer",
            password_hash="Roy@2026",
            full_name="Dr. A. Roy",
            designation="DGMS Central Directorate Regulator",
            role=UserRole.CORPORATE,
            mine_name="DGMS HQ - All Subsidiaries",
            phone="+91-9434077889"
        ))
        users.append(User(
            username="a.roy",
            password_hash="Roy@2026",
            full_name="Dr. A. Roy",
            designation="DGMS Central Directorate",
            role=UserRole.CORPORATE,
            mine_name="DGMS HQ - All Subsidiaries",
            phone="+91-9434077889"
        ))

        # 2. Mine Specific Personnel (5 Mines)
        mine_configs = [
            {
                "prefix": "jharia",
                "mine": "BCCL - Jharia Colliery",
                "mgr": ("V. K. Mehta", "Mehta@2026", "Colliery Agent & Mine Manager"),
                "insp": ("Rajesh Kumar Sharma", "Koyla@2026", "Mining Sirdar (CMR 113)"),
                "sup": ("S. Mukherjee", "Mukh@2026", "Colliery Overman / Shift Supervisor"),
                "fixers": [
                    ("Anil Verma", "Fixer@2026", "Ventilation & Gas Specialist (CMR 124/130)", "gas"),
                    ("Gautam Banerjee", "Fixer@2026", "Strata & Roof Support Specialist (CMR 104/188)", "strata"),
                    ("R. K. Meena", "Fixer@2026", "Mechanical, Dust & Fire Safety Specialist (CMR 169/176/182)", "dust"),
                    ("Deepak Rawat", "Fixer@2026", "Electrical & Haulage Machinery Specialist (CMR 82/94)", "elec")
                ]
            },
            {
                "prefix": "korba",
                "mine": "SECL - Korba Deep Pit-3",
                "mgr": ("A. K. Rathore", "Korba@2026", "First Class Mine Manager"),
                "insp": ("Manoj Kumar Sahu", "Koyla@2026", "Mining Sirdar (CMR 113)"),
                "sup": ("D. P. Chandrakar", "Mukh@2026", "Colliery Overman / Shift Supervisor"),
                "fixers": [
                    ("Ramesh Patel", "Fixer@2026", "Ventilation & Gas Specialist (CMR 124/130)", "gas"),
                    ("K. N. Verma", "Fixer@2026", "Strata & Roof Support Specialist (CMR 104/188)", "strata"),
                    ("Santosh Dewangan", "Fixer@2026", "Mechanical, Dust & Fire Safety Specialist (CMR 169/176/182)", "dust"),
                    ("Bhupendra Soni", "Fixer@2026", "Electrical & Haulage Machinery Specialist (CMR 82/94)", "elec")
                ]
            },
            {
                "prefix": "singrauli",
                "mine": "NCL - Singrauli OCP Block-B",
                "mgr": ("R. K. Srivastava", "Singrauli@2026", "Project Officer & Mine Manager"),
                "insp": ("Vikram Pratap Singh", "Koyla@2026", "Mining Sirdar (CMR 113)"),
                "sup": ("Harish Chandra", "Mukh@2026", "Shift In-Charge Supervisor"),
                "fixers": [
                    ("Alok Pandey", "Fixer@2026", "Ventilation & Gas Specialist (CMR 124/130)", "gas"),
                    ("Mahesh Kushwaha", "Fixer@2026", "Strata & Slope Stability Specialist (CMR 104/188)", "strata"),
                    ("Devendra Mishra", "Fixer@2026", "Mechanical, Dust & Fire Safety Specialist (CMR 169/176/182)", "dust"),
                    ("Pankaj Jaiswal", "Fixer@2026", "Electrical & Heavy Equipment Specialist (CMR 82/94)", "elec")
                ]
            },
            {
                "prefix": "raniganj",
                "mine": "ECL - Raniganj Colliery",
                "mgr": ("B. C. Ghosh", "Raniganj@2026", "Colliery Agent & Mine Manager"),
                "insp": ("Subhash Mondal", "Koyla@2026", "Mining Sirdar (CMR 113)"),
                "sup": ("Prabir Bhattacharya", "Mukh@2026", "Colliery Overman / Shift Supervisor"),
                "fixers": [
                    ("Tapas Sen", "Fixer@2026", "Ventilation & Gas Specialist (CMR 124/130)", "gas"),
                    ("Anirban Paul", "Fixer@2026", "Strata & Roof Support Specialist (CMR 104/188)", "strata"),
                    ("Chanchal Roy", "Fixer@2026", "Mechanical, Dust & Fire Safety Specialist (CMR 169/176/182)", "dust"),
                    ("Somnath Das", "Fixer@2026", "Electrical & Haulage Machinery Specialist (CMR 82/94)", "elec")
                ]
            },
            {
                "prefix": "piparwar",
                "mine": "CCL - Piparwar Opencast",
                "mgr": ("S. P. Yadav", "Piparwar@2026", "Project Officer & Mine Manager"),
                "insp": ("Amit Kumar Bhagat", "Koyla@2026", "Mining Sirdar (CMR 113)"),
                "sup": ("R. N. Tiwary", "Mukh@2026", "Shift In-Charge Supervisor"),
                "fixers": [
                    ("Vinod Kumar Gope", "Fixer@2026", "Ventilation & Gas Specialist (CMR 124/130)", "gas"),
                    ("Sanjay Munda", "Fixer@2026", "Strata & Highwall Safety Specialist (CMR 104/188)", "strata"),
                    ("Ravi Oraon", "Fixer@2026", "Mechanical, Dust & Fire Safety Specialist (CMR 169/176/182)", "dust"),
                    ("Arun Kerketta", "Fixer@2026", "Electrical & Haulage Machinery Specialist (CMR 82/94)", "elec")
                ]
            }
        ]

        for mc in mine_configs:
            # Manager
            users.append(User(
                username=f"{mc['prefix']}.manager",
                password_hash=mc["mgr"][1],
                full_name=mc["mgr"][0],
                designation=mc["mgr"][2],
                role=UserRole.MANAGER,
                mine_name=mc["mine"],
                phone="+91-9431000001"
            ))
            # Inspector
            users.append(User(
                username=f"{mc['prefix']}.inspector",
                password_hash=mc["insp"][1],
                full_name=mc["insp"][0],
                designation=mc["insp"][2],
                role=UserRole.WORKER,
                mine_name=mc["mine"],
                phone="+91-9835000002"
            ))
            # Supervisor
            users.append(User(
                username=f"{mc['prefix']}.supervisor",
                password_hash=mc["sup"][1],
                full_name=mc["sup"][0],
                designation=mc["sup"][2],
                role=UserRole.SUPERVISOR,
                mine_name=mc["mine"],
                phone="+91-9831000003"
            ))
            # 4 Fixers
            for fix_name, fix_pass, fix_desig, fix_tag in mc["fixers"]:
                users.append(User(
                    username=f"{mc['prefix']}.fixer.{fix_tag}",
                    password_hash=fix_pass,
                    full_name=fix_name,
                    designation=fix_desig,
                    role=UserRole.FIXER,
                    mine_name=mc["mine"],
                    phone="+91-9122000004"
                ))

        # Legacy alias accounts for seamless backward compatibility
        users.append(User(username="vk.mehta", password_hash="Mehta@2026", full_name="V. K. Mehta", designation="Colliery Agent", role=UserRole.MANAGER, mine_name="BCCL - Jharia Colliery"))
        users.append(User(username="rajesh.sharma", password_hash="Koyla@2026", full_name="Rajesh Kumar Sharma", designation="Mining Sirdar", role=UserRole.WORKER, mine_name="BCCL - Jharia Colliery"))
        users.append(User(username="s.mukherjee", password_hash="Mukh@2026", full_name="S. Mukherjee", designation="Colliery Overman", role=UserRole.SUPERVISOR, mine_name="BCCL - Jharia Colliery"))
        users.append(User(username="anil.verma", password_hash="Verma@2026", full_name="Anil Verma", designation="Ventilation Officer", role=UserRole.FIXER, mine_name="BCCL - Jharia Colliery"))

        db.add_all(users)
        db.flush()

        print("Seeding CMR-2017 10-Item Statutory Checklist...")
        checklist = [
            ChecklistItem(
                item_number=1,
                regulation_code="CMR 2017 Reg 130",
                title="Gas Monitoring & Methane Safety",
                description="Multi-gas detector verified at working face. Methane (CH4) < 0.5% in return airway, Carbon Monoxide (CO) < 50 ppm, and Oxygen (O2) > 19% volume.",
                category="Ventilation & Gases",
                default_assignee="Anil Verma (Ventilation & Gas Specialist)"
            ),
            ChecklistItem(
                item_number=2,
                regulation_code="CMR 2017 Reg 124",
                title="Adequate Face & Roadway Ventilation Air Quantity",
                description="Auxiliary fan operational; minimum statutory air quantity (> 6 m³/min per person employed underground) delivered to the split without recirculation.",
                category="Ventilation & Gases",
                default_assignee="Anil Verma (Ventilation & Gas Specialist)"
            ),
            ChecklistItem(
                item_number=3,
                regulation_code="CMR 2017 Reg 104",
                title="Strata Control & Roof Support Plan (SMP)",
                description="Roof bolting pattern verified with torque wrench; tell-tale extensometers checked; no visible bed separation, cracks, or side spalling along galleries.",
                category="Strata Support",
                default_assignee="Gautam Banerjee (Strata & Roof Support Specialist)"
            ),
            ChecklistItem(
                item_number=4,
                regulation_code="CMR 2017 Reg 169",
                title="Stone Dust & Water Explosion Barriers",
                description="Stone dust barriers properly loaded with dry incombustible dust; water barrier troughs undamaged and topped up across main haulage roadways.",
                category="Mechanical & Dust",
                default_assignee="R. K. Meena (Mechanical, Dust & Fire Specialist)"
            ),
            ChecklistItem(
                item_number=5,
                regulation_code="CMR 2017 Reg 182",
                title="Fire-Fighting Hydrant Lines & Extinguishers",
                description="Pressurized water hydrant lines active with nozzles available; dry chemical powder extinguishers inspected, tagged, and fully charged at sub-stations.",
                category="Mechanical & Dust",
                default_assignee="R. K. Meena (Mechanical, Dust & Fire Specialist)"
            ),
            ChecklistItem(
                item_number=6,
                regulation_code="CMR 2017 Reg 188",
                title="Emergency Escape Route Markings & Second Outlet",
                description="Escapeway illuminated with photoluminescent directional arrows, free from rock falls or obstructions, leading to operable second outlet shaft/incline.",
                category="Strata Support",
                default_assignee="Gautam Banerjee (Strata & Roof Support Specialist)"
            ),
            ChecklistItem(
                item_number=7,
                regulation_code="CMR 2017 Reg 82",
                title="Haulage Track, Runaway Switches & Signaling",
                description="Haulage track gauge intact, rope free of broken wires, runaway catches and jazz rails functional, acoustic pull-wire signaling working end-to-end.",
                category="Electrical & Haulage",
                default_assignee="Deepak Rawat (Electrical & Haulage Specialist)"
            ),
            ChecklistItem(
                item_number=8,
                regulation_code="CMR 2017 Reg 236",
                title="Underground Personnel PPE & Self-Rescuers",
                description="All miners in the district wearing DGMS-certified safety helmets with functional cap lamps, steel-toe boots, and carrying personal filter self-rescuers.",
                category="Mechanical & Dust",
                default_assignee="R. K. Meena (Mechanical, Dust & Fire Specialist)"
            ),
            ChecklistItem(
                item_number=9,
                regulation_code="CMR 2017 Reg 176",
                title="Respirable Dust Suppression Mist Sprays",
                description="Water mist sprays operational at belt conveyor transfer points, crusher chute, and continuous miner face to keep airborne coal dust within 2 mg/m³.",
                category="Mechanical & Dust",
                default_assignee="R. K. Meena (Mechanical, Dust & Fire Specialist)"
            ),
            ChecklistItem(
                item_number=10,
                regulation_code="CMR 2017 Reg 94",
                title="Flameproof (FLP) Electrical Enclosures & Earthing",
                description="FLP switchgear enclosures tightly bolted with no missing bolts or gaps > 0.5mm; earth leakage protection relay trip tested.",
                category="Electrical & Haulage",
                default_assignee="Deepak Rawat (Electrical & Haulage Specialist)"
            )
        ]
        db.add_all(checklist)
        db.flush()

        print("Seeding Initial Inspections across 5 Mines...")
        now = datetime.now()

        insp_jharia_1 = Inspection(
            id="INSP-BCCL-2026-0891",
            mine_name="BCCL - Jharia Colliery",
            inspector_name="Rajesh Kumar Sharma",
            shift="Shift 1",
            location_details="Jharia Pit-4, Seam V Panel B",
            passed_count=10,
            failed_count=0,
            compliance_score=100.0,
            statutory_attestation=True,
            status="COMPLETED",
            created_at=now - timedelta(hours=14)
        )
        insp_jharia_2 = Inspection(
            id="INSP-BCCL-2026-0884",
            mine_name="BCCL - Jharia Colliery",
            inspector_name="Rajesh Kumar Sharma",
            shift="Shift 2",
            location_details="Jharia North Incline, Transfer Point",
            passed_count=8,
            failed_count=2,
            compliance_score=80.0,
            statutory_attestation=True,
            status="ACTIONS_DISPATCHED",
            created_at=now - timedelta(days=1, hours=4)
        )
        insp_korba = Inspection(
            id="INSP-SECL-2026-0312",
            mine_name="SECL - Korba Deep Pit-3",
            inspector_name="Manoj Kumar Sahu",
            shift="Shift 1",
            location_details="Korba District C, Main Dip Roadway",
            passed_count=9,
            failed_count=1,
            compliance_score=90.0,
            statutory_attestation=True,
            status="ACTIONS_DISPATCHED",
            created_at=now - timedelta(days=2)
        )
        insp_singrauli = Inspection(
            id="INSP-NCL-2026-0105",
            mine_name="NCL - Singrauli OCP Block-B",
            inspector_name="Vikram Pratap Singh",
            shift="General Shift",
            location_details="Singrauli Section A Benches",
            passed_count=10,
            failed_count=0,
            compliance_score=100.0,
            statutory_attestation=True,
            status="COMPLETED",
            created_at=now - timedelta(days=3)
        )

        db.add_all([insp_jharia_1, insp_jharia_2, insp_korba, insp_singrauli])
        db.flush()

        print("Seeding Realistic Violations Scoped to 4 Specialized Disciplines...")
        violations = [
            # 1. Jharia - Strata & Roof (Critical, OPEN)
            Violation(
                id="VIOL-2026-0901",
                inspection_id="INSP-BCCL-2026-0884",
                mine_name="BCCL - Jharia Colliery",
                category="Strata Support",
                regulation="CMR 2017 Reg 104",
                title="Roof Bolt Loose & Bed Separation Observed",
                description="Roof bolt plate loosened near transfer junction; 5mm bed separation indicated by tell-tale extensometer.",
                severity=ViolationSeverity.CRITICAL,
                status=ViolationStatus.OPEN,
                assigned_to="Gautam Banerjee (Strata & Roof Support Specialist)",
                deadline=now + timedelta(hours=14),
                gps_coordinates="23.7508° N, 86.4132° E (Jharia Seam V Panel B)",
                before_photo="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
                created_at=now - timedelta(days=1)
            ),
            # 2. Jharia - Ventilation & Gas (Pending Verification with 5-point checklist filled)
            Violation(
                id="VIOL-2026-0902",
                inspection_id="INSP-BCCL-2026-0884",
                mine_name="BCCL - Jharia Colliery",
                category="Ventilation & Gases",
                regulation="CMR 2017 Reg 130",
                title="Methane Sensor Calibration Drift at Return Airway",
                description="Methane detector sensor uncalibrated; reading drifting 0.42% in return airway.",
                severity=ViolationSeverity.MAJOR,
                status=ViolationStatus.PENDING_VERIFICATION,
                assigned_to="Anil Verma (Ventilation & Gas Specialist)",
                deadline=now + timedelta(days=2),
                gps_coordinates="23.7507° N, 86.4131° E (Gate 3 Airway)",
                before_photo="https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
                after_photo="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                fix_notes="Replaced faulty sensor module with DGMS certified calibrated unit. Recalibrated zero-point.",
                work_stopped_status="STOPPED",
                work_continued_flag=False,
                gas_safe_verified=True,
                cordon_verified=True,
                loto_verified=True,
                supervision_ppe_verified=True,
                checklist_notes="All work halted during sensor swap. Sirdar R. Sharma present.",
                created_at=now - timedelta(days=1)
            ),
            # 3. Jharia - Mechanical & Dust (Critical, Alert sent)
            Violation(
                id="VIOL-2026-0903",
                inspection_id="INSP-BCCL-2026-0884",
                mine_name="BCCL - Jharia Colliery",
                category="Mechanical & Dust",
                regulation="CMR 2017 Reg 176",
                title="Dust Suppression Mist Spray Clogged at Transfer Point",
                description="High coal dust concentration at conveyor chute; mist nozzles completely blocked with scale.",
                severity=ViolationSeverity.CRITICAL,
                status=ViolationStatus.OPEN,
                assigned_to="R. K. Meena (Mechanical, Dust & Fire Specialist)",
                deadline=now + timedelta(hours=8),
                gps_coordinates="23.7510° N, 86.4135° E",
                before_photo="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop&q=60",
                alert_sent=True,
                alert_by_role="manager",
                alert_by_name="V. K. Mehta (Mine Manager)",
                alert_timestamp=now - timedelta(hours=2),
                alert_level="URGENT_NOTICE",
                alert_notes="CMR Reg 176 Notice: Severe airborne dust hazard. Clear immediately within current shift!",
                created_at=now - timedelta(hours=10)
            ),
            # 4. Jharia - Electrical & Haulage (Major, OPEN)
            Violation(
                id="VIOL-2026-0904",
                inspection_id="INSP-BCCL-2026-0884",
                mine_name="BCCL - Jharia Colliery",
                category="Electrical & Haulage",
                regulation="CMR 2017 Reg 94",
                title="FLP Switchgear Enclosure Loose Bolts & Broken Seal",
                description="Gate-end box FLP flameproof enclosure missing 2 statutory hex bolts. Spark containment compromised.",
                severity=ViolationSeverity.MAJOR,
                status=ViolationStatus.OPEN,
                assigned_to="Deepak Rawat (Electrical & Haulage Machinery Specialist)",
                deadline=now + timedelta(days=1),
                gps_coordinates="23.7505° N, 86.4128° E",
                before_photo="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                created_at=now - timedelta(hours=12)
            ),
            # 5. Korba - Mechanical & Dust (Major, OPEN)
            Violation(
                id="VIOL-2026-0895",
                inspection_id="INSP-SECL-2026-0312",
                mine_name="SECL - Korba Deep Pit-3",
                category="Mechanical & Dust",
                regulation="CMR 2017 Reg 169",
                title="Stone Dust Barrier Shelves Under-Loaded",
                description="Primary stone dust barrier shelves along intake haulage contain less than 30 kg/m² statutory quantity.",
                severity=ViolationSeverity.MAJOR,
                status=ViolationStatus.OPEN,
                assigned_to="Santosh Dewangan (Mechanical, Dust & Fire Safety Specialist)",
                deadline=now + timedelta(hours=18),
                gps_coordinates="22.3595° N, 82.7501° E (Pit 3 Incline)",
                before_photo="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop&q=60",
                created_at=now - timedelta(days=2)
            ),
            # 6. Korba - Ventilation & Gas (Major, OPEN)
            Violation(
                id="VIOL-2026-0896",
                inspection_id="INSP-SECL-2026-0312",
                mine_name="SECL - Korba Deep Pit-3",
                category="Ventilation & Gases",
                regulation="CMR 2017 Reg 124",
                title="Face Auxiliary Fan Duct Torn Causing Air Leakage",
                description="Canvas ducting torn 15m from face, air quantity dropping to 4.2 m³/min per person.",
                severity=ViolationSeverity.MAJOR,
                status=ViolationStatus.OPEN,
                assigned_to="Ramesh Patel (Ventilation & Gas Specialist)",
                deadline=now + timedelta(days=1),
                gps_coordinates="22.3590° N, 82.7495° E",
                before_photo="https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
                created_at=now - timedelta(days=2)
            ),
            # 7. Singrauli - Electrical & Machinery (CLOSED & Verified)
            Violation(
                id="VIOL-2026-0888",
                inspection_id="INSP-NCL-2026-0105",
                mine_name="NCL - Singrauli OCP Block-B",
                category="Electrical & Haulage",
                regulation="CMR 2017 Reg 82",
                title="Haul Road Acoustic Pull-Wire Horn Cable Detached",
                description="Acoustic warning horn wire disconnected at bench intersection.",
                severity=ViolationSeverity.MINOR,
                status=ViolationStatus.CLOSED,
                assigned_to="Pankaj Jaiswal (Electrical & Heavy Equipment Specialist)",
                deadline=now - timedelta(days=1),
                gps_coordinates="24.1997° N, 82.6644° E",
                before_photo="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=60",
                after_photo="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
                fix_notes="Reconnected tension wire, replaced degraded microswitch and acoustic test verified.",
                supervisor_notes="Verified on-site. Approved under CMR 2017 Reg 82.",
                work_stopped_status="STOPPED",
                gas_safe_verified=True,
                cordon_verified=True,
                loto_verified=True,
                supervision_ppe_verified=True,
                created_at=now - timedelta(days=4),
                closed_at=now - timedelta(days=2)
            ),
            # 8. Jharia - Strata Control (CLOSED & Verified under 7 days)
            Violation(
                id="VIOL-2026-0870",
                inspection_id="INSP-BCCL-2026-0880",
                mine_name="BCCL - Jharia Colliery",
                category="Strata Control & Roof Support",
                regulation="CMR 2017 Reg 104",
                title="W-Flank Roadway Roof Bolt Tension Below Statutory Limit (80 kN)",
                description="Torque wrench test revealed 4 roof bolts in Section 4 below minimum anchorage threshold.",
                severity=ViolationSeverity.CRITICAL,
                status=ViolationStatus.CLOSED,
                assigned_to="Gautam Banerjee (Strata & Roof Support Specialist)",
                deadline=now - timedelta(days=2),
                gps_coordinates="23.7463° N, 86.4158° E",
                before_photo="https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
                after_photo="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=500&auto=format&fit=crop&q=60",
                fix_notes="Re-drilled resin holes, installed 22mm Tor-steel resin capsules and re-torqued to 195 N-m (110 kN anchorage confirmed).",
                supervisor_notes="Tested with calibrated digital torque gauge. All bolts verified above 100 kN. Approved under Form VII-A.",
                work_stopped_status="STOPPED",
                gas_safe_verified=True,
                cordon_verified=True,
                loto_verified=True,
                supervision_ppe_verified=True,
                created_at=now - timedelta(days=3),
                closed_at=now - timedelta(days=2)
            ),
            # 9. Korba - Ventilation & Gases (CLOSED & Verified under 7 days)
            Violation(
                id="VIOL-2026-0875",
                inspection_id="INSP-SECL-2026-0305",
                mine_name="SECL - Korba Deep Pit-3",
                category="Ventilation & Gases",
                regulation="CMR 2017 Reg 130",
                title="Return Airway Methanometer Drift Beyond Calibration Tolerances",
                description="Continuous CH4 monitor reading drifted +0.18% above certified test canister baseline.",
                severity=ViolationSeverity.MAJOR,
                status=ViolationStatus.CLOSED,
                assigned_to="Ramesh Patel (Ventilation & Gas Specialist)",
                deadline=now - timedelta(days=1),
                gps_coordinates="22.3590° N, 82.7495° E",
                before_photo="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                after_photo="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
                fix_notes="Replaced electrochemical pellistor sensor head and calibrated against standard 1.0% CH4 certified gas mixture.",
                supervisor_notes="Confirmed 3-point calibration curve. Unit responding within 0.02% accuracy. Approved and closed under CMR Reg 130.",
                work_stopped_status="STOPPED",
                gas_safe_verified=True,
                cordon_verified=True,
                loto_verified=True,
                supervision_ppe_verified=True,
                created_at=now - timedelta(days=2),
                closed_at=now - timedelta(days=1)
            )
        ]

        db.add_all(violations)
        db.commit()

        # -----------------------------------------------------------
        # PHASE 1: Environmental, Production, Labour & Contractor Seed Data
        # -----------------------------------------------------------
        print("Seeding Phase 1 modules: Environmental, Production, Labour & Contractor records...")

        mine_names = MINE_NAMES

        environmental_records = []
        production_records = []
        attendance_records = []
        contractors = []

        for idx, mine_name in enumerate(mine_names):
            # --- Environmental: Air Quality (one mine intentionally over limit) ---
            spm_reading = 118.0 if idx == 0 else 78.0 + idx * 4
            environmental_records.append(EnvironmentalRecord(
                mine_name=mine_name,
                category="Air Quality",
                parameter="Suspended Particulate Matter (SPM)",
                reading_value=spm_reading,
                unit="µg/m³",
                statutory_limit=100.0,
                status="EXCEEDS_LIMIT" if spm_reading > 100.0 else "WITHIN_LIMIT",
                consent_valid_until=now + timedelta(days=180 - idx * 20),
                recorded_by="Environmental Compliance Officer",
                remarks="Routine ambient air quality station reading." if spm_reading <= 100.0
                        else "Dust suppression sprinklers under-performing near haul road; re-inspection ordered."
            ))
            # --- Environmental: Water Discharge ---
            environmental_records.append(EnvironmentalRecord(
                mine_name=mine_name,
                category="Water Discharge",
                parameter="Mine Discharge Water pH",
                reading_value=round(7.1 + (idx * 0.15), 2),
                unit="pH",
                statutory_limit=8.5,
                status="WITHIN_LIMIT",
                consent_valid_until=now + timedelta(days=240),
                recorded_by="Environmental Compliance Officer",
                remarks="Effluent treatment plant outlet sample, within CPCB norms."
            ))
            # --- Environmental: Consent to Operate (one mine pending renewal) ---
            environmental_records.append(EnvironmentalRecord(
                mine_name=mine_name,
                category="Land & Forest",
                parameter="Consent to Operate (CTO) — State Pollution Control Board",
                reading_value=1.0,
                unit="status",
                statutory_limit=None,
                status="PENDING_RENEWAL" if idx == 3 else "WITHIN_LIMIT",
                consent_valid_until=now - timedelta(days=5) if idx == 3 else now + timedelta(days=300),
                recorded_by="Mine Manager",
                remarks="CTO renewal application filed with SPCB; awaiting clearance." if idx == 3
                        else "Consent to Operate active and current."
            ))
            # --- Environmental: Plantation / Reclamation ---
            environmental_records.append(EnvironmentalRecord(
                mine_name=mine_name,
                category="Plantation",
                parameter="Reclaimed & Afforested Area",
                reading_value=round(62.0 + idx * 3.5, 1),
                unit="% of mined-out area",
                statutory_limit=None,
                status="WITHIN_LIMIT",
                recorded_by="Environmental Compliance Officer",
                remarks="Plantation drive on backfilled overburden dumps, tracked against 5-year mine closure plan."
            ))

            # --- Production: last 5 days, one overproduction day for realism ---
            approved_capacity = 3200.0 + idx * 400
            for d in range(5, 0, -1):
                extracted = approved_capacity * (0.94 + 0.03 * ((d + idx) % 3))
                if idx == 1 and d == 2:
                    extracted = approved_capacity * 1.12  # deliberate overproduction event
                production_records.append(ProductionRecord(
                    mine_name=mine_name,
                    production_date=now - timedelta(days=d),
                    shift="Shift 1",
                    quantity_extracted_tonnes=round(extracted, 1),
                    approved_capacity_tonnes=approved_capacity,
                    seam_or_block="Seam V Panel B" if idx == 0 else f"Block-{d}",
                    is_overproduction=extracted > approved_capacity,
                    remarks="Overproduction against DGMS-approved statutory capacity — review required."
                            if extracted > approved_capacity else None,
                    recorded_by="Production Officer"
                ))

            # --- Labour: attendance check-ins today ---
            worker_names = ["R. Kumar", "S. Yadav", "M. Ansari", "P. Ghosh", "T. Oraon"]
            for w_idx, worker in enumerate(worker_names):
                attendance_records.append(AttendanceRecord(
                    mine_name=mine_name,
                    worker_name=worker,
                    designation="Face Worker" if w_idx % 2 == 0 else "Contractor Labour",
                    shift="Shift 1",
                    check_in_time=now.replace(hour=8, minute=0, second=0, microsecond=0) - timedelta(minutes=w_idx * 3),
                    gps_coordinates="23.7508° N, 86.4132° E",
                    is_contractor_worker=(w_idx % 2 == 1),
                    working_hours_flag="NORMAL"
                ))

            # --- Contractors: 2 per mine, one healthy, one flagged/expiring ---
            contractors.append(Contractor(
                name=f"Shakti Mining Services Pvt. Ltd. ({mine_name.split(' ')[0]})",
                mine_name=mine_name,
                license_number=f"CIL-LIC-{2026000 + idx * 10 + 1}",
                license_expiry=now + timedelta(days=200),
                work_scope="Overburden removal & haulage support",
                safety_training_status="COMPLETED",
                active_workers_count=18 + idx,
                status="ACTIVE"
            ))
            expiring_soon = idx == 2
            contractors.append(Contractor(
                name=f"Bharat Drilling & Blasting Co. ({mine_name.split(' ')[0]})",
                mine_name=mine_name,
                license_number=f"CIL-LIC-{2026000 + idx * 10 + 2}",
                license_expiry=now + timedelta(days=10) if expiring_soon else now + timedelta(days=150),
                work_scope="Drilling & controlled blasting",
                safety_training_status="PENDING" if idx == 4 else "COMPLETED",
                active_workers_count=9 + idx,
                status="FLAGGED" if idx == 4 else "ACTIVE",
                flag_reason="Safety training refresher overdue for 3 blasting crew members." if idx == 4 else None
            ))

        db.add_all(environmental_records)
        db.add_all(production_records)
        db.add_all(attendance_records)
        db.add_all(contractors)
        db.commit()

        # -----------------------------------------------------------
        # PHASE 3/4: Grievances, Reminders & Audit Trail
        # -----------------------------------------------------------
        seed_phase3_extension(db, mine_names)

        print("Database successfully seeded with 36 authentic DGMS accounts and realistic records!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_reseed=True)
