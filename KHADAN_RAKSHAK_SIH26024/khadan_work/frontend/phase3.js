/* =====================================================================
   KHADAN RAKSHAK — PHASE 3/4/5 EXTENSION LAYER
   =====================================================================
   Loads AFTER app.js and live-integration.js (both already define
   `store`, `API_BASE`, `apiGet`/`apiPost`, `kpiCard`, `showLiveToast`,
   `currentOfficialMineSelection`, `ROLE_CONFIGS`, `switchScreen`).

   This file adds, without modifying app.js's existing logic:
     - Screen 16: Grievance Handling
     - Screen 17: GIS Map View (offline DGMS paper map)
     - Screen 18: Statutory Reports, OCR Digitization & Audit Trail
     - Screen 19: Reminders & Escalation Engine
     - A floating Conversational Assistant (chatbot) widget
     - A working English/Hindi i18n toggle over data-i18n-tagged elements
   ===================================================================== */

/* ---------------------------------------------------------------------
   0. EXTEND ROLE CONFIGS WITH THE NEW TABS
   Runs once at load. Screens 16 (Grievances) and 19 (Reminders) are
   relevant to every desk-bound official role; 17 (GIS) and 18 (Reports)
   are official/oversight tools (manager, supervisor, corporate).
   Screen 16's submission form is shown to ALL roles (workers/fixers can
   file too, per the platform's App-primary-but-web-fallback strategy).
   --------------------------------------------------------------------- */
(function extendRoleConfigs() {
  // app.js owns the canonical RBAC matrix. Phase 3 only renders screens 16-19.
  // Do not mutate allowedScreens here; this prevents accidental privilege expansion.
})();;

/* ---------------------------------------------------------------------
   1. HOOK INTO switchScreen()'S SCREEN LIFECYCLE
   app.js's switchScreen() hides screens 1-15 by id and calls per-screen
   render hooks. We wrap it (rather than editing app.js) to: (a) also
   hide/show 16-19, and (b) fire their render functions.
   --------------------------------------------------------------------- */
(function wrapSwitchScreen() {
  if (typeof switchScreen !== "function") return;
  const originalSwitchScreen = switchScreen;

  window.switchScreen = function (screenNum) {
    originalSwitchScreen(screenNum);

    // The original loop only hides screens 1-15; make sure 16-19 respect
    // the active screen too (hide all, then reveal the active one).
    for (let i = 16; i <= 19; i++) {
      const s = document.getElementById(`screen-${i}`);
      if (s) s.classList.toggle("hidden", store.currentScreen !== i);
    }

    if (screenNum === 16) renderScreen16Grievances();
    if (screenNum === 17) renderScreen17GIS();
    if (screenNum === 18) { renderScreen18AuditLog(); }
    if (screenNum === 19) renderScreen19Reminders();

    applyTranslations();
  };
})();

/* =======================================================================
   SCREEN 16: GRIEVANCE HANDLING
   ======================================================================= */
function grievanceStatusBadge(status) {
  const map = {
    SUBMITTED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">SUBMITTED</span>',
    ROUTED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">ROUTED</span>',
    IN_PROGRESS: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">IN PROGRESS</span>',
    RESOLVED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">RESOLVED</span>',
    REJECTED: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">REJECTED</span>',
  };
  return map[status] || status;
}

async function renderScreen16Grievances() {
  const currentUser = store.currentUser || {};
  const mine = currentUser.roleCode === "corporate" ? "ALL" : currentUser.mine;
  const canManage = ["manager", "supervisor", "corporate"].includes(currentUser.roleCode);

  const submitCard = document.getElementById("screen16-submit-card");
  if (submitCard) submitCard.classList.toggle("hidden", false); // everyone can file

  try {
    const [rows, summary] = await Promise.all([
      apiGet("/grievances/", { mine, user_role: currentUser.roleCode, user_mine: currentUser.mine }),
      apiGet("/grievances/summary", { mine, user_role: currentUser.roleCode, user_mine: currentUser.mine }),
    ]);

    const kpis = document.getElementById("screen16-kpis");
    if (kpis) {
      kpis.innerHTML = [
        kpiCard("Total Filed", summary.total, "neutral"),
        kpiCard("Open / In Progress", summary.open, summary.open > 0 ? "warn" : "good"),
        kpiCard("Resolved", summary.resolved, "good"),
        kpiCard("Urgent & Open", summary.urgent_open, summary.urgent_open > 0 ? "bad" : "good"),
      ].join("");
    }

    const tbody = document.getElementById("screen16-tbody");
    if (tbody) {
      tbody.innerHTML = rows.length ? rows.map(g => `
        <tr>
          <td class="py-2 px-3 font-mono text-[10px]">${g.id}</td>
          <td class="py-2 px-3">${g.mine_name}</td>
          <td class="py-2 px-3">${g.is_anonymous === "YES" ? "Anonymous" : g.submitted_by}</td>
          <td class="py-2 px-3">${g.category}</td>
          <td class="py-2 px-3">${g.priority}</td>
          <td class="py-2 px-3">${grievanceStatusBadge(g.status)}</td>
          <td class="py-2 px-3 text-right">${canManage ? grievanceActionButtons(g) : "—"}</td>
        </tr>
      `).join("") : `<tr><td colspan="7" class="py-4 px-3 text-center text-slate-400">No grievances recorded for this selection.</td></tr>`;
    }
  } catch (err) {
    console.warn("Screen 16 fetch failed", err);
    const tbody = document.getElementById("screen16-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}.</td></tr>`;
  }
}

function grievanceActionButtons(g) {
  if (g.status === "SUBMITTED") {
    return `<button onclick="promptRouteGrievance('${g.id}')" class="text-[10px] bg-blue-800 hover:bg-blue-900 text-white px-2 py-1 rounded font-semibold">Route</button>`;
  }
  if (g.status === "ROUTED" || g.status === "IN_PROGRESS") {
    return `<button onclick="promptResolveGrievance('${g.id}')" class="text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded font-semibold">Resolve</button>`;
  }
  return `<span class="text-slate-400 text-[10px]">Closed</span>`;
}

async function promptRouteGrievance(id) {
  const assignee = prompt("Assign this grievance to (officer name):", "Mine Manager");
  if (!assignee) return;
  try {
    await apiPost(`/grievances/${id}/route`, { assigned_to: assignee, routed_by: store.currentUser.name });
    showLiveToast("Grievance Routed", `${id} routed to ${assignee}.`, "info");
    renderScreen16Grievances();
  } catch (err) {
    showLiveToast("Action Failed", "Could not route grievance — is the backend running?", "error");
  }
}

async function promptResolveGrievance(id) {
  const decision = confirm("Click OK to mark RESOLVED, or Cancel to REJECT.") ? "RESOLVED" : "REJECTED";
  const notes = prompt(`Resolution notes for ${decision}:`, "");
  if (notes === null) return;
  try {
    await apiPost(`/grievances/${id}/resolve`, { decision, resolution_notes: notes || "No additional notes.", resolved_by: store.currentUser.name });
    showLiveToast("Grievance Updated", `${id} marked ${decision}.`, decision === "RESOLVED" ? "success" : "warn");
    renderScreen16Grievances();
  } catch (err) {
    showLiveToast("Action Failed", "Could not update grievance — is the backend running?", "error");
  }
}

async function handleGrievanceSubmit(evt) {
  evt.preventDefault();
  const currentUser = store.currentUser || {};
  const payload = {
    mine_name: currentUser.mine || "BCCL - Jharia Colliery",
    submitted_by: currentUser.name || "Worker",
    submitted_by_designation: currentUser.role || null,
    category: document.getElementById("grievance-category").value,
    description: document.getElementById("grievance-description").value,
    is_anonymous: document.getElementById("grievance-anonymous").checked,
    priority: document.getElementById("grievance-priority").value,
  };
  try {
    const g = await apiPost("/grievances/", payload);
    showLiveToast("Grievance Filed", `Reference ${g.id} submitted and queued for routing.`, "success");
    document.getElementById("grievance-submit-form").reset();
    renderScreen16Grievances();
  } catch (err) {
    showLiveToast("Submission Failed", "Could not file grievance — is the backend running?", "error");
  }
}

/* =======================================================================
   SCREEN 17: GIS MAP VIEW — OFFLINE DGMS FIELD PAPER MAP
   =======================================================================
   Self-contained paper map: no OSM/Leaflet tile dependency. DGMS can switch
   between consolidated and individual mine views; mine managers are locked
   to their assigned mine by UI and backend.
*/
function riskTierColor(tier) { if (tier === "CRITICAL") return "#dc2626"; if (tier === "ELEVATED") return "#d97706"; return "#059669"; }
function escapeMapText(value) { return String(value ?? "").replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function projectPaperMapPoint(lat, lng, bounds) {
  const { minLat, maxLat, minLng, maxLng, width, height, pad } = bounds;
  const latRange = Math.max(maxLat - minLat, 0.00001), lngRange = Math.max(maxLng - minLng, 0.00001);
  return { x: pad + ((lng-minLng)/lngRange)*(width-2*pad), y: height-pad-((lat-minLat)/latRange)*(height-2*pad) };
}
function violationSeverityColor(severity, status) {
  if (String(status || "").toUpperCase().replace(/^VIOLATIONSTATUS\./, "") === "CLOSED") return "#64748b";
  const s=String(severity||"").toUpperCase().replace(/^VIOLATIONSEVERITY\./, "");
  return s==="CRITICAL" ? "#dc2626" : s==="MAJOR" ? "#f97316" : s==="MINOR" ? "#eab308" : "#2563eb";
}
function normalizeGISSeverity(value) {
  const s=String(value ?? "").trim().toUpperCase().replace(/^VIOLATIONSEVERITY\./, "");
  return s === "CRITICAL" ? "CRITICAL" : s === "MAJOR" ? "MAJOR" : s === "MINOR" ? "MINOR" : s;
}
function normalizeGISStatus(value) {
  return String(value ?? "").trim().toUpperCase().replace(/^VIOLATIONSTATUS\./, "").replace(/\s+/g, "_");
}
function violationSeverityLabel(severity) { const s=normalizeGISSeverity(severity); return s==="CRITICAL"?"Critical":s==="MAJOR"?"Major":s==="MINOR"?"Minor":severity||"Unknown"; }
function violationStatusLabel(status) { const s=normalizeGISStatus(status); return s==="PENDING_VERIFICATION"?"Pending Verification":s.replaceAll("_"," ")||"Unknown"; }
function deriveZoneLabel(v,index) {
  if (v.zone) return v.zone;
  const cats={"Strata Support":"Strata / Roof Zone","Strata Control & Roof Support":"Strata / Roof Zone","Ventilation & Gases":"Ventilation / Return-Air Zone","Mechanical & Dust":"Conveyor / Dust Zone","Electrical & Haulage":"Electrical / Haulage Zone"};
  return cats[v.category] || `Mapped Field Zone ${index+1}`;
}
function buildPaperMapSvg(mines, violations, selectedMine) {
  const width=1500,height=720,pad=90,singleMine=selectedMine&&selectedMine!=="ALL";
  const lats=mines.map(m=>Number(m.latitude)).concat(violations.map(v=>Number(v.latitude))).filter(Number.isFinite);
  const lngs=mines.map(m=>Number(m.longitude)).concat(violations.map(v=>Number(v.longitude))).filter(Number.isFinite);
  let minLat=lats.length?Math.min(...lats):21.5,maxLat=lats.length?Math.max(...lats):25,minLng=lngs.length?Math.min(...lngs):81,maxLng=lngs.length?Math.max(...lngs):88.5;
  const spanLat=Math.max(maxLat-minLat,0.00001),spanLng=Math.max(maxLng-minLng,0.00001);
  // A tighter single-mine extent gives field-level separation; consolidated view retains geographic scale.
  const latPad=singleMine?Math.max(spanLat*.42,.0025):Math.max(spanLat*.12,.55);
  const lngPad=singleMine?Math.max(spanLng*.42,.0025):Math.max(spanLng*.08,.65);
  minLat-=latPad;maxLat+=latPad;minLng-=lngPad;maxLng+=lngPad;
  const bounds={minLat,maxLat,minLng,maxLng,width,height,pad};
  const grid=[],latStep=(maxLat-minLat)/8,lngStep=(maxLng-minLng)/10;
  for(let i=0;i<=8;i++){const lat=minLat+i*latStep,y=projectPaperMapPoint(lat,minLng,bounds).y;grid.push(`<line x1="${pad}" y1="${y.toFixed(1)}" x2="${width-pad}" y2="${y.toFixed(1)}" class="map-grid"/><text x="14" y="${(y+4).toFixed(1)}" class="coord-label">${lat.toFixed(4)}°N</text>`);}
  for(let i=0;i<=10;i++){const lng=minLng+i*lngStep,x=projectPaperMapPoint(minLat,lng,bounds).x;grid.push(`<line x1="${x.toFixed(1)}" y1="${pad}" x2="${x.toFixed(1)}" y2="${height-pad}" class="map-grid"/><text x="${(x-22).toFixed(1)}" y="${height-26}" class="coord-label">${lng.toFixed(4)}°E</text>`);}
  const land=singleMine?`M 145 585 L 125 475 L 190 350 L 290 260 L 425 205 L 590 180 L 760 205 L 930 270 L 1085 350 L 1230 455 L 1275 555 L 1160 610 L 980 620 L 790 600 L 610 625 L 420 610 L 250 620 Z`:`M 210 575 L 180 500 L 215 420 L 270 350 L 345 305 L 430 265 L 525 225 L 635 205 L 750 220 L 855 250 L 960 295 L 1060 350 L 1160 410 L 1260 500 L 1220 570 L 1080 600 L 920 615 L 760 600 L 600 620 L 440 600 L 300 615 Z`;
  const zoneLines=singleMine?`<g opacity="0.58">${[1,2,3,4,5].map(i=>{const x=170+i*205;return `<line x1="${x}" y1="190" x2="${x-30}" y2="615" stroke="#64748b" stroke-width="1.5" stroke-dasharray="8 7"/>`;}).join('')}${[1,2,3,4].map(i=>{const y=255+i*78;return `<line x1="135" y1="${y}" x2="1260" y2="${y-10}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="8 7"/>`;}).join('')}</g>`:'';
  const mineMarkers=mines.map(m=>{const pt=projectPaperMapPoint(Number(m.latitude),Number(m.longitude),bounds),color=riskTierColor(m.risk_tier),label=escapeMapText(m.mine_name.replace(/^.*? - /,''));return `<g class="mine-pin" transform="translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})"><circle r="15" fill="${color}" stroke="#fff" stroke-width="3"/><circle r="5" fill="#fff"/><text x="20" y="4" class="mine-label">${label}</text><title>${escapeMapText(m.mine_name)} — Risk ${Number(m.risk_score).toFixed(1)} — ${Number(m.open_violations_count||0)} open</title></g>`;}).join('');
  // Keep every violation marker at its real GPS point. Only the callout is offset, so the map never invents a location.
  const calloutSlots=[[95,-75],[105,18],[95,105],[-300,-80],[-310,20],[-300,110],[190,-125],[200,130],[-500,-125],[-500,135]];
  const violationMarkers=violations.map((v,idx)=>{
    const pt=projectPaperMapPoint(Number(v.latitude),Number(v.longitude),bounds),color=violationSeverityColor(v.severity,v.status),closed=normalizeGISStatus(v.status)==="CLOSED";
    const [ox,oy]=calloutSlots[idx%calloutSlots.length],zone=deriveZoneLabel(v,idx),sev=violationSeverityLabel(v.severity),stat=violationStatusLabel(v.status),shape=closed?`<circle r="9" fill="${color}" stroke="#fff" stroke-width="2" opacity="0.9"/>`:`<path d="M 0 -12 L 11 10 L -11 10 Z" fill="${color}" stroke="#fff" stroke-width="2.5"/>`;
    const boxW=Math.min(310,Math.max(210,zone.length*6+150)),boxX=ox>=0?18-6:-boxW+6,boxY=oy-28;
    return `<g class="violation-pin" tabindex="0"><g transform="translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})">${shape}<circle r="3" fill="#fff"/><line x1="0" y1="0" x2="${ox}" y2="${oy}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.75"/><g transform="translate(${ox} ${oy})"><rect x="${boxX}" y="${boxY}" width="${boxW}" height="56" rx="6" fill="#fffaf0" stroke="${color}" stroke-width="1.5" opacity="0.96"/><text x="${boxX+10}" y="${boxY+17}" class="violation-label">${escapeMapText(v.violation_id)} • ${escapeMapText(sev)} • ${escapeMapText(stat)}</text><text x="${boxX+10}" y="${boxY+33}" class="coord-label">${escapeMapText(zone)}</text><text x="${boxX+10}" y="${boxY+47}" class="coord-label">${Number(v.latitude).toFixed(5)}°N, ${Number(v.longitude).toFixed(5)}°E</text></g></g><title>${escapeMapText(v.violation_id)} — ${escapeMapText(v.title)} — ${escapeMapText(sev)} — ${escapeMapText(stat)} — ${escapeMapText(zone)}</title></g>`;
  }).join('');
  return `<svg class="paper-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="DGMS paper map showing mine locations and GPS-tagged violations"><defs><pattern id="paperNoise" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r="0.8" fill="#b89b6b" opacity="0.12"/><circle cx="9" cy="10" r="0.7" fill="#8f7652" opacity="0.08"/></pattern></defs><rect width="${width}" height="${height}" fill="#efe2c1"/><rect width="${width}" height="${height}" fill="url(#paperNoise)"/><rect x="16" y="16" width="${width-32}" height="${height-32}" rx="6" fill="none" stroke="#9b7b4b" stroke-width="2"/><path d="${land}" fill="#d8dfc2" stroke="#7d8965" stroke-width="3" opacity="0.78"/>${zoneLines}${grid.join('')}<text x="40" y="45" class="map-title">KHADAN RAKSHAK — ${singleMine?escapeMapText(selectedMine):'DGMS CONSOLIDATED FIELD MAP'}</text><text x="40" y="66" class="map-subtitle">Real GPS violation points • callouts identify field zones • no external map tiles</text>${singleMine?`<g transform="translate(1080 38)"><rect width="330" height="48" rx="5" fill="#fff7ed" stroke="#c2410c"/><text x="12" y="19" class="legend-text">MINE LOCAL FIELD VIEW</text><text x="12" y="36" class="coord-label">Markers remain at recorded GPS coordinates</text></g>`:''}<g transform="translate(1425 85)"><path d="M0 34 L0 -10 M0 -10 L-7 5 M0 -10 L7 5" stroke="#111827" stroke-width="2.5" fill="none"/><text x="-8" y="52" class="north-label">N</text></g><g transform="translate(38 675)"><circle r="7" fill="#dc2626"/><text x="14" y="4" class="legend-text">Critical</text><circle cx="82" r="7" fill="#f97316"/><text x="96" y="4" class="legend-text">Major</text><circle cx="166" r="7" fill="#eab308"/><text x="180" y="4" class="legend-text">Minor</text><circle cx="246" r="7" fill="#64748b"/><text x="260" y="4" class="legend-text">Closed</text><path d="M338 7 L346 -7 L354 7 Z" fill="#2563eb"/><text x="364" y="4" class="legend-text">Active GPS violation</text></g>${mineMarkers}${violationMarkers}</svg>`;
}
function ensureGISMineOptions(currentUser,mineSel){
  if(!mineSel)return;
  const isCorporate=currentUser.roleCode==="corporate";
  const mines=["BCCL - Jharia Colliery","SECL - Korba Deep Pit-3","NCL - Singrauli OCP Block-B","ECL - Raniganj Colliery","CCL - Piparwar Opencast"];
  const current=mineSel.value;
  if(isCorporate){mineSel.innerHTML=`<option value="ALL">Consolidated View — All 5 Mines</option>`+mines.map(m=>`<option value="${escapeMapText(m)}">${escapeMapText(m)}</option>`).join('');mineSel.value=(current==="ALL"||mines.includes(current))?current:"ALL";mineSel.disabled=false;}
  else{const own=currentUser.mine||"";mineSel.innerHTML=own?`<option value="${escapeMapText(own)}">${escapeMapText(own)}</option>`:`<option value="">No mine assigned</option>`;mineSel.value=own;mineSel.disabled=true;}
}
async function renderScreen17GIS(){
  const mapDiv=document.getElementById("screen17-map");if(!mapDiv)return;
  const currentUser=store.currentUser||{},isCorporate=currentUser.roleCode==="corporate";
  const mineSel=document.getElementById("screen17-mine-filter"),severitySel=document.getElementById("screen17-severity-filter"),scopeBadge=document.getElementById("screen17-scope-badge"),summaryEl=document.getElementById("screen17-map-summary");
  ensureGISMineOptions(currentUser,mineSel);
  const selectedMine=isCorporate?((mineSel&&mineSel.value)||"ALL"):(currentUser.mine||"");
  if(scopeBadge)scopeBadge.textContent=isCorporate?(selectedMine==="ALL"?"DGMS CENTRAL • CONSOLIDATED ALL MINES":`DGMS CENTRAL • ${selectedMine}`):`MINE SCOPED • ${currentUser.mine||"Unassigned"}`;
  try{
    const params={mine:selectedMine,user_role:currentUser.roleCode||"",user_mine:currentUser.mine||""};
    const [allMines,allViolations]=await Promise.all([apiGet("/gis/mines",params),apiGet("/gis/violations",params)]);
    const mines=isCorporate?(selectedMine==="ALL"?allMines:allMines.filter(m=>m.mine_name===selectedMine)):allMines.filter(m=>m.mine_name===currentUser.mine);
    const scopedViolations=isCorporate?allViolations:allViolations.filter(v=>v.mine_name===currentUser.mine);
    const severity=severitySel?normalizeGISSeverity(severitySel.value):"ALL";
    const violations=scopedViolations.filter(v=>severity==="ALL"||normalizeGISSeverity(v.severity)===severity);
    // Keep the severity control stable across rerenders and make filtering case/enum-proof.
    if(severitySel && severitySel.value!=="ALL" && normalizeGISSeverity(severitySel.value)!==severity) severitySel.value="ALL";
    const counts=scopedViolations.reduce((a,v)=>{const k=normalizeGISSeverity(v.severity);a[k]=(a[k]||0)+1;return a;},{});
    const shownCounts=violations.reduce((a,v)=>{const k=normalizeGISSeverity(v.severity);a[k]=(a[k]||0)+1;return a;},{});
    if(summaryEl)summaryEl.innerHTML=`<span class="font-bold">${violations.length}</span> of <span class="font-semibold">${scopedViolations.length}</span> GPS-tagged violations shown • <span class="text-red-700 font-semibold">${shownCounts.CRITICAL||0}/${counts.CRITICAL||0} Critical</span> • <span class="text-orange-700 font-semibold">${shownCounts.MAJOR||0}/${counts.MAJOR||0} Major</span> • <span class="text-yellow-700 font-semibold">${shownCounts.MINOR||0}/${counts.MINOR||0} Minor</span>${isCorporate?` • <span class="font-semibold">${mines.length} mine${mines.length===1?'':'s'} in view</span>`:''}`;
    mapDiv.innerHTML=buildPaperMapSvg(mines,violations,selectedMine);
  }catch(err){console.warn("Screen 17 GIS fetch failed",err);mapDiv.innerHTML=`<div class="h-full flex items-center justify-center bg-amber-50 text-sm text-red-700 p-6 text-center"><div><i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i><br/>Map data could not be loaded from the backend.<br/><span class="text-xs">The offline paper map itself requires no external map service.</span></div></div>`;if(typeof showLiveToast==="function")showLiveToast("Map Data Unavailable",`Could not reach backend at ${API_BASE}.`,"error");}
}

// Bind GIS controls once. This avoids relying only on inline onchange handlers and
// prevents stale selections when the map rerenders after a live update.
document.addEventListener("DOMContentLoaded",()=>{
  ["screen17-mine-filter","screen17-severity-filter"].forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.dataset.gisBound){el.addEventListener("change",()=>renderScreen17GIS());el.dataset.gisBound="1";}
  });
});

/* =======================================================================
   SCREEN 18: REPORTS, OCR & AUDIT TRAIL
   ======================================================================= */
async function downloadFileFromApi(path, params, fallbackName) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API_BASE}${path}${qs}`);
  if (!res.ok) throw new Error(`${res.status}`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadFormVII() {
  const id = document.getElementById("report-violation-id").value.trim();
  const statusEl = document.getElementById("report-status-msg");
  if (!id) { statusEl.innerHTML = `<span class="text-red-600">Enter a violation ID first.</span>`; return; }
  statusEl.innerHTML = `<span class="text-slate-500"><i class="fa-solid fa-spinner fa-spin"></i> Generating Form VII PDF…</span>`;
  try {
    await downloadFileFromApi(`/reports/form-vii/${encodeURIComponent(id)}`, null, `Form_VII_${id}.pdf`);
    statusEl.innerHTML = `<span class="text-emerald-700"><i class="fa-solid fa-circle-check"></i> Form VII PDF downloaded.</span>`;
    renderScreen18AuditLog();
  } catch (err) {
    statusEl.innerHTML = `<span class="text-red-600">Could not generate report — check the violation ID exists and the backend is running.</span>`;
  }
}

async function downloadMonthlySummary() {
  const mine = document.getElementById("report-mine-select").value;
  const statusEl = document.getElementById("report-status-msg");
  statusEl.innerHTML = `<span class="text-slate-500"><i class="fa-solid fa-spinner fa-spin"></i> Generating monthly summary PDF…</span>`;
  try {
    await downloadFileFromApi("/reports/monthly-summary", { mine, user_role: store.currentUser.roleCode, user_mine: store.currentUser.mine }, `Monthly_Summary_${mine}.pdf`);
    statusEl.innerHTML = `<span class="text-emerald-700"><i class="fa-solid fa-circle-check"></i> Monthly summary PDF downloaded.</span>`;
    renderScreen18AuditLog();
  } catch (err) {
    statusEl.innerHTML = `<span class="text-red-600">Could not generate report — is the backend running?</span>`;
  }
}

async function digitizeOcrBlob(blob, filename, docType) {
  const panel=document.getElementById("ocr-result-panel"), statusLine=document.getElementById("ocr-status-line"), fieldsPanel=document.getElementById("ocr-fields-panel"), rawDetails=document.getElementById("ocr-raw-details"), rawText=document.getElementById("ocr-raw-text");
  panel?.classList.remove("hidden"); if(statusLine) statusLine.textContent="Digitizing document…"; if(fieldsPanel) fieldsPanel.innerHTML=""; rawDetails?.classList.add("hidden");
  const fd=new FormData(); fd.append("file",blob,filename); fd.append("document_type",docType); fd.append("mine_name",store.currentUser.mine||"");
  try {
    const res=await fetch(`${API_BASE}/ocr/digitize`,{method:"POST",body:fd}); const data=await res.json();
    if(!res.ok) throw new Error(data.detail||`HTTP ${res.status}`);
    const fallback=data.engine_used==="INTELLIGENT_FALLBACK";
    if(statusLine) statusLine.innerHTML=`<span class="${fallback?'text-amber-700':'text-emerald-700'}"><i class="fa-solid ${fallback?'fa-wand-magic-sparkles':'fa-circle-check'}"></i> ${fallback?'Fallback parser used':'Document digitized successfully'} (${data.engine_used||'engine'})</span>`;
    const fields=data.extracted_fields||{}; const keys=Object.keys(fields);
    if(fieldsPanel) fieldsPanel.innerHTML=keys.length?`<table class="w-full text-[11px]"><tbody>${keys.map(k=>`<tr><td class="py-1 pr-3 font-semibold text-slate-600">${k.replace(/_/g,' ')}</td><td class="py-1">${Array.isArray(fields[k])?fields[k].join(', '):fields[k]}</td></tr>`).join('')}</tbody></table>`:`<p class="text-slate-500">No structured fields matched automatically — see raw text below.</p>`;
    if(rawText) rawText.textContent=data.raw_text||"(no text detected)"; rawDetails?.classList.remove("hidden"); renderScreen18AuditLog();
  } catch(err) { if(statusLine) statusLine.innerHTML=`<span class="text-red-600"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</span>`; }
}

async function handleOcrSubmit(evt) { evt.preventDefault(); const input=document.getElementById("ocr-file-input"); const type=document.getElementById("ocr-doc-type").value; if(input?.files?.[0]) await digitizeOcrBlob(input.files[0],input.files[0].name,type); }
async function runSampleOcr(type) { try { const res=await fetch(`${API_BASE}/ocr/sample/${type}`); if(!res.ok) throw new Error(`Sample generation failed (${res.status})`); await digitizeOcrBlob(await res.blob(),`sample_${type.toLowerCase()}.pdf`,type); } catch(e) { showLiveToast("Sample OCR Failed",e.message,"error"); } }

async function renderScreen18AuditLog() {
  const reportMine=document.getElementById("report-mine-select");
  if(reportMine && store.currentUser.roleCode !== "corporate") { reportMine.value=store.currentUser.mine; reportMine.disabled=true; }
  else if(reportMine) reportMine.disabled=false;
  const tbody = document.getElementById("screen18-audit-tbody");
  if (!tbody) return;
  try {
    const mine = store.currentUser.roleCode === "corporate" ? "ALL" : store.currentUser.mine;
    const rows = await apiGet("/audit/", { limit: 40, mine });
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td class="py-2 px-3">${r.entity_type} <span class="text-slate-400 font-mono text-[10px]">${r.entity_id}</span></td>
        <td class="py-2 px-3">${r.action}</td>
        <td class="py-2 px-3">${r.actor || "—"}</td>
        <td class="py-2 px-3 text-slate-500">${r.payload_summary || ""}</td>
        <td class="py-2 px-3 font-mono text-[10px] text-slate-400" title="${r.payload_hash}">${r.payload_hash.slice(0, 10)}…</td>
        <td class="py-2 px-3 text-slate-400 text-[10px]">${r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
      </tr>
    `).join("") : `<tr><td colspan="6" class="py-4 px-3 text-center text-slate-400">No audit entries yet.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}.</td></tr>`;
  }
}

async function verifyAuditChain() {
  const resultEl = document.getElementById("audit-verify-result");
  resultEl.innerHTML = `<span class="text-slate-500"><i class="fa-solid fa-spinner fa-spin"></i> Verifying chain…</span>`;
  try {
    const result = await apiGet("/audit/verify");
    resultEl.innerHTML = result.chain_intact
      ? `<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-shield-check"></i> Chain intact — ${result.total_entries} entries verified, no tampering detected. Latest hash: <span class="font-mono">${result.latest_hash.slice(0, 16)}…</span></span>`
      : `<span class="text-red-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Chain integrity BROKEN at entry #${result.broken_at_entry_id}.</span>`;
  } catch (err) {
    resultEl.innerHTML = `<span class="text-red-600">Could not verify — is the backend running?</span>`;
  }
}

/* =======================================================================
   SCREEN 19: REMINDERS & ESCALATION ENGINE
   ======================================================================= */
function reminderSeverityBadge(sev) {
  const map = {
    OVERDUE: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">OVERDUE</span>',
    CRITICAL: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">CRITICAL</span>',
    WARNING: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">WARNING</span>',
    NORMAL: '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">NORMAL</span>',
  };
  return map[sev] || sev;
}

async function renderScreen19Reminders() {
  const currentUser = store.currentUser || {};
  const mine = currentUser.roleCode === "corporate" ? "ALL" : currentUser.mine;

  try {
    const [rows, summary] = await Promise.all([
      apiGet("/reminders/", { mine, user_role: currentUser.roleCode, user_mine: currentUser.mine }),
      apiGet("/reminders/summary", { mine, user_role: currentUser.roleCode, user_mine: currentUser.mine }),
    ]);

    const kpis = document.getElementById("screen19-kpis");
    if (kpis) {
      kpis.innerHTML = [
        kpiCard("Overdue", summary.overdue, summary.overdue > 0 ? "bad" : "good"),
        kpiCard("Critical (&lt;24h)", summary.critical, summary.critical > 0 ? "bad" : "good"),
        kpiCard("Warning (&lt;72h)", summary.warning, summary.warning > 0 ? "warn" : "good"),
        kpiCard("Total Pending", summary.total_pending, "neutral"),
      ].join("");
    }

    const tbody = document.getElementById("screen19-tbody");
    if (tbody) {
      tbody.innerHTML = rows.length ? rows.map(r => `
        <tr>
          <td class="py-2 px-3">${reminderSeverityBadge(r.severity)}</td>
          <td class="py-2 px-3">${r.mine_name}</td>
          <td class="py-2 px-3">${r.title}${r.detail ? `<div class="text-[10px] text-slate-400">${r.detail}</div>` : ""}</td>
          <td class="py-2 px-3">${r.due_at ? new Date(r.due_at).toLocaleString() : "—"}</td>
          <td class="py-2 px-3 text-right space-x-1">
            <button onclick="acknowledgeReminder(${r.id})" class="text-[10px] bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded font-semibold">Acknowledge</button>
            ${r.severity === "OVERDUE" && !r.escalated ? `<button onclick="escalateReminder(${r.id})" class="text-[10px] bg-rose-700 hover:bg-rose-800 text-white px-2 py-1 rounded font-semibold">Escalate</button>` : ""}
          </td>
        </tr>
      `).join("") : `<tr><td colspan="5" class="py-4 px-3 text-center text-slate-400">No pending reminders — all statutory deadlines are on track.</td></tr>`;
    }
  } catch (err) {
    console.warn("Screen 19 fetch failed", err);
    const tbody = document.getElementById("screen19-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="py-4 px-3 text-center text-red-500">Could not reach backend at ${API_BASE}.</td></tr>`;
  }
}

async function acknowledgeReminder(id) {
  try {
    await apiPost(`/reminders/${id}/acknowledge?acknowledged_by=${encodeURIComponent(store.currentUser.name || "Official")}`, {});
    showLiveToast("Reminder Acknowledged", "Removed from the pending queue.", "success");
    renderScreen19Reminders();
  } catch (err) {
    showLiveToast("Action Failed", "Could not acknowledge reminder — is the backend running?", "error");
  }
}

async function escalateReminder(id) {
  try {
    await apiPost(`/reminders/${id}/escalate?escalated_by=${encodeURIComponent(store.currentUser.name || "Official")}`, {});
    showLiveToast("Escalated", "Reminder pushed to the DGMS escalation channel.", "warn");
    renderScreen19Reminders();
  } catch (err) {
    showLiveToast("Action Failed", "Could not escalate reminder — is the backend running?", "error");
  }
}

async function triggerReminderScan() {
  const statusEl = document.getElementById("reminder-scan-status");
  statusEl.textContent = "Scanning…";
  try {
    const result = await apiGet("/reminders/scan");
    statusEl.textContent = `Scan complete — ${result.created} new, ${result.updated} updated.`;
    renderScreen19Reminders();
  } catch (err) {
    statusEl.textContent = "Scan failed — is the backend running?";
  }
}

/* =======================================================================
   PHASE 4: CONVERSATIONAL ASSISTANT WIDGET
   ======================================================================= */
function chatLanguage() {
  return (typeof khadanCurrentLang !== "undefined" && khadanCurrentLang === "hi") ? "hi" : "en";
}
function updateChatbotLanguageUI() {
  const lang = chatLanguage();
  const selector = document.getElementById("chatbot-language");
  if (selector) selector.value = lang;
  const input = document.getElementById("chatbot-input");
  if (input) input.placeholder = lang === "hi" ? "अनुपालन, उल्लंघन या अनुस्मारक के बारे में पूछें…" : "Ask about compliance, violations, reminders…";
  const title = document.getElementById("chatbot-title");
  if (title) title.textContent = lang === "hi" ? "खदान रक्षक सहायक" : "KHADAN RAKSHAK Assistant";
  document.querySelectorAll("[data-chat-query-en]").forEach(btn => {
    const labels = lang === "hi"
      ? { "What is the compliance score?": "अनुपालन / Compliance", "How many open violations?": "उल्लंघन / Violations", "Any overdue reminders?": "अनुस्मारक / Reminders", "What is the mine risk score?": "जोखिम / Risk" }
      : { "What is the compliance score?": "Compliance / अनुपालन", "How many open violations?": "Violations / उल्लंघन", "Any overdue reminders?": "Reminders / अनुस्मारक", "What is the mine risk score?": "Risk / जोखिम" };
    btn.textContent = labels[btn.dataset.chatQueryEn] || btn.textContent;
  });
}
function toggleChatbot() {
  const panel = document.getElementById("chatbot-panel");
  if (!panel) return;
  const willOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden");
  updateChatbotLanguageUI();
  if (willOpen && !panel.dataset.greeted) {
    appendChatMessage("assistant", chatLanguage() === "hi"
      ? "नमस्ते! मैं अनुपालन, खुले उल्लंघन, अनुस्मारक, शिकायतों और खदान के जोखिम स्कोर के बारे में मदद कर सकता हूँ। नीचे दिए गए सवाल चुनें या अपना सवाल लिखें।"
      : "Hello! I can help with compliance, open violations, reminders, grievances, and mine risk scores. Choose a suggested question or type your own.");
    panel.dataset.greeted = "1";
  }
}
function appendChatMessage(role, text, extraClass = "") {
  const container = document.getElementById("chatbot-messages");
  if (!container) return null;
  const bubble = document.createElement("div");
  bubble.className = (role === "user"
    ? "ml-auto max-w-[88%] bg-blue-900 text-white rounded-lg rounded-tr-none px-3 py-2 whitespace-pre-wrap break-words"
    : "mr-auto max-w-[90%] bg-white border border-slate-200 text-slate-800 rounded-lg rounded-tl-none px-3 py-2 whitespace-pre-wrap break-words") + (extraClass ? " " + extraClass : "");
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}
async function sendChatQuery(query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return;
  appendChatMessage("user", cleanQuery);
  const input = document.getElementById("chatbot-input");
  if (input) input.value = "";
  const send = document.getElementById("chatbot-send");
  if (send) send.disabled = true;
  const pending = appendChatMessage("assistant", chatLanguage() === "hi" ? "जानकारी प्राप्त की जा रही है…" : "Checking live information…");
  if (pending) pending.setAttribute("aria-label", "Assistant is responding");
  try {
    const currentUser = store.currentUser || {};
    const res = await apiPost("/chat/query", { query: cleanQuery, mine_name: currentUser.mine || "ALL", language: chatLanguage() });
    if (pending) pending.textContent = res.answer || (chatLanguage() === "hi" ? "कोई उत्तर उपलब्ध नहीं है।" : "No answer was returned.");
  } catch (err) {
    if (pending) pending.textContent = chatLanguage() === "hi"
      ? "सहायक सर्वर से संपर्क नहीं हो सका। कृपया कनेक्शन जाँचें और फिर प्रयास करें।"
      : "I couldn't reach the assistant service. Please check the connection and try again.";
  } finally {
    if (send) send.disabled = false;
    if (input) input.focus();
  }
}
async function handleChatSubmit(evt) {
  evt.preventDefault();
  const input = document.getElementById("chatbot-input");
  if (input) await sendChatQuery(input.value);
}
document.addEventListener("click", evt => {
  const btn = evt.target.closest("[data-chat-query-en]");
  if (!btn) return;
  const query = chatLanguage() === "hi" ? btn.dataset.chatQueryHi : btn.dataset.chatQueryEn;
  sendChatQuery(query);
});

/* Show the chatbot widget only once authenticated (mirrors nav bar visibility). */
(function watchChatbotVisibility() {
  const originalSetAuthChrome = typeof setAuthenticatedChrome === "function" ? setAuthenticatedChrome : null;
  if (!originalSetAuthChrome) return;
  window.setAuthenticatedChrome = function (isAuthenticated) {
    originalSetAuthChrome(isAuthenticated);
    const widget = document.getElementById("chatbot-widget");
    if (widget) widget.classList.toggle("hidden", !isAuthenticated);
  };
})();

/* =======================================================================
   PHASE 4: FUNCTIONAL i18n (English / Hindi)
   Applies to every element tagged data-i18n="key" plus a small set of
   dynamically-rendered strings (nav tabs, KPI labels use English only
   for now — data tables stay in English since statutory IDs/regulation
   codes are not translated in official DGMS practice either).
   ======================================================================= */
const KHADAN_TRANSLATIONS = {
  en: {
    login_title: "Statutory Officer Login",
    login_subtitle: "National Single Sign-On • Ministry of Coal",
    label_colliery: "Colliery / Workings Unit",
    label_role: "Designation / Operational Role",
    label_username: "Username or Employee ID",
    label_password: "Password",
    label_captcha: "Security Captcha Verification",
    btn_login: "Authenticate & Enter Statutory Portal",
    label_remember: "Remember terminal",
    badge_sso: "DGMS National Single Sign-On (SSO)",
    badge_auth_required: "Authentication Required for Statutory Clearance",
    btn_signout: "Sign Out",
    footer_portal_title: "KHADAN RAKSHAK PORTAL",
    footer_framework_title: "STATUTORY FRAMEWORK",
    footer_arch_title: "SYSTEM ARCHITECTURE",
    home_title: "Shift Safety & Compliance Desk",
    home_inspection_title: "Standard 10-Point Underground Safety Inspection",
    btn_start_inspection: "Start New Inspection",
    checklist_title: "Coal Mine Statutory 10-Item Inspection Checklist",
    btn_review_submit: "Proceed to Review & Submit",
    review_title: "Inspection Statutory Summary & Submission Review",
    review_th_parameter: "Statutory Regulation & Checklist Parameter",
    review_th_result: "Audit Result",
    review_th_severity: "Severity",
    review_th_evidence: "Evidence Photo & GPS",
    btn_submit_inspection: "Submit Inspection & Issue Action Orders",
    closeout_title: "Close Out Violation & Upload Proof of Remediation",
  },
  hi: {
    login_title: "सांविधिक अधिकारी लॉगिन",
    login_subtitle: "राष्ट्रीय एकल साइन-ऑन • कोयला मंत्रालय",
    label_colliery: "कोलियरी / कार्य इकाई",
    label_role: "पदनाम / परिचालन भूमिका",
    label_username: "उपयोगकर्ता नाम या कर्मचारी आईडी",
    label_password: "पासवर्ड",
    label_captcha: "सुरक्षा कैप्चा सत्यापन",
    btn_login: "प्रमाणित करें और पोर्टल में प्रवेश करें",
    label_remember: "टर्मिनल याद रखें",
    badge_sso: "डीजीएमएस राष्ट्रीय एकल साइन-ऑन (SSO)",
    badge_auth_required: "सांविधिक स्वीकृति हेतु प्रमाणीकरण आवश्यक",
    btn_signout: "साइन आउट",
    footer_portal_title: "खदान रक्षक पोर्टल",
    footer_framework_title: "सांविधिक ढांचा",
    footer_arch_title: "सिस्टम संरचना",
    home_title: "शिफ्ट सुरक्षा एवं अनुपालन डेस्क",
    home_inspection_title: "भूमिगत सुरक्षा की मानक 10-बिंदु जाँच",
    btn_start_inspection: "नई जाँच शुरू करें",
    checklist_title: "कोयला खदान की वैधानिक 10-बिंदु जाँच सूची",
    btn_review_submit: "समीक्षा करें और जमा करें",
    review_title: "जाँच का वैधानिक सारांश एवं जमा करने की समीक्षा",
    review_th_parameter: "वैधानिक विनियम एवं जाँच पैरामीटर",
    review_th_result: "जाँच परिणाम",
    review_th_severity: "गंभीरता",
    review_th_evidence: "साक्ष्य फोटो एवं GPS",
    btn_submit_inspection: "जाँच जमा करें और कार्रवाई आदेश जारी करें",
    closeout_title: "उल्लंघन बंद करें और सुधार का प्रमाण अपलोड करें",
  },
};

let khadanCurrentLang = (() => {
  try { return localStorage.getItem("khadan_rakshak_lang") === "hi" ? "hi" : "en"; }
  catch (_) { return "en"; }
})();

// Broad UI dictionary used for both static markup and dynamically rendered workflow content.
const KHADAN_UI_HI = {
  "Sign Out":"साइन आउट", "Return to Inspection Desk (Screen 2)":"निरीक्षण डेस्क पर लौटें (स्क्रीन 2)",
  "Sign Out to Login as Another Role":"दूसरी भूमिका से लॉगिन करने के लिए साइन आउट करें",
  "Shift Safety & Compliance Desk":"शिफ्ट सुरक्षा एवं अनुपालन डेस्क",
  "Standard 10-Point Underground Safety Inspection":"भूमिगत सुरक्षा की मानक 10-बिंदु जाँच",
  "Start New Inspection":"नया निरीक्षण शुरू करें", "Coal Mine Statutory 10-Item Inspection Checklist":"कोयला खदान की वैधानिक 10-बिंदु निरीक्षण सूची",
  "Proceed to Review & Submit":"समीक्षा करें और जमा करें", "Inspection Statutory Summary & Submission Review":"निरीक्षण का वैधानिक सारांश एवं जमा करने की समीक्षा",
  "Statutory Regulation & Checklist Parameter":"वैधानिक विनियम एवं जाँच पैरामीटर", "Audit Result":"जाँच परिणाम", "Severity":"गंभीरता", "Evidence Photo & GPS":"साक्ष्य फोटो एवं GPS",
  "Submit Inspection & Issue Action Orders":"निरीक्षण जमा करें और कार्रवाई आदेश जारी करें", "Close Out Violation & Upload Proof of Remediation":"उल्लंघन बंद करें और सुधार का प्रमाण अपलोड करें",
  "Colliery / Workings Unit":"कोलियरी / कार्य इकाई", "Designation / Operational Role":"पदनाम / परिचालन भूमिका", "Username or Employee ID":"उपयोगकर्ता नाम या कर्मचारी आईडी",
  "Password":"पासवर्ड", "Security Captcha Verification":"सुरक्षा कैप्चा सत्यापन", "Authenticate & Enter Statutory Portal":"प्रमाणित करें और पोर्टल में प्रवेश करें",
  "Remember terminal":"टर्मिनल याद रखें", "DGMS National Single Sign-On (SSO)":"डीजीएमएस राष्ट्रीय एकल साइन-ऑन (SSO)",
  "Authentication Required for Statutory Clearance":"वैधानिक स्वीकृति के लिए प्रमाणीकरण आवश्यक", "KHADAN RAKSHAK PORTAL":"खदान रक्षक पोर्टल",
  "STATUTORY FRAMEWORK":"वैधानिक ढाँचा", "SYSTEM ARCHITECTURE":"सिस्टम संरचना", "Pass":"सही", "Fail":"गलत",
  "Fail (Non-Compliant)":"विफल (अनुपालन नहीं)", "Select an Open Assigned Violation":"खुला आवंटित उल्लंघन चुनें", "Choose a violation…":"उल्लंघन चुनें…",
  "Open Closeout Desk":"समापन डेस्क खोलें", "Only open violations scoped to your mine and operational assignment are listed.":"केवल आपकी खदान और परिचालन कार्य से संबंधित खुले उल्लंघन दिखाए गए हैं।",
  "Gas Monitoring & Methane Safety":"गैस निगरानी एवं मीथेन सुरक्षा", "Ventilation & Gases":"वेंटिलेशन एवं गैसें",
  "Adequate Face & Roadway Ventilation Air Quantity":"कार्यस्थल एवं मार्ग में पर्याप्त वायु प्रवाह", "Strata Control & Roof Support Plan (SMP)":"भूस्तर नियंत्रण एवं छत सहारा योजना (SMP)",
  "Strata Support":"भूस्तर सहारा", "Stone Dust & Water Explosion Barriers":"पत्थर की धूल एवं जल विस्फोट अवरोधक", "Mechanical & Dust":"यांत्रिकी एवं धूल",
  "Fire-Fighting Hydrant Lines & Extinguishers":"अग्निशमन हाइड्रेंट लाइन एवं अग्निशामक", "Emergency Escape Route Markings & Second Outlet":"आपातकालीन निकास मार्ग चिह्न एवं दूसरा निकास",
  "Haulage Track, Runaway Switches & Signaling":"ढुलाई ट्रैक, रनअवे स्विच एवं संकेत प्रणाली", "Electrical & Haulage":"विद्युत एवं ढुलाई",
  "Underground Personnel PPE & Self-Rescuers":"भूमिगत कर्मियों के सुरक्षा उपकरण (PPE) एवं सेल्फ-रेस्क्यूर", "Respirable Dust Suppression Mist Sprays":"साँस में जाने वाली धूल रोकने के लिए पानी की फुहार",
  "Flameproof (FLP) Electrical Enclosures & Earthing":"ज्वालारोधी (FLP) विद्युत बॉक्स एवं अर्थिंग",
  "Multi-gas detector verified at working face. Methane (CH4) < 0.5% in return airway, Carbon Monoxide (CO) < 50 ppm, and Oxygen (O2) > 19% volume.":"कार्यस्थल पर मल्टी-गैस डिटेक्टर की जाँच करें। वापसी वायु मार्ग में मीथेन (CH4) 0.5% से कम, कार्बन मोनोऑक्साइड (CO) 50 ppm से कम और ऑक्सीजन (O2) 19% से अधिक हो।",
  "Auxiliary fan operational; minimum statutory air quantity (> 6 m³/min per person employed underground) delivered to the split without recirculation.":"सहायक पंखा चालू हो। भूमिगत प्रत्येक व्यक्ति के लिए निर्धारित न्यूनतम वायु मात्रा (> 6 m³/मिनट) बिना पुनर्चक्रण के पहुँचे।",
  "Roof bolting pattern verified with torque wrench; tell-tale extensometers checked; no visible bed separation, cracks, or side spalling along galleries.":"रूफ बोल्टिंग पैटर्न को टॉर्क रिंच से जाँचें; एक्सटेंसोमीटर जाँचें; गैलरी में परत अलग होने, दरार या किनारे टूटने के संकेत न हों।",
  "Stone dust barriers properly loaded with dry incombustible dust; water barrier troughs undamaged and topped up across main haulage roadways.":"पत्थर की धूल वाले अवरोधकों में सूखी अज्वलनशील धूल सही मात्रा में हो। मुख्य ढुलाई मार्गों के जल-अवरोध टब सही और भरे हों।",
  "Pressurized water hydrant lines active with nozzles available; dry chemical powder extinguishers inspected, tagged, and fully charged at sub-stations.":"दबावयुक्त जल हाइड्रेंट लाइन चालू हो और नोज़ल उपलब्ध हों। सब-स्टेशन के ड्राई केमिकल अग्निशामक जाँचे, टैग किए और पूरी तरह चार्ज हों।",
  "Escapeway illuminated with photoluminescent directional arrows, free from rock falls or obstructions, leading to operable second outlet shaft/incline.":"निकास मार्ग पर चमकदार दिशा-तीर हों, रास्ता पत्थर गिरने या रुकावट से मुक्त हो और चालू दूसरे निकास शाफ्ट/ढलान तक जाता हो।",
  "Haulage track gauge intact, rope free of broken wires, runaway catches and jazz rails functional, acoustic pull-wire signaling working end-to-end.":"ढुलाई ट्रैक की चौड़ाई सही हो, रस्सी के तार टूटे न हों, रनअवे कैच और रेल काम करें तथा पुल-वायर संकेत प्रणाली पूरी तरह चालू हो।",
  "All miners in the district wearing DGMS-certified safety helmets with functional cap lamps, steel-toe boots, and carrying personal filter self-rescuers.":"सभी खनिक DGMS-प्रमाणित हेलमेट, चालू कैप लैंप, स्टील-टो जूते और व्यक्तिगत फ़िल्टर सेल्फ-रेस्क्यूर पहनें।",
  "Water mist sprays operational at belt conveyor transfer points, crusher chute, and continuous miner face to keep airborne coal dust within 2 mg/m³.":"बेल्ट कन्वेयर ट्रांसफर पॉइंट, क्रशर च्यूट और कटिंग मशीन पर पानी की फुहार चालू हो, ताकि हवा में कोयले की धूल 2 mg/m³ के भीतर रहे।",
  "FLP switchgear enclosures tightly bolted with no missing bolts or gaps > 0.5mm; earth leakage protection relay trip tested.":"FLP स्विचगियर बॉक्स के सभी बोल्ट कसे हों और 0.5 मिमी से बड़े अंतर न हों। अर्थ-लीकेज सुरक्षा रिले का ट्रिप परीक्षण करें।",
  "Evidence logged":"साक्ष्य दर्ज किया गया", "Statutory clearance verified":"वैधानिक अनुपालन सत्यापित", "pending sync":"सिंक होना बाकी"
};
const KHADAN_HI_TO_EN = Object.fromEntries(Object.entries(KHADAN_UI_HI).map(([en,hi])=>[hi,en]));
// Extended worker-facing and portal-wide phrase dictionary.  Phrase matching is
// intentionally longest-first so dynamic strings such as "2 Non-Compliant Violations"
// and "Screen 7 of 11 • Action Fixer" retain their IDs/numbers while translating
// the human-readable parts around them.
Object.assign(KHADAN_UI_HI, {
  "Online":"ऑनलाइन", "Offline":"ऑफलाइन", "pending sync":"सिंक लंबित", "pending":"लंबित",
  "Government of India":"भारत सरकार", "MINISTRY OF COAL":"कोयला मंत्रालय",
  "DGMS STATUTORY COMPLIANCE PORTAL":"डीजीएमएस वैधानिक अनुपालन पोर्टल",
  "AI-Based Smart Governance and Statutory Compliance Monitoring System for Coal Mines":"कोयला खदानों के लिए एआई-आधारित स्मार्ट शासन एवं वैधानिक अनुपालन निगरानी प्रणाली",
  "Form IV & Form VII Regulatory Workflow • Directorate General of Mines Safety (DGMS)":"फॉर्म IV एवं फॉर्म VII नियामक कार्यप्रवाह • खान सुरक्षा महानिदेशालय (DGMS)",
  "Colliery Safety Snapshot":"कोलियरी सुरक्षा स्थिति", "Scope: Field Safety Inspector (Form IV)":"क्षेत्र: फील्ड सुरक्षा निरीक्षक (फॉर्म IV)",
  "CMR-2017":"CMR-2017", "Role-Authorized Portal:":"भूमिका-अधिकृत पोर्टल:",
  "Sign in with your registered Coal India / DGMS credentials to unlock the role-specific dashboard. To shift roles, simply sign out and log in under the other role.":"भूमिका-विशिष्ट डैशबोर्ड खोलने के लिए अपने पंजीकृत Coal India / DGMS क्रेडेंशियल से साइन इन करें। भूमिका बदलने के लिए साइन आउट करें और दूसरी भूमिका से लॉगिन करें।",
  "Invalid credentials or captcha code.":"गलत क्रेडेंशियल या कैप्चा कोड।", "Forgot password?":"पासवर्ड भूल गए?", "GPS Geofence Locked":"GPS जियोफेंस लॉक है",
  "Active Identity:":"सक्रिय पहचान:", "✓ Ready to Sign In":"✓ साइन इन के लिए तैयार", "Logged In As:":"लॉगिन उपयोगकर्ता:", "| Unit:":"| इकाई:",
  "Form IV Statutory Shift Log":"फॉर्म IV वैधानिक शिफ्ट लॉग", "CMR 2017 MANDATORY AUDIT":"CMR 2017 अनिवार्य ऑडिट",
  "Execute statutory physical checks for Gas Monitoring, Ventilation, Strata Roof Support, Dust Barriers, Fire Extinguishers, and FLP Electrical Enclosures.":"गैस निगरानी, वेंटिलेशन, भूस्तर/छत सहारा, धूल अवरोधक, अग्निशामक और FLP विद्युत बॉक्स की वैधानिक भौतिक जाँच करें।",
  "Mandatory Photo Proof on Failure":"विफलता पर फोटो प्रमाण अनिवार्य", "Auto Geolocation Tagging":"स्वचालित जियोलोकेशन टैगिंग", "Immutable Timestamping":"अपरिवर्तनीय समय-मुहर",
  "Compliance % This Month":"इस माह अनुपालन %", "Within Acceptable Safety Limits":"स्वीकार्य सुरक्षा सीमा के भीतर", "Pending Fixes in Shift":"शिफ्ट में लंबित सुधार", "Items":"आइटम", "Under Action Verification":"कार्रवाई सत्यापन लंबित", "Total Monthly Audits":"कुल मासिक ऑडिट", "Logged":"दर्ज", "100% Shift Coverage":"100% शिफ्ट कवरेज",
  "FORM IV STATUTORY MASTER REGISTER":"फॉर्म IV वैधानिक मास्टर रजिस्टर", "CMR 2017 Shift Audits":"CMR 2017 शिफ्ट ऑडिट", "Colliery Shift Inspections Register & Field Telemetry Desk":"कोलियरी शिफ्ट निरीक्षण रजिस्टर एवं फील्ड टेलीमेट्री डेस्क",
  "Official statutory logs: multi-gas telemetry, strata roof bolting, ventilation velocity, FLP electrical status & immediate remedial assignments.":"आधिकारिक वैधानिक लॉग: मल्टी-गैस टेलीमेट्री, रूफ बोल्टिंग, वेंटिलेशन वेग, FLP विद्युत स्थिति और तत्काल सुधार कार्य।",
  "Active Logs":"सक्रिय लॉग", "Shift:":"शिफ्ट:", "All Shifts":"सभी शिफ्ट", "Shift 1 (Morning)":"शिफ्ट 1 (सुबह)", "Shift 2 (Afternoon)":"शिफ्ट 2 (दोपहर)", "Shift 3 (Night)":"शिफ्ट 3 (रात)", "General Shift":"सामान्य शिफ्ट",
  "Compliance Tier:":"अनुपालन स्तर:", "All Audit Outcomes":"सभी ऑडिट परिणाम", "100% Compliant (Clean Audit)":"100% अनुपालन (क्लीन ऑडिट)", "Non-Compliant (Violations Identified)":"अनुपालन नहीं (उल्लंघन मिले)",
  "Inspection Reference":"निरीक्षण संदर्भ", "Date & Shift":"तिथि एवं शिफ्ट", "Colliery & Working Face":"कोलियरी एवं कार्यस्थल", "Auditor Attestation":"ऑडिटर प्रमाणन", "Statutory Compliance":"वैधानिक अनुपालन", "Audit Tally":"ऑडिट गणना", "Status":"स्थिति", "Form IV Actions":"फॉर्म IV कार्रवाई",
  "Evaluate all 10 statutory items.":"सभी 10 वैधानिक बिंदुओं की जाँच करें।", "Marking":"चिह्नित करने पर", "enforces photographic evidence, GPS coordinate capture, and severity classification.":"फोटो प्रमाण, GPS निर्देशांक और गंभीरता वर्गीकरण अनिवार्य होगा।",
  "Quick Hackathon Simulation:":"त्वरित हैकाथॉन सिमुलेशन:", "Auto-Fill Realistic Scenario (8 Pass, 2 Fail)":"यथार्थ परिदृश्य स्वतः भरें (8 पास, 2 विफल)", "Back to Desk":"डेस्क पर वापस जाएँ",
  "Verify physical observations before signing and generating official DGMS violation records.":"हस्ताक्षर और आधिकारिक DGMS उल्लंघन रिकॉर्ड बनाने से पहले भौतिक निरीक्षण परिणाम सत्यापित करें।",
  "Detailed Item-by-Item Statutory Audit":"प्रत्येक बिंदु का विस्तृत वैधानिक ऑडिट", "Statutory Declaration under CMR 2017:":"CMR 2017 के अंतर्गत वैधानिक घोषणा:", "Modify Checklist":"जाँच सूची संशोधित करें",
  "Statutory Corrective Action Order Assignment (Form VII)":"वैधानिक सुधारात्मक कार्रवाई आदेश आवंटन (फॉर्म VII)", "Inspection ID:":"निरीक्षण आईडी:", "Assigned orders will immediately notify the nominated officers and appear in their Part B field queue (Screen 6).":"आवंटित आदेश नामित अधिकारियों को तुरंत सूचित होंगे और उनकी पार्ट B फील्ड कतार (स्क्रीन 6) में दिखाई देंगे।", "Dispatch Action Orders & Complete Filing":"कार्रवाई आदेश भेजें और फाइलिंग पूरी करें",
  "My Assigned Remedial Actions (Field Queue)":"मेरे आवंटित सुधारात्मक कार्य (फील्ड कतार)", "Violations assigned to you, ordered by statutory deadline urgency and risk severity. Click any item to upload proof and close it out.":"आपको आवंटित उल्लंघन वैधानिक समयसीमा और जोखिम की गंभीरता के अनुसार क्रमित हैं। प्रमाण अपलोड और बंद करने के लिए किसी आइटम पर क्लिक करें।",
  "Close Out Violation & Upload Proof of Remediation":"उल्लंघन बंद करें और सुधार का प्रमाण अपलोड करें", "Provide verified \"After\" photographic evidence and rectification remarks for supervisor verification.":"पर्यवेक्षक सत्यापन के लिए प्रमाणित \"बाद की\" फोटो और सुधार संबंधी टिप्पणी दें।", "Back to My Actions":"मेरी कार्रवाइयों पर वापस जाएँ",
  "Supervisor Statutory Verification (Form VII-A)":"पर्यवेक्षक वैधानिक सत्यापन (फॉर्म VII-A)", "Inspect side-by-side Before & After photographic evidence submitted by fixers. Approve to close violation or Reject with directives.":"फिक्सर द्वारा जमा की गई पहले और बाद की फोटो का साथ-साथ निरीक्षण करें। उल्लंघन बंद करने के लिए स्वीकृत करें या निर्देश के साथ अस्वीकार करें।",
  "Executive Dashboard":"कार्यकारी डैशबोर्ड", "DGMS Mine Safety & Compliance Executive Dashboard":"DGMS खदान सुरक्षा एवं अनुपालन कार्यकारी डैशबोर्ड", "High-level executive metrics, statutory compliance score, and historical violation frequency across colliery workings.":"कोलियरी कार्यक्षेत्रों के उच्च-स्तरीय कार्यकारी मेट्रिक्स, वैधानिक अनुपालन स्कोर और ऐतिहासिक उल्लंघन आवृत्ति।",
  "Open Violations":"खुले उल्लंघन", "Total Active":"कुल सक्रिय", "Under investigation or remediation":"जाँच या सुधार के अधीन", "Critical Violations":"गंभीर उल्लंघन", "24h Immediate":"24 घंटे में तत्काल", "Immediate Hazard Danger":"तत्काल खतरा", "Overdue Actions":"समयसीमा पार कार्रवाइयाँ", "Exceeded TAT":"TAT पार", "Passed statutory remediation deadline":"वैधानिक सुधार समयसीमा पार",
  "Statutory Violations & Closures Over Time (Last 6 Months)":"पिछले 6 महीनों में वैधानिक उल्लंघन एवं समापन", "Severity Distribution":"गंभीरता वितरण",
  "Master Statutory Violations Audit Log":"मास्टर वैधानिक उल्लंघन ऑडिट लॉग", "Drill down into specific coal mine violations with multi-parameter filtering.":"बहु-पैरामीटर फ़िल्टर के साथ विशिष्ट कोयला खदान उल्लंघनों का विवरण देखें।",
  "Total Logged:":"कुल दर्ज:", "Filter by Mine":"खदान से फ़िल्टर", "Filter by Severity":"गंभीरता से फ़िल्टर", "All Severities":"सभी गंभीरताएँ", "Critical (Immediate Danger)":"गंभीर (तत्काल खतरा)", "Major":"प्रमुख", "Minor":"लघु", "Filter by Status":"स्थिति से फ़िल्टर", "All Statuses":"सभी स्थितियाँ", "OPEN":"खुला", "PENDING VERIFICATION":"सत्यापन लंबित", "CLOSED":"बंद", "Search Keyword / ID":"कीवर्ड / आईडी खोजें", "Violation ID":"उल्लंघन आईडी", "Mine Unit":"खदान इकाई", "Regulation & Issue":"विनियम एवं समस्या", "Remediation Deadline":"सुधार समयसीमा", "Assigned To":"आवंटित व्यक्ति", "Current Status":"वर्तमान स्थिति", "Action":"कार्रवाई",
  "Submit Grievance":"शिकायत जमा करें", "File a New Grievance":"नई शिकायत दर्ज करें", "Grievance Register":"शिकायत रजिस्टर", "Category":"श्रेणी", "Wages":"मजदूरी", "Safety":"सुरक्षा", "Working Hours":"कार्य घंटे", "Welfare Facilities":"कल्याण सुविधाएँ", "Harassment":"उत्पीड़न", "Other":"अन्य", "Priority":"प्राथमिकता", "Normal":"सामान्य", "High":"उच्च", "Urgent":"अत्यावश्यक", "Description":"विवरण", "Submit anonymously":"गुमनाम रूप से जमा करें",
  "Colliery & Hazard-Site Geographic Map":"कोलियरी एवं खतरा-स्थल भौगोलिक मानचित्र", "DGMS Field Paper Map":"DGMS फील्ड पेपर मानचित्र", "Severity":"गंभीरता", "All severities":"सभी गंभीरताएँ", "Markers are placed from the violation's logged GPS coordinate.":"मार्कर उल्लंघन के दर्ज GPS निर्देशांक के आधार पर रखे गए हैं।",
  "Statutory Report & Document Center":"वैधानिक रिपोर्ट एवं दस्तावेज़ केंद्र", "Automated Report Generation":"स्वचालित रिपोर्ट निर्माण", "Monthly Statutory Compliance Summary":"मासिक वैधानिक अनुपालन सारांश", "OCR Document Digitization":"OCR दस्तावेज़ डिजिटलीकरण", "Scan / Photograph Document":"दस्तावेज़ स्कैन / फोटो लें", "Document Type":"दस्तावेज़ प्रकार", "Contractor License":"ठेकेदार लाइसेंस", "Inspection Register Page":"निरीक्षण रजिस्टर पृष्ठ", "CTO / Consent Certificate":"CTO / सहमति प्रमाणपत्र", "Generic Document":"सामान्य दस्तावेज़", "Digitize":"डिजिटाइज़ करें", "Raw OCR text":"कच्चा OCR पाठ", "Hash-Chained Audit Trail":"हैश-चेन ऑडिट ट्रेल", "Verify Chain Integrity":"चेन की अखंडता सत्यापित करें", "Entity":"इकाई", "Actor":"कर्ता", "Summary":"सारांश", "When":"कब",
  "Proactive Deadline & Renewal Reminders":"समयसीमा एवं नवीनीकरण के सक्रिय रिमाइंडर", "Re-Scan Now":"अभी पुनः स्कैन करें", "Pending Reminders (most urgent first)":"लंबित रिमाइंडर (सबसे जरूरी पहले)", "Title":"शीर्षक", "Due":"देय तिथि",
  "Loading...":"लोड हो रहा है...", "No grievances recorded for this selection.":"इस चयन के लिए कोई शिकायत दर्ज नहीं है।", "Could not reach backend":"बैकएंड से संपर्क नहीं हो सका", "Route":"रूट करें", "Resolve":"समाधान करें", "Closed":"बंद", "Anonymous":"गुमनाम", "No Actions":"कोई कार्रवाई नहीं", "Action Not Permitted":"कार्रवाई की अनुमति नहीं है",
  "Connection restored":"कनेक्शन बहाल", "Pending inspections will sync now.":"लंबित निरीक्षण अब सिंक होंगे।", "You are offline":"आप ऑफलाइन हैं", "Inspection submissions will be saved on this device until connection returns.":"कनेक्शन वापस आने तक निरीक्षण इस डिवाइस पर सुरक्षित रहेंगे।", "Synced ✓":"सिंक हो गया ✓", "Queued — will sync":"कतार में रखा गया — बाद में सिंक होगा",
  "Authentication Succeeded":"प्रमाणीकरण सफल", "Checklist Auto-Filled":"जाँच सूची स्वतः भरी गई", "Photo Uploaded":"फोटो अपलोड हुई", "Upload Failed":"अपलोड विफल", "Submitted for Verification":"सत्यापन के लिए जमा किया गया", "Submission failed":"जमा करना विफल", "Verification Failed":"सत्यापन विफल", "Violation Approved & Closed":"उल्लंघन स्वीकृत एवं बंद", "Violation Returned for Re-work":"उल्लंघन पुनः कार्य के लिए लौटाया गया",
  "Pass":"पास", "Fail":"विफल", "Non-Compliant":"अनुपालन नहीं", "Compliant":"अनुपालन", "Critical":"गंभीर", "Elevated":"उन्नत जोखिम", "Normal":"सामान्य",
});
const khadanOriginalText = new WeakMap();
const khadanOriginalAttrs = new WeakMap();
function translatePhraseText(value, toHindi) {
  const raw = String(value ?? "");
  if (!toHindi) {
    // Use the reverse map for the same phrase-level engine when returning to English.
    const reverse = KHADAN_HI_TO_EN_EXT;
    let out = raw;
    for (const [hi, en] of reverse) out = out.split(hi).join(en);
    return out;
  }
  let out = raw;
  // Longest phrases first prevents short replacements from damaging a larger phrase.
  for (const [en, hi] of KHADAN_EN_TO_HI_EXT) out = out.split(en).join(hi);
  return out;
}
const KHADAN_EN_TO_HI_EXT = Object.entries(KHADAN_UI_HI).sort((a,b)=>b[0].length-a[0].length);
const KHADAN_HI_TO_EN_EXT = Object.entries(KHADAN_UI_HI).map(([en,hi])=>[hi,en]).sort((a,b)=>b[0].length-a[0].length);
function translateValue(value) {
  return translatePhraseText(value, khadanCurrentLang === "hi");
}
function applyTranslations() {
  const dict = KHADAN_TRANSLATIONS[khadanCurrentLang] || KHADAN_TRANSLATIONS.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,textarea,[data-i18n]")) continue;
    if (!khadanOriginalText.has(node)) khadanOriginalText.set(node, node.nodeValue);
    const original = khadanOriginalText.get(node);
    node.nodeValue = translatePhraseText(original, khadanCurrentLang === "hi");
  }
  document.querySelectorAll("input,textarea,button,[title],[aria-label]").forEach(el => {
    ["placeholder","title","aria-label"].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      let saved = khadanOriginalAttrs.get(el); if (!saved) { saved = {}; khadanOriginalAttrs.set(el,saved); }
      if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
      el.setAttribute(attr, translatePhraseText(saved[attr], khadanCurrentLang === "hi"));
    });
  });
  const selector = document.getElementById("language-selector");
  if (selector) selector.value = khadanCurrentLang;
  const btn = document.getElementById("lang-toggle-btn");
  if (btn) btn.textContent = khadanCurrentLang === "en" ? "हिन्दी" : "English";
  document.documentElement.setAttribute("lang", khadanCurrentLang);
}
function setLanguage(lang) {
  khadanCurrentLang = lang === "hi" ? "hi" : "en";
  try { localStorage.setItem("khadan_rakshak_lang", khadanCurrentLang); } catch (_) {}
  const selector = document.getElementById("language-selector");
  if (selector) selector.value = khadanCurrentLang;
  applyTranslations();
  if (typeof updateChatbotLanguageUI === "function") updateChatbotLanguageUI();
  if (typeof store !== "undefined" && store.currentScreen) {
    const screen = store.currentScreen;
    if (screen === 2 && typeof renderScreen2PastInspections === "function") renderScreen2PastInspections();
    if (screen === 3 && typeof renderChecklist === "function") renderChecklist();
    if (screen === 4 && typeof renderScreen4Review === "function") renderScreen4Review();
    if (screen === 5 && typeof renderScreen5Assignment === "function" && store.currentInspection) renderScreen5Assignment(Object.keys(store.currentInspection.results || {}).filter(id => store.currentInspection.results[id]?.status === "fail"));
    if (screen === 6 && typeof renderScreen6MyActions === "function") renderScreen6MyActions();
    if (screen === 7 && typeof renderScreen7 === "function") renderScreen7();
    if (screen === 8 && typeof renderScreen8Verifications === "function") renderScreen8Verifications();
    if (screen === 10 && typeof renderScreen10ViolationsTable === "function") renderScreen10ViolationsTable();
    if (screen === 12 && typeof renderScreen12ClosedViolations === "function") renderScreen12ClosedViolations();
    if (screen === 16 && typeof renderScreen16Grievances === "function") renderScreen16Grievances();
    if (screen === 17 && typeof renderScreen17GIS === "function") renderScreen17GIS();
    if (screen === 18 && typeof renderScreen18AuditLog === "function") renderScreen18AuditLog();
    if (screen === 19 && typeof renderScreen19Reminders === "function") renderScreen19Reminders();
    requestAnimationFrame(applyTranslations);
  }
}

function toggleLanguage() {
  setLanguage(khadanCurrentLang === "en" ? "hi" : "en");
}
let khadanTranslationObserver;
function startKhadanTranslationObserver() {
  if (khadanTranslationObserver || !document.body) return;
  khadanTranslationObserver = new MutationObserver(() => {
    if (khadanTranslationObserver) { khadanTranslationObserver.disconnect(); applyTranslations(); khadanTranslationObserver.observe(document.body,{childList:true,subtree:true}); }
  });
  khadanTranslationObserver.observe(document.body,{childList:true,subtree:true});
}

document.addEventListener("DOMContentLoaded", () => { applyTranslations(); startKhadanTranslationObserver(); if (typeof updateChatbotLanguageUI === "function") updateChatbotLanguageUI(); });
if (document.readyState !== "loading") { applyTranslations(); startKhadanTranslationObserver(); }

/* =======================================================================
   LIVE-UPDATE INTEGRATION: extend live-integration.js's event labels
   so Phase 3 mutations (grievances, reminders) also produce toasts and
   refresh whichever new screen is currently open.
   ======================================================================= */
if (typeof LIVE_EVENT_LABELS === "object") {
  Object.assign(LIVE_EVENT_LABELS, {
    grievance_submitted: { title: "New Grievance Filed", type: "info" },
    grievance_routed: { title: "Grievance Routed", type: "info" },
    grievance_resolved: { title: "Grievance Resolved", type: "success" },
    reminders_generated: { title: "Reminder Engine Scan", type: "info" },
    reminder_acknowledged: { title: "Reminder Acknowledged", type: "success" },
    reminder_escalated: { title: "Reminder Escalated", type: "warning" },
  });
}

if (typeof refreshPhase1ScreenIfActive === "function") {
  const originalRefresh = refreshPhase1ScreenIfActive;
  window.refreshPhase1ScreenIfActive = function (msg) {
    originalRefresh(msg);
    if (typeof store === "undefined") return;
    const activeScreen = store.currentScreen;
    if (activeScreen === 16 && ["grievance_submitted", "grievance_routed", "grievance_resolved"].includes(msg.event)) {
      renderScreen16Grievances();
    }
    if (activeScreen === 19 && ["reminders_generated", "reminder_acknowledged", "reminder_escalated"].includes(msg.event)) {
      renderScreen19Reminders();
    }
  };
}
