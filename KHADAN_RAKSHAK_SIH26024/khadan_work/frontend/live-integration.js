/* =====================================================================
   KHADAN RAKSHAK — LIVE BACKEND INTEGRATION LAYER
   =====================================================================
   Loaded BEFORE app.js so the globals below (API_BASE, apiGet, apiPost)
   are already defined when app.js's existing fetchAndUpdateComplianceKPI()
   runs. That function already calls the real /analytics/compliance-score
   endpoint — it was only ever silently failing because API_BASE was never
   defined anywhere in the project.

   This file also opens a WebSocket to the backend's /ws/live channel.
   Every mutating API call anywhere in the backend (an inspection filed, an
   action assigned, a violation closed/verified, a red alert issued, a new
   Environmental/Production/Labour/Contractor record logged) broadcasts a
   small JSON event through that socket. Every open browser tab — Mine
   Manager, DGMS Officer, Supervisor, Fixer — receives it instantly, so the
   platform behaves like a real multi-user governance system: actions taken
   by one role show up live for everyone else without a manual refresh.

   To point this at a deployed backend instead of local dev, set
   window.KHADAN_API_BASE before this script loads, e.g.:
     <script>window.KHADAN_API_BASE = "https://your-backend.onrender.com/api/v1";</script>
   ===================================================================== */

// Resolve the backend from the page host so the same build works when opened
// through localhost, a LAN IP, or the bundled FastAPI frontend server.
// A manual window.KHADAN_API_BASE override still takes priority for deployment.
function resolveKhadanApiBase() {
  if (window.KHADAN_API_BASE) return window.KHADAN_API_BASE.replace(/\/$/, "");

  // When FastAPI serves the bundled frontend, use the exact origin (host +
  // port) that delivered the page. This also works if the launcher has to
  // move to a free port because 8000 is already occupied.
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return `${window.location.origin}/api/v1`;
  }

  // Backward-compatible fallback when index.html is opened directly from disk.
  return "http://127.0.0.1:8000/api/v1";
}

const API_BASE = resolveKhadanApiBase();
const KHADAN_WS_URL = API_BASE.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "") + "/ws/live";

async function apiGet(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API_BASE}${path}${qs}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------------------
   WebSocket live-update client, with auto-reconnect + keep-alive ping.
   --------------------------------------------------------------------- */
let khadanLiveSocket = null;
let khadanLiveReconnectDelay = 2000;

const LIVE_EVENT_LABELS = {
  inspection_submitted:                  { title: "New Inspection Filed",             type: "info" },
  actions_assigned:                      { title: "Corrective Actions Dispatched",    type: "info" },
  fixer_alert_issued:                    { title: "Escalation Alert Issued",          type: "warning" },
  red_alert_issued:                      { title: "Statutory Red Alert Issued",       type: "error" },
  stoppage_warning_issued:               { title: "DGMS Work-Stoppage Directive",     type: "error" },
  stoppage_acknowledged:                 { title: "Work-Stoppage Acknowledged",       type: "success" },
  violation_closed_pending_verification: { title: "Rectification Submitted",          type: "info" },
  violation_verified:                    { title: "Violation Verification Decision",  type: "success" },
  environmental_record_added:            { title: "Environmental Reading Logged",     type: "info" },
  production_record_added:               { title: "Production Return Logged",         type: "info" },
  attendance_checkin:                    { title: "Worker Checked In",                type: "info" },
  contractor_added:                      { title: "New Contractor Registered",        type: "info" },
  contractor_status_changed:             { title: "Contractor Status Updated",        type: "warning" }
};

function describeLiveEvent(msg) {
  const p = msg.payload || {};
  switch (msg.event) {
    case "inspection_submitted":
      return `${p.inspector_name || "An inspector"} filed a Form IV inspection at ${p.mine_name || "a colliery"} (${p.failed_count || 0} failure(s)).`;
    case "actions_assigned":
      return `Corrective action orders dispatched at ${p.mine_name || "a colliery"}.`;
    case "fixer_alert_issued":
      return `Escalation alert sent to ${p.alert_recipient || "assigned fixer"} at ${p.mine_name || ""}.`;
    case "red_alert_issued":
      return `Red Alert on ${p.violation_id || "a violation"} at ${p.mine_name || ""} (${p.red_alerts_in_28_days || 0} in 28 days).`;
    case "stoppage_warning_issued":
      return `DGMS Section 22 stoppage directive served to ${p.mine_name || "a colliery"}.`;
    case "stoppage_acknowledged":
      return `${p.acknowledged_by || "Mine Manager"} acknowledged the stoppage directive at ${p.mine_name || ""}.`;
    case "violation_closed_pending_verification":
      return `Rectification proof submitted for ${p.violation_id || "a violation"} — awaiting supervisor verification.`;
    case "violation_verified":
      return `${p.violation_id || "Violation"} ${p.decision === "APPROVE" ? "approved & closed" : "rejected & reopened"}.`;
    case "environmental_record_added":
      return `${p.parameter || "A reading"} logged at ${p.mine_name || ""} — ${p.status || ""}.`;
    case "production_record_added":
      return `Production return logged at ${p.mine_name || ""}${p.is_overproduction ? " (OVER APPROVED CAPACITY)" : ""}.`;
    case "attendance_checkin":
      return `${p.worker_name || "A worker"} checked in at ${p.mine_name || ""}.`;
    case "contractor_added":
      return `${p.name || "A contractor"} registered at ${p.mine_name || ""}.`;
    case "contractor_status_changed":
      return `${p.name || "Contractor"} status set to ${p.status || ""} by ${p.updated_by || "an official"}.`;
    default:
      return "Live update received from another session.";
  }
}

function connectLiveSocket() {
  try {
    khadanLiveSocket = new WebSocket(KHADAN_WS_URL);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  khadanLiveSocket.onopen = () => {
    khadanLiveReconnectDelay = 2000;
    khadanLiveSocket._pingInterval = setInterval(() => {
      if (khadanLiveSocket && khadanLiveSocket.readyState === WebSocket.OPEN) {
        khadanLiveSocket.send("ping");
      }
    }, 25000);
  };

  khadanLiveSocket.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch (e) { return; }
    handleLiveEvent(msg);
  };

  khadanLiveSocket.onclose = () => {
    if (khadanLiveSocket && khadanLiveSocket._pingInterval) clearInterval(khadanLiveSocket._pingInterval);
    scheduleReconnect();
  };

  khadanLiveSocket.onerror = () => {
    try { khadanLiveSocket.close(); } catch (e) { /* noop */ }
  };
}

function scheduleReconnect() {
  setTimeout(connectLiveSocket, khadanLiveReconnectDelay);
  khadanLiveReconnectDelay = Math.min(khadanLiveReconnectDelay * 1.5, 20000);
}

function handleLiveEvent(msg) {
  if (!msg || !msg.event) return;

  const label = LIVE_EVENT_LABELS[msg.event] || { title: "Live Update", type: "info" };
  const mineName = (msg.payload && msg.payload.mine_name) || "";

  // Mine-scoped roles (manager/supervisor/fixer/worker) only get toasted for
  // their own colliery; corporate/DGMS and not-logged-in views see everything.
  const hasStore = typeof store !== "undefined" && store.currentUser;
  const role = hasStore ? store.currentUser.roleCode : null;
  const myMine = hasStore ? store.currentUser.mine : null;
  const isMineScoped = ["manager", "supervisor", "fixer", "worker"].includes(role);

  if (isMineScoped && mineName && myMine && !mineName.includes(myMine.split(" ")[0])) {
    return; // event belongs to a different colliery — don't interrupt this session
  }

  if (typeof showLiveToast === "function") {
    showLiveToast(label.title, describeLiveEvent(msg), label.type);
  }

  if (hasStore && typeof fetchAndUpdateComplianceKPI === "function") {
    fetchAndUpdateComplianceKPI(store.currentUser.mine);
  }

  refreshPhase1ScreenIfActive(msg);
  document.dispatchEvent(new CustomEvent("khadan:live", { detail: msg }));
}

async function syncViolationsFromBackend() {
  if (!store?.currentUser?.roleCode) return;
  try {
    const role=store.currentUser.roleCode, mine=role==='corporate'?'ALL':store.currentUser.mine;
    const rows=await apiGet('/analytics/violations',{mine,user_role:role,user_mine:store.currentUser.mine,status:'ALL'});
    store.violations=rows.map(v => {
      const existing = (store.violations || []).find(x => x.id === v.id);
      const cachedPhoto = window._fixerAfterPhotos ? window._fixerAfterPhotos[v.id] : null;
      let sessionPhoto = null;
      try { sessionPhoto = sessionStorage.getItem('khadan_after_' + v.id); } catch (_) {}

      const preservedPhoto = (existing && existing.afterPhoto) || cachedPhoto || sessionPhoto || v.after_photo || '';
      const preservedFixNotes = (existing && existing.fixNotes) || v.fix_notes || '';
      const preservedStatus = (existing && existing.status === 'PENDING_VERIFICATION') ? 'PENDING_VERIFICATION' : v.status;

      return {
        id: v.id,
        mine: v.mine_name,
        category: v.category,
        regulation: v.regulation,
        title: v.title,
        description: v.description,
        severity: String(v.severity).toLowerCase()==='critical'?'Critical':String(v.severity).toLowerCase()==='major'?'Major':'Minor',
        status: preservedStatus,
        assignedTo: v.assigned_to||'',
        deadline: v.deadline,
        gps: v.gps_coordinates||'—',
        beforePhoto: v.before_photo||'',
        afterPhoto: preservedPhoto,
        fixNotes: preservedFixNotes,
        supervisor_notes: v.supervisor_notes||'',
        ...v,
        status: preservedStatus,
        afterPhoto: preservedPhoto,
        fixNotes: preservedFixNotes
      };
    });
    if(store.currentScreen===6 && typeof renderScreen6MyActions==='function') renderScreen6MyActions();
    if(store.currentScreen===7 && typeof renderScreen7==='function') {
      const remarksInput = document.getElementById('fix-remarks-input');
      const curRemarks = remarksInput ? remarksInput.value : '';
      renderScreen7();
      const updatedRemarks = document.getElementById('fix-remarks-input');
      if (updatedRemarks && curRemarks) updatedRemarks.value = curRemarks;
    }
    if(store.currentScreen===8 && typeof renderScreen8Verifications==='function') renderScreen8Verifications();
    if(store.currentScreen===10 && typeof renderScreen10ViolationsTable==='function') renderScreen10ViolationsTable();
    if(store.currentScreen===12 && typeof renderScreen12ClosedViolations==='function') renderScreen12ClosedViolations();
  } catch(e) { console.debug('Live violation sync skipped',e); }
}

function refreshPhase1ScreenIfActive(msg) {
  if (typeof store === "undefined") return;
  const s=store.currentScreen;
  const event=msg.event;
  if (s===2 && ['inspection_submitted'].includes(event) && typeof renderScreen2PastInspections==='function') renderScreen2PastInspections();
  if (s===6 && ['actions_assigned','fixer_alert_issued','violation_closed_pending_verification','red_alert_issued'].includes(event) && typeof renderScreen6MyActions==='function') renderScreen6MyActions();
  if (s===7 && ['violation_closed_pending_verification'].includes(event) && typeof renderScreen7==='function') renderScreen7();
  if (s===8 && ['violation_closed_pending_verification','violation_verified','red_alert_issued'].includes(event) && typeof renderScreen8Verifications==='function') renderScreen8Verifications();
  if (s===9 && typeof renderScreen9Charts==='function' && ['inspection_submitted','violation_closed_pending_verification','violation_verified','red_alert_issued','stoppage_warning_issued'].includes(event)) { renderScreen9Charts(); if(typeof updateAllComplianceDisplays==='function') updateAllComplianceDisplays(); }
  if (s===10 && ['inspection_submitted','violation_closed_pending_verification','violation_verified','red_alert_issued'].includes(event) && typeof renderScreen10ViolationsTable==='function') renderScreen10ViolationsTable();
  if (s===11 && ['inspection_submitted','violation_verified','red_alert_issued'].includes(event) && typeof renderScreen11CorporateMines==='function') renderScreen11CorporateMines();
  if (s===12 && ['violation_verified','red_alert_issued'].includes(event) && typeof renderScreen12ClosedViolations==='function') renderScreen12ClosedViolations();
  if (s===13 && ['environmental_record_added','production_record_added'].includes(event) && typeof renderScreen13Compliance==='function') renderScreen13Compliance();
  if (s===14 && ['attendance_checkin','contractor_added','contractor_status_changed'].includes(event) && typeof renderScreen14Labour==='function') renderScreen14Labour();
  if (s===15 && typeof renderScreen15Analytics==='function') renderScreen15Analytics();
  if (s===16 && typeof renderScreen16Grievances==='function') renderScreen16Grievances();
  if (s===17 && typeof renderScreen17GIS==='function') renderScreen17GIS();
  if (s===18 && typeof renderScreen18AuditLog==='function') renderScreen18AuditLog();
  if (s===19 && typeof renderScreen19Reminders==='function') renderScreen19Reminders();
  syncViolationsFromBackend();
}

// Boot the live socket as soon as this script loads.
connectLiveSocket();
