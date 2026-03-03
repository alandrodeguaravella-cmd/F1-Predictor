/* =========================
   F1 2026 Predictor (Front-end only)
   Drag & drop ranking for:
   - Per race: pole + top 22
   - Season: drivers top 22
   - Season: constructors top 11
   Autosaves in localStorage
   ========================= */

const LS_KEY = "f1_2026_predictor_v1";

/** ASSET MODE
 * "placeholder" = initials
 * "local" = loads from /assets (code-based images)
 */
const ASSET_MODE = "local"; // "placeholder" | "local"

const ASSETS = {
  driversPath: "assets/drivers/",
  teamsPath: "assets/teams/",
  flagsPath: "assets/flags/",
  driverExt: "png",
  teamExt: "png",
  flagExt: "png"
};

// ---------- DATA ----------
const TEAMS = [
  { id:"ferrari", name:"Ferrari", drivers:["Leclerc","Hamilton"] },
  { id:"redbull", name:"Red Bull", drivers:["Verstappen","Hadjar"] },
  { id:"mercedes", name:"Mercedes", drivers:["Russell","Kimi Antonelli"] },
  { id:"cadillac", name:"Cadillac", drivers:["Perez","Bottas"] },
  { id:"mclaren", name:"McLaren", drivers:["Norris","Piastri"] },
  { id:"williams", name:"Williams", drivers:["Sainz","Albon"] },
  { id:"aston", name:"Aston Martin", drivers:["Alonso","Stroll"] },
  { id:"alpine", name:"Alpine", drivers:["Gasly","Colapinto"] },
  { id:"haas", name:"Haas", drivers:["Bearman","Ocon"] },
  { id:"audi", name:"Audi", drivers:["Bortoleto","Hulkenberg"] },
  { id:"vcarb", name:"VCARB", drivers:["Lawson","Lindblad"] },
];

const DRIVERS = TEAMS.flatMap(t =>
  t.drivers.map(fullName => ({
    id: slug(fullName),
    name: fullName,
    teamId: t.id,
    teamName: t.name
  }))
);

const RACES = [
  { id:"aus", name:"Australian Grand Prix", date:"6 – 8 Mar 2026", location:"Melbourne, AUS", flag:"AUS" },
  { id:"chn", name:"Chinese Grand Prix", date:"13 – 15 Mar 2026", location:"Shanghai, CHN", flag:"CHN" },
  { id:"jpn", name:"Japanese Grand Prix", date:"27 – 29 Mar 2026", location:"Suzuka, JPN", flag:"JPN" },
  { id:"bhr", name:"Bahrain Grand Prix", date:"10 – 12 Apr 2026", location:"Sakhir, BHR", flag:"BHR" },
  { id:"sau", name:"Saudi Arabian Grand Prix", date:"17 – 19 Apr 2026", location:"Jeddah, SAU", flag:"SAU" },
  { id:"mia", name:"Miami Grand Prix", date:"1 – 3 May 2026", location:"Miami, USA", flag:"USA" },
  { id:"can", name:"Canadian Grand Prix", date:"22 – 24 May 2026", location:"Montreal, CAN", flag:"CAN" },
  { id:"mco", name:"Monaco Grand Prix", date:"5 – 7 Jun 2026", location:"Monaco, MON", flag:"MON" },
  { id:"esp1", name:"Barcelona-Catalunya Grand Prix", date:"12 – 14 Jun 2026", location:"Barcelona, ESP", flag:"ESP" },
  { id:"aut", name:"Austrian Grand Prix", date:"26 – 28 Jun 2026", location:"Spielberg, AUT", flag:"AUT" },
  { id:"gbr", name:"British Grand Prix", date:"3 – 5 Jul 2026", location:"Silverstone, GBR", flag:"GBR" },
  { id:"bel", name:"Belgian Grand Prix", date:"17 – 19 Jul 2026", location:"Spa-Francorchamps, BEL", flag:"BEL" },
  { id:"hun", name:"Hungarian Grand Prix", date:"24 – 26 Jul 2026", location:"Budapest, HUN", flag:"HUN" },
  { id:"ned", name:"Dutch Grand Prix", date:"21 – 23 Aug 2026", location:"Zandvoort, NED", flag:"NED" },
  { id:"ita", name:"Italian Grand Prix", date:"4 – 6 Sep 2026", location:"Monza, ITA", flag:"ITA" },
  { id:"esp2", name:"Spanish Grand Prix", date:"11 – 13 Sep 2026", location:"Madrid, ESP", flag:"ESP" },
  { id:"aze", name:"Azerbaijan Grand Prix", date:"24 – 26 Sep 2026", location:"Baku, AZE", flag:"AZE" },
  { id:"sgp", name:"Singapore Grand Prix", date:"9 – 11 Oct 2026", location:"Singapore, SGP", flag:"SGP" },
  { id:"usa", name:"United States Grand Prix", date:"23 – 25 Oct 2026", location:"Austin, USA", flag:"USA" },
  { id:"mex", name:"Mexico City Grand Prix", date:"30 Oct – 1 Nov 2026", location:"Mexico City, MEX", flag:"MEX" },
  { id:"bra", name:"Brazilian Grand Prix", date:"6 – 8 Nov 2026", location:"São Paulo, BRA", flag:"BRA" },
  { id:"lvg", name:"Las Vegas Grand Prix", date:"19 – 21 Nov 2026", location:"Las Vegas, USA", flag:"USA" },
  { id:"qat", name:"Qatar Grand Prix", date:"27 – 29 Nov 2026", location:"Lusail, QAT", flag:"QAT" },
  { id:"abu", name:"Abu Dhabi Grand Prix", date:"4 – 6 Dec 2026", location:"Yas Marina, UAE", flag:"UAE" },
];

// ---------- STATE ----------
const defaultState = () => ({
  activeRaceId: RACES[0].id,
  racePredictions: {},
  seasonDrivers: { order: [] },
  constructors: { order: [] },
  ui: { racePoolSearch: "", racePoolTeam: "all" }
});

let state = loadState();

// ---------- DOM ----------
const tabs = [...document.querySelectorAll(".tab")];
const panels = {
  race: document.getElementById("panel-race"),
  seasonDrivers: document.getElementById("panel-seasonDrivers"),
  constructors: document.getElementById("panel-constructors"),
  manage: document.getElementById("panel-manage"),
};

const raceSelect = document.getElementById("raceSelect");
const raceDatePill = document.getElementById("raceDatePill");
const raceLocationText = document.getElementById("raceLocationText");
const raceFlagIcon = document.getElementById("raceFlagIcon");

const poleZone = document.querySelector(".poleZone");
const raceRankList = document.getElementById("raceRankList");
const driverPool = document.getElementById("driverPool");

const driverSearch = document.getElementById("driverSearch");
const teamFilter = document.getElementById("teamFilter");
const shufflePoolBtn = document.getElementById("shufflePool");
const clearPoolFiltersBtn = document.getElementById("clearPoolFilters");

const seasonDriversRankList = document.getElementById("seasonDriversRankList");
const seasonDriversPool = document.getElementById("seasonDriversPool");

const constructorsRankList = document.getElementById("constructorsRankList");
const constructorsPool = document.getElementById("constructorsPool");

// Manage
const exportBox = document.getElementById("exportBox");
const importBox = document.getElementById("importBox");
const toastEl = document.getElementById("toast");

// Buttons
document.getElementById("resetRace").addEventListener("click", resetActiveRace);
document.getElementById("saveRace").addEventListener("click", () => { saveState(); toast("Race saved ✅"); });

document.getElementById("resetSeasonDrivers").addEventListener("click", resetSeasonDrivers);
document.getElementById("saveSeasonDrivers").addEventListener("click", () => { saveState(); toast("Season drivers saved ✅"); });

document.getElementById("resetConstructors").addEventListener("click", resetConstructors);
document.getElementById("saveConstructors").addEventListener("click", () => { saveState(); toast("Constructors saved ✅"); });

document.getElementById("refreshExport").addEventListener("click", refreshExport);
document.getElementById("copyExport").addEventListener("click", copyExport);
document.getElementById("importBtn").addEventListener("click", importFromBox);
document.getElementById("clearAll").addEventListener("click", clearAll);

// Filters
driverSearch.addEventListener("input", () => {
  state.ui.racePoolSearch = driverSearch.value;
  saveState(false);
  renderRace();
});
teamFilter.addEventListener("change", () => {
  state.ui.racePoolTeam = teamFilter.value;
  saveState(false);
  renderRace();
});
shufflePoolBtn.addEventListener("click", () => {
  state.ui.__shuffleSeed = Math.random().toString(36).slice(2);
  renderRace();
});
clearPoolFiltersBtn.addEventListener("click", () => {
  state.ui.racePoolSearch = "";
  state.ui.racePoolTeam = "all";
  driverSearch.value = "";
  teamFilter.value = "all";
  saveState(false);
  renderRace();
});

// Tabs
tabs.forEach(btn => btn.addEventListener("click", () => {
  tabs.forEach(t => t.classList.remove("active"));
  btn.classList.add("active");

  Object.values(panels).forEach(p => p.classList.remove("active"));
  const tab = btn.dataset.tab;
  panels[tab].classList.add("active");

  if (tab === "manage") refreshExport();
}));

// Race select
raceSelect.addEventListener("change", () => {
  state.activeRaceId = raceSelect.value;
  saveState(false);
  renderRace();
});

// ---------- INIT ----------
init();

function init(){
  raceSelect.innerHTML = RACES.map(r =>
    `<option value="${r.id}">${r.name} • ${r.date}</option>`
  ).join("");
  raceSelect.value = state.activeRaceId;

  teamFilter.innerHTML = [
    `<option value="all">All teams</option>`,
    ...TEAMS.map(t => `<option value="${t.id}">${t.name}</option>`)
  ].join("");
  teamFilter.value = state.ui.racePoolTeam ?? "all";
  driverSearch.value = state.ui.racePoolSearch ?? "";

  if (!state.racePredictions) state.racePredictions = {};
  if (!state.seasonDrivers) state.seasonDrivers = { order: [] };
  if (!state.constructors) state.constructors = { order: [] };

  makeDropZone(poleZone, handleDropPole);
  makeDropZone(driverPool, handleDropToPool);
  makeDropZone(seasonDriversPool, handleDropToSeasonDriversPool);
  makeDropZone(constructorsPool, handleDropToConstructorsPool);

  renderAll();
}

function renderAll(){
  renderRace();
  renderSeasonDrivers();
  renderConstructors();
}

function renderRace(){
  const race = RACES.find(r => r.id === state.activeRaceId) || RACES[0];
  raceDatePill.textContent = race.date;

  // pill text + optional flag image
  if (raceLocationText) raceLocationText.textContent = `${race.location} • ${race.flag}`;
  if (raceFlagIcon){
    raceFlagIcon.innerHTML = "";
    const src = getFlagImage(race.flag);
    if (!src){
      raceFlagIcon.textContent = "🏁";
    } else {
      const img = document.createElement("img");
      img.src = src; // assets/flags/aus.png
      img.alt = race.flag;
      img.addEventListener("error", () => {
        raceFlagIcon.textContent = "🏁";
      });
      raceFlagIcon.appendChild(img);
    }
  }

  if (!state.racePredictions[race.id]){
    state.racePredictions[race.id] = { pole: null, order: [] };
  }
  const rp = state.racePredictions[race.id];

  poleZone.innerHTML = "";
  if (rp.pole){
    const d = DRIVERS.find(x => x.id === rp.pole);
    if (d) poleZone.appendChild(makeDriverCard(d, { context:"pole" }));
  } else {
    const hint = document.createElement("div");
    hint.className = "zoneHint";
    hint.textContent = "Drop 1 driver here";
    poleZone.appendChild(hint);
  }

  raceRankList.innerHTML = "";
  for (let i=1; i<=22; i++){
    const slot = document.createElement("li");
    slot.className = "rankSlot";
    slot.dataset.pos = String(i);

    const idx = document.createElement("div");
    idx.className = "slotIndex";
    idx.textContent = String(i);

    const target = document.createElement("div");
    target.className = "dropTarget empty";
    target.dataset.zone = "raceRank";
    target.dataset.pos = String(i);

    const driverId = rp.order[i-1] ?? null;
    if (driverId){
      const d = DRIVERS.find(x => x.id === driverId);
      if (d){
        target.classList.remove("empty");
        target.appendChild(makeDriverCard(d, { context:"raceRank" }));
      }
    }

    makeDropZone(target, handleDropRaceRankSlot);

    slot.appendChild(idx);
    slot.appendChild(target);
    raceRankList.appendChild(slot);
  }

  const used = new Set([rp.pole, ...rp.order].filter(Boolean));
  let poolDrivers = DRIVERS.filter(d => !used.has(d.id));

  const q = (state.ui.racePoolSearch || "").toLowerCase().trim();
  const tf = state.ui.racePoolTeam || "all";
  if (tf !== "all") poolDrivers = poolDrivers.filter(d => d.teamId === tf);
  if (q) poolDrivers = poolDrivers.filter(d =>
    d.name.toLowerCase().includes(q) || d.teamName.toLowerCase().includes(q)
  );

  if (state.ui.__shuffleSeed){
    poolDrivers = shuffle(poolDrivers, state.ui.__shuffleSeed);
  }

  driverPool.innerHTML = "";
  poolDrivers.forEach(d => driverPool.appendChild(makeDriverCard(d, { context:"pool" })));
}

function renderSeasonDrivers(){
  seasonDriversRankList.innerHTML = "";
  const ranked = state.seasonDrivers.order || [];

  for (let i=1; i<=22; i++){
    const slot = document.createElement("li");
    slot.className = "rankSlot";
    slot.dataset.pos = String(i);

    const idx = document.createElement("div");
    idx.className = "slotIndex";
    idx.textContent = String(i);

    const target = document.createElement("div");
    target.className = "dropTarget empty";
    target.dataset.zone = "seasonDriversRank";
    target.dataset.pos = String(i);

    const driverId = ranked[i-1] ?? null;
    if (driverId){
      const d = DRIVERS.find(x => x.id === driverId);
      if (d){
        target.classList.remove("empty");
        target.appendChild(makeDriverCard(d, { context:"seasonDriversRank" }));
      }
    }

    makeDropZone(target, handleDropSeasonDriversRankSlot);

    slot.appendChild(idx);
    slot.appendChild(target);
    seasonDriversRankList.appendChild(slot);
  }

  const used = new Set(ranked.filter(Boolean));
  const pool = DRIVERS.filter(d => !used.has(d.id));

  seasonDriversPool.innerHTML = "";
  pool.forEach(d => seasonDriversPool.appendChild(makeDriverCard(d, { context:"seasonDriversPool" })));
}

function renderConstructors(){
  constructorsRankList.innerHTML = "";
  const ranked = state.constructors.order || [];

  for (let i=1; i<=11; i++){
    const slot = document.createElement("li");
    slot.className = "rankSlot";
    slot.dataset.pos = String(i);

    const idx = document.createElement("div");
    idx.className = "slotIndex";
    idx.textContent = String(i);

    const target = document.createElement("div");
    target.className = "dropTarget empty";
    target.dataset.zone = "constructorsRank";
    target.dataset.pos = String(i);

    const teamId = ranked[i-1] ?? null;
    if (teamId){
      const t = TEAMS.find(x => x.id === teamId);
      if (t){
        target.classList.remove("empty");
        target.appendChild(makeTeamCard(t, { context:"constructorsRank" }));
      }
    }

    makeDropZone(target, handleDropConstructorsRankSlot);

    slot.appendChild(idx);
    slot.appendChild(target);
    constructorsRankList.appendChild(slot);
  }

  const used = new Set(ranked.filter(Boolean));
  const pool = TEAMS.filter(t => !used.has(t.id));

  constructorsPool.innerHTML = "";
  pool.forEach(t => constructorsPool.appendChild(makeTeamCard(t, { context:"constructorsPool" })));
}

// ---------- CARDS ----------
function makeDriverCard(driver, opts={}){
  const el = document.createElement("div");
  el.className = "driverCard";
  el.draggable = true;
  el.dataset.type = "driver";
  el.dataset.id = driver.id;
  el.dataset.from = opts.context || "unknown";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.appendChild(makeImageOrInitial(getDriverImage(driver), initials(driver.name)));

  const logo = document.createElement("div");
  logo.className = "logo";
  logo.appendChild(makeImageOrInitial(getTeamLogo(driver.teamId), teamAbbr(driver.teamName)));

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<div class="name">${driver.name}</div><div class="sub">${driver.teamName}</div>`;

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = "DRIVER";

  el.appendChild(avatar);
  el.appendChild(logo);
  el.appendChild(meta);
  el.appendChild(badge);

  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      type:"driver",
      id: driver.id,
      from: el.dataset.from
    }));
    e.dataTransfer.effectAllowed = "move";
  });

  return el;
}

function makeTeamCard(team, opts={}){
  const el = document.createElement("div");
  el.className = "teamCard";
  el.draggable = true;
  el.dataset.type = "team";
  el.dataset.id = team.id;
  el.dataset.from = opts.context || "unknown";

  const logo = document.createElement("div");
  logo.className = "avatar";
  logo.appendChild(makeImageOrInitial(getTeamLogo(team.id), teamAbbr(team.name)));

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<div class="name">${team.name}</div><div class="sub">${team.drivers.join(", ")}</div>`;

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = "TEAM";

  el.appendChild(logo);
  el.appendChild(meta);
  el.appendChild(badge);

  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      type:"team",
      id: team.id,
      from: el.dataset.from
    }));
    e.dataTransfer.effectAllowed = "move";
  });

  return el;
}

function makeImageOrInitial(src, fallbackText){
  if (!src){
    const span = document.createElement("span");
    span.textContent = fallbackText;
    return span;
  }
  const img = document.createElement("img");
  img.src = src;
  img.alt = fallbackText;
  img.width = 34;
  img.height = 34;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.addEventListener("error", () => {
    img.replaceWith(Object.assign(document.createElement("span"), { textContent: fallbackText }));
  });
  return img;
}

// ---------- DROP ZONES ----------
function makeDropZone(el, onDrop){
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("dragOver");
    e.dataTransfer.dropEffect = "move";
  });
  el.addEventListener("dragleave", () => el.classList.remove("dragOver"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("dragOver");
    const payload = safeParse(e.dataTransfer.getData("application/json"));
    if (!payload) return;
    onDrop(payload, el);
  });
}

// ----- Race drops
function handleDropPole(payload){
  if (payload.type !== "driver") return;

  const raceId = state.activeRaceId;
  const rp = state.racePredictions[raceId] || { pole:null, order:[] };

  rp.order = (rp.order || []).filter(id => id !== payload.id);
  rp.pole = payload.id;

  state.racePredictions[raceId] = rp;
  saveState(false);
  renderRace();
}

function handleDropRaceRankSlot(payload, slotEl){
  if (payload.type !== "driver") return;

  const pos = Number(slotEl.dataset.pos);
  if (!pos || pos < 1 || pos > 22) return;

  const raceId = state.activeRaceId;
  const rp = state.racePredictions[raceId] || { pole:null, order:[] };
  rp.order = rp.order || [];

  const targetIdx = pos - 1;
  const draggedId = payload.id;

  // Who is currently in the target slot?
  const replacedId = rp.order[targetIdx] ?? null;

  // Remove dragged from pole/order
  if (rp.pole === draggedId) rp.pole = null;

  // If dragging from within raceRank, find its old index
  const oldIdx = rp.order.findIndex(id => id === draggedId);

  // Remove dragged from its old position
  if (oldIdx !== -1) rp.order[oldIdx] = null;

  // Place dragged into target
  rp.order[targetIdx] = draggedId;

  // If we replaced someone, put them back where dragged came from (swap),
  // otherwise just remove them (they go back to pool automatically because not used).
  if (replacedId && replacedId !== draggedId){
    if (oldIdx !== -1){
      rp.order[oldIdx] = replacedId; // swap
    } else {
      // dragged came from pool/pole → replaced goes back to pool (do nothing)
    }
  }

  state.racePredictions[raceId] = rp;
  saveState(false);
  renderRace();
}

function handleDropToPool(payload){
  if (payload.type !== "driver") return;

  const raceId = state.activeRaceId;
  const rp = state.racePredictions[raceId] || { pole:null, order:[] };

  if (rp.pole === payload.id) rp.pole = null;

  // Remove driver from order cleanly
  rp.order = (rp.order || []).map(id => (id === payload.id ? null : id));

  state.racePredictions[raceId] = rp;
  saveState(false);
  renderRace();
}

// ----- Season drivers drops
function handleDropSeasonDriversRankSlot(payload, slotEl){
  if (payload.type !== "driver") return;

  const pos = Number(slotEl.dataset.pos);
  if (!pos || pos < 1 || pos > 22) return;

  const ranked = state.seasonDrivers.order || [];
  const targetIdx = pos - 1;
  const draggedId = payload.id;

  const replacedId = ranked[targetIdx] ?? null;
  const oldIdx = ranked.findIndex(id => id === draggedId);

  if (oldIdx !== -1) ranked[oldIdx] = null;
  ranked[targetIdx] = draggedId;

  if (replacedId && replacedId !== draggedId){
    if (oldIdx !== -1){
      ranked[oldIdx] = replacedId; // swap
    }
  }

  state.seasonDrivers.order = ranked;
  saveState(false);
  renderSeasonDrivers();
}

function handleDropToSeasonDriversPool(payload){
  if (payload.type !== "driver") return;

  state.seasonDrivers.order = (state.seasonDrivers.order || []).map(id => (id === payload.id ? null : id));
  saveState(false);
  renderSeasonDrivers();
}

// ----- Constructors drops
function handleDropConstructorsRankSlot(payload, slotEl){
  if (payload.type !== "team") return;

  const pos = Number(slotEl.dataset.pos);
  if (!pos || pos < 1 || pos > 11) return;

  const ranked = state.constructors.order || [];
  const targetIdx = pos - 1;
  const draggedId = payload.id;

  const replacedId = ranked[targetIdx] ?? null;
  const oldIdx = ranked.findIndex(id => id === draggedId);

  if (oldIdx !== -1) ranked[oldIdx] = null;
  ranked[targetIdx] = draggedId;

  if (replacedId && replacedId !== draggedId){
    if (oldIdx !== -1){
      ranked[oldIdx] = replacedId; // swap
    }
  }

  state.constructors.order = ranked;
  saveState(false);
  renderConstructors();
}

function handleDropToConstructorsPool(payload){
  if (payload.type !== "team") return;

  state.constructors.order = (state.constructors.order || []).map(id => (id === payload.id ? null : id));
  saveState(false);
  renderConstructors();
}

// ---------- RESET ----------
function resetActiveRace(){
  const raceId = state.activeRaceId;
  state.racePredictions[raceId] = { pole:null, order:[] };
  saveState(false);
  renderRace();
  toast("Race reset ✅");
}

function resetSeasonDrivers(){
  state.seasonDrivers.order = [];
  saveState(false);
  renderSeasonDrivers();
  toast("Season drivers reset ✅");
}

function resetConstructors(){
  state.constructors.order = [];
  saveState(false);
  renderConstructors();
  toast("Constructors reset ✅");
}

function clearAll(){
  state = defaultState();
  saveState(true);
  raceSelect.value = state.activeRaceId;
  driverSearch.value = "";
  teamFilter.value = "all";
  renderAll();
  refreshExport();
  toast("Cleared ✅");
}

// ---------- MANAGE ----------
function refreshExport(){
  exportBox.value = JSON.stringify(state, null, 2);
}

async function copyExport(){
  try{
    await navigator.clipboard.writeText(exportBox.value || "");
    toast("Copied ✅");
  }catch{
    toast("Copy failed (browser blocked clipboard).");
  }
}

function importFromBox(){
  const data = safeParse(importBox.value);
  if (!data){
    toast("Invalid JSON ❌");
    return;
  }
  if (!data.activeRaceId || !data.racePredictions){
    toast("JSON does not look like this app’s export ❌");
    return;
  }
  state = data;
  saveState(true);

  raceSelect.value = state.activeRaceId;
  driverSearch.value = state.ui?.racePoolSearch || "";
  teamFilter.value = state.ui?.racePoolTeam || "all";

  renderAll();
  refreshExport();
  toast("Imported ✅");
}

function toast(msg){
  toastEl.textContent = msg;
  setTimeout(() => {
    if (toastEl.textContent === msg) toastEl.textContent = "";
  }, 2400);
}

// ---------- STORAGE ----------
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  }catch{
    return defaultState();
  }
}

function saveState(refreshExportBox=true){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }catch{}
  if (refreshExportBox) refreshExport();
}

// ---------- ASSET HELPERS ----------
function getTeamLogo(teamId){
  if (ASSET_MODE !== "local") return null;
  return `images/teams/${teamId}.png`;
}

function getDriverImage(driver){
  if (ASSET_MODE !== "local") return null;
  return `images/drivers/${driver.id}.png`;
}

function getFlagImage(flagCode){
  if (ASSET_MODE !== "local") return null;
  return `images/flags/${String(flagCode).toLowerCase()}.png`;
}

// ---------- UTIL ----------
function slug(s){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

function initials(name){
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[parts.length-1]?.[0] || "";
  return (a + b).toUpperCase();
}

function teamAbbr(teamName){
  const map = {
    "Ferrari":"FER",
    "Red Bull":"RBR",
    "Mercedes":"MER",
    "Cadillac":"CAD",
    "McLaren":"MCL",
    "Williams":"WIL",
    "Aston Martin":"AST",
    "Alpine":"ALP",
    "Haas":"HAA",
    "Audi":"AUD",
    "VCARB":"VCB",
  };
  return map[teamName] || teamName.slice(0,3).toUpperCase();
}

function safeParse(s){
  try { return JSON.parse(s); } catch { return null; }
}

function shuffle(arr, seedStr){
  let seed = 0;
  for (let i=0;i<seedStr.length;i++) seed = (seed*31 + seedStr.charCodeAt(i)) >>> 0;

  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i+1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}