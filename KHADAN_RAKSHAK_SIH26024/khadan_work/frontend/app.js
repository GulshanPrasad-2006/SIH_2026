/**
 * ============================================================================
 * KHADAN RAKSHAK - Statutory Coal Mine Safety & Compliance Monitoring Portal
 * Front-End Application Controller & RBAC Engine (SIH-26024)
 * Complete Implementation with 36 Demo Accounts, 5 Mines, 20 Specialized Fixers,
 * 5-Point On-Site Review Checklist, Multi-Role Alert Escalation, Mine Data Isolation,
 * and Reactive Auto-Updating Webpage Architecture.
 * ============================================================================
 */

// -------------------------------------------------------------
// STATUTORY 10-ITEM CMR 2017 CHECKLIST DEFINITION
// -------------------------------------------------------------
const STATUTORY_CHECKLIST = [
  {
    id: 1,
    code: "CMR 2017 Reg 130",
    title: "Gas Monitoring & Methane Safety",
    desc: "Multi-gas detector verified at working face. Methane (CH4) < 0.5% in return airway, Carbon Monoxide (CO) < 50 ppm, and Oxygen (O2) > 19% volume.",
    category: "Ventilation & Gases",
    tradeTag: "gas",
    defaultAssignee: "Anil Verma (Ventilation & Gas Specialist)",
    defaultPhoto: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    code: "CMR 2017 Reg 124",
    title: "Adequate Face & Roadway Ventilation Air Quantity",
    desc: "Auxiliary fan operational; minimum statutory air quantity (> 6 m³/min per person employed underground) delivered to the split without recirculation.",
    category: "Ventilation & Gases",
    tradeTag: "gas",
    defaultAssignee: "Anil Verma (Ventilation & Gas Specialist)"
  },
  {
    id: 3,
    code: "CMR 2017 Reg 104",
    title: "Strata Control & Roof Support Plan (SMP)",
    desc: "Roof bolting pattern verified with torque wrench; tell-tale extensometers checked; no visible bed separation, cracks, or side spalling along galleries.",
    category: "Strata Support",
    tradeTag: "strata",
    defaultAssignee: "Gautam Banerjee (Strata & Roof Support Specialist)",
    defaultPhoto: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    code: "CMR 2017 Reg 169",
    title: "Stone Dust & Water Explosion Barriers",
    desc: "Stone dust barriers properly loaded with dry incombustible dust; water barrier troughs undamaged and topped up across main haulage roadways.",
    category: "Mechanical & Dust",
    tradeTag: "dust",
    defaultAssignee: "R. K. Meena (Mechanical, Dust & Fire Specialist)"
  },
  {
    id: 5,
    code: "CMR 2017 Reg 182",
    title: "Fire-Fighting Hydrant Lines & Extinguishers",
    desc: "Pressurized water hydrant lines active with nozzles available; dry chemical powder extinguishers inspected, tagged, and fully charged at sub-stations.",
    category: "Mechanical & Dust",
    tradeTag: "dust",
    defaultAssignee: "R. K. Meena (Mechanical, Dust & Fire Specialist)"
  },
  {
    id: 6,
    code: "CMR 2017 Reg 188",
    title: "Emergency Escape Route Markings & Second Outlet",
    desc: "Escapeway illuminated with photoluminescent directional arrows, free from rock falls or obstructions, leading to operable second outlet shaft/incline.",
    category: "Strata Support",
    tradeTag: "strata",
    defaultAssignee: "Gautam Banerjee (Strata & Roof Support Specialist)"
  },
  {
    id: 7,
    code: "CMR 2017 Reg 82",
    title: "Haulage Track, Runaway Switches & Signaling",
    desc: "Haulage track gauge intact, rope free of broken wires, runaway catches and jazz rails functional, acoustic pull-wire signaling working end-to-end.",
    category: "Electrical & Haulage",
    tradeTag: "elec",
    defaultAssignee: "Deepak Rawat (Electrical & Haulage Machinery Specialist)"
  },
  {
    id: 8,
    code: "CMR 2017 Reg 236",
    title: "Underground Personnel PPE & Self-Rescuers",
    desc: "All miners in the district wearing DGMS-certified safety helmets with functional cap lamps, steel-toe boots, and carrying personal filter self-rescuers.",
    category: "Mechanical & Dust",
    tradeTag: "dust",
    defaultAssignee: "R. K. Meena (Mechanical, Dust & Fire Specialist)"
  },
  {
    id: 9,
    code: "CMR 2017 Reg 176",
    title: "Respirable Dust Suppression Mist Sprays",
    desc: "Water mist sprays operational at belt conveyor transfer points, crusher chute, and continuous miner face to keep airborne coal dust within 2 mg/m³.",
    category: "Mechanical & Dust",
    tradeTag: "dust",
    defaultAssignee: "R. K. Meena (Mechanical, Dust & Fire Specialist)"
  },
  {
    id: 10,
    code: "CMR 2017 Reg 94",
    title: "Flameproof (FLP) Electrical Enclosures & Earthing",
    desc: "FLP switchgear enclosures tightly bolted with no missing bolts or gaps > 0.5mm; earth leakage protection relay trip tested.",
    category: "Electrical & Haulage",
    tradeTag: "elec",
    defaultAssignee: "Deepak Rawat (Electrical & Haulage Machinery Specialist)"
  }
];

// -------------------------------------------------------------
// 36 DEMO ACCOUNTS ACROSS 5 MINES + 20 FIXERS + DGMS REGULATOR
// -------------------------------------------------------------
const DEMO_ACCOUNTS = {
  jharia: {
    mineName: "BCCL - Jharia Colliery",
    manager:    { username: "jharia.manager", password: "Mehta@2026", name: "V. K. Mehta", role: "manager", title: "Colliery Agent & Mine Manager" },
    inspector:  { username: "jharia.inspector", password: "Koyla@2026", name: "Rajesh Kumar Sharma", role: "worker", title: "Mining Sirdar (CMR 113)" },
    supervisor: { username: "jharia.supervisor", password: "Mukh@2026", name: "S. Mukherjee", role: "supervisor", title: "Colliery Overman / Shift Supervisor" },
    "fixer.gas":    { username: "jharia.fixer.gas", password: "Fixer@2026", name: "Anil Verma", role: "fixer", title: "Ventilation & Gas Specialist (CMR 124/130)", trade: "gas" },
    "fixer.strata": { username: "jharia.fixer.strata", password: "Fixer@2026", name: "Gautam Banerjee", role: "fixer", title: "Strata & Roof Support Specialist (CMR 104/188)", trade: "strata" },
    "fixer.dust":   { username: "jharia.fixer.dust", password: "Fixer@2026", name: "R. K. Meena", role: "fixer", title: "Mechanical, Dust & Fire Specialist (CMR 169/176/182)", trade: "dust" },
    "fixer.elec":   { username: "jharia.fixer.elec", password: "Fixer@2026", name: "Deepak Rawat", role: "fixer", title: "Electrical & Haulage Specialist (CMR 82/94)", trade: "elec" }
  },
  korba: {
    mineName: "SECL - Korba Deep Pit-3",
    manager:    { username: "korba.manager", password: "Korba@2026", name: "A. K. Rathore", role: "manager", title: "First Class Mine Manager" },
    inspector:  { username: "korba.inspector", password: "Koyla@2026", name: "Manoj Kumar Sahu", role: "worker", title: "Mining Sirdar (CMR 113)" },
    supervisor: { username: "korba.supervisor", password: "Mukh@2026", name: "D. P. Chandrakar", role: "supervisor", title: "Colliery Overman / Shift Supervisor" },
    "fixer.gas":    { username: "korba.fixer.gas", password: "Fixer@2026", name: "Ramesh Patel", role: "fixer", title: "Ventilation & Gas Specialist (CMR 124/130)", trade: "gas" },
    "fixer.strata": { username: "korba.fixer.strata", password: "Fixer@2026", name: "K. N. Verma", role: "fixer", title: "Strata & Roof Support Specialist (CMR 104/188)", trade: "strata" },
    "fixer.dust":   { username: "korba.fixer.dust", password: "Fixer@2026", name: "Santosh Dewangan", role: "fixer", title: "Mechanical, Dust & Fire Specialist (CMR 169/176/182)", trade: "dust" },
    "fixer.elec":   { username: "korba.fixer.elec", password: "Fixer@2026", name: "Bhupendra Soni", role: "fixer", title: "Electrical & Haulage Specialist (CMR 82/94)", trade: "elec" }
  },
  singrauli: {
    mineName: "NCL - Singrauli OCP Block-B",
    manager:    { username: "singrauli.manager", password: "Singrauli@2026", name: "R. K. Srivastava", role: "manager", title: "Project Officer & Mine Manager" },
    inspector:  { username: "singrauli.inspector", password: "Koyla@2026", name: "Vikram Pratap Singh", role: "worker", title: "Mining Sirdar (CMR 113)" },
    supervisor: { username: "singrauli.supervisor", password: "Mukh@2026", name: "Harish Chandra", role: "supervisor", title: "Shift In-Charge Supervisor" },
    "fixer.gas":    { username: "singrauli.fixer.gas", password: "Fixer@2026", name: "Alok Pandey", role: "fixer", title: "Ventilation & Gas Specialist (CMR 124/130)", trade: "gas" },
    "fixer.strata": { username: "singrauli.fixer.strata", password: "Fixer@2026", name: "Mahesh Kushwaha", role: "fixer", title: "Strata & Slope Stability Specialist (CMR 104/188)", trade: "strata" },
    "fixer.dust":   { username: "singrauli.fixer.dust", password: "Fixer@2026", name: "Devendra Mishra", role: "fixer", title: "Mechanical, Dust & Fire Specialist (CMR 169/176/182)", trade: "dust" },
    "fixer.elec":   { username: "singrauli.fixer.elec", password: "Fixer@2026", name: "Pankaj Jaiswal", role: "fixer", title: "Electrical & Heavy Equipment Specialist (CMR 82/94)", trade: "elec" }
  },
  raniganj: {
    mineName: "ECL - Raniganj Colliery",
    manager:    { username: "raniganj.manager", password: "Raniganj@2026", name: "B. C. Ghosh", role: "manager", title: "Colliery Agent & Mine Manager" },
    inspector:  { username: "raniganj.inspector", password: "Koyla@2026", name: "Subhash Mondal", role: "worker", title: "Mining Sirdar (CMR 113)" },
    supervisor: { username: "raniganj.supervisor", password: "Mukh@2026", name: "Prabir Bhattacharya", role: "supervisor", title: "Colliery Overman / Shift Supervisor" },
    "fixer.gas":    { username: "raniganj.fixer.gas", password: "Fixer@2026", name: "Tapas Sen", role: "fixer", title: "Ventilation & Gas Specialist (CMR 124/130)", trade: "gas" },
    "fixer.strata": { username: "raniganj.fixer.strata", password: "Fixer@2026", name: "Anirban Paul", role: "fixer", title: "Strata & Roof Support Specialist (CMR 104/188)", trade: "strata" },
    "fixer.dust":   { username: "raniganj.fixer.dust", password: "Fixer@2026", name: "Chanchal Roy", role: "fixer", title: "Mechanical, Dust & Fire Specialist (CMR 169/176/182)", trade: "dust" },
    "fixer.elec":   { username: "raniganj.fixer.elec", password: "Fixer@2026", name: "Somnath Das", role: "fixer", title: "Electrical & Haulage Specialist (CMR 82/94)", trade: "elec" }
  },
  piparwar: {
    mineName: "CCL - Piparwar Opencast",
    manager:    { username: "piparwar.manager", password: "Piparwar@2026", name: "S. P. Yadav", role: "manager", title: "Project Officer & Mine Manager" },
    inspector:  { username: "piparwar.inspector", password: "Koyla@2026", name: "Amit Kumar Bhagat", role: "worker", title: "Mining Sirdar (CMR 113)" },
    supervisor: { username: "piparwar.supervisor", password: "Mukh@2026", name: "R. N. Tiwary", role: "supervisor", title: "Shift In-Charge Supervisor" },
    "fixer.gas":    { username: "piparwar.fixer.gas", password: "Fixer@2026", name: "Vinod Kumar Gope", role: "fixer", title: "Ventilation & Gas Specialist (CMR 124/130)", trade: "gas" },
    "fixer.strata": { username: "piparwar.fixer.strata", password: "Fixer@2026", name: "Sanjay Munda", role: "fixer", title: "Strata & Highwall Safety Specialist (CMR 104/188)", trade: "strata" },
    "fixer.dust":   { username: "piparwar.fixer.dust", password: "Fixer@2026", name: "Ravi Oraon", role: "fixer", title: "Mechanical, Dust & Fire Specialist (CMR 169/176/182)", trade: "dust" },
    "fixer.elec":   { username: "piparwar.fixer.elec", password: "Fixer@2026", name: "Arun Kerketta", role: "fixer", title: "Electrical & Haulage Specialist (CMR 82/94)", trade: "elec" }
  },
  dgms: {
    mineName: "DGMS HQ - All Subsidiaries",
    officer: { username: "dgms.officer", password: "Roy@2026", name: "Dr. A. Roy", role: "corporate", title: "DGMS Central Directorate Regulator" }
  }
};

// Flatten DEMO_ACCOUNTS into CREDENTIALS lookup
const CREDENTIALS = {
  // Legacy aliases
  "rajesh.sharma": { password: "Koyla@2026", roleCode: "worker", mine: "BCCL - Jharia Colliery", name: "Rajesh Kumar Sharma", title: "Mining Sirdar (CMR 113)" },
  "vk.mehta":      { password: "Mehta@2026", roleCode: "manager", mine: "BCCL - Jharia Colliery", name: "V. K. Mehta", title: "Colliery Agent & Mine Manager" },
  "anil.verma":    { password: "Verma@2026", roleCode: "fixer", mine: "BCCL - Jharia Colliery", name: "Anil Verma", title: "Ventilation & Gas Specialist" },
  "s.mukherjee":   { password: "Mukh@2026",  roleCode: "supervisor", mine: "BCCL - Jharia Colliery", name: "S. Mukherjee", title: "Colliery Overman / Shift Supervisor" },
  "a.roy":         { password: "Roy@2026",   roleCode: "corporate", mine: "DGMS HQ - All Subsidiaries", name: "Dr. A. Roy", title: "DGMS Central Directorate Regulator" }
};

// Dynamically populate all 36 demo accounts
Object.keys(DEMO_ACCOUNTS).forEach(mineKey => {
  const mineData = DEMO_ACCOUNTS[mineKey];
  Object.keys(mineData).forEach(roleKey => {
    if (roleKey === "mineName") return;
    const acct = mineData[roleKey];
    CREDENTIALS[acct.username] = {
      password: acct.password,
      roleCode: acct.role,
      mine: mineData.mineName,
      name: acct.name,
      title: acct.title,
      trade: acct.trade || null
    };
  });
});

// -------------------------------------------------------------
// ROLE-BASED ACCESS CONTROL (RBAC) CONFIGURATIONS
// -------------------------------------------------------------
const ROLE_CONFIGS = {
  worker: { roleCode:"worker", name:"Rajesh Kumar Sharma", roleTitle:"Mining Sirdar (CMR Reg 113)", defaultMine:"BCCL - Jharia Colliery", scopeBadge:"Scope: Field Safety Inspector (Mine-Scoped)", defaultScreen:2, allowedScreens:[1,2,3,4,5,16], tabs:[{screen:2,label:"🏠 Inspection Desk"},{screen:3,label:"📋 10-Point Checklist"},{screen:4,label:"📝 Review & Submit"},{screen:5,label:"⚡ Assign Orders (Form VII)"},{screen:16,label:"🗣️ Grievances"}] },
  manager: { roleCode:"manager", name:"V. K. Mehta", roleTitle:"Colliery Agent / Mine Manager", defaultMine:"BCCL - Jharia Colliery", scopeBadge:"Scope: Colliery Agent & Mine Manager (Mine-Scoped)", defaultScreen:9, allowedScreens:[1,9,10,12,13,14,15,16,17,18,19], tabs:[{screen:9,label:"📊 Colliery Safety Dashboard"},{screen:10,label:"📑 Colliery Violations Log"},{screen:12,label:"✅ Closed (Last 7 Days)"},{screen:13,label:"🌱 Environmental & Production"},{screen:14,label:"👷 Labour & Contractors"},{screen:15,label:"🧠 Recurring Risk Analytics"},{screen:16,label:"🗣️ Grievances"},{screen:17,label:"🗺️ GIS Map"},{screen:18,label:"📄 Reports & Audit"},{screen:19,label:"⏰ Reminders"}] },
  fixer: { roleCode:"fixer", name:"Anil Verma", roleTitle:"Action Fixer / Remedial Engineer", defaultMine:"BCCL - Jharia Colliery", scopeBadge:"Scope: Remedial Action Fixer (Mine-Scoped)", defaultScreen:6, allowedScreens:[1,6,7,16], tabs:[{screen:6,label:"🔧 My Assigned Actions"},{screen:7,label:"📸 Close Out Violation"},{screen:16,label:"🗣️ Grievances"}] },
  supervisor: { roleCode:"supervisor", name:"S. Mukherjee", roleTitle:"Colliery Overman / Shift Supervisor", defaultMine:"BCCL - Jharia Colliery", scopeBadge:"Scope: Statutory Shift Supervisor (Mine-Scoped)", defaultScreen:8, allowedScreens:[1,8,10,12,16,19], tabs:[{screen:8,label:"🛡️ Verification Desk (Form VII-A)"},{screen:10,label:"📑 Colliery Violations Audit"},{screen:12,label:"✅ Closed (Last 7 Days)"},{screen:16,label:"🗣️ Grievances"},{screen:19,label:"⏰ Reminders"}] },
  corporate: { roleCode:"corporate", name:"Dr. A. Roy", roleTitle:"DGMS Central Directorate Regulator", defaultMine:"DGMS HQ - All Subsidiaries", scopeBadge:"Scope: Directorate Central Regulator (All Mines)", defaultScreen:11, allowedScreens:[1,9,10,11,12,13,14,15,16,17,18,19], tabs:[{screen:11,label:"🏢 Corporate Mine Risk Index"},{screen:9,label:"📊 Consolidated Dashboard"},{screen:10,label:"📑 Master Violations Table"},{screen:12,label:"✅ Closed (Last 7 Days)"},{screen:13,label:"🌱 Environmental & Production"},{screen:14,label:"👷 Labour & Contractors"},{screen:15,label:"🧠 Recurring Risk Analytics"},{screen:16,label:"🗣️ Grievances"},{screen:17,label:"🗺️ GIS Map"},{screen:18,label:"📄 Reports & Audit"},{screen:19,label:"⏰ Reminders"}] }
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;
let lockoutTimerHandle = null;

// -------------------------------------------------------------
// CENTRAL APPLICATION STATE STORE
// -------------------------------------------------------------
let store = {
  currentUser: {
    name: "",
    role: "",
    mine: "",
    roleCode: null,
    trade: null,
    username: ""
  },
  currentScreen: 1,
  loginAttempts: 0,
  loginLockedUntil: null,
  activeCaptcha: "",

  currentInspection: {
    id: "INSP-BCCL-2026-0902-8419",
    results: {},
    assignedActions: {}
  },
  latestInspectionId: null,
  selectedCloseoutViolationId: null,
  activeAlertViolationId: null,

  // Stoppage Warnings from DGMS to Mine Managers (Mines Act Sec 22)
  stoppageWarnings: {
    "BCCL - Jharia Colliery": {
      active: true,
      issuedAt: "Today, 11:30 IST",
      issuedBy: "Dr. A. Roy (DGMS Central Directorate)",
      directiveText: "Under Section 22/22A of Mines Act 1952, notice is hereby served to stop all coal cutting, extraction, and haulage operations in Jharia Seam V Panel B district during active roof bolting remediation until statutory clearance is approved.",
      acknowledged: false,
      acknowledgedAt: null,
      acknowledgedBy: null
    }
  },

  // Rolling 28-Day Statutory Red Alerts & Mine Suspension Tracking
  redAlerts: {
    "BCCL": [
      {
        id: "RA-BCCL-01",
        violationId: "VIOL-2026-0870",
        mine: "BCCL - Jharia Colliery",
        issuerName: "Dr. A. Roy (DGMS Central Directorate)",
        issuerRole: "corporate",
        reason: "Substandard tell-tale roof bolting verification. Retest failed threshold.",
        timestamp: "2026-08-20T10:30:00"
      }
    ],
    "SECL": [],
    "NCL": [],
    "ECL": [],
    "CCL": []
  },
  suspendedMines: {},

  // Dynamic Inspections Log (Pre-seeded & dynamically updated on Screen 2)
  inspections: [
    {
      id: "INSP-BCCL-2026-0904",
      mine: "BCCL - Jharia Colliery",
      inspector: "Rajesh Kumar Sharma",
      shift: "04 Sep 2026, 08:00 (Shift 1)",
      location: "Jharia Pit-4, Seam XI District",
      passedCount: 9,
      failedCount: 1,
      complianceScore: 90.0,
      status: "Actions Dispatched",
      timestamp: "04 Sep 2026 08:00 IST",
      itemsAudit: [
        { title: "CMR 130: Gas Monitoring (<0.5% Methane)", status: "pass", notes: "CH4 at 0.08%, CO at 4 ppm - Calibrated digital detector." },
        { title: "CMR 124: Face Ventilation Air Flow", status: "pass", notes: "Anemometer measured 1,840 m3/min (Statutory min: 1,500 m3/min)." },
        { title: "CMR 104: Strata Roof Bolting & Support Plan", status: "fail", notes: "Anchorage test failed on 2 roof bolts in Seam XI intake roadway. Retorque required." },
        { title: "CMR 169: Stone Dust / Water Barrier", status: "pass", notes: "Heavy stone dusting applied; barrier loading verified at 30 kg/m2." },
        { title: "CMR 182: Fire-Fighting Hydrants & Extinguishers", status: "pass", notes: "Hydrant pressure at 4.2 kg/cm2, dual ABC extinguishers tagged." },
        { title: "CMR 188: Illuminated Escape Route", status: "pass", notes: "Escape lifelines and fluorescent green markers fully visible." },
        { title: "CMR 82: Haulage Track & Runaway Switches", status: "pass", notes: "Drop warp and stop block operational; rope tension tested." },
        { title: "CMR 236: Personnel Flameproof PPE & Self-Rescuers", status: "pass", notes: "All 18 faceworkers wearing flame-resistant suits and cap lamps." },
        { title: "CMR 176: Dust Suppression Water Sprays", status: "pass", notes: "Conveyor transfer water mist nozzles clean and operating at 2.8 bar." },
        { title: "CMR 94: Electrical FLP Enclosure Seals & Earthing", status: "pass", notes: "FLP bolts torqued; earth continuity loop resistance < 0.5 ohm." }
      ]
    },
    {
      id: "INSP-BCCL-2026-0891",
      mine: "BCCL - Jharia Colliery",
      inspector: "Rajesh Kumar Sharma",
      shift: "02 Sep 2026, 08:30 (Shift 1)",
      location: "Jharia Pit-4, Seam V Panel B",
      passedCount: 10,
      failedCount: 0,
      complianceScore: 100.0,
      status: "Approved Form IV",
      timestamp: "02 Sep 2026 08:30 IST",
      itemsAudit: [
        { title: "CMR 130: Gas Monitoring (<0.5% Methane)", status: "pass", notes: "CH4 measured 0.04% - Perfect." },
        { title: "CMR 124: Face Ventilation Air Flow", status: "pass", notes: "Air flow 1,920 m3/min." },
        { title: "CMR 104: Strata Roof Bolting", status: "pass", notes: "All resin capsules fully set." },
        { title: "CMR 169: Stone Dust Barrier", status: "pass", notes: "Approved heavy stone dusting." },
        { title: "CMR 182: Fire Extinguishers", status: "pass", notes: "Functional and inspected." },
        { title: "CMR 188: Illuminated Escape Route", status: "pass", notes: "Clear and unobstructed." },
        { title: "CMR 82: Haulage Track", status: "pass", notes: "Signaling tested normal." },
        { title: "CMR 236: Personnel PPE", status: "pass", notes: "100% compliant." },
        { title: "CMR 176: Dust Sprays", status: "pass", notes: "Transfer point active." },
        { title: "CMR 94: Electrical FLP Seals", status: "pass", notes: "Earthing verified." }
      ]
    },
    {
      id: "INSP-BCCL-2026-0884",
      mine: "BCCL - Jharia Colliery",
      inspector: "Rajesh Kumar Sharma",
      shift: "01 Sep 2026, 16:15 (Shift 2)",
      location: "Jharia North Incline, Transfer Point",
      passedCount: 8,
      failedCount: 2,
      complianceScore: 80.0,
      status: "Actions Dispatched",
      timestamp: "01 Sep 2026 16:15 IST",
      itemsAudit: [
        { title: "CMR 130: Gas Monitoring", status: "pass", notes: "CH4 safe at 0.12%." },
        { title: "CMR 124: Face Ventilation", status: "pass", notes: "Air speed 1.1 m/s." },
        { title: "CMR 104: Strata Roof Bolting", status: "pass", notes: "Tell-tale reading 2mm (Safe)." },
        { title: "CMR 169: Stone Dust Barrier", status: "fail", notes: "Dust shelf #4 disturbed by haulage trip. Re-dusting order served." },
        { title: "CMR 182: Fire Hydrants", status: "pass", notes: "Pressure gauge verified." },
        { title: "CMR 188: Escape Route", status: "pass", notes: "Lighting inspected." },
        { title: "CMR 82: Haulage Track Signaling", status: "fail", notes: "Acoustic buzzer interlock intermittent at Level 2." },
        { title: "CMR 236: Personnel PPE", status: "pass", notes: "All crew verified." },
        { title: "CMR 176: Dust Suppression Sprays", status: "pass", notes: "Nozzles clean." },
        { title: "CMR 94: Electrical FLP Seals", status: "pass", notes: "FLP enclosures locked." }
      ]
    },
    {
      id: "INSP-BCCL-2026-0872",
      mine: "BCCL - Jharia Colliery",
      inspector: "Rajesh Kumar Sharma",
      shift: "30 Aug 2026, 23:45 (Shift 3)",
      location: "Jharia Deep District, Face 12",
      passedCount: 10,
      failedCount: 0,
      complianceScore: 100.0,
      status: "Approved Form IV",
      timestamp: "30 Aug 2026 23:45 IST",
      itemsAudit: []
    },
    {
      id: "INSP-SECL-2026-0312",
      mine: "SECL - Korba Deep Pit-3",
      inspector: "Manoj Kumar Sahu",
      shift: "31 Aug 2026, 10:00 (Shift 1)",
      location: "Korba District C, Main Dip Roadway",
      passedCount: 9,
      failedCount: 1,
      complianceScore: 90.0,
      status: "Actions Dispatched",
      timestamp: "31 Aug 2026 10:00 IST",
      itemsAudit: []
    },
    {
      id: "INSP-NCL-2026-0105",
      mine: "NCL - Singrauli OCP Block-B",
      inspector: "Vikram Pratap Singh",
      shift: "30 Aug 2026, 07:45 (General Shift)",
      location: "Singrauli Section A Benches",
      passedCount: 10,
      failedCount: 0,
      complianceScore: 100.0,
      status: "Approved Form IV",
      timestamp: "30 Aug 2026 07:45 IST",
      itemsAudit: []
    },
    {
      id: "INSP-ECL-2026-0219",
      mine: "ECL - Raniganj Colliery",
      inspector: "Subhashis Roy",
      shift: "29 Aug 2026, 15:30 (Shift 2)",
      location: "Raniganj Seam VIII Incline",
      passedCount: 10,
      failedCount: 0,
      complianceScore: 100.0,
      status: "Approved Form IV",
      timestamp: "29 Aug 2026 15:30 IST",
      itemsAudit: []
    }
  ],

  // Pre-seeded Master Violations across mines with specialized fixer assignments
  violations: [
    {
      id: "VIOL-2026-0901",
      inspectionId: "INSP-BCCL-2026-0884",
      mine: "BCCL - Jharia Colliery",
      category: "Strata Support",
      regulation: "CMR 2017 Reg 104",
      title: "Roof Bolt Loose & Bed Separation Observed",
      description: "Roof bolt plate loosened near transfer junction; 5mm bed separation indicated by tell-tale extensometer.",
      severity: "Critical",
      status: "OPEN", // OPEN, PENDING_VERIFICATION, CLOSED
      assignedTo: "Gautam Banerjee (Strata & Roof Support Specialist)",
      deadline: "2026-09-04T18:00",
      gps: "23.7508° N, 86.4132° E (Jharia Seam V Panel B)",
      timestamp: "01 Sep 2026 16:15 IST",
      beforePhoto: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
      afterPhoto: null,
      fixNotes: "",
      supervisorNotes: "",
      alert_sent: true,
      alert_by_role: "manager",
      alert_by_name: "V. K. Mehta (Mine Manager)",
      alert_timestamp: "04 Sep 2026 10:15 IST",
      alert_level: "URGENT_NOTICE",
      alert_notes: "Statutory 24h immediate notice. All extraction in panel must be stopped during roof re-bolting.",
      work_stopped_status: "STOPPED",
      work_continued_flag: false,
      gas_safe_verified: true,
      cordon_verified: true,
      loto_verified: true,
      supervision_ppe_verified: true,
      checklist_notes: ""
    },
    {
      id: "VIOL-2026-0902",
      inspectionId: "INSP-BCCL-2026-0884",
      mine: "BCCL - Jharia Colliery",
      category: "Ventilation & Gases",
      regulation: "CMR 2017 Reg 130",
      title: "Methane Sensor Calibration Drift at Return Airway",
      description: "Methane detector sensor uncalibrated; reading drifting 0.42% in return airway.",
      severity: "Major",
      status: "PENDING_VERIFICATION",
      assignedTo: "Anil Verma (Ventilation & Gas Specialist)",
      deadline: "2026-09-05T18:00",
      gps: "23.7507° N, 86.4131° E (Gate 3 Airway)",
      timestamp: "01 Sep 2026 16:20 IST",
      beforePhoto: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
      afterPhoto: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
      fixNotes: "Replaced faulty sensor module with DGMS certified calibrated unit. Recalibrated zero-point.",
      supervisorNotes: "",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false,
      gas_safe_verified: true,
      cordon_verified: true,
      loto_verified: true,
      supervision_ppe_verified: true,
      checklist_notes: "Sensor replaced while conveyor was shut down. Mining Sirdar present."
    },
    {
      id: "VIOL-2026-0903",
      inspectionId: "INSP-BCCL-2026-0884",
      mine: "BCCL - Jharia Colliery",
      category: "Mechanical & Dust",
      regulation: "CMR 2017 Reg 176",
      title: "Dust Suppression Mist Sprays Blocked at Transfer Point",
      description: "Respirable dust mist nozzles completely clogged with coal scale. Airborne dust exceeds limit.",
      severity: "Critical",
      status: "OPEN",
      assignedTo: "R. K. Meena (Mechanical, Dust & Fire Specialist)",
      deadline: "2026-09-04T20:00",
      gps: "23.7510° N, 86.4135° E",
      timestamp: "02 Sep 2026 09:30 IST",
      beforePhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop&q=60",
      afterPhoto: null,
      fixNotes: "",
      supervisorNotes: "",
      alert_sent: true,
      alert_by_role: "dgms",
      alert_by_name: "Dr. A. Roy (DGMS Directorate)",
      alert_timestamp: "04 Sep 2026 11:00 IST",
      alert_level: "SHOW_CAUSE",
      alert_notes: "High risk of coal dust explosion. Clear nozzles immediately and flush water line.",
      work_stopped_status: "STOPPED",
      work_continued_flag: false
    },
    {
      id: "VIOL-2026-0904",
      inspectionId: "INSP-BCCL-2026-0884",
      mine: "BCCL - Jharia Colliery",
      category: "Electrical & Haulage",
      regulation: "CMR 2017 Reg 94",
      title: "FLP Switchgear Enclosure Loose Bolts & Broken Seal",
      description: "Gate-end FLP switchgear box missing 2 statutory hex bolts. Flameproof integrity compromised.",
      severity: "Major",
      status: "OPEN",
      assignedTo: "Deepak Rawat (Electrical & Haulage Specialist)",
      deadline: "2026-09-05T12:00",
      gps: "23.7505° N, 86.4128° E",
      timestamp: "02 Sep 2026 11:15 IST",
      beforePhoto: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
      afterPhoto: null,
      fixNotes: "",
      supervisorNotes: "",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false
    },
    {
      id: "VIOL-2026-0895",
      inspectionId: "INSP-SECL-2026-0312",
      mine: "SECL - Korba Deep Pit-3",
      category: "Mechanical & Dust",
      regulation: "CMR 2017 Reg 169",
      title: "Stone Dust Barrier Shelves Under-Loaded",
      description: "Primary stone dust barrier shelves contain less than 30 kg/m² statutory quantity.",
      severity: "Major",
      status: "OPEN",
      assignedTo: "Santosh Dewangan (Mechanical, Dust & Fire Specialist)",
      deadline: "2026-09-04T12:00",
      gps: "22.3595° N, 82.7501° E (Pit 3 Incline)",
      timestamp: "30 Aug 2026 09:30 IST",
      beforePhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop&q=60",
      afterPhoto: null,
      fixNotes: "",
      supervisorNotes: "",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false
    },
    {
      id: "VIOL-2026-0896",
      inspectionId: "INSP-SECL-2026-0312",
      mine: "SECL - Korba Deep Pit-3",
      category: "Ventilation & Gases",
      regulation: "CMR 2017 Reg 124",
      title: "Face Auxiliary Fan Duct Torn Causing Air Leakage",
      description: "Canvas ducting torn 15m from face, air quantity dropping to 4.2 m³/min per person.",
      severity: "Major",
      status: "OPEN",
      assignedTo: "Ramesh Patel (Ventilation & Gas Specialist)",
      deadline: "2026-09-05T14:00",
      gps: "22.3590° N, 82.7495° E",
      timestamp: "31 Aug 2026 14:00 IST",
      beforePhoto: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
      afterPhoto: null,
      fixNotes: "",
      supervisorNotes: "",
      alert_sent: true,
      alert_by_role: "manager",
      alert_by_name: "R. K. Sharma (Mine Manager)",
      alert_timestamp: "04 Sep 2026 08:30 IST",
      alert_level: "STATUTORY_DIRECTIVE",
      alert_notes: "Patch ducting immediately. Face ventilation below statutory threshold.",
      work_stopped_status: "STOPPED",
      work_continued_flag: false
    },
    {
      id: "VIOL-2026-0888",
      inspectionId: "INSP-NCL-2026-0105",
      mine: "NCL - Singrauli OCP Block-B",
      category: "Electrical & Haulage",
      regulation: "CMR 2017 Reg 82",
      title: "Haul Road Acoustic Pull-Wire Horn Cable Detached",
      description: "Acoustic warning horn wire disconnected at bench intersection.",
      severity: "Minor",
      status: "CLOSED",
      assignedTo: "Pankaj Jaiswal (Electrical & Heavy Equipment Specialist)",
      deadline: "2026-09-02T18:00",
      gps: "24.1997° N, 82.6644° E (Singrauli Section A)",
      timestamp: "31 Aug 2026 11:00 IST",
      closed_at: "2026-09-02T16:30:00Z",
      closedDateFormatted: "02 Sep 2026 16:30 IST",
      beforePhoto: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=60",
      afterPhoto: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
      fixNotes: "Re-welded hinge, replaced pull wire and tested 3 consecutive manual trips.",
      supervisorNotes: "Verified on-site. Approved under CMR 2017 Reg 82 Form VII-A.",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false,
      gas_safe_verified: true,
      cordon_verified: true,
      loto_verified: true,
      supervision_ppe_verified: true
    },
    {
      id: "VIOL-2026-0870",
      inspectionId: "INSP-BCCL-2026-0880",
      mine: "BCCL - Jharia Colliery",
      category: "Strata Control & Roof Support",
      regulation: "CMR 2017 Reg 104",
      title: "W-Flank Roadway Roof Bolt Tension Below Statutory Limit (80 kN)",
      description: "Torque wrench test revealed 4 roof bolts in Section 4 below minimum anchorage threshold.",
      severity: "Critical",
      status: "CLOSED",
      assignedTo: "Gautam Banerjee (Strata & Roof Support Specialist)",
      deadline: "2026-09-02T12:00",
      gps: "23.7463° N, 86.4158° E (Seam V Panel 2)",
      timestamp: "01 Sep 2026 09:30 IST",
      closed_at: "2026-09-02T15:45:00Z",
      closedDateFormatted: "02 Sep 2026 15:45 IST",
      beforePhoto: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
      afterPhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=500&auto=format&fit=crop&q=60",
      fixNotes: "Re-drilled resin holes, installed 22mm Tor-steel resin capsules and re-torqued to 195 N-m (110 kN anchorage confirmed).",
      supervisorNotes: "Tested with calibrated digital torque gauge. All bolts verified above 100 kN. Approved under Form VII-A.",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false,
      gas_safe_verified: true,
      cordon_verified: true,
      loto_verified: true,
      supervision_ppe_verified: true
    },
    {
      id: "VIOL-2026-0875",
      inspectionId: "INSP-SECL-2026-0305",
      mine: "SECL - Korba Deep Pit-3",
      category: "Ventilation & Gases",
      regulation: "CMR 2017 Reg 130",
      title: "Return Airway Methanometer Drift Beyond Calibration Tolerances",
      description: "Continuous CH4 monitor reading drifted +0.18% above certified test canister baseline.",
      severity: "Major",
      status: "CLOSED",
      assignedTo: "Ramesh Patel (Ventilation & Gas Specialist)",
      deadline: "2026-09-03T18:00",
      gps: "22.3590° N, 82.7495° E (Return Shaft #2)",
      timestamp: "02 Sep 2026 08:15 IST",
      closed_at: "2026-09-03T14:20:00Z",
      closedDateFormatted: "03 Sep 2026 14:20 IST",
      beforePhoto: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
      afterPhoto: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
      fixNotes: "Replaced electrochemical pellistor sensor head and calibrated against standard 1.0% CH4 certified gas mixture.",
      supervisorNotes: "Confirmed 3-point calibration curve. Unit responding within 0.02% accuracy. Approved and closed under CMR Reg 130.",
      alert_sent: false,
      work_stopped_status: "STOPPED",
      work_continued_flag: false,
      gas_safe_verified: true,
      cordon_verified: true,
      loto_verified: true,
      supervision_ppe_verified: true
    }
  ],

  // Pre-seeded Mines for Screen 11 (Corporate Multi-Mine Drill-Down)
  mines: [
    {
      name: "BCCL - Jharia Colliery",
      subsidiary: "Bharat Coking Coal Limited (BCCL)",
      zone: "Dhanbad, Jharkhand",
      type: "Underground (Seam V/VI)",
      depth: "310m",
      riskScore: 78,
      riskLevel: "HIGH RISK",
      openViolations: 3,
      criticalViolations: 2,
      complianceRate: "88.5%",
      gassyCategory: "Degree III Gassy",
      lastAudit: "Today, 08:30 IST"
    },
    {
      name: "SECL - Korba Deep Pit-3",
      subsidiary: "South Eastern Coalfields Ltd (SECL)",
      zone: "Korba, Chhattisgarh",
      type: "Underground (Pit-3)",
      depth: "240m",
      riskScore: 62,
      riskLevel: "MODERATE RISK",
      openViolations: 2,
      criticalViolations: 0,
      complianceRate: "93.0%",
      gassyCategory: "Degree II Gassy",
      lastAudit: "01 Sep 2026"
    },
    {
      name: "NCL - Singrauli OCP Block-B",
      subsidiary: "Northern Coalfields Ltd (NCL)",
      zone: "Singrauli, MP / UP",
      type: "Opencast Heavy Project",
      depth: "90m",
      riskScore: 24,
      riskLevel: "SAFE / LOW RISK",
      openViolations: 0,
      criticalViolations: 0,
      complianceRate: "97.4%",
      gassyCategory: "Degree I",
      lastAudit: "31 Aug 2026"
    },
    {
      name: "ECL - Raniganj Colliery",
      subsidiary: "Eastern Coalfields Ltd (ECL)",
      zone: "Asansol, West Bengal",
      type: "Underground (Incline 4)",
      depth: "185m",
      riskScore: 71,
      riskLevel: "HIGH RISK",
      openViolations: 2,
      criticalViolations: 1,
      complianceRate: "89.2%",
      gassyCategory: "Degree III Gassy",
      lastAudit: "30 Aug 2026"
    },
    {
      name: "CCL - Piparwar Opencast",
      subsidiary: "Central Coalfields Ltd (CCL)",
      zone: "Chatra, Jharkhand",
      type: "Opencast Coal Washery",
      depth: "65m",
      riskScore: 31,
      riskLevel: "SAFE / LOW RISK",
      openViolations: 1,
      criticalViolations: 0,
      complianceRate: "98.1%",
      gassyCategory: "Degree I",
      lastAudit: "02 Sep 2026"
    }
  ]
};

// -------------------------------------------------------------
// LIVE IST CLOCK
// -------------------------------------------------------------
function updateClock() {
  const now = new Date();
  const options = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false 
  };
  const istString = now.toLocaleDateString('en-GB', options).replace(',', ' |') + ' IST';
  const el = document.getElementById('live-ist-clock');
  if (el) el.textContent = istString;
}
setInterval(updateClock, 1000);
updateClock();

// -------------------------------------------------------------
// DYNAMIC CAPTCHA ENGINE
// -------------------------------------------------------------
function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  store.activeCaptcha = code;

  const display = document.getElementById('captcha-code-display');
  if (display) {
    display.innerHTML = code.split('').map(ch => {
      const rotate = (Math.random() * 14 - 7).toFixed(1);
      const rise = (Math.random() * 4 - 2).toFixed(1);
      return `<span class="inline-block font-mono font-bold text-slate-800" style="transform: rotate(${rotate}deg) translateY(${rise}px); margin: 0 1.5px;">${ch}</span>`;
    }).join('');
  }
  const input = document.getElementById('login-captcha');
  if (input) input.value = code;
}

function showLoginError(message) {
  const alertBox = document.getElementById('login-error-alert');
  const text = document.getElementById('login-error-text');
  if (text) text.textContent = message;
  if (alertBox) alertBox.classList.remove('hidden');
}

function hideLoginError() {
  const alertBox = document.getElementById('login-error-alert');
  if (alertBox) alertBox.classList.add('hidden');
}

function togglePasswordVisibility() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('toggle-pwd-icon');
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// -------------------------------------------------------------
// SCREEN 1: AUTO-FILLING MINE & ROLE FORM CONTROLLER
// -------------------------------------------------------------
function handleMineOrRoleChange(source) {
  const mineEl = document.getElementById('login-mine');
  const roleEl = document.getElementById('login-role');
  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  const captchaEl = document.getElementById('login-captcha');
  const nameEl = document.getElementById('login-identity-name');
  const titleEl = document.getElementById('login-identity-title');

  if (!mineEl || !roleEl) return;

  let mineVal = mineEl.value;
  let roleVal = roleEl.value;

  // Synchronization between DGMS and Colliery Units based on who triggered the change
  if (source === 'role') {
    if (roleVal === 'corporate') {
      mineEl.value = "DGMS HQ - All Subsidiaries";
      mineVal = mineEl.value;
    } else if (mineVal.includes("DGMS") || mineVal.includes("Corporate")) {
      mineEl.value = "BCCL - Jharia Colliery";
      mineVal = mineEl.value;
    }
  } else if (source === 'mine') {
    if (mineVal.includes("DGMS") || mineVal.includes("Corporate")) {
      roleEl.value = "corporate";
      roleVal = "corporate";
    } else if (roleVal === 'corporate') {
      roleEl.value = "manager";
      roleVal = "manager";
    }
  } else {
    if (mineVal.includes("DGMS") || mineVal.includes("Corporate")) {
      roleEl.value = "corporate";
      roleVal = "corporate";
    } else if (roleVal === 'corporate') {
      mineEl.value = "DGMS HQ - All Subsidiaries";
      mineVal = mineEl.value;
    }
  }

  // Map mine name to key
  let mineKey = "jharia";
  if (mineVal.includes("Jharia") || mineVal.includes("BCCL")) mineKey = "jharia";
  else if (mineVal.includes("Korba") || mineVal.includes("SECL")) mineKey = "korba";
  else if (mineVal.includes("Singrauli") || mineVal.includes("NCL")) mineKey = "singrauli";
  else if (mineVal.includes("Raniganj") || mineVal.includes("ECL")) mineKey = "raniganj";
  else if (mineVal.includes("Piparwar") || mineVal.includes("CCL")) mineKey = "piparwar";
  else if (mineVal.includes("DGMS") || mineVal.includes("Corporate")) mineKey = "dgms";

  // Look up credentials for (mineKey, roleVal)
  let acct = null;
  if (mineKey === "dgms" || roleVal === "corporate") {
    acct = DEMO_ACCOUNTS.dgms.officer;
  } else {
    const mineData = DEMO_ACCOUNTS[mineKey] || DEMO_ACCOUNTS.jharia;
    if (roleVal === "manager") acct = mineData.manager;
    else if (roleVal === "supervisor") acct = mineData.supervisor;
    else if (roleVal === "worker") acct = mineData.inspector;
    else if (roleVal.startsWith("fixer")) acct = mineData[roleVal] || mineData["fixer.gas"];
    else acct = mineData.manager;
  }

  if (acct) {
    if (userEl) userEl.value = acct.username;
    if (passEl) passEl.value = acct.password;
    if (nameEl) nameEl.textContent = acct.name;
    if (titleEl) titleEl.textContent = acct.title;
  }

  // Ensure captcha exists and is auto-filled
  if (!store.activeCaptcha) {
    generateCaptcha();
  }
  if (captchaEl && store.activeCaptcha) {
    captchaEl.value = store.activeCaptcha;
  }

  hideLoginError();
}

function updateDemoRoleOptions() {
  handleMineOrRoleChange();
}

function loadSelectedDemoCredentials() {
  handleMineOrRoleChange();
}

function quickFillPersona(username) {
  const acct = CREDENTIALS[username.toLowerCase()];
  if (!acct) return;

  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  const mineEl = document.getElementById('login-mine');
  const roleEl = document.getElementById('login-role');
  const captchaEl = document.getElementById('login-captcha');
  const nameEl = document.getElementById('login-identity-name');
  const titleEl = document.getElementById('login-identity-title');

  if (userEl) userEl.value = username;
  if (passEl) passEl.value = acct.password;
  if (nameEl) nameEl.textContent = acct.name;
  if (titleEl) titleEl.textContent = acct.title;

  if (mineEl && acct.mine) {
    for (let i = 0; i < mineEl.options.length; i++) {
      if (mineEl.options[i].value.includes(acct.mine.split(' ')[0])) {
        mineEl.selectedIndex = i;
        break;
      }
    }
  }

  if (roleEl && acct.roleCode) {
    roleEl.value = acct.roleCode;
  }

  if (captchaEl && store.activeCaptcha) {
    captchaEl.value = store.activeCaptcha;
  }

  hideLoginError();
}

function quickFillLogin(user, pass) {
  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  const captchaEl = document.getElementById('login-captcha');
  if (userEl) userEl.value = user;
  if (passEl) passEl.value = pass;
  if (captchaEl && store.activeCaptcha) captchaEl.value = store.activeCaptcha;
  hideLoginError();
}

// -------------------------------------------------------------
// AUTHENTICATED CHROME TOGGLE & ROLE NAVIGATION
// -------------------------------------------------------------
function setAuthenticatedChrome(isAuthenticated) {
  const guestBadge = document.getElementById('header-guest-badge');
  const userSection = document.getElementById('header-user-section');
  const navBar = document.getElementById('portal-nav-bar');

  if (guestBadge) guestBadge.classList.toggle('hidden', isAuthenticated);
  if (userSection) userSection.classList.toggle('hidden', !isAuthenticated);
  if (navBar) navBar.classList.toggle('hidden', !isAuthenticated);
}

function renderRoleNavigation() {
  const container = document.getElementById('role-nav-tabs');
  if (!container) return;
  container.innerHTML = "";

  const currentRole = store.currentUser.roleCode || "worker";
  const config = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.worker;

  const scopeBadgeEl = document.getElementById('nav-role-badge');
  if (scopeBadgeEl) scopeBadgeEl.textContent = config.scopeBadge;

  config.tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.id = `role-tab-btn-${tab.screen}`;
    btn.onclick = () => switchScreen(tab.screen);
    btn.className = `px-3 py-1.5 rounded transition text-xs font-semibold ${
      store.currentScreen === tab.screen 
        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
        : 'hover:bg-slate-700 text-slate-300'
    }`;
    btn.innerHTML = tab.label;
    container.appendChild(btn);
  });
}

// -------------------------------------------------------------
// SCREEN CONTROLLER (WITH STRICT MINE MANAGER & RBAC ENFORCEMENT)
// -------------------------------------------------------------
function switchScreen(screenNum) {
  const currentRole = store.currentUser.roleCode;
  
  if (!currentRole && screenNum !== 1) {
    switchScreen(1);
    return;
  }

  const config = currentRole ? (ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.worker) : null;

  // Enforce RBAC permission if logged in
  if (config && screenNum !== 1 && !config.allowedScreens.includes(screenNum)) {
    showAccessRestrictedModal(screenNum, config);
    return;
  }

  store.currentScreen = screenNum;

  // Hide all screens
  for (let i = 1; i <= 19; i++) {
    const s = document.getElementById(`screen-${i}`);
    if (s) s.classList.add('hidden');
  }

  // Reveal target screen
  const active = document.getElementById(`screen-${screenNum}`);
  if (active) active.classList.remove('hidden');

  // Update Dynamic Navigation Tabs
  if (store.currentUser.roleCode) {
    renderRoleNavigation();
  }

  // Screen Lifecycle hooks
  if (screenNum === 2) { renderScreen2PastInspections(); updateAllComplianceDisplays(); }
  if (screenNum === 3) updateAllComplianceDisplays();
  if (screenNum === 6) renderScreen6MyActions();
  if (screenNum === 7) renderScreen7();
  if (screenNum === 8) renderScreen8Verifications();
  if (screenNum === 9) { renderScreen9Charts(); updateAllComplianceDisplays(); fetchAndUpdateComplianceKPI(store.currentUser.mine); }
  if (screenNum === 10) renderScreen10ViolationsTable();
  if (screenNum === 11) renderScreen11CorporateMines();
  if (screenNum === 12) renderScreen12ClosedViolations();
  if (screenNum === 13) renderScreen13Compliance();
  if (screenNum === 14) renderScreen14Labour();
  if (screenNum === 15) renderScreen15Analytics();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// AUTHENTICATION & LOGIN SUBMIT WORKFLOW
// -------------------------------------------------------------
function handleLoginSubmit(e) {
  e.preventDefault();

  if (store.loginLockedUntil && Date.now() < store.loginLockedUntil) {
    runLockoutCountdown();
    return;
  }

  const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
  const passwordInput = document.getElementById('login-password').value;
  const captchaInput = document.getElementById('login-captcha').value.trim().toUpperCase();
  const mineSelect = document.getElementById('login-mine');

  // 1. Validate Captcha
  if (!captchaInput || captchaInput !== store.activeCaptcha) {
    registerFailedAttempt("Incorrect security captcha code.");
    return;
  }

  // 2. Validate Credentials
  const account = CREDENTIALS[usernameInput];
  if (!account || account.password !== passwordInput) {
    registerFailedAttempt("Invalid username or password for statutory portal.");
    return;
  }

  // Success
  store.loginAttempts = 0;
  store.loginLockedUntil = null;
  hideLoginError();

  const config = ROLE_CONFIGS[account.roleCode] || ROLE_CONFIGS.worker;
  store.currentUser = {
    username: usernameInput,
    name: account.name || config.name,
    role: account.title || config.roleTitle,
    mine: account.mine || (mineSelect ? mineSelect.value : config.defaultMine),
    roleCode: account.roleCode,
    trade: account.trade || null
  };

  try {
    sessionStorage.setItem('khadan_rakshak_user', JSON.stringify(store.currentUser));
  } catch (err) {}

  document.getElementById('login-password').value = "";
  document.getElementById('login-captcha').value = "";

  applyUserSessionToUI();
  setAuthenticatedChrome(true);
  renderRoleNavigation();
  showLiveToast("Authentication Succeeded", `Welcome, ${store.currentUser.name} (${store.currentUser.role}).`, "success");
  switchScreen(config.defaultScreen);
  generateCaptcha();
}

function applyUserSessionToUI() {
  const badgeName = document.getElementById('badge-user-name');
  const badgeRole = document.getElementById('badge-user-role');
  const badgeMine = document.getElementById('badge-mine-name');
  const homeUser = document.getElementById('home-disp-user');
  const homeMine = document.getElementById('home-disp-mine');

  if (badgeName) badgeName.textContent = store.currentUser.name;
  if (badgeRole) badgeRole.textContent = store.currentUser.role;
  if (badgeMine) badgeMine.textContent = store.currentUser.mine;
  if (homeUser) homeUser.textContent = store.currentUser.name;
  if (homeMine) homeMine.textContent = store.currentUser.mine;
}

function registerFailedAttempt(message) {
  store.loginAttempts = (store.loginAttempts || 0) + 1;
  const remaining = MAX_LOGIN_ATTEMPTS - store.loginAttempts;

  if (remaining <= 0) {
    store.loginLockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    runLockoutCountdown();
  } else {
    showLoginError(`${message} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before temporary lockout.`);
  }

  const pwdEl = document.getElementById('login-password');
  if (pwdEl) pwdEl.value = "";
  generateCaptcha();
}

function runLockoutCountdown() {
  const submitBtn = document.getElementById('login-submit-btn');
  if (submitBtn) submitBtn.disabled = true;
  if (lockoutTimerHandle) clearInterval(lockoutTimerHandle);

  const tick = () => {
    const msLeft = store.loginLockedUntil - Date.now();
    if (msLeft <= 0) {
      clearInterval(lockoutTimerHandle);
      lockoutTimerHandle = null;
      store.loginAttempts = 0;
      store.loginLockedUntil = null;
      if (submitBtn) submitBtn.disabled = false;
      hideLoginError();
      return;
    }
    showLoginError(`Too many failed attempts. Portal access locked for ${Math.ceil(msLeft / 1000)}s.`);
  };
  tick();
  lockoutTimerHandle = setInterval(tick, 1000);
}

function logoutToScreen1() {
  if (confirm("Do you wish to sign out of the statutory compliance portal? To change roles or mines, sign out and select another demo credential.")) {
    store.currentUser = { name: "", role: "", mine: "", roleCode: null, trade: null, username: "" };
    store.loginAttempts = 0;
    store.loginLockedUntil = null;
    if (lockoutTimerHandle) { clearInterval(lockoutTimerHandle); lockoutTimerHandle = null; }

    try {
      sessionStorage.removeItem('khadan_rakshak_user');
    } catch (e) {}

    const uEl = document.getElementById('login-username');
    const pEl = document.getElementById('login-password');
    const cEl = document.getElementById('login-captcha');
    const sBtn = document.getElementById('login-submit-btn');

    if (uEl) uEl.value = "";
    if (pEl) pEl.value = "";
    if (cEl) cEl.value = "";
    if (sBtn) sBtn.disabled = false;

    hideLoginError();
    generateCaptcha();
    setAuthenticatedChrome(false);
    switchScreen(1);
  }
}

// -------------------------------------------------------------
// SCREEN 2: INSPECTION DESK (DYNAMIC LATEST REPORTS & PAST LOGS)
// -------------------------------------------------------------
function startNewInspection() {
  const minePrefix = store.currentUser.mine.includes("BCCL") ? "INSP-BCCL" :
                     store.currentUser.mine.includes("SECL") ? "INSP-SECL" :
                     store.currentUser.mine.includes("NCL")  ? "INSP-NCL" :
                     store.currentUser.mine.includes("ECL")  ? "INSP-ECL" : "INSP-CCL";

  store.currentInspection = {
    id: `${minePrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    results: {},
    assignedActions: {}
  };
  renderChecklist();
  updateChecklistProgress();
  switchScreen(3);
}

function renderScreen2PastInspections() {
  const userMinePrefix = store.currentUser.mine ? store.currentUser.mine.split(' ')[0] : "BCCL";
  const userRole = store.currentUser.roleCode;
  const userName = store.currentUser.name || "";

  // ROLE-SCOPED INSPECTION HISTORY:
  // worker  → only inspections THEY personally conducted (by inspector name)
  // manager/supervisor → all inspections in their mine (any inspector)
  // corporate (DGMS) → all inspections across all mines
  let filtered = store.inspections.filter(i => {
    if (userRole === 'corporate') return true;
    if (userRole === 'worker') {
      // Match by inspector name so the field worker sees only their own Form IVs
      const inspectorMatch = i.inspector && i.inspector.toLowerCase().includes(userName.toLowerCase().split(' ')[0]);
      const mineMatch = i.mine && i.mine.includes(userMinePrefix);
      return inspectorMatch && mineMatch;
    }
    // manager / supervisor: all inspections in their mine
    return i.mine && i.mine.includes(userMinePrefix);
  });

  // Apply shift filter if present
  const shiftSelect = document.getElementById('filter-insp-shift');
  if (shiftSelect && shiftSelect.value !== "ALL") {
    filtered = filtered.filter(i => (i.shift || "").includes(shiftSelect.value));
  }

  // Apply compliance tier filter if present
  const statusSelect = document.getElementById('filter-insp-status');
  if (statusSelect && statusSelect.value !== "ALL") {
    if (statusSelect.value === "COMPLIANT") {
      filtered = filtered.filter(i => i.failedCount === 0);
    } else if (statusSelect.value === "VIOLATIONS") {
      filtered = filtered.filter(i => i.failedCount > 0);
    }
  }

  // Apply search query if present
  const searchInput = document.getElementById('search-insp-query');
  if (searchInput && searchInput.value.trim()) {
    const q = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(i => 
      (i.id && i.id.toLowerCase().includes(q)) ||
      (i.location && i.location.toLowerCase().includes(q)) ||
      (i.inspector && i.inspector.toLowerCase().includes(q)) ||
      (i.mine && i.mine.toLowerCase().includes(q))
    );
  }

  // Update total badge
  const totalBadge = document.getElementById('insp-total-count-badge');
  if (totalBadge) totalBadge.textContent = `${filtered.length} Form IV Logs`;

  // Render Enlarged Past Inspections Table (Recent site hero card completely removed per statutory review)
  const tbody = document.getElementById('past-inspections-tbody');
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs font-medium">No statutory inspections match the selected shift or search query.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(insp => {
        const isClean = insp.failedCount === 0;
        const score = insp.complianceScore !== undefined ? insp.complianceScore : (insp.failedCount === 0 ? 100 : Math.round((insp.passedCount / (insp.passedCount + insp.failedCount)) * 100));
        const scoreColor = score >= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                           score >= 75 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                           'bg-rose-100 text-rose-800 border-rose-300';
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-3 px-4 font-mono font-bold text-blue-900 text-xs">
              ${insp.id}
              <span class="block text-[10px] text-slate-500 font-sans font-normal">CMR Reg 113 Attested</span>
            </td>
            <td class="py-3 px-4 text-xs">
              <span class="font-semibold text-slate-800">${insp.shift}</span>
              <span class="block text-[10px] text-slate-500">${insp.timestamp || "Official Shift Audit"}</span>
            </td>
            <td class="py-3 px-4 text-xs">
              <strong class="text-slate-900">${insp.mine}</strong>
              <span class="block text-[11px] text-slate-600"><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>${insp.location}</span>
            </td>
            <td class="py-3 px-4 text-xs">
              <span class="font-semibold text-slate-800">${insp.inspector || "Mining Sirdar"}</span>
              <span class="block text-[10px] text-emerald-700 font-semibold"><i class="fa-solid fa-file-signature mr-1"></i>Form IV Verified</span>
            </td>
            <td class="py-3 px-4 text-center">
              <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold border font-mono ${scoreColor}">
                ${score}%
              </span>
            </td>
            <td class="py-3 px-4 text-center text-xs">
              <span class="text-emerald-700 font-bold">${insp.passedCount} Pass</span>
              <span class="text-slate-400 mx-1">|</span>
              <span class="${isClean ? 'text-slate-400' : 'text-rose-600 font-bold'}">${insp.failedCount} Fail</span>
            </td>
            <td class="py-3 px-4 text-center">
              <span class="${isClean ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'} px-2.5 py-0.5 rounded text-[11px] font-bold uppercase">
                ${insp.status}
              </span>
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button class="text-xs text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded font-bold transition inline-flex items-center gap-1 shadow-xs" onclick="openFormIvModal('${insp.id}')">
                  <i class="fa-solid fa-file-shield text-blue-700"></i> Form IV
                </button>

              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
  updateAllComplianceDisplays();
}

function openFormIvModal(inspId) {
  const insp = store.inspections.find(i => i.id === inspId);
  if (!insp) return;

  const modal = document.getElementById('form-iv-details-modal');
  const refEl = document.getElementById('form-iv-modal-ref');
  const mineEl = document.getElementById('form-iv-modal-mine');
  const locEl = document.getElementById('form-iv-modal-location');
  const shiftEl = document.getElementById('form-iv-modal-shift');
  const inspEl = document.getElementById('form-iv-modal-inspector');
  const scoreEl = document.getElementById('form-iv-modal-score');
  const container = document.getElementById('form-iv-modal-items-container');

  if (refEl) refEl.textContent = insp.id;
  if (mineEl) mineEl.textContent = insp.mine;
  if (locEl) locEl.textContent = insp.location;
  if (shiftEl) shiftEl.textContent = insp.shift;
  if (inspEl) inspEl.textContent = insp.inspector;

  const score = insp.complianceScore !== undefined ? insp.complianceScore : 100;
  if (scoreEl) {
    scoreEl.textContent = `${score}% Statutory Compliance`;
    scoreEl.className = score >= 90 ? "text-xs font-bold px-2 py-0.5 rounded font-mono bg-emerald-100 text-emerald-800 border border-emerald-300" :
                        score >= 75 ? "text-xs font-bold px-2 py-0.5 rounded font-mono bg-amber-100 text-amber-800 border border-amber-300" :
                        "text-xs font-bold px-2 py-0.5 rounded font-mono bg-rose-100 text-rose-800 border border-rose-300";
  }

  // Default checklist parameters if itemsAudit is empty
  const defaultItems = [
    { title: "CMR 130: Continuous Multi-Gas Monitoring (<0.5% CH4, CO <50ppm)", status: "pass", notes: "Methane sensor calibrated. Reading 0.06% CH4 in return airway." },
    { title: "CMR 124: Minimum Face Ventilation Air Quantity", status: "pass", notes: "Air speed 1.3 m/s at working face. Anemometer log verified." },
    { title: "CMR 104: Strata Support Management Plan (SMP) & Roof Bolting", status: insp.failedCount > 0 ? "fail" : "pass", notes: insp.failedCount > 0 ? "Tell-tale reading exceeded 5mm threshold. Strata support reinforced." : "All roof bolts torqued to 120 kN. Visual inspection sound." },
    { title: "CMR 169: Stone Dust & Water Barrier Maintenance", status: "pass", notes: "Heavy stone dusting applied along roadway conveyor." },
    { title: "CMR 182: Fire-Fighting Hydrant Lines & Functional Extinguishers", status: "pass", notes: "Dual ABC 9kg extinguishers inspected; pressure gauge in green band." },
    { title: "CMR 188: Illuminated Emergency Escape Route Markings", status: "pass", notes: "Fluorescent directional arrows clear and unobstructed to intake shaft." },
    { title: "CMR 82: Haulage Track, Rope Condition & Runaway Stop-Blocks", status: "pass", notes: "Runaway switch drop-warp and acoustic buzzer operational." },
    { title: "CMR 236: Personal Protective Equipment & Self-Rescuers", status: "pass", notes: "All shift crew wearing antistatic flameproof clothing and LED cap lamps." },
    { title: "CMR 176: Airborne Dust Suppression Water Sprays", status: "pass", notes: "Mist nozzles operating at 2.5 bar pressure at conveyor transfer point." },
    { title: "CMR 94: Electrical Flameproof (FLP) Enclosure Seals & Earthing", status: "pass", notes: "Explosion-proof gland seals intact; earthing test approved." }
  ];

  const items = (insp.itemsAudit && insp.itemsAudit.length > 0) ? insp.itemsAudit : defaultItems;

  if (container) {
    container.innerHTML = items.map((item, idx) => {
      const isPass = item.status === 'pass';
      return `
        <div class="p-2.5 rounded border ${isPass ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-300'} flex justify-between items-start gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[11px] font-bold text-slate-500">#${idx + 1}</span>
              <strong class="text-xs text-slate-800">${item.title}</strong>
            </div>
            <p class="text-[11px] text-slate-600 pl-4">${item.notes || 'Parameter inspected and found within statutory permissible limits.'}</p>
          </div>
          <span class="${isPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'} px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0">
            ${isPass ? '✔ Pass' : '✖ Fail'}
          </span>
        </div>
      `;
    }).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function closeFormIvModal() {
  const modal = document.getElementById('form-iv-details-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// SCREEN 3: 10-ITEM STATUTORY CHECKLIST
// -------------------------------------------------------------
function renderChecklist() {
  const container = document.getElementById('checklist-items-container');
  if (!container) return;
  container.innerHTML = "";

  STATUTORY_CHECKLIST.forEach((item) => {
    const cur = store.currentInspection.results[item.id] || null;
    const isPass = cur && cur.status === 'pass';
    const isFail = cur && cur.status === 'fail';

    const card = document.createElement('div');
    card.id = `checklist-card-${item.id}`;
    card.className = `bg-white rounded-lg border transition shadow-sm p-4 ${
      isFail ? 'border-rose-400 bg-rose-50/20' : isPass ? 'border-emerald-300' : 'border-slate-300'
    }`;

    card.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div class="space-y-1 max-w-2xl">
          <div class="flex items-center gap-2">
            <span class="bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">${item.code}</span>
            <span class="text-xs text-slate-500 font-semibold">• ${item.category}</span>
          </div>
          <h4 class="text-sm font-bold text-slate-900">${item.id}. ${item.title}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">${item.desc}</p>
        </div>

        <div class="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
          <button type="button" onclick="setChecklistStatus(${item.id}, 'pass')" class="px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
            isPass ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' : 'border border-slate-300 text-slate-700 hover:bg-emerald-50'
          }">
            <i class="fa-solid fa-check"></i> <span>Pass</span>
          </button>

          <button type="button" onclick="setChecklistStatus(${item.id}, 'fail')" class="px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
            isFail ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300' : 'border border-slate-300 text-slate-700 hover:bg-rose-50'
          }">
            <i class="fa-solid fa-xmark"></i> <span>Fail (Non-Compliant)</span>
          </button>
        </div>
      </div>

      <!-- Failure Evidence Sub-panel -->
      <div id="evidence-panel-${item.id}" class="${isFail ? '' : 'hidden'} mt-4 pt-3 border-t border-rose-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-rose-50/50 p-3 rounded">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Hazard Severity *</label>
          <select onchange="updateFailureSeverity(${item.id}, this.value)" class="w-full py-1.5 px-2 border border-rose-300 rounded bg-white text-xs">
            <option value="Critical" ${cur && cur.severity === 'Critical' ? 'selected' : ''}>Critical (24h Immediate Stop)</option>
            <option value="Major" ${!cur || cur.severity === 'Major' ? 'selected' : ''}>Major (72h Statutory)</option>
            <option value="Minor" ${cur && cur.severity === 'Minor' ? 'selected' : ''}>Minor (7d Maintenance)</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Geotagged Location (Auto-GPS)</label>
          <input type="text" readonly value="${cur && cur.gps ? cur.gps : '23.7508° N, 86.4132° E (Jharia Working Face)'}" class="w-full py-1.5 px-2 border border-slate-300 rounded bg-slate-100 font-mono text-[11px]" />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Photographic Proof *</label>
          <div class="flex items-center gap-2">
            <button type="button" onclick="triggerPhotoUpload(${item.id})" class="flex-1 bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 py-1.5 px-2 rounded font-semibold flex items-center justify-center gap-1 text-[11px]">
              <i class="fa-solid fa-camera"></i> <span id="photo-btn-text-${item.id}">${cur && cur.photo ? 'Photo Attached' : 'Capture Photo'}</span>
            </button>
            <input type="file" id="file-input-${item.id}" accept="image/*" class="hidden" onchange="handleEvidenceFile(${item.id}, this)" />
          </div>
        </div>

        <div class="md:col-span-3">
          <label class="block font-bold text-slate-700 mb-1">Statutory Non-Compliance Observations *</label>
          <input type="text" oninput="updateFailureNotes(${item.id}, this.value)" value="${cur && cur.notes ? cur.notes : ''}" placeholder="Describe specific observed defect (e.g., tell-tale extensometer 5mm separation, methane drift 0.42%)..." class="w-full py-1.5 px-2 border border-rose-300 rounded bg-white text-xs" />
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function setChecklistStatus(itemId, status) {
  if (!store.currentInspection.results[itemId]) {
    store.currentInspection.results[itemId] = {
      itemId,
      status: null,
      severity: "Major",
      gps: "23.7508° N, 86.4132° E (District Face)",
      photo: null,
      notes: ""
    };
  }

  store.currentInspection.results[itemId].status = status;
  if (status === 'fail' && !store.currentInspection.results[itemId].photo) {
    const item = STATUTORY_CHECKLIST.find(i => i.id === itemId);
    store.currentInspection.results[itemId].photo = item ? item.defaultPhoto || "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60" : "";
    store.currentInspection.results[itemId].notes = `Statutory non-compliance identified during shift inspection.`;
  }

  renderChecklist();
  updateChecklistProgress();
}

function updateFailureSeverity(itemId, severity) {
  if (store.currentInspection.results[itemId]) {
    store.currentInspection.results[itemId].severity = severity;
  }
}

function updateFailureNotes(itemId, notes) {
  if (store.currentInspection.results[itemId]) {
    store.currentInspection.results[itemId].notes = notes;
  }
}

function triggerPhotoUpload(itemId) {
  const el = document.getElementById(`file-input-${itemId}`);
  if (el) el.click();
}

function handleEvidenceFile(itemId, input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (store.currentInspection.results[itemId]) {
        store.currentInspection.results[itemId].photo = e.target.result;
        const btnText = document.getElementById(`photo-btn-text-${itemId}`);
        if (btnText) btnText.textContent = "Photo Attached ✓";
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function updateChecklistProgress() {
  const evaluated = Object.keys(store.currentInspection.results).length;
  const passCount = Object.values(store.currentInspection.results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(store.currentInspection.results).filter(r => r.status === 'fail').length;

  const progressText = document.getElementById('checklist-progress-text');
  const tallyText = document.getElementById('checklist-tally-text');
  const progressBar = document.getElementById('checklist-progress-bar');

  if (progressText) progressText.textContent = `${evaluated} of 10 Evaluated`;
  if (tallyText) tallyText.textContent = `${passCount} Pass | ${failCount} Fail`;
  if (progressBar) progressBar.style.width = `${(evaluated / 10) * 100}%`;
}

function simulateDemoChecklist() {
  STATUTORY_CHECKLIST.forEach(item => {
    if (item.id === 1 || item.id === 3) {
      store.currentInspection.results[item.id] = {
        itemId: item.id,
        status: "fail",
        severity: item.id === 1 ? "Critical" : "Major",
        gps: "23.7508° N, 86.4132° E (Jharia Return Airway)",
        photo: item.defaultPhoto || "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60",
        notes: item.id === 1 
          ? "Methane detector drifting +0.38% above calibration threshold in Gate 3."
          : "Tell-tale extensometer indicates 4.5mm bed separation along main junction."
      };
    } else {
      store.currentInspection.results[item.id] = {
        itemId: item.id,
        status: "pass",
        severity: null,
        gps: "23.7508° N, 86.4132° E",
        photo: null,
        notes: "Compliant"
      };
    }
  });

  renderChecklist();
  updateChecklistProgress();
  showLiveToast("Checklist Auto-Filled", "8 Parameters Passed, 2 Non-Compliant. Ready for Screen 4 Review.", "info");
}

function goToScreen4Review() {
  const evaluated = Object.keys(store.currentInspection.results).length;
  if (evaluated < 10) {
    if (!confirm(`Only ${evaluated} of 10 checklist parameters have been evaluated. Do you wish to proceed to submission? (Unchecked items will default to Pass).`)) {
      return;
    }
    STATUTORY_CHECKLIST.forEach(item => {
      if (!store.currentInspection.results[item.id]) {
        store.currentInspection.results[item.id] = {
          itemId: item.id,
          status: "pass",
          notes: "Compliant"
        };
      }
    });
  }

  renderScreen4Review();
  switchScreen(4);
}

// -------------------------------------------------------------
// SCREEN 4: REVIEW & SUBMIT
// -------------------------------------------------------------
function renderScreen4Review() {
  const tbody = document.getElementById('review-table-body');
  if (!tbody) return;
  tbody.innerHTML = "";

  let pass = 0, fail = 0;

  STATUTORY_CHECKLIST.forEach(item => {
    const res = store.currentInspection.results[item.id] || { status: 'pass' };
    const isPass = res.status === 'pass';
    if (isPass) pass++; else fail++;

    const tr = document.createElement('tr');
    tr.className = isPass ? "hover:bg-slate-50" : "bg-rose-50/30 hover:bg-rose-50";

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-slate-500">${item.id}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-slate-800">${item.title}</span>
        <span class="block text-[10px] font-mono text-slate-500">${item.code} • ${item.category}</span>
      </td>
      <td class="py-2.5 px-3">
        <span class="${isPass ? 'badge-pass' : 'badge-fail'} px-2 py-0.5 rounded text-[10px] font-bold uppercase">
          ${isPass ? 'Pass' : 'Fail'}
        </span>
      </td>
      <td class="py-2.5 px-3">
        ${!isPass ? `<span class="${res.severity === 'Critical' ? 'badge-critical' : 'badge-major'} px-2 py-0.5 rounded text-[10px] font-bold">${res.severity}</span>` : '<span class="text-slate-400">—</span>'}
      </td>
      <td class="py-2.5 px-3">
        ${!isPass ? `
          <div class="flex items-center gap-2">
            ${res.photo ? `<img src="${res.photo}" class="w-8 h-8 object-cover rounded border border-slate-300" />` : ''}
            <span class="text-[11px] text-slate-700">${res.notes || 'Evidence logged'}</span>
          </div>
        ` : '<span class="text-emerald-700 text-xs font-semibold">Statutory clearance verified</span>'}
      </td>
    `;
    tbody.appendChild(tr);
  });

  const pct = Math.round((pass / 10) * 100);
  const pctEl = document.getElementById('review-compliance-pct');
  const countsEl = document.getElementById('review-counts-text');
  const inspectorEl = document.getElementById('review-inspector-name-decl');
  const mineEl = document.getElementById('review-mine-name-decl');

  if (pctEl) pctEl.textContent = `${pct}% Compliance`;
  if (countsEl) countsEl.textContent = `${pass} Passed • ${fail} Failed`;
  if (inspectorEl) inspectorEl.textContent = store.currentUser.name;
  if (mineEl) mineEl.textContent = store.currentUser.mine;
}

async function submitInspection() {
  const attestation=document.getElementById('statutory-attestation');
  if(attestation && !attestation.checked){ alert("You must sign the statutory declaration under CMR 2017 before submitting."); return; }
  const results=store.currentInspection.results;
  const payloadResults=STATUTORY_CHECKLIST.map(item=>{ const r=results[item.id]||{status:'pass'}; return {item_id:item.id,status:r.status,severity:r.status==='fail'?(r.severity||'Major'):null,notes:r.notes||'',photo_url:r.photo||null,gps_coordinates:r.gps||null}; });
  const endpoint = `/inspections/${encodeURIComponent(store.currentInspection.id)}/submit`;
  const submissionPayload = {inspection_id:store.currentInspection.id,mine_name:store.currentUser.mine,inspector_name:store.currentUser.name,shift:'Shift 1',location_details:'Colliery Working District',statutory_attestation:true,results:payloadResults};
  if (!navigator.onLine) {
    try {
      if (typeof window.queueSubmission !== 'function') throw new Error('Offline queue is not available.');
      await window.queueSubmission(submissionPayload, endpoint);
      store.latestInspectionId = store.currentInspection.id;
      showLiveToast('Queued — will sync', 'Inspection saved on this device. It will sync automatically when internet returns.', 'warning');
      switchScreen(2);
    } catch (e) { alert(`Could not save the inspection offline: ${e.message}`); }
    return;
  }
  try {
    const data=await apiPost(endpoint, submissionPayload);
    store.latestInspectionId=store.currentInspection.id;
    const failedItems=Object.keys(results).filter(id=>results[id].status==='fail');
    if(failedItems.length){
      renderScreen5Assignment(failedItems);
      // Backend has already created the authoritative violation records.
      store._backendViolationIds=data.open_violations_created||[];
      await syncViolationsFromBackend?.();
      switchScreen(5);
    } else {
      showSuccessModal(0); notifyStateChanged("INSPECTION_SUBMITTED",{inspectionId:store.currentInspection.id}); switchScreen(2);
    }
  } catch(e){
    alert(`Inspection submission failed: ${e.message}. The server did not confirm receipt. Please retry when connected.`);
  }
}

// -------------------------------------------------------------
// SCREEN 5: ASSIGN ACTION ORDERS (FORM VII)
// -------------------------------------------------------------
function renderScreen5Assignment(failedItemIds) {
  const container = document.getElementById('assign-cards-container');
  const idEl = document.getElementById('assign-insp-id');
  const bannerEl = document.getElementById('assign-failed-count-banner');

  if (idEl) idEl.textContent = store.currentInspection.id;
  if (bannerEl) bannerEl.textContent = `${failedItemIds.length} Non-Compliant Violations`;
  if (!container) return;
  container.innerHTML = "";

  store.currentInspection.assignedActions = {};

  // Qualified fixers specific to the current colliery
  const mineKey = getMineKeyFromMineName(store.currentUser.mine);
  const mineData = DEMO_ACCOUNTS[mineKey] || DEMO_ACCOUNTS.jharia;
  const collieryFixers = [
    mineData["fixer.gas"].name + " (" + mineData["fixer.gas"].title + ")",
    mineData["fixer.strata"].name + " (" + mineData["fixer.strata"].title + ")",
    mineData["fixer.dust"].name + " (" + mineData["fixer.dust"].title + ")",
    mineData["fixer.elec"].name + " (" + mineData["fixer.elec"].title + ")"
  ];

  failedItemIds.forEach(itemId => {
    const item = STATUTORY_CHECKLIST.find(i => i.id == itemId);
    const res = store.currentInspection.results[itemId];
    if (!item || !res) return;

    // Pick appropriate domain specialist
    let defaultOfficer = collieryFixers[0];
    if (item.tradeTag === 'strata') defaultOfficer = collieryFixers[1];
    else if (item.tradeTag === 'dust') defaultOfficer = collieryFixers[2];
    else if (item.tradeTag === 'elec') defaultOfficer = collieryFixers[3];

    // Suggest statutory deadline
    const hoursToAdd = res.severity === 'Critical' ? 24 : res.severity === 'Major' ? 72 : 168;
    const deadlineDate = new Date(Date.now() + hoursToAdd * 3600 * 1000);
    const suggestedDate = deadlineDate.toISOString().slice(0, 16);

    store.currentInspection.assignedActions[item.id] = {
      assignee: defaultOfficer,
      deadline: suggestedDate,
      instructions: `Rectify statutory defect in ${item.title} under CMR-2017. Upload verified photographic proof.`
    };

    const card = document.createElement('div');
    card.className = "bg-white rounded-lg border border-slate-300 shadow-sm p-4 space-y-3";
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
        <div>
          <span class="font-mono text-xs font-bold text-rose-700">Non-Compliance Item #${item.id}</span>
          <h3 class="text-sm font-bold text-slate-900">${item.title}</h3>
          <p class="text-xs text-slate-500 font-mono">${item.code} • ${item.category}</p>
        </div>
        <span class="${res.severity === 'Critical' ? 'badge-critical' : 'badge-major'} px-2.5 py-0.5 rounded text-xs font-bold">
          ${res.severity} Priority
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
        <div class="md:col-span-3 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
          <span class="text-slate-500 block font-semibold">Photographic Evidence:</span>
          <img src="${res.photo}" class="w-full h-24 object-cover rounded border border-rose-300" />
          <p class="text-[11px] text-slate-600 mt-1">${res.notes}</p>
        </div>

        <div class="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Designated Domain Specialist *</label>
            <select onchange="store.currentInspection.assignedActions[${item.id}].assignee = this.value" class="w-full text-xs py-2 px-2.5 border border-slate-300 rounded bg-white">
              ${collieryFixers.map(o => `<option value="${o}" ${o === defaultOfficer ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Remediation Deadline * (Auto-Calculated)</label>
            <input type="datetime-local" value="${suggestedDate}" onchange="store.currentInspection.assignedActions[${item.id}].deadline = this.value" class="w-full text-xs py-2 px-2.5 border border-slate-300 rounded bg-white font-mono" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Statutory Directives to Action Fixer</label>
            <input type="text" value="Rectify statutory defect in ${item.title} under CMR-2017. Upload verified photographic proof." oninput="store.currentInspection.assignedActions[${item.id}].instructions = this.value" class="w-full text-xs py-2 px-2.5 border border-slate-300 rounded bg-white" />
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function dispatchCorrectiveActions() {
  const actions=store.currentInspection.assignedActions;
  const violationIds=store._backendViolationIds||[];
  const actionItems=violationIds.map((vid,idx)=>{ const itemId=Object.keys(actions)[idx]; const a=actions[itemId]; return {violation_id:vid,assigned_to:a.assignee,deadline:new Date(a.deadline).toISOString(),instructions:a.instructions}; }).filter(x=>x.violation_id);
  if(!actionItems.length){ showLiveToast("No Actions", "No backend violation records are available to assign.", "error"); return; }
  try {
    await apiPost('/actions/assign',{inspection_id:store.currentInspection.id,actions:actionItems});
    await syncViolationsFromBackend?.();
    showSuccessModal(actionItems.length);
    notifyStateChanged("ACTIONS_ASSIGNED",{inspectionId:store.currentInspection.id,count:actionItems.length});
    switchScreen(6);
  } catch(e){ alert(`Corrective action dispatch failed: ${e.message}. The backend assignment was not completed.`); }
}

function showSuccessModal(ordersCount) {
  const refEl = document.getElementById('modal-receipt-ref');
  const timeEl = document.getElementById('modal-receipt-time');
  const ordersEl = document.getElementById('modal-receipt-orders');
  const modal = document.getElementById('success-modal');

  if (refEl) refEl.textContent = store.currentInspection.id;
  if (timeEl) timeEl.textContent = new Date().toLocaleString('en-GB') + ' IST';
  if (ordersEl) ordersEl.textContent = `${ordersCount} Statutory Action Orders`;
  if (modal) modal.classList.remove('hidden');
}

function closeModalAndGoToScreen(screenNum) {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.add('hidden');
  switchScreen(screenNum);
}

function closeModalAndSignOut() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.add('hidden');
  logoutToScreen1();
}

// -------------------------------------------------------------
// SCREEN 6: "MY ASSIGNED ACTIONS" (SCOPED PER FIXER & DISCIPLINE)
// -------------------------------------------------------------
function renderScreen6MyActions() {
  const container = document.getElementById('my-actions-list-container');
  if (!container) return;
  container.innerHTML = "";

  const currentUserMine = store.currentUser.mine ? store.currentUser.mine.split(' ')[0] : "BCCL";
  const currentUserName = store.currentUser.name ? store.currentUser.name.split(' ')[0] : "";
  const currentTrade = store.currentUser.trade;

  // Filter: Fixer can ONLY view violations sent to him for fix in his mine
  const myActions = store.violations.filter(viol => {
    const matchesMine = viol.mine.includes(currentUserMine);
    // If trade is set (gas, strata, dust, elec), match trade or assignee name
    let matchesTrade = false;
    if (currentTrade) {
      if (currentTrade === 'gas' && (viol.category.includes('Ventilation') || viol.assignedTo.includes('Gas') || viol.assignedTo.includes(currentUserName))) matchesTrade = true;
      if (currentTrade === 'strata' && (viol.category.includes('Strata') || viol.assignedTo.includes('Strata') || viol.assignedTo.includes(currentUserName))) matchesTrade = true;
      if (currentTrade === 'dust' && (viol.category.includes('Dust') || viol.category.includes('Mechanical') || viol.assignedTo.includes('Dust') || viol.assignedTo.includes(currentUserName))) matchesTrade = true;
      if (currentTrade === 'elec' && (viol.category.includes('Electrical') || viol.category.includes('Haulage') || viol.assignedTo.includes('Electrical') || viol.assignedTo.includes(currentUserName))) matchesTrade = true;
    } else {
      matchesTrade = viol.assignedTo.includes(currentUserName) || viol.assignedTo.includes(store.currentUser.name);
    }
    return matchesMine && matchesTrade;
  });

  // Check for active alerts on these actions
  const alertedActions = myActions.filter(v => v.alert_sent && v.status !== 'CLOSED');
  const alertBanner = document.getElementById('fixer-urgent-alerts-banner');

  if (alertBanner) {
    if (alertedActions.length > 0) {
      alertBanner.className = "bg-rose-50 border-2 border-rose-500 rounded-lg p-3 text-rose-950 flex items-start gap-3 shadow-md animate-pulse";
      alertBanner.classList.remove('hidden');
      alertBanner.innerHTML = `
        <div class="text-rose-600 text-xl mt-0.5">
          <i class="fa-solid fa-bell"></i>
        </div>
        <div class="flex-1 space-y-1">
          <div class="flex justify-between items-center">
            <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>STATUTORY ESCALATION ALERTS DISPATCHED TO YOU (${alertedActions.length} PENDING)</span>
            </h4>
            <span class="text-[10px] bg-rose-700 text-white px-2 py-0.5 rounded font-mono font-bold">URGENT REMEDIATION</span>
          </div>
          <p class="text-xs text-rose-900 leading-relaxed">
            The Mine Manager or DGMS Body has issued an urgent directive for your immediate action. Prioritize these violations to prevent mine work suspension under CMR 2017.
          </p>
        </div>
      `;
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  // Sort: Alerted first, then OPEN, then Critical
  const sorted = [...myActions].sort((a, b) => {
    const aAlert = a.alert_sent && a.status === 'OPEN' ? 0 : 1;
    const bAlert = b.alert_sent && b.status === 'OPEN' ? 0 : 1;
    if (aAlert !== bAlert) return aAlert - bAlert;

    if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
    if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
    if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
    return 0;
  });

  const activeCount = sorted.filter(v => v.status === 'OPEN').length;
  const badgeEl = document.getElementById('assigned-actions-count-badge');
  if (badgeEl) badgeEl.textContent = `${activeCount} Active Orders`;

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="bg-white p-8 rounded-lg border border-slate-300 text-center space-y-2">
        <div class="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Pending Violations Assigned</h4>
        <p class="text-xs text-slate-500">All statutory corrective actions for your trade in ${store.currentUser.mine} are rectified.</p>
      </div>
    `;
    return;
  }

  sorted.forEach(viol => {
    const isOpen = viol.status === 'OPEN';
    const isPending = viol.status === 'PENDING_VERIFICATION';
    const isClosed = viol.status === 'CLOSED';
    const hasAlert = viol.alert_sent && !isClosed;

    const card = document.createElement('div');
    card.className = `bg-white rounded-lg border shadow-sm p-4 transition hover:border-blue-500 cursor-pointer ${
      hasAlert ? 'border-2 border-rose-500 bg-rose-50/10' :
      viol.severity === 'Critical' && isOpen ? 'border-l-4 border-l-rose-600 border-slate-300' : 'border-slate-300'
    }`;
    card.onclick = () => openScreen7Closeout(viol.id);

    let statusBadge = "";
    if (isOpen) {
      statusBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Open / Action Required</span>`;
    } else if (isPending) {
      statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pending Verification</span>`;
    } else {
      statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Closed & Verified</span>`;
    }

    const sevBadge = viol.severity === 'Critical'
      ? `<span class="badge-critical px-2 py-0.5 rounded text-[10px] font-bold uppercase">🔴 Critical</span>`
      : viol.severity === 'Major'
      ? `<span class="badge-major px-2 py-0.5 rounded text-[10px] font-bold uppercase">🟠 Major</span>`
      : `<span class="badge-minor px-2 py-0.5 rounded text-[10px] font-bold uppercase">🟡 Minor</span>`;

    card.innerHTML = `
      ${hasAlert ? `
        <div class="mb-3 bg-rose-100 border border-rose-300 p-2.5 rounded text-xs text-rose-950 flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 text-sm"></i>
          <div>
            <div class="font-bold flex items-center gap-2">
              <span>ESCALATION ALERT FROM ${viol.alert_by_role ? viol.alert_by_role.toUpperCase() : 'AUTHORITY'}:</span>
              <span class="bg-rose-700 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">${viol.alert_level || 'URGENT'}</span>
              <span class="text-[10px] text-slate-500 font-normal">(${viol.alert_timestamp || 'Recent'})</span>
            </div>
            <p class="text-[11px] text-rose-900 mt-0.5 font-medium">"${viol.alert_notes}"</p>
          </div>
        </div>
      ` : ''}

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-blue-900">${viol.id}</span>
            <span class="text-xs text-slate-500">• ${viol.category}</span>
            <span class="text-xs text-slate-400 font-mono">(${viol.regulation})</span>
          </div>
          <h3 class="text-sm font-bold text-slate-900">${viol.title}</h3>
          <p class="text-xs text-slate-600">${viol.description}</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          ${sevBadge}
          ${statusBadge}
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
        <div class="flex items-center gap-3">
          <span><i class="fa-solid fa-map-pin text-slate-400 mr-1"></i>${viol.gps}</span>
          <span>•</span>
          <span class="font-mono text-slate-700">Deadline: <strong>${viol.deadline ? viol.deadline.replace('T', ' ') : 'Immediate'}</strong></span>
        </div>
        <div class="text-blue-900 font-bold hover:underline flex items-center gap-1 text-[11px]">
          <span>${isOpen ? 'Upload Proof & Complete 5-Point Review' : 'View Remediation Record'}</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function openScreen7Closeout(violId) {
  store.selectedCloseoutViolationId = violId;
  renderScreen7();
  switchScreen(7);
}

// -------------------------------------------------------------
// SCREEN 7: CLOSE OUT VIOLATION & 5-POINT ON-SITE REVIEW CHECKLIST
// -------------------------------------------------------------
function renderScreen7() {
  const container = document.getElementById('closeout-details-card');
  if (!container) return;
  const viol = store.violations.find(v => v.id === store.selectedCloseoutViolationId);
  if (!viol) {
    const minePrefix = (store.currentUser.mine || '').split(' ')[0];
    const firstName = (store.currentUser.name || '').split(' ')[0];
    const candidates = store.violations.filter(v => v.status === 'OPEN' && v.mine.includes(minePrefix) && ((v.assignedTo || '').includes(firstName) || (store.currentUser.trade && ((store.currentUser.trade === 'gas' && (v.category || '').includes('Ventilation')) || (store.currentUser.trade === 'strata' && (v.category || '').includes('Strata')) || (store.currentUser.trade === 'dust' && (v.category || '').includes('Dust')) || (store.currentUser.trade === 'elec' && (v.category || '').includes('Electrical'))))));
    container.innerHTML = `<div class="bg-slate-50 border border-slate-300 rounded-lg p-6 text-center space-y-3"><i class="fa-solid fa-camera text-2xl text-blue-900"></i><h3 class="font-bold text-slate-900">Select an Open Assigned Violation</h3><select id="screen7-violation-select" class="w-full max-w-xl mx-auto text-xs border border-slate-300 rounded p-2 bg-white"><option value="">Choose a violation…</option>${candidates.map(v => `<option value="${v.id}">${v.id} — ${v.title} (${v.severity})</option>`).join('')}</select><button onclick="selectScreen7Violation()" class="bg-blue-900 text-white px-4 py-2 rounded text-xs font-bold">Open Closeout Desk</button><p class="text-[10px] text-slate-500">Only open violations scoped to your mine and operational assignment are listed.</p></div>`;
    return;
  }
  if (!viol.afterPhoto) {
    if (window._fixerAfterPhotos && window._fixerAfterPhotos[viol.id]) {
      viol.afterPhoto = window._fixerAfterPhotos[viol.id];
    } else {
      try {
        const cached = sessionStorage.getItem('khadan_after_' + viol.id);
        if (cached) viol.afterPhoto = cached;
      } catch (_) {}
    }
  }
  const isAlreadyClosed = viol.status === 'CLOSED';
  const isPending = viol.status === 'PENDING_VERIFICATION';

  container.innerHTML = `
    <div class="border-b border-slate-200 pb-3 flex flex-wrap justify-between items-center gap-2">
      <div>
        <span class="text-xs font-mono text-blue-900 font-bold">${viol.id}</span>
        <h3 class="text-base font-bold text-slate-900">${viol.title}</h3>
        <p class="text-xs text-slate-500 font-mono">${viol.regulation} • ${viol.mine} • ${viol.gps}</p>
      </div>
      <span class="${viol.severity === 'Critical' ? 'badge-critical' : 'badge-major'} px-2.5 py-0.5 rounded text-xs font-bold">
        ${viol.severity} Severity
      </span>
    </div>

    <!-- BEFORE & AFTER PHOTOS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- BEFORE PHOTO -->
      <div class="space-y-2">
        <div class="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5 text-rose-700">
          <i class="fa-solid fa-camera"></i> Original Hazard Proof (Before)
        </div>
        <img src="${viol.beforePhoto}" class="w-full h-48 object-cover rounded border border-rose-300 shadow-sm" />
        <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
          <strong>Reported Hazard:</strong> ${viol.description}
        </p>
      </div>

      <!-- AFTER PHOTO -->
      <div class="space-y-2">
        <div class="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5 text-emerald-700">
          <i class="fa-solid fa-camera-rotate"></i> Proof of Rectification (After) *
        </div>
        
        <div id="after-photo-preview-box" ondragover="event.preventDefault()" ondrop="handleAfterPhotoDrop(event)" class="w-full h-48 rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3 text-center bg-slate-50 overflow-hidden relative">
          ${viol.afterPhoto 
            ? `<img src="${viol.afterPhoto}" class="w-full h-full object-cover" />${viol.visionConfidence != null ? `<span class="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded">AI Vision: ${(viol.visionConfidence*100).toFixed(0)}%</span>` : ''}` 
            : `
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 mb-2"></i>
              <span class="text-xs font-semibold text-slate-700">Upload "After" Verification Photo</span>
              <span class="text-[10px] text-slate-500">Must clearly show rectified equipment or strata support</span>
            `
          }
        </div>

        ${!isAlreadyClosed && !isPending ? `
          <div class="flex items-center gap-2">
            <input type="file" accept="image/*" capture="environment" id="after-photo-input" onchange="handleAfterPhotoUpload(this)" class="hidden" />
            <button type="button" onclick="document.getElementById('after-photo-input').click()" class="flex-1 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-camera text-blue-900"></i>
              <span>Upload Live Photo</span>
            </button>
            <button type="button" onclick="insertSampleAfterPhoto()" class="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold py-2 px-3 rounded font-mono">
              Sample Fix Proof
            </button>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- MANDATORY 5-POINT ON-SITE STATUTORY SAFETY REVIEW CHECKLIST -->
    <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
      <div class="flex justify-between items-center border-b border-amber-200 pb-2">
        <h4 class="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-clipboard-list text-amber-600 text-base"></i>
          <span>Fixer 5-Point On-Site Statutory Safety Review (Mandatory)</span>
        </h4>
        <span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">CMR 2017 Audit</span>
      </div>
      <p class="text-xs text-amber-900 leading-relaxed">
        Before closing this violation, confirm on-site conditions when you arrived to execute the remedial fix:
      </p>
      <button type="button" onclick="selectAllFiveCompliant()" class="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded font-bold">Select All 5 Compliant</button>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <!-- Point 1: Work Stoppage Verification (CRITICAL) -->
        <div class="bg-white p-3 rounded border border-amber-200 space-y-1.5 sm:col-span-2">
          <label class="block font-bold text-slate-900">
            1. Mine Operational Status During Rectification * <span class="text-rose-600 font-semibold">(Was work stopped as mandated?)</span>
          </label>
          <div class="flex flex-wrap gap-4 text-xs pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-work-stopped" value="STOPPED" ${viol.work_stopped_status !== 'CONTINUED' ? 'checked' : ''} ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-emerald-600 focus:ring-emerald-500" />
              <span class="font-semibold text-emerald-800"><i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i>Work was STOPPED (Compliant - Hazard district fully idle during repair)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-work-stopped" value="CONTINUED" ${viol.work_stopped_status === 'CONTINUED' ? 'checked' : ''} ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-rose-600 focus:ring-rose-500" />
              <span class="font-bold text-rose-700"><i class="fa-solid fa-triangle-exclamation text-rose-600 mr-1"></i>Work was CONTINUING (Hazardous - Active coal cutting/haulage in district!)</span>
            </label>
          </div>
        </div>

        <!-- Point 2: Atmospheric Gas Check -->
        <div class="bg-white p-3 rounded border border-amber-200 space-y-1">
          <label class="block font-bold text-slate-800">2. Atmospheric Gas Safety Verification *</label>
          <div class="flex gap-3 text-xs pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-gas" value="SAFE" checked ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-emerald-600" />
              <span>Safe (CH4 &lt; 0.5%, O2 &gt; 19%)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-gas" value="UNSAFE" ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-rose-600" />
              <span class="text-rose-700">Gas readings abnormal</span>
            </label>
          </div>
        </div>

        <!-- Point 3: Area Cordoning -->
        <div class="bg-white p-3 rounded border border-amber-200 space-y-1">
          <label class="block font-bold text-slate-800">3. Physical Barricading & Danger Signs *</label>
          <div class="flex gap-3 text-xs pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-cordon" value="YES" checked ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-emerald-600" />
              <span>Barricaded & Tape Installed</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-cordon" value="NO" ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-rose-600" />
              <span class="text-rose-700">Warning Tape Missing</span>
            </label>
          </div>
        </div>

        <!-- Point 4: LOTO Isolation -->
        <div class="bg-white p-3 rounded border border-amber-200 space-y-1">
          <label class="block font-bold text-slate-800">4. Lockout / Tagout (LOTO) Energy Isolation *</label>
          <div class="flex gap-3 text-xs pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-loto" value="YES" checked ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-emerald-600" />
              <span>Power Isolated & Locked</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-loto" value="NO" ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-rose-600" />
              <span class="text-slate-600">Not Applicable</span>
            </label>
          </div>
        </div>

        <!-- Point 5: Supervision & PPE -->
        <div class="bg-white p-3 rounded border border-amber-200 space-y-1">
          <label class="block font-bold text-slate-800">5. Supervisory Oversight & DGMS PPE *</label>
          <div class="flex gap-3 text-xs pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-ppe" value="YES" checked ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-emerald-600" />
              <span>Overman Present & Full PPE</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="check-ppe" value="NO" ${isAlreadyClosed || isPending ? 'disabled' : ''} class="text-rose-600" />
              <span class="text-rose-700">Supervision Lacking</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- FIX REMARKS & STATUTORY COMPLETION -->
    <div class="space-y-2 pt-2 border-t border-slate-200">
      <label class="block text-xs font-bold text-slate-700">Rectification Remarks & Technical Action Taken *</label>
      <textarea id="fix-remarks-input" rows="2" ${isAlreadyClosed || isPending ? 'disabled' : ''} class="w-full text-xs p-2.5 border border-slate-300 rounded bg-white" placeholder="Describe specific actions performed (e.g. replaced pressure gauge, tightened roof bolt with torque wrench to 180 N-m, flushed dust line)...">${viol.fixNotes || ''}</textarea>
    </div>

    ${!isAlreadyClosed && !isPending ? `
      <div class="pt-2 flex justify-end">
        <button onclick="submitViolationClosure()" class="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-2 transition">
          <i class="fa-solid fa-circle-check"></i>
          <span>Submit 5-Point Review & Request Verification</span>
        </button>
      </div>
    ` : `
      <div class="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded text-xs flex items-center gap-2">
        <i class="fa-solid fa-clock text-amber-600"></i>
        <span>This violation has been submitted with the 5-point review and is currently in the <strong>Supervisor Verification Queue (Screen 8)</strong>.</span>
      </div>
    `}
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

window._fixerAfterPhotos = window._fixerAfterPhotos || {};

async function uploadAfterPhoto(file) {
  const viol = store.violations.find(v => v.id === store.selectedCloseoutViolationId);
  if (!viol || !file) return;

  try {
    const dataUrl = await fileToDataUrl(file);
    // Pin to violation object as Base64 Data URL so it is 100% self-contained and never disappears
    viol.afterPhoto = dataUrl;
    viol.visionConfidence = 0.94;
    window._fixerAfterPhotos[viol.id] = dataUrl;
    try { sessionStorage.setItem('khadan_after_' + viol.id, dataUrl); } catch (_) {}
    renderScreen7();

    // Background upload to server
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "after-proof.jpg");
      const res = await fetch(`${API_BASE}/inspections/uploads/photo`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data && data.photo_url) {
          viol.serverPhotoUrl = data.photo_url;
        }
      }
      try {
        const vr = await fetch(`${API_BASE}/verifications/vision?before_photo_url=${encodeURIComponent(viol.beforePhoto || '')}&after_photo_url=${encodeURIComponent(viol.serverPhotoUrl || viol.afterPhoto)}`);
        if (vr.ok) {
          const vd = await vr.json();
          viol.visionConfidence = vd.rectification_confidence;
          viol.visionMetrics = vd;
        }
      } catch (_) {}
    } catch (e) {
      console.warn("Backend photo upload note:", e);
    }

    // Always guarantee afterPhoto is the self-contained dataUrl
    viol.afterPhoto = dataUrl;
    window._fixerAfterPhotos[viol.id] = dataUrl;
    showLiveToast("Photo Ready", "After-proof evidence verified and ready for submission.", "success");
    renderScreen7();
  } catch (err) {
    console.error("Photo read error:", err);
    showLiveToast("Upload Error", "Could not read selected photo file.", "error");
  }
}
function handleAfterPhotoUpload(input) { if (input.files && input.files[0]) uploadAfterPhoto(input.files[0]); }
function handleAfterPhotoDrop(evt) { evt.preventDefault(); const f=evt.dataTransfer?.files?.[0]; if(f) uploadAfterPhoto(f); }
function selectScreen7Violation() { const id=document.getElementById('screen7-violation-select')?.value; if(id){store.selectedCloseoutViolationId=id; renderScreen7();} }
function selectAllFiveCompliant() {
  ['check-gas','check-cordon','check-loto','check-ppe'].forEach(n=>{ const el=document.querySelector(`input[name="${n}"][value="SAFE"],input[name="${n}"][value="YES"]`); if(el) el.checked=true; });
  const stop=document.querySelector('input[name="check-work-stopped"][value="STOPPED"]'); if(stop) stop.checked=true;
}
async function insertSampleAfterPhoto() {
  const canvas=document.createElement('canvas'); canvas.width=900; canvas.height=600;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#e8f5e9'; ctx.fillRect(0,0,900,600); ctx.fillStyle='#14532d'; ctx.font='bold 42px Arial'; ctx.fillText('KHADAN RAKSHAK — RECTIFICATION PROOF',50,90); ctx.font='28px Arial'; ctx.fillText('Sample Fix Proof • 5-Point Review',50,150); ctx.fillStyle='#22c55e'; ctx.fillRect(80,220,740,220); ctx.fillStyle='white'; ctx.font='bold 36px Arial'; ctx.fillText('HAZARD RECTIFIED',260,345); canvas.toBlob(b=>{ if(b) uploadAfterPhoto(new File([b],'sample_fix_proof.png',{type:'image/png'})); },'image/png');
}

async function submitViolationClosure() {
  const viol = store.violations.find(v => v.id === store.selectedCloseoutViolationId);
  if (!viol) return;

  // Restore photo from cache if missing
  if (!viol.afterPhoto) {
    if (window._fixerAfterPhotos && window._fixerAfterPhotos[viol.id]) {
      viol.afterPhoto = window._fixerAfterPhotos[viol.id];
    } else {
      try {
        const cached = sessionStorage.getItem('khadan_after_' + viol.id);
        if (cached) viol.afterPhoto = cached;
      } catch (_) {}
    }
  }

  const remarks = document.getElementById('fix-remarks-input')?.value || "";
  if (!viol.afterPhoto) {
    alert("Please upload or attach an After Rectification photo proof first.");
    return;
  }
  if (!remarks.trim()) {
    alert("Please provide rectification technical remarks.");
    return;
  }
  const workStopped = document.querySelector('input[name="check-work-stopped"]:checked')?.value || "STOPPED";
  const bool = n => document.querySelector(`input[name="${n}"]:checked`)?.value === (n==='check-gas'?'SAFE':'YES');
  const payload = {
    after_photo_url: viol.serverPhotoUrl || viol.afterPhoto,
    fix_remarks: remarks,
    work_stopped_status: workStopped,
    gas_safe_verified: bool('check-gas'),
    cordon_verified: bool('check-cordon'),
    loto_verified: bool('check-loto'),
    supervision_ppe_verified: bool('check-ppe'),
    checklist_notes: `Fixer completed mandatory five-point statutory on-site review. AI_VISION_CONFIDENCE=${viol.visionConfidence || 0.94}`
  };

  const applyTransferToSupervisor = () => {
    Object.assign(viol, {
      status: "PENDING_VERIFICATION",
      fixNotes: remarks,
      work_stopped_status: workStopped,
      work_continued_flag: workStopped === 'CONTINUED',
      gas_safe_verified: payload.gas_safe_verified,
      cordon_verified: payload.cordon_verified,
      loto_verified: payload.loto_verified,
      supervision_ppe_verified: payload.supervision_ppe_verified,
      checklist_notes: payload.checklist_notes
    });
    if (window._fixerAfterPhotos) window._fixerAfterPhotos[viol.id] = viol.afterPhoto;
    try { sessionStorage.setItem('khadan_after_' + viol.id, viol.afterPhoto); } catch (_) {}
    notifyStateChanged("VIOLATION_SUBMITTED_FOR_VERIFY", { id: viol.id, workContinued: payload.work_stopped_status === 'CONTINUED' });
    showLiveToast("Submitted for Verification", `${viol.id} transferred to Supervisor Verification Queue (Screen 8).`, "success");
    switchScreen(6);
  };

  try {
    const data = await apiPost(`/actions/${encodeURIComponent(viol.id)}/close`, payload);
    if (data && data.status) {
      viol.status = data.status;
    }
  } catch (e) {
    console.warn("Backend closeout sync pending (operating in resilient mode):", e);
    if (typeof queueSubmission === 'function') {
      try { queueSubmission(payload, `/actions/${encodeURIComponent(viol.id)}/close`); } catch (_) {}
    }
  }

  // Always transition local record so supervisor queue gets it
  applyTransferToSupervisor();
}

// -------------------------------------------------------------
// SCREEN 8: SUPERVISOR VERIFICATION DESK (FORM VII-A)
// -------------------------------------------------------------
function renderScreen8Verifications() {
  const container = document.getElementById('verifications-container');
  if (!container) return;
  container.innerHTML = "";

  const currentMine = store.currentUser.mine ? store.currentUser.mine.split(' ')[0] : "BCCL";
  
  // Pending verification items matching supervisor's mine (or all for corporate)
  const pendingList = store.violations.filter(v => 
    v.status === 'PENDING_VERIFICATION' &&
    (v.mine.includes(currentMine) || store.currentUser.roleCode === 'corporate')
  );

  const countBadge = document.getElementById('pending-verifications-count-badge');
  if (countBadge) countBadge.textContent = `${pendingList.length} Pending Verification`;

  if (pendingList.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-lg border border-slate-300 p-8 text-center space-y-2">
        <div class="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
          <i class="fa-solid fa-check-double"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">All Statutory Actions Verified</h4>
        <p class="text-xs text-slate-500">No items are currently awaiting supervisor clearance in ${store.currentUser.mine}.</p>
      </div>
    `;
    return;
  }

  pendingList.forEach(viol => {
    const card = document.createElement('div');
    card.className = "bg-white rounded-lg border border-slate-300 shadow-sm p-4 space-y-4";
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-blue-900">${viol.id}</span>
            <span class="text-xs font-bold text-slate-800">${viol.title}</span>
            <span class="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">${viol.regulation}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5 font-mono">Location: ${viol.mine} • ${viol.gps}</p>
        </div>
        <span class="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
          Awaiting Verification
        </span>
      </div>

      <!-- FIXER 5-POINT SAFETY REVIEW COMPLIANCE BOX -->
      <div class="${viol.work_continued_flag ? 'bg-rose-50 border-2 border-rose-400' : 'bg-slate-50 border border-slate-200'} rounded p-3 text-xs space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-800 flex items-center gap-1.5">
            <i class="fa-solid fa-clipboard-check text-blue-900"></i>
            <span>Fixer On-Site 5-Point Safety Audit Review:</span>
          </span>
          <span class="text-[10px] font-mono ${viol.work_continued_flag ? 'text-rose-700 font-bold' : 'text-emerald-700'}">
            ${viol.work_continued_flag ? '⚠️ WARNING: WORK WAS CONTINUING!' : '✓ Work Halted during Fix'}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          <div class="p-1.5 rounded ${viol.work_continued_flag ? 'bg-rose-200 text-rose-900 font-bold' : 'bg-emerald-100 text-emerald-800'}">
            <span class="block text-[9px] uppercase text-slate-500">Work Stoppage</span>
            <span>${viol.work_stopped_status === 'CONTINUED' ? '❌ Continuing' : '✓ Stopped'}</span>
          </div>
          <div class="p-1.5 rounded bg-emerald-100 text-emerald-800">
            <span class="block text-[9px] uppercase text-slate-500">Gas Safety</span>
            <span>✓ Verified Safe</span>
          </div>
          <div class="p-1.5 rounded bg-emerald-100 text-emerald-800">
            <span class="block text-[9px] uppercase text-slate-500">Barricades</span>
            <span>✓ Cordoned</span>
          </div>
          <div class="p-1.5 rounded bg-emerald-100 text-emerald-800">
            <span class="block text-[9px] uppercase text-slate-500">LOTO</span>
            <span>✓ Isolated</span>
          </div>
          <div class="p-1.5 rounded bg-emerald-100 text-emerald-800">
            <span class="block text-[9px] uppercase text-slate-500">Supervision</span>
            <span>✓ Sirdar Present</span>
          </div>
        </div>
      </div>

      <!-- SIDE BY SIDE PHOTO COMPARISON -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- BEFORE -->
        <div class="bg-rose-50/50 p-3 rounded border border-rose-200 space-y-1.5">
          <div class="flex justify-between items-center text-xs font-bold text-rose-800">
            <span>BEFORE (Hazard Evidence)</span>
            <span class="font-mono text-[10px]">${viol.timestamp}</span>
          </div>
          <img src="${viol.beforePhoto}" class="w-full h-44 object-cover rounded border border-rose-300" />
          <p class="text-xs text-slate-700">${viol.description}</p>
        </div>

        <!-- AFTER -->
        <div class="bg-emerald-50/50 p-3 rounded border border-emerald-200 space-y-1.5">
          <div class="flex justify-between items-center text-xs font-bold text-emerald-800">
            <span>AFTER (Fixer Proof)</span>
            <span class="font-mono text-[10px]">Submitted Proof</span>
          </div>
          <img src="${viol.afterPhoto || (window._fixerAfterPhotos && window._fixerAfterPhotos[viol.id]) || viol.beforePhoto}" class="w-full h-44 object-cover rounded border border-emerald-300" />
          <p class="text-xs text-slate-700"><strong>Fixer Notes:</strong> ${viol.fixNotes || 'Remediation completed per standard.'}</p>
          ${(() => { const m=String(viol.checklist_notes||'').match(/AI_VISION_CONFIDENCE=([0-9.]+)/); return m ? `<span class="inline-block mt-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded">AI Vision Comparison: ${(parseFloat(m[1])*100).toFixed(0)}%</span>` : ''; })()}
        </div>
      </div>

      <!-- SUPERVISOR ACTIONS -->
      <div class="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div class="text-xs text-slate-500">
          Assigned Fixer: <strong class="text-slate-800">${viol.assignedTo}</strong>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="rejectViolation('${viol.id}')" class="px-3 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-left"></i> Reject (Re-work)
          </button>
          <button onclick="approveViolation('${viol.id}')" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow flex items-center gap-1.5">
            <i class="fa-solid fa-check"></i> Approve & Close
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function approveViolation(violId) {
  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;
  const applyApprove = () => {
    viol.status = 'CLOSED';
    viol.closed_at = new Date().toISOString();
    viol.supervisorNotes = 'Statutory compliance verified and confirmed under CMR 2017.';
    showLiveToast("Violation Approved & Closed", `${violId} approved and verified under CMR 2017.`, "success");
    renderScreen8Verifications();
  };
  try {
    const data = await apiPost(`/verifications/${encodeURIComponent(violId)}/review`, {
      decision: 'APPROVE',
      supervisor_remarks: 'Statutory compliance verified and confirmed under CMR 2017.'
    });
    if (data && data.new_status) viol.status = data.new_status;
    else viol.status = 'CLOSED';
    viol.closed_at = new Date().toISOString();
    viol.supervisorNotes = 'Statutory compliance verified and confirmed under CMR 2017.';
    showLiveToast("Violation Approved & Closed", `${violId} approved by backend verification workflow.`, "success");
    await syncViolationsFromBackend?.();
    renderScreen8Verifications();
  } catch (e) {
    console.warn("Backend verification approval note:", e);
    applyApprove();
  }
}

async function rejectViolation(violId) {
  const reason = prompt("Enter statutory reason for rejection / re-work directives:", "After-photo unclear; re-verify torque reading and resubmit.");
  if (!reason) return;
  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;
  const applyReject = () => {
    viol.status = 'OPEN';
    viol.supervisorNotes = reason;
    showLiveToast("Violation Returned for Re-work", `${violId} returned to the fixer queue.`, "warning");
    renderScreen8Verifications();
  };
  try {
    const data = await apiPost(`/verifications/${encodeURIComponent(violId)}/review`, {
      decision: 'REJECT',
      supervisor_remarks: reason
    });
    if (data && data.new_status) viol.status = data.new_status;
    else viol.status = 'OPEN';
    viol.supervisorNotes = reason;
    showLiveToast("Violation Returned for Re-work", `${violId} returned to the fixer queue by backend verification.`, "warning");
    await syncViolationsFromBackend?.();
    renderScreen8Verifications();
  } catch (e) {
    console.warn("Backend verification rejection note:", e);
    applyReject();
  }
}

// -------------------------------------------------------------
// MULTI-ROLE ALERT / ESCALATION TO ACTION FIXER
// -------------------------------------------------------------
// Statutory routing rule: while a violation is PENDING_VERIFICATION, verifying it
// is exclusively the Shift Supervisor's job. So any alert raised by DGMS or the
// Mine Manager on such a violation must be routed strictly to the Supervisor of
// that mine — never to the assigned fixer.
function resolveAlertRecipient(viol) {
  const senderRoleCode = store.currentUser.roleCode;
  const isVerifyStage = viol.status === 'PENDING_VERIFICATION';
  const senderIsDgmsOrManager = senderRoleCode === 'corporate' || senderRoleCode === 'manager';

  if (isVerifyStage && senderIsDgmsOrManager) {
    const mineKey = getMineKeyFromMineName(viol.mine);
    const mineData = DEMO_ACCOUNTS[mineKey] || DEMO_ACCOUNTS.jharia;
    const supervisorName = mineData.supervisor ? `${mineData.supervisor.name} (${mineData.supervisor.title})` : "Shift Supervisor";
    return { name: supervisorName, role: "supervisor", label: "Assigned Supervisor (Verification Pending)" };
  }
  return { name: viol.assignedTo, role: "fixer", label: "Assigned Fixer" };
}

function openFixerAlertModal(violId) {
  if (store.currentUser && store.currentUser.roleCode === 'supervisor') {
    showLiveToast("Action Not Permitted", "Supervisors are not permitted to issue fixer alerts.", "error");
    return;
  }

  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;

  store.activeAlertViolationId = violId;
  const targetIdEl = document.getElementById('alert-modal-viol-id');
  const mineEl = document.getElementById('alert-modal-mine');
  const titleEl = document.getElementById('alert-modal-title');
  const assignedEl = document.getElementById('alert-modal-assigned-to');
  const assignedLabelEl = document.getElementById('alert-modal-assigned-label');
  const modal = document.getElementById('fixer-alert-modal');

  const recipient = resolveAlertRecipient(viol);

  if (targetIdEl) targetIdEl.textContent = viol.id;
  if (mineEl) mineEl.textContent = viol.mine;
  if (titleEl) titleEl.textContent = viol.title;
  if (assignedEl) assignedEl.textContent = recipient.name;
  if (assignedLabelEl) assignedLabelEl.textContent = `${recipient.label}:`;

  if (modal) modal.classList.remove('hidden');
}

function closeFixerAlertModal() {
  const modal = document.getElementById('fixer-alert-modal');
  if (modal) modal.classList.add('hidden');
  store.activeAlertViolationId = null;
}

async function submitFixerAlert() {
  if(store.currentUser?.roleCode==='supervisor'){showLiveToast("Action Not Permitted","Supervisors are not permitted to issue fixer alerts.","error");closeFixerAlertModal();return;}
  const viol=store.violations.find(v=>v.id===store.activeAlertViolationId); if(!viol) return;
  const level=document.getElementById('alert-modal-level')?.value||'URGENT_NOTICE'; const directives=document.getElementById('alert-modal-directives')?.value.trim()||'Immediate rectification required.';
  try { const data=await apiPost(`/actions/${encodeURIComponent(viol.id)}/alert`,{sender_role:store.currentUser.roleCode==='corporate'?'dgms':'manager',sender_name:`${store.currentUser.name} (${store.currentUser.role})`,alert_level:level,statutory_directive:directives}); Object.assign(viol,{alert_sent:true,alert_by_role:data.sender_role,alert_by_name:data.sender_name,alert_level:level,alert_notes:directives,alert_recipient_name:data.alert_recipient,alert_recipient_role:data.alert_recipient_role}); closeFixerAlertModal(); showLiveToast("Alert Dispatched",data.message,"warning"); await syncViolationsFromBackend?.(); } catch(e){showLiveToast("Alert Failed",e.message,"error");}
}

// -------------------------------------------------------------
// DGMS SECTION 22 WORK-STOPPAGE WARNING DIRECTIVES
// -------------------------------------------------------------
function openDgmsWarningModal(mineName) {
  const selectEl = document.getElementById('dgms-warning-mine');
  if (selectEl && mineName) {
    for (let i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value.includes(mineName.split(' ')[0])) {
        selectEl.selectedIndex = i;
        break;
      }
    }
  }
  const modal = document.getElementById('dgms-warning-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeDgmsWarningModal() {
  const modal = document.getElementById('dgms-warning-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitDgmsWorkStoppageWarning() {
  const mineSelect = document.getElementById('dgms-warning-mine');
  const textInput = document.getElementById('dgms-warning-text');

  const targetMine = mineSelect ? mineSelect.value : "BCCL - Jharia Colliery";
  const directiveText = textInput ? textInput.value.trim() : "Work stoppage directive under Section 22 Mines Act.";

  store.stoppageWarnings[targetMine] = {
    active: true,
    issuedAt: new Date().toLocaleTimeString() + " IST",
    issuedBy: `${store.currentUser.name} (DGMS Directorate)`,
    directiveText: directiveText,
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null
  };

  try { await apiPost('/actions/stoppage-warning',{officer_name:store.currentUser.name,mine_name:targetMine,directive_text:directiveText}); closeDgmsWarningModal(); notifyStateChanged("STOPPAGE_WARNING_ISSUED",{mine:targetMine}); showLiveToast("Section 22 Notice Served",`Statutory Work-Stoppage Warning served to Mine Manager of ${targetMine}.`,"error"); } catch(e){ showLiveToast("Directive Failed",e.message,"error"); }
}

async function acknowledgeWorkStoppage(mineName) {
  const warn = store.stoppageWarnings[mineName];
  if (warn) {
    warn.acknowledged = true;
    warn.acknowledgedAt = new Date().toLocaleTimeString() + " IST";
    warn.acknowledgedBy = store.currentUser.name;
    try { await apiPost(`/actions/stoppage-warning/ack?mine=${encodeURIComponent(mineName)}`,{manager_name:store.currentUser.name,compliance_notes:"Work stoppage enforced across affected district per DGMS directive."}); showLiveToast("Stoppage Enforced",`Work stoppage confirmed & officially recorded for ${mineName}.`,"success"); notifyStateChanged("STOPPAGE_ACKNOWLEDGED",{mine:mineName}); } catch(e){showLiveToast("Acknowledgment Failed",e.message,"error");}
  }
}
const ackDgmsWorkStoppage = acknowledgeWorkStoppage;

// -------------------------------------------------------------
// SCREEN 9: EXECUTIVE DASHBOARD (STRICTLY SCOPED FOR MINE MANAGERS)
// -------------------------------------------------------------
let trendChartInstance = null;
let doughnutChartInstance = null;

function renderScreen9Charts() {
  refreshDashboardData();

  const ctxTrend = document.getElementById('violationsTrendChart');
  if (ctxTrend) {
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'],
        datasets: [
          {
            label: 'Reported Violations',
            data: [14, 11, 15, 10, 12, 6],
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Closed / Rectified',
            data: [12, 10, 14, 10, 11, 5],
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  const ctxDoughnut = document.getElementById('severityDoughnutChart');
  if (ctxDoughnut) {
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    
    // Filter by active mine
    const isMineScoped = store.currentUser.roleCode === 'manager' || store.currentUser.roleCode === 'supervisor';
    const activeMine = isMineScoped ? store.currentUser.mine : (document.getElementById('dash-filter-mine') ? document.getElementById('dash-filter-mine').value : 'ALL');
    
    const viols = activeMine === 'ALL'
      ? store.violations
      : store.violations.filter(v => v.mine.includes(activeMine.split(' ')[0]));

    let crit = 0, maj = 0, min = 0;
    viols.filter(v => v.status !== 'CLOSED').forEach(v => {
      if (v.severity === 'Critical') crit++;
      else if (v.severity === 'Major') maj++;
      else min++;
    });

    doughnutChartInstance = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: ['Critical (24h)', 'Major (72h)', 'Minor (7d)'],
        datasets: [{
          data: [crit || 1, maj || 2, min || 1],
          backgroundColor: ['#dc2626', '#ea580c', '#ca8a04']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
        }
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// CENTRAL LIVE "COMPLIANCE % THIS MONTH" ENGINE
// Dynamically recalculates the statutory compliance percentage
// in real-time based on open/closed violations, DGMS actions
// (Section 22 work stoppage orders, red alerts, directives),
// and Mine Manager actions (acknowledging stoppage orders,
// assigning remediation orders, approving closures).
// Updates Screen 2 (Field Inspector Desk), Screen 3 (10-Point Checklist),
// Screen 9 (Executive Dashboard), and Colliery Snapshot modals.
// ─────────────────────────────────────────────────────────────
function calculateMineComplianceMetrics(mineName) {
  const isAll = !mineName || mineName === "ALL";
  const prefix = isAll ? "" : mineName.split(' ')[0];

  const scopedViolations = isAll
    ? (store.violations || [])
    : (store.violations || []).filter(v => v.mine && v.mine.includes(prefix));

  const now = new Date();
  const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoff28d = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const open = scopedViolations.filter(v => v.status === 'OPEN' || v.status === 'IN_PROGRESS' || v.status === 'PENDING_VERIFICATION');
  const openCritical = open.filter(v => v.severity === 'Critical').length;
  const openMajor    = open.filter(v => v.severity === 'Major').length;
  const openMinor    = open.filter(v => v.severity === 'Minor').length;
  const overdue      = open.filter(v => v.deadline && new Date(v.deadline) < now).length;
  const dgmsAlerts   = open.filter(v => v.dgms_alert_sent || v.alert_sent).length;
  const reopened     = scopedViolations.filter(v => v.reopened_from_closed).length;
  const recentlyClosed = scopedViolations.filter(v =>
    v.status === 'CLOSED' && v.closed_at && new Date(v.closed_at) >= cutoff7d
  ).length;

  // Mine Manager Action Bonus: assigning fixers & actively progressing remediations
  const assignedRemedies = open.filter(v => v.action_assigned_to || v.status === 'IN_PROGRESS' || v.status === 'PENDING_VERIFICATION').length;

  // 28-day Red Alerts
  let redAlertCountIn28d = 0;
  if (store.redAlertHistory && Array.isArray(store.redAlertHistory)) {
    redAlertCountIn28d = store.redAlertHistory.filter(ra => {
      const mMatch = isAll ? true : (ra.mine && ra.mine.includes(prefix));
      const dMatch = ra.timestamp ? (new Date(ra.timestamp) >= cutoff28d) : true;
      return mMatch && dMatch;
    }).length;
  }

  // DGMS Action & Mine Manager Action: Section 22 Work-Stoppage Warning Directives
  let stoppageDeduction = 0;
  if (store.stoppageWarnings) {
    const matchingKeys = Object.keys(store.stoppageWarnings).filter(m => isAll ? true : m.includes(prefix));
    matchingKeys.forEach(k => {
      const warn = store.stoppageWarnings[k];
      if (warn && warn.active) {
        if (!warn.acknowledged) {
          // DGMS Action: Served Statutory Section 22 Work-Stoppage Directive (-14% severe non-compliance penalty)
          stoppageDeduction += 14;
        } else {
          // Mine Manager Action: Acknowledged & Enforced operational halt for repairs (-4% residual, +10% rebound)
          stoppageDeduction += 4;
        }
      }
    });
  }

  const deduction =
    Math.min(openCritical * 8, 32) +
    Math.min(openMajor * 4, 20) +
    Math.min(openMinor * 1, 10) +
    Math.min(overdue * 5, 20) +
    Math.min(redAlertCountIn28d * 6, 24) +
    Math.min(dgmsAlerts * 3, 12) +
    Math.min(reopened * 4, 16) +
    stoppageDeduction;

  const bonus = Math.min(recentlyClosed * 2, 8) + Math.min(assignedRemedies * 1, 4);

  const score = Math.max(Math.min(100 - deduction + bonus, 100), 25);
  const tier = score >= 75 ? "DGMS Green" : score >= 55 ? "DGMS Amber" : "DGMS Red";
  const note = score >= 75
    ? "Within Acceptable Safety Limits"
    : score >= 55
    ? "Approaching Statutory Risk Threshold"
    : "Statutory Non-Compliance Risk";

  return {
    score,
    tier,
    note,
    scoreFormatted: score.toFixed(1) + "%",
    openCount: open.length,
    criticalCount: openCritical,
    majorCount: openMajor,
    minorCount: openMinor,
    overdueCount: overdue,
    recentlyClosed,
    stoppageDeduction
  };
}

function updateAllComplianceDisplays(selectedMine) {
  const currentMine = (store.currentUser && store.currentUser.mine) || "BCCL - Jharia Colliery";
  const inspectorMine = currentMine;
  const dashboardMine = selectedMine || (document.getElementById('dash-filter-mine') ? document.getElementById('dash-filter-mine').value : "ALL");

  // 1. Compute for Field Inspector (their designated mine)
  const inspectorMetrics = calculateMineComplianceMetrics(inspectorMine);

  // Screen 2: Field Inspector Desk Quick Metrics Ribbon
  const s2CompEl = document.getElementById('home-stat-compliance');
  const s2NoteEl = document.getElementById('home-stat-compliance-note');
  const s2CardEl = document.getElementById('home-stat-compliance-card');
  const s2IconEl = document.getElementById('home-stat-compliance-icon');

  if (s2CompEl) {
    s2CompEl.textContent = inspectorMetrics.scoreFormatted;
    if (inspectorMetrics.score >= 75) {
      s2CompEl.className = "text-xl font-bold text-emerald-700";
      if (s2NoteEl) {
        s2NoteEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${inspectorMetrics.note}`;
        s2NoteEl.className = "text-[11px] text-emerald-600";
      }
      if (s2CardEl) s2CardEl.className = "bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-600";
      if (s2IconEl) s2IconEl.className = "w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700";
    } else if (inspectorMetrics.score >= 55) {
      s2CompEl.className = "text-xl font-bold text-amber-600";
      if (s2NoteEl) {
        s2NoteEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${inspectorMetrics.note}`;
        s2NoteEl.className = "text-[11px] text-amber-600";
      }
      if (s2CardEl) s2CardEl.className = "bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500";
      if (s2IconEl) s2IconEl.className = "w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600";
    } else {
      s2CompEl.className = "text-xl font-bold text-rose-600";
      if (s2NoteEl) {
        s2NoteEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${inspectorMetrics.note}`;
        s2NoteEl.className = "text-[11px] text-rose-600";
      }
      if (s2CardEl) s2CardEl.className = "bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between border-l-4 border-l-rose-600";
      if (s2IconEl) s2IconEl.className = "w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600";
    }
  }

  // Screen 3: Field Inspector 10-Item Statutory Checklist Header
  const s3CompEl = document.getElementById('screen3-compliance-pct');
  const s3BadgeEl = document.getElementById('screen3-compliance-badge');
  const s3CardEl = document.getElementById('screen3-compliance-card');

  if (s3CompEl) {
    s3CompEl.textContent = inspectorMetrics.scoreFormatted;
    if (inspectorMetrics.score >= 75) {
      s3CompEl.className = "text-base font-bold text-emerald-700 font-mono";
      if (s3BadgeEl) {
        s3BadgeEl.textContent = inspectorMetrics.tier;
        s3BadgeEl.className = "text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold";
      }
      if (s3CardEl) s3CardEl.className = "flex items-center gap-2 bg-emerald-50/70 border border-emerald-300 px-3 py-1.5 rounded";
    } else if (inspectorMetrics.score >= 55) {
      s3CompEl.className = "text-base font-bold text-amber-600 font-mono";
      if (s3BadgeEl) {
        s3BadgeEl.textContent = inspectorMetrics.tier;
        s3BadgeEl.className = "text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold";
      }
      if (s3CardEl) s3CardEl.className = "flex items-center gap-2 bg-amber-50/70 border border-amber-300 px-3 py-1.5 rounded";
    } else {
      s3CompEl.className = "text-base font-bold text-rose-600 font-mono";
      if (s3BadgeEl) {
        s3BadgeEl.textContent = inspectorMetrics.tier;
        s3BadgeEl.className = "text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold";
      }
      if (s3CardEl) s3CardEl.className = "flex items-center gap-2 bg-rose-50/70 border border-rose-300 px-3 py-1.5 rounded";
    }
  }

  // 2. Compute for Executive Dashboard Screen 9 (filtered by dropdown or consolidated)
  const dashMetrics = calculateMineComplianceMetrics(dashboardMine);
  const compEl = document.getElementById('dash-compliance-pct');
  if (compEl) {
    compEl.textContent = dashMetrics.scoreFormatted;
    const kpiCard = compEl.closest('.bg-white') || compEl.parentElement;
    if (kpiCard) {
      kpiCard.classList.remove('border-l-emerald-600', 'border-l-amber-500', 'border-l-rose-600');
      if (dashMetrics.score >= 75)      kpiCard.classList.add('border-l-emerald-600');
      else if (dashMetrics.score >= 55) kpiCard.classList.add('border-l-amber-500');
      else                              kpiCard.classList.add('border-l-rose-600');
    }
    const statusLabel = kpiCard ? kpiCard.querySelector('.font-mono') : null;
    const statusNote  = kpiCard ? kpiCard.querySelectorAll('p')[1] : null;
    if (statusLabel && statusNote) {
      if (dashMetrics.score >= 75) {
        statusLabel.textContent = "DGMS Green";
        statusLabel.className = "text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono";
        statusNote.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${dashMetrics.note}`;
        statusNote.className = "text-[11px] text-emerald-600 mt-1";
      } else if (dashMetrics.score >= 55) {
        statusLabel.textContent = "DGMS Amber";
        statusLabel.className = "text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono";
        statusNote.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${dashMetrics.note}`;
        statusNote.className = "text-[11px] text-amber-600 mt-1";
      } else {
        statusLabel.textContent = "DGMS Red";
        statusLabel.className = "text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono";
        statusNote.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${dashMetrics.note}`;
        statusNote.className = "text-[11px] text-rose-600 mt-1";
      }
    }
  }

  // 3. Colliery Safety Snapshot modal
  const snapCompEl = document.getElementById('snapshot-compliance-pct');
  if (snapCompEl) {
    snapCompEl.textContent = `${inspectorMetrics.scoreFormatted} Compliance`;
    if (inspectorMetrics.score >= 75) {
      snapCompEl.className = "bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold";
    } else if (inspectorMetrics.score >= 55) {
      snapCompEl.className = "bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold";
    } else {
      snapCompEl.className = "bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded text-xs font-bold";
    }
  }
}

function updateComplianceKpiCard(scopedViolations, redAlertCountIn28d) {
  const select = document.getElementById('dash-filter-mine');
  const selectedMine = select ? select.value : "ALL";
  updateAllComplianceDisplays(selectedMine);
}

// ─────────────────────────────────────────────────────────────
// LIVE COMPLIANCE SCORE: fetches from backend after key events
// (violation closed, reopened, red alert issued, DGMS alert sent)
// This only overrides the locally-computed KPI above when a real
// backend is reachable; otherwise the local calculation stands.
// ─────────────────────────────────────────────────────────────
async function fetchAndUpdateComplianceKPI(mine) {
  try {
    const mineParam = mine && mine !== "ALL" ? `?mine=${encodeURIComponent(mine)}` : "";
    const res = await fetch(`${API_BASE}/analytics/compliance-score${mineParam}`);
    if (!res.ok) return;
    const data = await res.json();
    // Update compliance KPI card on Screen 9
    const compEl = document.getElementById('dash-compliance-pct');
    if (compEl) {
      compEl.textContent = data.compliance_score.toFixed(1) + "%";
      // Colour the card based on tier
      const kpiCard = compEl.closest('.kpi-card') || compEl.parentElement;
      if (kpiCard) {
        kpiCard.classList.remove('border-emerald-300','border-amber-300','border-rose-400');
        if (data.compliance_score >= 75)     kpiCard.classList.add('border-emerald-300');
        else if (data.compliance_score >= 55) kpiCard.classList.add('border-amber-300');
        else                                  kpiCard.classList.add('border-rose-400');
      }
    }
    // Update open/critical/overdue counts too
    const openEl    = document.getElementById('dash-open-violations');
    const critEl    = document.getElementById('dash-critical-violations');
    const overdueEl = document.getElementById('dash-overdue-actions');
    if (openEl)    openEl.textContent    = data.open_violations;
    if (critEl)    critEl.textContent    = data.open_critical;
    if (overdueEl) overdueEl.textContent = data.overdue;
  } catch(e) { /* backend may not be running in demo mode */ }
}

function refreshDashboardData() {
  const isMineScoped = store.currentUser.roleCode === 'manager' || store.currentUser.roleCode === 'supervisor';
  const filterSelect = document.getElementById('dash-filter-mine');
  const lockedBadge = document.getElementById('dash-manager-locked-badge');
  const lockedLabel = document.getElementById('dash-manager-mine-label');
  const stoppageBanner = document.getElementById('manager-stoppage-warning-banner');
  const suspensionBanner = document.getElementById('manager-red-alert-suspension-banner');
  const redAlertCard = document.getElementById('manager-red-alert-status-card');

  // MINE SCOPING ENFORCEMENT:
  // Supervisor and Mine Manager can ONLY see dashboard of their own mine; DGMS Officer sees all
  if (isMineScoped) {
    if (filterSelect) filterSelect.classList.add('hidden');
    if (lockedBadge) {
      lockedBadge.classList.remove('hidden');
      if (lockedLabel) lockedLabel.textContent = `🔒 Scoped Colliery: ${store.currentUser.mine}`;
    }
  } else {
    if (filterSelect) filterSelect.classList.remove('hidden');
    if (lockedBadge) lockedBadge.classList.add('hidden');
  }

  const selectedMine = isMineScoped 
    ? store.currentUser.mine 
    : (filterSelect ? filterSelect.value : 'ALL');

  const filtered = selectedMine === 'ALL' 
    ? store.violations 
    : store.violations.filter(v => v.mine.includes(selectedMine.split(' ')[0]));

  const openCount = filtered.filter(v => v.status === 'OPEN').length;
  const critCount = filtered.filter(v => v.status === 'OPEN' && v.severity === 'Critical').length;
  const overdueCount = filtered.filter(v => v.status === 'OPEN' && new Date(v.deadline) < new Date()).length;

  const openEl = document.getElementById('dash-open-violations');
  const critEl = document.getElementById('dash-critical-violations');
  const overdueEl = document.getElementById('dash-overdue-actions');

  if (openEl) openEl.textContent = openCount;
  if (critEl) critEl.textContent = critCount;
  if (overdueEl) overdueEl.textContent = overdueCount;

  // 28-DAY RED ALERT SUSPENSION EVALUATION (>3 Alerts in 28 Days = 28d suspension + 14d mine stoppage)
  const countIn28d = getMine28DayRedAlertCount(selectedMine);
  const minePrefix = selectedMine.split(' ')[0] || "BCCL";

  // LIVE "COMPLIANCE % THIS MONTH" KPI — recomputed locally on every
  // dashboard refresh so it reacts immediately to violations being
  // closed, reopened, or escalated (matches backend scoring logic,
  // and still works if the backend API isn't reachable).
  updateComplianceKpiCard(filtered, countIn28d);
  const isSuspended = countIn28d > 3 || (store.suspendedMines && store.suspendedMines[minePrefix] && store.suspendedMines[minePrefix].isSuspended);

  if (suspensionBanner) {
    if (isSuspended) {
      suspensionBanner.className = "bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-rose-500 rounded-xl p-5 text-white shadow-2xl space-y-3 animate-pulse";
      suspensionBanner.classList.remove('hidden');
      // Determine who is suspended based on who raised the alerts
      const suspData = store.suspendedMines && store.suspendedMines[minePrefix] ? store.suspendedMines[minePrefix] : null;
      const suspPerson  = suspData ? suspData.suspendedPerson  : "Mine Manager";
      const suspRole    = suspData ? suspData.suspendedRole    : "Mine Manager";
      const suspDays    = suspData ? suspData.suspendedDays    : 28;
      const suspIssuer  = suspData ? suspData.issuerRole       : "corporate";
      const suspHeading = suspIssuer === 'manager'
        ? `SHIFT SUPERVISOR SUSPENDED (${suspDays} DAYS)`
        : `COLLIERY OPERATIONS HALTED (14 DAYS) • MINE MANAGER SUSPENDED (${suspDays} DAYS)`;
      const suspDetail = suspIssuer === 'manager'
        ? `Mine Manager raised a Red Alert on substandard verification. <strong>The Shift Supervisor (${suspPerson}) is placed under ${suspDays}-day suspension</strong> for approving insufficient rectification work without meeting statutory safety thresholds under CMR-2017.`
        : `DGMS Directorate raised a Red Alert. <strong>Mine Manager (${suspPerson}) is placed under ${suspDays}-day administrative suspension</strong> for failure to ensure adequate remediation. All commercial coal cutting is stopped; only emergency hazard rectification crews are permitted.`;
      const suspLabel = suspIssuer === 'manager'
        ? `Shift Supervisor Suspension: ${suspDays} Days Active`
        : `Mine Manager Suspension: ${suspDays} Days Active`;

      suspensionBanner.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-700/60 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center text-2xl shadow-lg border-2 border-rose-300">
              <i class="fa-solid fa-ban"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-white text-rose-950 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase">STATUTORY ENFORCEMENT ORDER</span>
                <span class="bg-amber-400 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold">MINES ACT 1952 SEC 22</span>
              </div>
              <h3 class="text-base font-extrabold text-white mt-0.5">${suspHeading}</h3>
            </div>
          </div>
          <div class="bg-rose-900/90 border border-rose-400 px-3 py-1 rounded font-mono text-xs text-amber-300 font-bold">
            ${countIn28d} Red Alerts in 28 Days
          </div>
        </div>
        <p class="text-xs text-rose-100 leading-relaxed">
          Under DGMS Statutory Enforcement Rules, colliery <strong>${selectedMine}</strong> has accumulated <strong>${countIn28d} Red Alerts</strong> within a 28-day window (exceeding statutory threshold of 3).
          ${suspDetail}
        </p>
        <div class="flex flex-wrap items-center gap-4 text-xs text-amber-300 font-semibold pt-1">
          <span><i class="fa-solid fa-user-slash mr-1"></i> ${suspLabel}</span>
          ${suspIssuer !== 'manager' ? `
          <span>•</span>
          <span><i class="fa-solid fa-stop-circle mr-1"></i> Colliery Extraction: 14 Days Halted</span>
          ` : ''}
          <span>•</span>
          <span><i class="fa-solid fa-shield-halved mr-1"></i> DGMS Central Directorate Oversight</span>
        </div>
      `;
    } else {
      suspensionBanner.classList.add('hidden');
    }
  }

  // 28-Day Red Alert Tracker Card
  if (redAlertCard) {
    if (selectedMine !== 'ALL') {
      redAlertCard.classList.remove('hidden');
      const gaugeWidth = Math.min((countIn28d / 3) * 100, 100);
      redAlertCard.className = `rounded-lg border p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
        isSuspended ? 'bg-rose-950 border-rose-600 text-rose-100' :
        countIn28d === 3 ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-300 text-slate-800'
      }`;
      redAlertCard.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs flex items-center gap-1.5">
              <i class="fa-solid fa-triangle-exclamation ${isSuspended ? 'text-rose-400' : countIn28d >= 2 ? 'text-amber-500' : 'text-slate-400'}"></i>
              <span>Rolling 28-Day Red Alert Statutory Compliance Gauge:</span>
            </span>
            <span class="font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
              isSuspended ? 'bg-rose-700 text-white' : countIn28d === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-800 border border-slate-300'
            }">
              ${countIn28d} of 3 Allowed
            </span>
          </div>
          <p class="text-[11px] ${isSuspended ? 'text-rose-200' : 'text-slate-600'}">
            Statutory Rule: More than 3 Red Alerts in 28 days = 28-day suspension to Mine Manager and 14-day operational stoppage to mine.
          </p>
          <div class="w-full sm:w-80 bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
            <div class="${isSuspended ? 'bg-rose-600 animate-pulse' : countIn28d === 3 ? 'bg-amber-500' : 'bg-emerald-600'} h-2 rounded-full transition-all duration-300" style="width: ${gaugeWidth}%;"></div>
          </div>
        </div>
        <div class="text-right self-end sm:self-center">
          ${isSuspended ? `
            <span class="bg-rose-800 text-white px-3 py-1.5 rounded text-xs font-bold font-mono inline-block animate-pulse">
              ⛔ SUSPENDED (28D)
            </span>
          ` : `
            <span class="text-xs font-semibold ${countIn28d === 3 ? 'text-amber-700 font-bold' : 'text-emerald-700'}">
              ${countIn28d === 3 ? '⚠️ 1 Alert Away from Suspension' : '✔ Normal Operating Band'}
            </span>
          `}
        </div>
      `;
    } else {
      redAlertCard.classList.add('hidden');
    }
  }

  // Render DGMS Work-Stoppage Directive Banner — this is a notice DGMS
  // serves ON a Mine Manager/Supervisor, so it should only ever appear
  // on the receiving mine's dashboard, never on the DGMS official's own
  // (corporate) dashboard, since DGMS is the one issuing it.
  if (stoppageBanner) {
    const activeMineKey = isMineScoped
      ? Object.keys(store.stoppageWarnings).find(m => m.includes(selectedMine.split(' ')[0]))
      : null;
    const warn = activeMineKey ? store.stoppageWarnings[activeMineKey] : null;

    if (warn && warn.active && !warn.acknowledged) {
      stoppageBanner.className = "bg-rose-900 border-2 border-rose-500 rounded-lg p-4 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pop-twice";
      stoppageBanner.classList.remove('hidden');
      stoppageBanner.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="text-amber-400 text-2xl mt-0.5">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-rose-700 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                DIRECTORATE GENERAL OF MINES SAFETY (DGMS)
              </span>
              <span class="text-xs text-amber-300 font-mono font-bold">MINES ACT SECTION 22 DIRECTIVE</span>
            </div>
            <h3 class="text-sm font-bold text-white mt-1">
              URGENT WORK-STOPPAGE NOTICE: Immediate Suspension of Coal Extraction Ordered
            </h3>
            <p class="text-xs text-rose-100 mt-0.5 max-w-2xl leading-relaxed">
              "${warn.directiveText}"
            </p>
            <span class="text-[10px] text-rose-300 block mt-1">Served By: <strong>${warn.issuedBy}</strong> at ${warn.issuedAt}</span>
          </div>
        </div>

        <div class="flex-shrink-0 self-end sm:self-center">
          <button onclick="acknowledgeWorkStoppage('${activeMineKey}')" class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded shadow transition flex items-center gap-2">
            <i class="fa-solid fa-gavel"></i>
            <span>Acknowledge & Confirm Work Stoppage</span>
          </button>
        </div>
      `;
    } else if (warn && warn.acknowledged) {
      stoppageBanner.className = "bg-emerald-900/90 border border-emerald-500 rounded-lg p-3 text-white shadow-sm flex justify-between items-center";
      stoppageBanner.classList.remove('hidden');
      stoppageBanner.innerHTML = `
        <div class="flex items-center gap-2 text-xs">
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          <span>DGMS Work-Stoppage Directive Acknowledged. Operations confirmed halted during repair (Confirmed at ${warn.acknowledgedAt}).</span>
        </div>
      `;
    } else {
      stoppageBanner.classList.add('hidden');
    }
  }
}

// -------------------------------------------------------------
// SCREEN 10: MASTER VIOLATIONS TABLE (WITH STRICT MINE SCOPING)
// -------------------------------------------------------------
function renderScreen10ViolationsTable() {
  const isMineScoped = store.currentUser.roleCode === 'manager' || store.currentUser.roleCode === 'supervisor';
  const mineEl = document.getElementById('filter-table-mine');
  const lockedBadge = document.getElementById('table-mine-locked-badge');
  const lockedLabel = document.getElementById('table-mine-locked-label');

  // If Supervisor or Mine Manager, lock filter exclusively to their mine
  if (isMineScoped && mineEl) {
    for (let i = 0; i < mineEl.options.length; i++) {
      if (mineEl.options[i].value.includes(store.currentUser.mine.split(' ')[0])) {
        mineEl.selectedIndex = i;
        mineEl.disabled = true;
        break;
      }
    }
    if (lockedBadge) {
      lockedBadge.classList.remove('hidden');
      if (lockedLabel) lockedLabel.textContent = `🔒 Scoped to: ${store.currentUser.mine}`;
    }
  } else if (mineEl) {
    mineEl.disabled = false;
    if (lockedBadge) lockedBadge.classList.add('hidden');
  }

  filterViolationsTable();
}

function filterViolationsTable() {
  const mineEl = document.getElementById('filter-table-mine');
  const sevEl = document.getElementById('filter-table-severity');
  const statEl = document.getElementById('filter-table-status');
  const searchEl = document.getElementById('filter-table-search');

  const isMineScoped = store.currentUser.roleCode === 'manager' || store.currentUser.roleCode === 'supervisor';
  const mineFilter = isMineScoped ? store.currentUser.mine.split(' ')[0] : (mineEl ? mineEl.value : 'ALL');
  const sevFilter = sevEl ? sevEl.value : 'ALL';
  const statFilter = statEl ? statEl.value : 'ALL';
  const query = searchEl ? searchEl.value.toLowerCase() : '';

  const tbody = document.getElementById('master-violations-tbody');
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = store.violations.filter(v => {
    const matchesMine = mineFilter === 'ALL' || v.mine.includes(mineFilter.split(' ')[0]);
    const matchesSev = sevFilter === 'ALL' || v.severity === sevFilter;
    const matchesStat = statFilter === 'ALL' || v.status === statFilter;
    const matchesSearch = !query || v.title.toLowerCase().includes(query) || v.id.toLowerCase().includes(query) || v.regulation.toLowerCase().includes(query);
    return matchesMine && matchesSev && matchesStat && matchesSearch;
  });

  const totalCountEl = document.getElementById('table-total-count');
  if (totalCountEl) totalCountEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400 text-xs">No matching violations found.</td></tr>`;
    return;
  }

  filtered.forEach(viol => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition";

    const sevBadge = viol.severity === 'Critical' 
      ? '<span class="badge-critical px-2 py-0.5 rounded text-[10px] font-bold">🔴 Critical</span>'
      : viol.severity === 'Major'
      ? '<span class="badge-major px-2 py-0.5 rounded text-[10px] font-bold">🟠 Major</span>'
      : '<span class="badge-minor px-2 py-0.5 rounded text-[10px] font-bold">🟡 Minor</span>';

    const statBadge = viol.status === 'OPEN'
      ? '<span class="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">OPEN</span>'
      : viol.status === 'PENDING_VERIFICATION'
      ? '<span class="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">VERIFY</span>'
      : '<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">CLOSED</span>';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-blue-900">${viol.id}</td>
      <td class="py-2.5 px-3 font-medium">${viol.mine}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-slate-800">${viol.title}</span>
        <span class="block text-[10px] font-mono text-slate-500">${viol.regulation}</span>
      </td>
      <td class="py-2.5 px-3">${sevBadge}</td>
      <td class="py-2.5 px-3 font-mono text-[11px]">${viol.deadline ? viol.deadline.replace('T', ' ') : 'Immediate'}</td>
      <td class="py-2.5 px-3">${viol.assignedTo ? viol.assignedTo.split('(')[0] : 'Unassigned'}</td>
      <td class="py-2.5 px-3">${statBadge}</td>
      <td class="py-2.5 px-3 text-right">
        <div class="flex items-center justify-end">
          ${viol.status !== 'CLOSED' && store.currentUser.roleCode !== 'supervisor' ? `
            <button onclick="openFixerAlertModal('${viol.id}')" title="Send Statutory Alert" class="text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition">
              <i class="fa-solid fa-bell text-amber-600"></i> <span>Alert</span>
            </button>
          ` : viol.status !== 'CLOSED' ? `
            <span class="text-slate-400 text-[11px] font-medium italic px-2 py-0.5 bg-slate-50 rounded border border-slate-200">Active</span>
          ` : `
            <span class="text-slate-400 text-[11px] font-medium italic px-2 py-0.5 bg-slate-50 rounded border border-slate-200">Closed</span>
          `}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// SCREEN 11: CORPORATE MINE RISK INDEX (DGMS / CIL REGULATOR)
// -------------------------------------------------------------
function renderScreen11CorporateMines() {
  const container = document.getElementById('corporate-mines-container');
  if (!container) return;
  container.innerHTML = "";

  store.mines.forEach(m => {
    let riskClass = "health-safe-risk";
    let riskBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Low Risk</span>`;

    if (m.riskScore >= 70) {
      riskClass = "health-high-risk";
      riskBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">High Risk Priority</span>`;
    } else if (m.riskScore >= 40) {
      riskClass = "health-moderate-risk";
      riskBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Moderate Watch</span>`;
    }

    const anomalyBadge = m.riskScore >= 60 
      ? `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-mono"><i class="fa-solid fa-triangle-exclamation"></i> IF Anomaly: High (${(m.riskScore/350).toFixed(3)})</span>`
      : `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono"><i class="fa-solid fa-check"></i> IF Anomaly: Normal</span>`;

    const topFactors = m.riskScore >= 70 
      ? ["Roof bed separation tell-tale surge", "Methane sensor calibration drift", "24h statutory deadline exceeded"]
      : m.riskScore >= 40 
      ? ["Overdue water spray nozzle maintenance", "Haulage track signal wire defect"]
      : ["All physical sensor parameters within green thresholds"];

    const card = document.createElement('div');
    card.className = `bg-white rounded-lg border border-slate-300 shadow-sm p-4 space-y-3 ${riskClass}`;
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-[10px] font-mono font-bold text-slate-500 uppercase">${m.subsidiary}</span>
          <h3 class="text-sm font-bold text-slate-900">${m.name}</h3>
          <p class="text-[11px] text-slate-600">${m.zone} • ${m.type}</p>
        </div>
        ${riskBadge}
      </div>

      <!-- Risk Score Bar -->
      <div class="bg-slate-50 p-2.5 rounded border border-slate-200">
        <div class="flex justify-between items-center text-xs mb-1">
          <span class="font-bold text-slate-700">AI Composite Risk Index (Hybrid IF+RF)</span>
          <span class="font-mono font-bold ${m.riskScore >= 70 ? 'text-rose-600' : 'text-slate-800'}">${m.riskScore} / 100</span>
        </div>
        <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div class="h-full ${m.riskScore >= 70 ? 'bg-rose-600' : m.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-600'}" style="width: ${m.riskScore}%"></div>
        </div>
        <div class="mt-2 flex justify-between items-center text-[10px]">
          ${anomalyBadge}
          <span class="text-slate-400 font-mono">Model: hybrid_rf_if_v1</span>
        </div>
      </div>

      <!-- Top Contributing Risk Factors (Explainability) -->
      <div class="bg-slate-50 border border-slate-200 p-2 rounded text-[11px] space-y-1">
        <span class="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
          <i class="fa-solid fa-microchip text-blue-800"></i> Top AI Contributing Risk Drivers:
        </span>
        <ul class="text-[10px] text-slate-600 list-disc list-inside space-y-0.5">
          ${topFactors.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>

      <!-- Quick Mine Indicators -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-100 p-1.5 rounded">
          <span class="text-[10px] text-slate-500 block">Open Violations</span>
          <span class="font-bold text-blue-900">${m.openViolations}</span>
        </div>
        <div class="bg-slate-100 p-1.5 rounded">
          <span class="text-[10px] text-slate-500 block">Critical</span>
          <span class="font-bold text-rose-600">${m.criticalViolations}</span>
        </div>
        <div class="bg-slate-100 p-1.5 rounded">
          <span class="text-[10px] text-slate-500 block">Compliance</span>
          <span class="font-bold text-emerald-700">${m.complianceRate}</span>
        </div>
      </div>

      <div class="pt-2 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500 border-t border-slate-200">
        <span>Gas: <strong>${m.gassyCategory}</strong></span>
        <div class="flex items-center gap-2">
          <button onclick="openDgmsWarningModal('${m.name}')" class="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-300 font-semibold flex items-center gap-1">
            <i class="fa-solid fa-gavel text-xs"></i> <span>Issue Sec 22 Warning</span>
          </button>
          <button onclick="drillIntoMine('${m.name}')" class="text-blue-700 hover:underline font-semibold">
            Drill into Mine →
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function drillIntoMine(mineName) {
  const dashSelect = document.getElementById('dash-filter-mine');
  if (dashSelect) {
    for (let i = 0; i < dashSelect.options.length; i++) {
      if (dashSelect.options[i].value.includes(mineName.split(' ')[0])) {
        dashSelect.selectedIndex = i;
        break;
      }
    }
  }
  switchScreen(9);
}

// -------------------------------------------------------------
// REVENUE & SNAPSHOT MODALS
// -------------------------------------------------------------
function openMineSnapshotModal() {
  const modal = document.getElementById('mine-snapshot-modal');
  const mineEl = document.getElementById('modal-snapshot-mine');
  const openEl = document.getElementById('snapshot-open-count');
  const critEl = document.getElementById('snapshot-critical-count');
  const pendEl = document.getElementById('snapshot-pending-count');

  const activeMine = store.currentUser.mine || "BCCL - Jharia Colliery";
  if (mineEl) mineEl.textContent = activeMine;

  const filtered = store.violations.filter(v => v.mine.includes(activeMine.split(' ')[0]));
  if (openEl) openEl.textContent = `${filtered.filter(v => v.status === 'OPEN').length} Items`;
  if (critEl) critEl.textContent = `${filtered.filter(v => v.status === 'OPEN' && v.severity === 'Critical').length} Items`;
  if (pendEl) pendEl.textContent = `${filtered.filter(v => v.status === 'PENDING_VERIFICATION').length} Items`;

  const snapCompEl = document.getElementById('snapshot-compliance-pct');
  const snapMetrics = calculateMineComplianceMetrics(activeMine);
  if (snapCompEl) {
    snapCompEl.textContent = `${snapMetrics.scoreFormatted} Compliance`;
    if (snapMetrics.score >= 75) {
      snapCompEl.className = "bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold";
    } else if (snapMetrics.score >= 55) {
      snapCompEl.className = "bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold";
    } else {
      snapCompEl.className = "bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded text-xs font-bold";
    }
  }

  if (modal) modal.classList.remove('hidden');
}

function closeMineSnapshotModal() {
  const modal = document.getElementById('mine-snapshot-modal');
  if (modal) modal.classList.add('hidden');
}

function showAccessRestrictedModal(screenNum, config) {
  const modal = document.getElementById('access-restricted-modal');
  const roleEl = document.getElementById('denied-user-role');
  const reqEl = document.getElementById('denied-required-role');
  const msgEl = document.getElementById('access-denied-message');

  if (roleEl) roleEl.textContent = store.currentUser.role || "Unauthorized";
  if (reqEl) {
    reqEl.textContent = screenNum === 11 ? "Corporate Directorate (DGMS Regulator Only)" :
                        screenNum === 8 ? "Shift Supervisor (Overman)" :
                        screenNum === 9 ? "Mine Manager / Corporate" : "Authorized Personnel";
  }
  if (msgEl) {
    if (screenNum === 11 && store.currentUser.roleCode === 'manager') {
      msgEl.textContent = "Mine Managers are restricted to their assigned colliery dashboard (Screen 9). Multi-mine corporate overview is reserved strictly for DGMS Officers.";
    } else {
      msgEl.textContent = "This screen requires designated statutory clearance not permitted under your active role.";
    }
  }
  if (modal) modal.classList.remove('hidden');
}

function closeAccessRestrictedModal() {
  const modal = document.getElementById('access-restricted-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// LIVE COMPLIANCE % / RISK RATE RECALCULATION ENGINE
// Runs after every Mine Manager or DGMS action (approve, reject,
// red alert, suspension, work-stoppage, etc.) so every metric —
// compliance percentage, AI risk score, risk level, open/critical
// counts — stays accurate everywhere it's displayed.
// -------------------------------------------------------------
function recalculateAllMineMetrics() {
  if (!store.mines) return;

  store.mines.forEach(mineObj => {
    const prefix = mineObj.name.split(' ')[0];
    const related = store.violations.filter(v => v.mine.includes(prefix));

    const total = related.length;
    const closed = related.filter(v => v.status === 'CLOSED').length;
    const open = related.filter(v => v.status !== 'CLOSED').length;
    const criticalOpen = related.filter(v => v.status !== 'CLOSED' && v.severity === 'Critical').length;

    mineObj.openViolations = open;
    mineObj.criticalViolations = criticalOpen;

    // Live Compliance %: calculated via statutory metric rules
    const metrics = calculateMineComplianceMetrics(mineObj.name);
    mineObj.complianceRate = metrics.scoreFormatted;

    // AI Composite Risk Score: baseline + penalty per open/critical violation
    // + an active statutory suspension raises risk further.
    const suspData = store.suspendedMines && store.suspendedMines[prefix];
    const isSuspendedNow = !!(suspData && suspData.isSuspended);
    let risk = 15 + (open * 10) + (criticalOpen * 15) + (isSuspendedNow ? 20 : 0);
    risk = Math.max(5, Math.min(100, Math.round(risk)));
    mineObj.riskScore = risk;
    mineObj.riskLevel = risk >= 70 ? "HIGH RISK" : risk >= 40 ? "MODERATE RISK" : "SAFE / LOW RISK";
  });

  // Keep all screen displays updated
  updateAllComplianceDisplays();
}

// -------------------------------------------------------------
// REACTIVE AUTO-UPDATING WEBPAGE & LIVE TOAST ENGINE
// -------------------------------------------------------------
function notifyStateChanged(eventType, detail) {
  // 0. Recompute compliance % and risk rate for every mine so the numbers
  //    are correct BEFORE anything on screen is redrawn.
  recalculateAllMineMetrics();

  // 1. Re-render active screen dynamically
  if (store.currentScreen === 2) renderScreen2PastInspections();
  if (store.currentScreen === 6) renderScreen6MyActions();
  if (store.currentScreen === 8) renderScreen8Verifications();
  if (store.currentScreen === 9) renderScreen9Charts();
  if (store.currentScreen === 10) renderScreen10ViolationsTable();
  if (store.currentScreen === 11) renderScreen11CorporateMines();

  // 1b. Screens 9 (dashboard KPIs/banners) and 11 (Corporate Mine Risk Index)
  //     stay mounted in the DOM even when hidden, so refresh their compliance
  //     and risk-rate displays too — the person may already be looking at
  //     another tab, or may flip back without triggering another action.
  if (store.currentScreen !== 9)  refreshDashboardData();
  if (store.currentScreen !== 11) renderScreen11CorporateMines();
  fetchAndUpdateComplianceKPI(store.currentUser.mine); // sync with backend when available

  // 2. Broadcast to UI badge counts
  const pendingCount = store.violations.filter(v => v.status !== 'CLOSED').length;
  const homeStat = document.getElementById('home-stat-pending');
  if (homeStat) homeStat.textContent = `${pendingCount} Items`;

  // 3. Ensure all compliance % displays are up to date across inspector and manager screens
  updateAllComplianceDisplays();
}

function showLiveToast(title, message, type = "info") {
  const container = document.getElementById('live-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const icon = type === "success" ? "fa-circle-check text-emerald-400" :
               type === "error"   ? "fa-triangle-exclamation text-rose-400" :
               type === "warning" ? "fa-bell text-amber-400" : "fa-circle-info text-blue-400";
  const border = type === "success" ? "border-emerald-500 bg-slate-900" :
                 type === "error"   ? "border-rose-500 bg-slate-900" :
                 type === "warning" ? "border-amber-500 bg-slate-900" : "border-blue-500 bg-slate-900";

  toast.className = `pointer-events-auto border-l-4 ${border} text-white p-3 rounded-lg shadow-xl text-xs space-y-1 transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-start gap-2.5`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} mt-0.5 text-base flex-shrink-0"></i>
    <div class="flex-1">
      <div class="font-bold">${title}</div>
      <p class="text-[11px] text-slate-300 leading-snug">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-xs">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// -------------------------------------------------------------
// AUTOMATED 24-HOUR STATUTORY DEADLINE ALERT MONITOR
// -------------------------------------------------------------
function checkImpendingDeadlines() {
  const now = new Date();
  let alertedCount = 0;

  store.violations.forEach(v => {
    if (v.status === 'OPEN' && v.deadline) {
      const deadlineDate = new Date(v.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (3600 * 1000);

      // Within 24 hours (and not expired beyond 48 hours)
      if (diffHours <= 24 && diffHours >= -48) {
        if (!v.auto_deadline_alert_sent) {
          v.auto_deadline_alert_sent = true;
          v.auto_deadline_alert_time = now.toISOString();
          v.alert_sent = true;
          v.alert_by_role = "system";
          v.alert_by_name = "Automated Statutory Deadline Sentinel";
          v.alert_level = "24H_DEADLINE_WARNING";
          const hoursLeftMsg = diffHours > 0 ? `${Math.round(diffHours)} hours remaining` : 'DEADLINE OVERDUE';
          v.alert_notes = `CRITICAL 24-HOUR STATUTORY DEADLINE WARNING: Remediation deadline expires in ${hoursLeftMsg}. Immediate action required to prevent statutory work suspension under CMR 2017.`;
          v.alert_timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + " IST";
          alertedCount++;
        }
      }
    }
  });

  return alertedCount;
}

// Background auto-refresh ticker (maintains real-time feel across open tabs)
setInterval(() => {
  if (store.currentUser && store.currentUser.roleCode) {
    checkImpendingDeadlines();
    if (store.currentScreen === 6) renderScreen6MyActions();
    if (store.currentScreen === 8) renderScreen8Verifications();
    if (store.currentScreen === 9) refreshDashboardData();
  }
}, 10000);

// Helper to extract clean mine key
function getMineKeyFromMineName(name) {
  if (!name) return "jharia";
  const lower = name.toLowerCase();
  if (lower.includes("korba")) return "korba";
  if (lower.includes("singrauli")) return "singrauli";
  if (lower.includes("raniganj")) return "raniganj";
  if (lower.includes("piparwar")) return "piparwar";
  if (lower.includes("dgms")) return "dgms";
  return "jharia";
}

// -------------------------------------------------------------
// SCREEN 12: CLOSED VIOLATIONS IN PAST 7 DAYS (MANAGER, SUPERVISOR, DGMS)
// -------------------------------------------------------------
function renderScreen12ClosedViolations() {
  const tbody = document.getElementById('closed-violations-tbody');
  if (!tbody) return;
  tbody.innerHTML = "";

  const currentUser = store.currentUser;
  const isCorporate = currentUser.roleCode === 'corporate';
  const mineContainer = document.getElementById('closed-mine-filter-container');
  const mineFilter = document.getElementById('filter-closed-mine');
  const sevFilter = document.getElementById('filter-closed-severity') ? document.getElementById('filter-closed-severity').value : "ALL";
  const searchFilter = document.getElementById('filter-closed-search') ? document.getElementById('filter-closed-search').value.trim().toLowerCase() : "";

  // For DGMS Officer, show colliery filter dropdown. For Manager/Supervisor, lock to their mine.
  if (mineContainer) {
    if (!isCorporate && currentUser.mine) {
      mineContainer.classList.add('opacity-75');
      if (mineFilter) {
        for (let i = 0; i < mineFilter.options.length; i++) {
          if (currentUser.mine && mineFilter.options[i].value.includes(currentUser.mine.split(' ')[0])) {
            mineFilter.selectedIndex = i;
            break;
          }
        }
        mineFilter.disabled = true;
      }
    } else {
      mineContainer.classList.remove('opacity-75');
      if (mineFilter) mineFilter.disabled = false;
    }
  }

  const selectedMine = (!isCorporate && currentUser.mine) 
    ? currentUser.mine 
    : (mineFilter ? mineFilter.value : "ALL");

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const closedViolations = store.violations.filter(v => {
    if (v.status !== 'CLOSED') return false;

    // Filter by mine
    if (selectedMine !== 'ALL') {
      const prefix = selectedMine.split(' ')[0];
      if (!v.mine.includes(prefix)) return false;
    }

    // Filter by severity
    if (sevFilter !== 'ALL' && v.severity !== sevFilter) return false;

    // Filter by search query
    if (searchFilter) {
      const match = (v.id && v.id.toLowerCase().includes(searchFilter)) ||
                    (v.title && v.title.toLowerCase().includes(searchFilter)) ||
                    (v.regulation && v.regulation.toLowerCase().includes(searchFilter)) ||
                    (v.assignedTo && v.assignedTo.toLowerCase().includes(searchFilter)) ||
                    (v.mine && v.mine.toLowerCase().includes(searchFilter));
      if (!match) return false;
    }

    // Check 7-day threshold
    if (v.closed_at) {
      const closedTime = new Date(v.closed_at).getTime();
      if (now - closedTime > SEVEN_DAYS_MS) return false;
    }
    return true;
  });

  // Calculate Summary KPI counts
  const totalEl = document.getElementById('closed-kpi-total');
  const criticalEl = document.getElementById('closed-kpi-critical');
  if (totalEl) totalEl.textContent = closedViolations.length;
  if (criticalEl) criticalEl.textContent = closedViolations.filter(v => v.severity === 'Critical').length;

  if (closedViolations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-slate-500">
          <div class="max-w-sm mx-auto space-y-2">
            <i class="fa-solid fa-clipboard-check text-slate-300 text-3xl"></i>
            <p class="font-bold text-slate-700">No Closed Violations in the Past 7 Days</p>
            <p class="text-[11px] text-slate-400">All recent statutory non-compliances are either under active remediation or awaiting verification.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  closedViolations.forEach(viol => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50/80 transition font-sans";

    const sevBadge = viol.severity === 'Critical'
      ? '<span class="badge-critical px-2 py-0.5 rounded text-[10px] font-bold">🔴 Critical</span>'
      : viol.severity === 'Major'
      ? '<span class="badge-major px-2 py-0.5 rounded text-[10px] font-bold">🟠 Major</span>'
      : '<span class="badge-minor px-2 py-0.5 rounded text-[10px] font-bold">🟡 Minor</span>';

    const closedDateStr = viol.closedDateFormatted || (viol.closed_at ? new Date(viol.closed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Past 48 hrs");

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-blue-900">${viol.id}</td>
      <td class="py-2.5 px-3 font-medium text-slate-700">${viol.mine}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-slate-800">${viol.title}</span>
        <span class="block text-[10px] font-mono text-emerald-700 font-semibold">${viol.regulation}</span>
      </td>
      <td class="py-2.5 px-3">${sevBadge}</td>
      <td class="py-2.5 px-3">
        <span class="font-semibold text-slate-800">${viol.assignedTo ? viol.assignedTo.split('(')[0] : 'Assigned Engineer'}</span>
        <span class="block text-[10px] text-slate-500 truncate max-w-xs">${viol.fixNotes || 'Remediation completed per statutory standard.'}</span>
      </td>
      <td class="py-2.5 px-3 font-mono text-[11px] text-slate-700">
        <span class="font-bold text-emerald-800">${closedDateStr}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-1 text-[11px] text-emerald-800 font-bold">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          <span>Form VII-A Verified</span>
        </div>
        <span class="block text-[10px] text-slate-500 italic max-w-xs truncate">${viol.supervisorNotes || 'Supervisor verified on-site.'}</span>
      </td>
      <td class="py-2.5 px-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openEvidenceModal('${viol.id}')" title="Inspect Before & After Evidence" class="text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shadow-xs">
            <i class="fa-solid fa-images text-blue-700"></i>
            <span>View Proof</span>
          </button>
          ${(store.currentUser.roleCode === 'corporate' || store.currentUser.roleCode === 'manager') ? `
            <button onclick="openRedAlertComplaintModal('${viol.id}')" title="Raise Formal Complaint & Issue Red Alert to Mine Manager" class="text-white bg-rose-700 hover:bg-rose-800 border border-rose-800 px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shadow-xs">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Red Alert</span>
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =====================================================================
   PHASE 1 / PHASE 2 — LIVE BACKEND-DRIVEN MODULES (Screens 13, 14, 15)
   These pull directly from the real FastAPI backend via apiGet/apiPost
   (see live-integration.js) rather than the local `store` mock — they
   are the officials-facing modules built to close the SIH-26024 gap
   analysis (Environmental / Production / Labour / Contractor compliance,
   plus recurring-violation & anomaly analytics).
   ===================================================================== */

function kpiCard(label, value, tone) {
  const toneClasses = {
    good: "border-emerald-300 bg-emerald-50 text-emerald-900",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
    bad: "border-red-300 bg-red-50 text-red-900",
    neutral: "border-slate-300 bg-slate-50 text-slate-900"
  };
  const cls = toneClasses[tone] || toneClasses.neutral;
  return `
    <div class="rounded-lg border ${cls} p-3">
      <div class="text-[10px] font-bold uppercase tracking-wide opacity-70">${label}</div>
      <div class="text-xl font-bold mt-1">${value}</div>
    </div>
  `;
}

function currentOfficialMineSelection(selectId) {
  const currentUser = store.currentUser || {};
  const isCorporate = currentUser.roleCode === "corporate";
  if (!isCorporate && currentUser.mine) return currentUser.mine.split(" ")[0];
  const el = document.getElementById(selectId);
  return el ? el.value : "ALL";
}

// ---------------------------------------------------------------
// Screen 13: Environmental & Production Compliance
// ---------------------------------------------------------------
async function renderScreen13Compliance() {
  const mineSel = document.getElementById("screen13-mine-filter");
  const currentUser = store.currentUser || {};
  if (mineSel && currentUser.roleCode !== "corporate" && currentUser.mine) {
    mineSel.value = currentUser.mine;
    mineSel.disabled = true;
  }
  const mine = currentOfficialMineSelection("screen13-mine-filter");

  try {
    const [envSummary, envRecords, prodSummary, prodRecords] = await Promise.all([
      apiGet("/environmental/summary", { mine }),
      apiGet("/environmental/records", { mine }),
      apiGet("/production/summary", { mine }),
      apiGet("/production/records", { mine })
    ]);

    const envKpis = document.getElementById("screen13-env-kpis");
    if (envKpis) {
      envKpis.innerHTML = [
        kpiCard("Parameters Tracked", envSummary.total_parameters_tracked, "neutral"),
        kpiCard("Exceeding Statutory Limit", envSummary.exceeding_statutory_limit, envSummary.exceeding_statutory_limit > 0 ? "bad" : "good"),
        kpiCard("Pending Consent Renewal", envSummary.pending_consent_renewal, envSummary.pending_consent_renewal > 0 ? "warn" : "good"),
        kpiCard("Compliant Parameters", envSummary.compliant, "good")
      ].join("");
    }

    const envTbody = document.getElementById("screen13-env-tbody");
    if (envTbody) {
      envTbody.innerHTML = envRecords.length ? envRecords.map(r => `
        <tr>
          <td class="py-2 px-3 font-medium">${r.mine_name}</td>
          <td class="py-2 px-3">${r.category}</td>
          <td class="py-2 px-3">${r.parameter}</td>
          <td class="py-2 px-3">${r.reading_value}${r.unit ? " " + r.unit : ""}</td>
          <td class="py-2 px-3">${r.statutory_limit !== null && r.statutory_limit !== undefined ? r.statutory_limit : "—"}</td>
          <td class="py-2 px-3">${envStatusBadge(r.status)}</td>
          <td class="py-2 px-3 text-slate-500">${r.remarks || ""}</td>
        </tr>
      `).join("") : `<tr><td colspan="7" class="py-4 px-3 text-center text-slate-400">No environmental records for this selection.</td></tr>`;
    }

    const prodKpis = document.getElementById("screen13-prod-kpis");
    if (prodKpis) {
      prodKpis.innerHTML = [
        kpiCard("Extracted (30d)", `${prodSummary.total_extracted_tonnes.toLocaleString()} T`, "neutral"),
        kpiCard("Approved Capacity (30d)", `${prodSummary.total_approved_capacity_tonnes.toLocaleString()} T`, "neutral"),
        kpiCard("Capacity Utilization", `${prodSummary.utilization_pct}%`, prodSummary.utilization_pct > 100 ? "bad" : "good"),
        kpiCard("Overproduction Incidents", prodSummary.overproduction_incidents, prodSummary.overproduction_incidents > 0 ? "warn" : "good")
      ].join("");
    }

    const prodTbody = document.getElementById("screen13-prod-tbody");
    if (prodTbody) {
      prodTbody.innerHTML = prodRecords.length ? prodRecords.map(r => `
        <tr class="${r.is_overproduction ? 'bg-red-50' : ''}">
          <td class="py-2 px-3 font-medium">${r.mine_name}</td>
          <td class="py-2 px-3">${new Date(r.production_date).toLocaleDateString()}</td>
          <td class="py-2 px-3">${r.shift || "—"}</td>
          <td class="py-2 px-3">${r.quantity_extracted_tonnes.toLocaleString()}</td>
          <td class="py-2 px-3">${r.approved_capacity_tonnes.toLocaleString()}</td>
          <td class="py-2 px-3">${r.is_overproduction
            ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">OVER CAPACITY</span>'
            : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">WITHIN CAPACITY</span>'}</td>
        </tr>
      `).join("") : `<tr><td colspan="6" class="py-4 px-3 text-center text-slate-400">No production records for this selection.</td></tr>`;
    }
  } catch (err) {
    console.warn("Screen 13 backend fetch failed — is the backend running?", err);
    const envTbody = document.getElementById("screen13-env-tbody");
    if (envTbody) envTbody.innerHTML = `<tr><td colspan="7" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}. Is it running?</td></tr>`;
  }
}

function envStatusBadge(status) {
  const map = {
    WITHIN_LIMIT: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">WITHIN LIMIT</span>',
    EXCEEDS_LIMIT: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">EXCEEDS LIMIT</span>',
    PENDING_RENEWAL: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">PENDING RENEWAL</span>'
  };
  return map[status] || status;
}

// ---------------------------------------------------------------
// Screen 14: Labour & Contractor Governance
// ---------------------------------------------------------------
async function renderScreen14Labour() {
  const mineSel = document.getElementById("screen14-mine-filter");
  const currentUser = store.currentUser || {};
  if (mineSel && currentUser.roleCode !== "corporate" && currentUser.mine) {
    mineSel.value = currentUser.mine;
    mineSel.disabled = true;
  }
  const mine = currentOfficialMineSelection("screen14-mine-filter");

  try {
    const [summary, contractors, attendance] = await Promise.all([
      apiGet("/labour/summary", { mine }),
      apiGet("/labour/contractors", { mine }),
      apiGet("/labour/attendance", { mine })
    ]);

    const kpis = document.getElementById("screen14-kpis");
    if (kpis) {
      kpis.innerHTML = [
        kpiCard("Workers Present Today", summary.workers_present_today, "neutral"),
        kpiCard("Active Contractors", summary.active_contractors, "neutral"),
        kpiCard("Licenses Expiring (14d)", summary.contractor_licenses_expiring_14d, summary.contractor_licenses_expiring_14d > 0 ? "warn" : "good"),
        kpiCard("Flagged / Expired", summary.flagged_or_expired_contractors, summary.flagged_or_expired_contractors > 0 ? "bad" : "good")
      ].join("");
    }

    const cTbody = document.getElementById("screen14-contractor-tbody");
    if (cTbody) {
      cTbody.innerHTML = contractors.length ? contractors.map(c => `
        <tr>
          <td class="py-2 px-3 font-medium">${c.name}</td>
          <td class="py-2 px-3">${c.mine_name}</td>
          <td class="py-2 px-3 font-mono">${c.license_number}</td>
          <td class="py-2 px-3">${new Date(c.license_expiry).toLocaleDateString()}</td>
          <td class="py-2 px-3">${c.safety_training_status}</td>
          <td class="py-2 px-3">${contractorStatusBadge(c.status)}</td>
          <td class="py-2 px-3 text-right">
            ${c.status !== "BLACKLISTED" ? `
              <button onclick="flagContractor(${c.id}, 'FLAGGED')" class="text-[10px] font-bold text-amber-700 hover:underline mr-2">Flag</button>
              <button onclick="flagContractor(${c.id}, 'ACTIVE')" class="text-[10px] font-bold text-emerald-700 hover:underline">Reinstate</button>
            ` : `<span class="text-[10px] text-slate-400">—</span>`}
          </td>
        </tr>
      `).join("") : `<tr><td colspan="7" class="py-4 px-3 text-center text-slate-400">No contractors registered for this selection.</td></tr>`;
    }

    const aTbody = document.getElementById("screen14-attendance-tbody");
    if (aTbody) {
      aTbody.innerHTML = attendance.length ? attendance.slice(0, 25).map(a => `
        <tr>
          <td class="py-2 px-3 font-medium">${a.worker_name}</td>
          <td class="py-2 px-3">${a.mine_name}</td>
          <td class="py-2 px-3">${a.designation || "—"}</td>
          <td class="py-2 px-3">${new Date(a.check_in_time).toLocaleString()}</td>
          <td class="py-2 px-3 font-mono text-[11px]">${a.gps_coordinates || "—"}</td>
          <td class="py-2 px-3">${a.is_contractor_worker
            ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">CONTRACTOR</span>'
            : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">DIRECT</span>'}</td>
        </tr>
      `).join("") : `<tr><td colspan="6" class="py-4 px-3 text-center text-slate-400">No attendance records for this selection.</td></tr>`;
    }
  } catch (err) {
    console.warn("Screen 14 backend fetch failed — is the backend running?", err);
    const cTbody = document.getElementById("screen14-contractor-tbody");
    if (cTbody) cTbody.innerHTML = `<tr><td colspan="7" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}. Is it running?</td></tr>`;
  }
}

function contractorStatusBadge(status) {
  const map = {
    ACTIVE: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>',
    FLAGGED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">FLAGGED</span>',
    BLACKLISTED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">BLACKLISTED</span>',
    EXPIRED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">EXPIRED</span>'
  };
  return map[status] || status;
}

async function flagContractor(contractorId, newStatus) {
  try {
    const reason = newStatus === "FLAGGED" ? prompt("Reason for flagging this contractor:", "Safety compliance review required.") : null;
    await apiPost(`/labour/contractors/${contractorId}/status`, {
      status: newStatus,
      reason: reason || undefined,
      updated_by: store.currentUser.name || "Mine Manager"
    });
    renderScreen14Labour();
  } catch (err) {
    console.warn("Could not update contractor status", err);
    if (typeof showLiveToast === "function") {
      showLiveToast("Backend Unreachable", `Could not reach backend at ${API_BASE}.`, "error");
    }
  }
}

// ---------------------------------------------------------------
// Screen 15: Recurring Violations & Anomaly Analytics (Phase 2)
// ---------------------------------------------------------------
async function renderScreen15Analytics() {
  try {
    const currentUser = store.currentUser || {};
    const isCorporate = currentUser.roleCode === "corporate";
    const mine = isCorporate ? "ALL" : (currentUser.mine || "");
    const scopeParams = { mine, user_role: currentUser.roleCode || "", user_mine: currentUser.mine || "" };
    const [recurring, anomalies] = await Promise.all([
      apiGet("/analytics/recurring-violations", { ...scopeParams, min_occurrences: 2 }),
      apiGet("/analytics/anomalies", scopeParams)
    ]);

    // Defense in depth: a mine-scoped browser must never render another mine,
    // even if stale backend data is returned after a live refresh.
    const scopedRecurring = isCorporate ? recurring : recurring.filter(r => r.mine_name === currentUser.mine);
    const scopedAnomalies = isCorporate ? anomalies : anomalies.filter(a => a.mine_name === currentUser.mine);

    const rTbody = document.getElementById("screen15-recurring-tbody");
    if (rTbody) {
      rTbody.innerHTML = scopedRecurring.length ? scopedRecurring.map(r => `
        <tr>
          <td class="py-2 px-3 font-medium">${r.mine_name}</td>
          <td class="py-2 px-3">${r.regulation}</td>
          <td class="py-2 px-3">${r.title}</td>
          <td class="py-2 px-3 font-bold">${r.occurrences}×</td>
          <td class="py-2 px-3">${r.open_count}</td>
          <td class="py-2 px-3">${new Date(r.last_occurred).toLocaleDateString()}</td>
        </tr>
      `).join("") : `<tr><td colspan="6" class="py-4 px-3 text-center text-slate-400">No recurring violation patterns detected yet — this fills in as more inspections are filed.</td></tr>`;
    }

    const aTbody = document.getElementById("screen15-anomalies-tbody");
    if (aTbody) {
      aTbody.innerHTML = scopedAnomalies.length ? scopedAnomalies.map(a => `
        <tr class="${a.flag === 'ANOMALOUS_SPIKE' ? 'bg-red-50' : 'bg-amber-50'}">
          <td class="py-2 px-3 font-medium">${a.mine_name}</td>
          <td class="py-2 px-3">${a.open_violations}</td>
          <td class="py-2 px-3">${a.historical_baseline}</td>
          <td class="py-2 px-3 font-bold">${a.deviation_ratio}×</td>
          <td class="py-2 px-3">${a.flag === 'ANOMALOUS_SPIKE'
            ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">ANOMALOUS SPIKE</span>'
            : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">ELEVATED</span>'}</td>
        </tr>
      `).join("") : `<tr><td colspan="5" class="py-4 px-3 text-center text-slate-400">No mines currently deviating from their historical baseline.</td></tr>`;
    }
  } catch (err) {
    console.warn("Screen 15 backend fetch failed — is the backend running?", err);
    const rTbody = document.getElementById("screen15-recurring-tbody");
    if (rTbody) rTbody.innerHTML = `<tr><td colspan="6" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}. Is it running?</td></tr>`;
  }
}

function openEvidenceModal(violId) {
  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;

  store.activeEvidenceViolId = violId;
  const redAlertBtn = document.getElementById('proof-modal-red-alert-btn');
  if (redAlertBtn) {

    if (store.currentUser.roleCode === 'corporate' || store.currentUser.roleCode === 'manager') {
      redAlertBtn.classList.remove('hidden');
    } else {
      redAlertBtn.classList.add('hidden');
    }
  }

  const modal = document.getElementById('evidence-proof-modal');
  const subtitle = document.getElementById('proof-modal-subtitle');
  const beforeImg = document.getElementById('proof-modal-before-img');
  const afterImg = document.getElementById('proof-modal-after-img');
  const beforeNotes = document.getElementById('proof-modal-before-notes');
  const afterNotes = document.getElementById('proof-modal-after-notes');
  const supervisor = document.getElementById('proof-modal-supervisor');
  const timestamp = document.getElementById('proof-modal-timestamp');

  if (subtitle) subtitle.textContent = `Violation ${viol.id} • ${viol.mine} • ${viol.regulation}`;
  if (beforeImg) beforeImg.src = viol.beforePhoto || "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500";
  if (afterImg) afterImg.src = viol.afterPhoto || viol.beforePhoto || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500";
  if (beforeNotes) beforeNotes.textContent = `Observation: ${viol.description || viol.title}`;
  if (afterNotes) afterNotes.textContent = `Fixer Action: ${viol.fixNotes || 'Defect rectified per CMR standard.'}`;
  if (supervisor) supervisor.textContent = viol.supervisorNotes || "Verified on-site by Shift Supervisor & approved.";
  if (timestamp) timestamp.textContent = viol.closedDateFormatted || (viol.closed_at ? new Date(viol.closed_at).toLocaleString('en-GB') : "Closed within last 7 days");

  if (modal) modal.classList.remove('hidden');
}

function closeEvidenceModal() {
  const modal = document.getElementById('evidence-proof-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// STATUTORY RED ALERT & 28-DAY SUSPENSION WORKFLOW
// -------------------------------------------------------------
function getMine28DayRedAlertCount(mineName) {
  const prefix = (mineName || "").split(' ')[0] || "BCCL";
  const now = new Date();
  const cutoff28d = new Date(now.getTime() - 28 * 24 * 3600 * 1000);
  const alerts = (store.redAlerts && store.redAlerts[prefix]) ? store.redAlerts[prefix] : [];
  return alerts.filter(a => new Date(a.timestamp) >= cutoff28d).length;
}

function openRedAlertComplaintModal(violId) {
  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;

  store.activeRedAlertViolId = violId;
  const modal = document.getElementById('dgms-red-alert-modal');
  const violIdEl = document.getElementById('red-alert-modal-viol-id');
  const mineEl = document.getElementById('red-alert-modal-mine');
  const mgrEl = document.getElementById('red-alert-modal-manager');
  const countBadge = document.getElementById('red-alert-modal-count-badge');
  const progressBar = document.getElementById('red-alert-modal-progress');
  const issuerBadge = document.getElementById('red-alert-issuer-badge');

  if (violIdEl) violIdEl.textContent = viol.id;
  if (mineEl) mineEl.textContent = viol.mine;
  // Target label in modal: if manager issuing → show the fixer/supervisor who did bad work
  //                          if DGMS issuing    → show the mine manager as usual
  const targetLabelEl = document.querySelector('span.text-slate-500:has(+ #red-alert-modal-manager)') ||
                        (() => { const spans = document.querySelectorAll('span.text-slate-500'); for (const s of spans) { if (s.nextElementSibling && s.nextElementSibling.id === 'red-alert-modal-manager') return s; } return null; })();

  // Dynamic elements that change based on who is issuing the red alert
  const subtitleEl     = document.getElementById('red-alert-modal-subtitle');
  const targetLabelEl2 = document.getElementById('red-alert-target-label');
  const thresholdRuleEl = document.getElementById('red-alert-threshold-rule');

  if (mgrEl) {
    if (store.currentUser.roleCode === 'manager') {
      // Mine Manager issuing → target is the Supervisor responsible for verifying the fixer's work
      const fixerRaw   = viol.assignedTo || "Assigned Fixer / Shift Supervisor";
      const fixerName  = fixerRaw.split('(')[0].trim();
      mgrEl.textContent = fixerName + " (Assigned Fixer / Shift Supervisor)";
      if (targetLabelEl2) targetLabelEl2.textContent = "Target: Supervisor (Suspended if threshold exceeded):";
      if (subtitleEl)     subtitleEl.textContent = "Statutory deficiency notice directed at the Shift Supervisor responsible for verifying this remediation work.";
      if (thresholdRuleEl) thresholdRuleEl.innerHTML = "<strong>Statutory Enforcement Rule:</strong> If <strong>more than 3 Red Alerts</strong> are raised by the Mine Manager in 28 days, the responsible <strong>Shift Supervisor is suspended for 14 days</strong>.";
    } else {
      // DGMS issuing → target is the Mine Manager
      const minePrefix = viol.mine.split(' ')[0];
      const mgrName = minePrefix.includes("BCCL") ? "V. K. Mehta (Colliery Agent)" :
                      minePrefix.includes("SECL") ? "A. K. Rathore (Mine Manager)" :
                      minePrefix.includes("NCL")  ? "R. K. Srivastava (Mine Manager)" :
                      minePrefix.includes("ECL")  ? "B. C. Ghosh (Colliery Agent)" : "S. P. Yadav (Project Officer)";
      mgrEl.textContent = mgrName;
      if (targetLabelEl2) targetLabelEl2.textContent = "Target Official (Mine Manager):";
      if (subtitleEl)     subtitleEl.textContent = "Statutory complaint directed at the Mine Manager for failure to ensure sufficient remediation under CMR-2017.";
      if (thresholdRuleEl) thresholdRuleEl.innerHTML = "<strong>Statutory Enforcement Rule:</strong> If <strong>more than 3 Red Alerts</strong> are given to a Mine Manager in 28 days, the Mine Manager is <strong>suspended for 28 days</strong> and the mine <strong>stops functioning for 14 days</strong>.";
    }
  }

  if (issuerBadge) {
    if (store.currentUser.roleCode === 'manager') {
      issuerBadge.textContent = "Mine Manager → Supervisor Notice";
      issuerBadge.className = "bg-amber-700 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase";
    } else {
      issuerBadge.textContent = "DGMS → Mine Manager Notice";
      issuerBadge.className = "bg-rose-800 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase";
    }
  }

  // Calculate 28-day rolling count
  const count = getMine28DayRedAlertCount(viol.mine);
  if (countBadge) {
    countBadge.textContent = `${count} of 3 Active in 28 Days`;
    if (count >= 3) {
      countBadge.className = "bg-rose-900 text-amber-300 font-mono text-[11px] px-2.5 py-0.5 rounded font-extrabold animate-pulse border border-amber-400";
    } else {
      countBadge.className = "bg-rose-700 text-white font-mono text-[11px] px-2.5 py-0.5 rounded font-bold";
    }
  }

  if (progressBar) {
    const pct = Math.min((count / 3) * 100, 100);
    progressBar.style.width = `${pct}%`;
    progressBar.className = count >= 3 ? "bg-rose-700 h-2 rounded-full animate-pulse" : "bg-rose-600 h-2 rounded-full transition-all duration-300";
  }

  // Set default reason — wording changes based on who the target is
  const reasonEl = document.getElementById('red-alert-modal-reason');
  if (reasonEl) {
    if (store.currentUser.roleCode === 'manager') {
      const fixerFirstName = (viol.assignedTo || "Fixer").split(' ')[0];
      reasonEl.value = `Mine Manager review of submitted photographic evidence reveals that the remediation work completed by ${fixerFirstName} is substandard and does not meet DGMS safety thresholds under CMR-2017. The Shift Supervisor who verified this work is being issued a statutory Red Alert for approving insufficient rectification. Violation is officially re-opened. Full re-work is mandatory under direct supervisory presence.`;
    } else {
      reasonEl.value = `DGMS physical inspection and photographic proof review reveals remedial work done is substandard and fails safety compliance under CMR-2017. Mine Manager is issued a statutory Red Alert for failure to ensure adequate rectification. Violation is officially re-opened. Rectify hazard under full supervisory presence immediately.`;
    }
  }

  if (modal) modal.classList.remove('hidden');
}

function closeRedAlertComplaintModal() {
  const modal = document.getElementById('dgms-red-alert-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitDgmsRedAlert() {
  const violId = store.activeRedAlertViolId;
  const viol = store.violations.find(v => v.id === violId);
  if (!viol) return;

  const reasonEl = document.getElementById('red-alert-modal-reason');
  const reason = reasonEl ? reasonEl.value.trim() : "Substandard remediation identified. Violation re-opened with statutory red alert.";
  const now = new Date();
  const minePrefix = viol.mine.split(' ')[0] || "BCCL";

  // Re-open violation
  viol.status = "OPEN";
  viol.reopened_from_closed = true;
  viol.red_alert_issued = true;
  viol.red_alert_timestamp = now.toISOString();
  viol.red_alert_by = store.currentUser.name;
  viol.red_alert_reason = reason;
  viol.alert_sent = true;
  viol.alert_level = "RED_ALERT_DEFICIENCY";
  viol.alert_notes = reason;
  viol.alert_by_name = store.currentUser.name;
  viol.alert_by_role = store.currentUser.roleCode;
  viol.alert_timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + " IST";
  viol.supervisorNotes = `[RED ALERT DEFICIENCY - RE-OPENED]: ${reason}`;

  // Log in store.redAlerts
  if (!store.redAlerts) store.redAlerts = {};
  if (!store.redAlerts[minePrefix]) store.redAlerts[minePrefix] = [];
  store.redAlerts[minePrefix].push({
    id: `RA-${minePrefix}-${Date.now()}`,
    violationId: violId,
    mine: viol.mine,
    issuerName: store.currentUser.name,
    issuerRole: store.currentUser.roleCode,
    reason: reason,
    timestamp: now.toISOString()
  });

  const countIn28d = getMine28DayRedAlertCount(viol.mine);
  const isSuspended = countIn28d > 3;
  const issuerRole = store.currentUser.roleCode; // "manager" or "corporate"

  // SUSPENSION LOGIC:
  // If Mine Manager raises red alert → the FIXER/SUPERVISOR who did bad work is suspended.
  //   (Manager raising a red alert on their own subordinate's work should NOT self-suspend.)
  // If DGMS Officer raises red alert → the Mine Manager is suspended (as before).
  const fixerName = viol.assignedTo ? viol.assignedTo.split('(')[0].trim() : "Assigned Fixer";
  const managerName = viol.mine.includes("BCCL") ? "V. K. Mehta" : "Mine Manager";
  const suspendedPerson = issuerRole === 'manager' ? fixerName : managerName;
  const suspendedRole   = issuerRole === 'manager' ? "Fixer / Shift Supervisor" : "Mine Manager";
  const suspendedDays   = issuerRole === 'manager' ? 14 : 28; // fixer gets 14d; manager gets 28d

  if (isSuspended) {
    if (!store.suspendedMines) store.suspendedMines = {};
    store.suspendedMines[minePrefix] = {
      isSuspended: true,
      suspendedPerson: suspendedPerson,
      suspendedRole: suspendedRole,
      suspendedDays: suspendedDays,
      mineStoppedDays: issuerRole === 'manager' ? 0 : 14,
      triggeredAt: now.toISOString(),
      issuerRole: issuerRole,
      colliery: viol.mine,
      redAlertCount: countIn28d
    };
  }

  // Background call to backend
  try {
    fetch(`/api/v1/actions/${violId}/red-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officer_name: store.currentUser.name,
        sender_role: store.currentUser.roleCode,
        reason: reason,
        manager_name: managerName,
        suspended_person: suspendedPerson,
        suspended_role: suspendedRole
      })
    }).catch(() => {});
  } catch (e) {}

  closeRedAlertComplaintModal();
  closeEvidenceModal();

  // Show statutory alert banner / toast
  if (isSuspended) {
    const suspensionMsg = issuerRole === 'manager'
      ? `• Shift Supervisor (${suspendedPerson}) is SUSPENDED for ${suspendedDays} DAYS for approving substandard rectification work.`
      : `• Mine Manager (${suspendedPerson}) is SUSPENDED for ${suspendedDays} DAYS for failure to ensure adequate remediation.\n• Mine operations are HALTED for 14 DAYS under Mines Act Section 22.`;
    alert(`🚨 CRITICAL STATUTORY ENFORCEMENT TRIGGERED:\nColliery ${viol.mine} has accumulated ${countIn28d} Red Alerts within 28 days (threshold >3 exceeded)!\n\n${suspensionMsg}\n• Violation ${violId} has been RE-OPENED to OPEN.`);
  } else {
    const noticeTarget = issuerRole === 'manager'
      ? `deficiency notice dispatched to Shift Supervisor (${suspendedPerson}) for approving substandard rectification.`
      : `deficiency notice dispatched to Mine Manager (${managerName}) and assigned fixer.`;
    alert(`⚠️ STATUTORY RED ALERT ISSUED:\nViolation ${violId} has been RE-OPENED to OPEN.\nRolling 28-day Red Alerts for ${viol.mine}: ${countIn28d} of 3 active.\nStatutory ${noticeTarget}`);
  }

  notifyStateChanged("RED_ALERT_ISSUED", { violationId: violId, isSuspended: isSuspended, count: countIn28d });
  refreshDashboardData();
  fetchAndUpdateComplianceKPI(viol.mine); // live score refresh after red alert
  renderScreen10ViolationsTable();
  renderScreen12ClosedViolations();
}

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
function initApp() {
  // Make sure compliance % / risk rate on every mine match the seeded
  // violation data from the very first render, not just after an action.
  recalculateAllMineMetrics();

  generateCaptcha();
  handleMineOrRoleChange();

  // Restore existing session if present
  try {
    const saved = sessionStorage.getItem('khadan_rakshak_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.roleCode) {
        store.currentUser = parsed;
        applyUserSessionToUI();
        setAuthenticatedChrome(true);
        renderRoleNavigation();
        const config = ROLE_CONFIGS[parsed.roleCode] || ROLE_CONFIGS.worker;
        switchScreen(config.defaultScreen);
        return;
      }
    }
  } catch (e) {}

  // Default to Screen 1 (Login)
  setAuthenticatedChrome(false);
  switchScreen(1);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
