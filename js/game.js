// ===================== ENGINE + UI =====================
import { TURNS, RANKS, BUILDINGS, WORKPLACES, TYPEWRITERS, TRAITS, FAKEABLE, generatePeople, INCIDENTS, OVERHEARD, NEWS_SRC, HOLIDAYS, monthOf, makeLinks, LINKS, NEEDS } from "./data.js";
import { STORY, CONDITIONAL } from "./events.js";
import { createWorld } from "./world.js";
import { loadModels } from "./assets.js";
import { sfx, unlock as unlockAudio, startRing, stopRing, radio as radioSound, soundOn, setSound } from "./audio.js";
import { playMinigame, MINI } from "./minigames.js";
import { openDaily, dailyResult, todayKey } from "./daily.js";
import { MEDALS, medals, award, ARCHIVE, MODS, unlockedMods } from "./meta.js";
import { RULES, CHRONICLE } from "./lexicon.js";
import { SKILLS, SK_MAX, XP_PER_POINT, XP, REP, repWord, ERRANDS, errandFor, buildStory, DENIALS } from "./rpg.js";

const SAVE = "akte-save-v6", ENDS = "akte-endings-v2";
const QUOTA = { 1983: { res: 1, ims: 1 }, 1984: { res: 2, ims: 1 }, 1985: { res: 2, ims: 2 }, 1986: { res: 3, ims: 2 }, 1987: { res: 4, ims: 3 }, 1988: { res: 4, ims: 3 }, 1989: { res: 4, ims: 3 } };
const CODES = ["Rose", "Kranich", "Falke", "Tulpe", "Sonne", "Igel", "Birke", "Anker", "Kompass", "Feder", "Linde", "Pinsel", "Rabe", "Kerze", "Glocke", "Adler", "Uhr", "Heide", "Ostsee", "Stein", "Mohn", "Wolke", "Fichte", "Brücke", "Ahorn", "Taube", "Spiegel", "Distel"];
const ENDINGS = { overgelopen: "Defected", gearresteerd: "A file of your own", overgeplaatst: "Bitterfeld", nee: "The man who said no", major: "Genosse Major", kantoor: "A small job", werk: "‘I was doing my job’", naam: "A name in everyone's file" };
const ZERS = ["Their post arrives opened, with something missing every time.", "Colleagues receive anonymous letters full of half-truths.", "Furniture in the flat has been moved when they come home. Nothing is stolen.", "The car tyres are flat every week. Again and again.", "Friends are told there is an informer in the group. Suspicion falls on exactly the wrong person."];

let S = null, world = null;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const R = Math.random;
const rand = a => a && a.length ? a[Math.floor(R() * a.length)] : undefined;
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(v)));
const P = id => S.people.find(p => p.id === id);
const Bd = id => BUILDINGS.find(b => b.id === id);
const rank = () => RANKS[S.rank];
const turn = () => TURNS[S.t];
const free = q => q.status === "vrij" || q.status === "zersetzt";
const imCount = () => S.people.filter(p => p.status === "im").length;
const pool = () => Object.keys(S.bugs).length + Object.keys(S.taps).length;
const pron = p => p.sex === "f" ? "she" : "he";
const Pron = p => p.sex === "f" ? "She" : "He";
const obj = p => p.sex === "f" ? "her" : "him";
const STATUS_L = { vrij: "free", im: "IM", gevangen: "imprisoned", zersetzt: "zersetzt", gevlucht: "fled", uitgereisd: "emigrated", overgeplaatst: "transferred" };
const trLabel = t => t === "dubbel" ? "Secretly in contact with the opposition (double agent!)" : (TRAITS[t] ? TRAITS[t].l : t);
const twOf = p => p.traits.find(t => TRAITS[t] && TRAITS[t].tw);

function uid() { return Math.random().toString(36).slice(2, 9); }
const INV = { dm: ["Westgeld", "50 DM in an envelope"], kaffee: ["Jacobs Krönung", "a packet of West coffee"], buck: ["Bückware", "a tin of pineapple from under the counter"],
  kas: ["Cassette", "an ORWO C60: record a Treff or replay an interrogation"], minox: ["Minox camera", "every observation turns up at least two things"], set: ["Bugging set", "one more bug or phone tap at the same time"] };
// ---------- RPG (fase 3E) ----------
const sk = k => (S.sk && S.sk[k]) || 0;
const points = () => Math.floor(S.xp / XP_PER_POINT) - S.spent;
const bugCap = () => rank().bugs + (S.inv.set || 0) + (sk("tech") >= 3 ? 1 : 0);
const pc = v => Math.max(5, Math.min(95, Math.round(v)));
function rep(k, n) { if (k === "gezin") S.gezin = clamp(S.gezin + n); else if (k === "mfs") S.gunst = clamp(S.gunst + n); else S.rep[k] = clamp(S.rep[k] + n); }
const repV = k => k === "gezin" ? S.gezin : k === "mfs" ? S.gunst : S.rep[k];
const churchy = p => p.traits.some(t => ["kerk", "vrede", "milieu"].includes(t)) || p.work === "kerk";
function gainXP(n) {
  if (!n || !S) return; const before = points(); S.xp += n;
  while (S.rank < RANKS.length - 1 && S.xp >= RANKS[S.rank + 1].xp) { S.rank++; S.promo = (S.promo || 0) + 1; }
  if (points() > before) S.flags._sp = true;
}
// kans bij een gesprek: basis + vaardigheid + reputatie − angst/wrok
function talkChance(p, skill, base = 40) { return pc(base + sk(skill) * 9 + (S.rep.buurt - 50) / 4 + (churchy(p) ? (S.rep.kerk - 50) / 4 : 0) + (p.owes ? 15 : 0) - (p.fear || 0) / 5 - p.dis / 4); }
function showPromo(next) {
  S.promo = 0; sfx.fanfare(); if (S.rank >= 3) medal("major"); save(); refresh();
  modal(`<div class="promo"><div class="epau"><i></i><i></i><i></i></div><div class="ptxt"><div class="dymo">Beförderung</div><b>${esc(rank().id)}</b><small>Kessler pins the new shoulder boards on you himself.</small></div></div>
    <div class="result">‘Experience counts, comrade. They are talking about you at Normannenstraße.’\n\nFrom next turn: ${rank().mk} manpower, room for ${rank().ims} IMs and ${rank().bugs} bugging sets.</div><button class="next" id="nx">Continue</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); if (next) next(); }, { lock: true });
}
function invAdd(k, n = 1) { S.inv[k] = Math.max(0, (S.inv[k] || 0) + n); }
function medal(id) { if (award(id)) { sfx.fanfare(); toast(`<b>Decoration:</b> ${esc(MEDALS[id].t)}`); } }
// ---------- verbanden en dossiercompleetheid (prikbord) ----------
const conf = (p, t) => p.known[t] && p.known[t].s === "zeker";
const linksOf = p => S.links.filter(l => l.a === p.id || l.b === p.id);
function discoverLinks() {
  let n = 0;
  S.links.forEach(l => {
    if (l.found) return; const a = P(l.a), b = P(l.b); if (!a || !b) return;
    const ca = a.traits.includes(l.k) && conf(a, l.k), cb = b.traits.includes(l.k) && conf(b, l.k);
    let hit = ca && cb;
    [[a, ca], [b, cb]].forEach(([p, c]) => { if (!hit && c && !l.roll[p.id]) { l.roll[p.id] = 1; if (R() < 0.6) hit = true; } });
    if (hit) { l.found = true; n++; a.pages += 2; b.pages += 2; gainXP(XP.link); inbox("info", "New connection", `${a.name} ${LINKS[l.k].l} ${b.name}. A thread on your pinboard.`, a.id); }
  });
  if (n) { sfx.telex(4); if (S.links.filter(l => l.found).length >= 12) medal("faden"); }
  S.people.forEach(p => { if (!p.complete && !p.secretIM && completion(p) >= 100) { p.complete = true; S.stats.complete = (S.stats.complete || 0) + 1; p.pages += 5; applyE({ g: 2 }); gainXP(XP.complete); inbox("info", "File complete", `The file on ${p.name} is complete: VOLLSTÄNDIG. Kessler likes thick, finished files. (Favour +2, +${XP.complete} XP)`, p.id); if (S.stats.complete >= 5) medal("kartei"); } });
}
function secrets(p) { return p.traits.length + linksOf(p).length; }
function completion(p) { const tot = secrets(p); if (!tot) return 100; const k = p.traits.filter(t => conf(p, t)).length + linksOf(p).filter(l => l.found).length; return Math.round(k / tot * 100); }
// ---------- eigen dossier: wat ze over jou hebben ----------
let evCtx = "";
function ownNote(txt) { S.ownLog.push(`${turn().label}: ${txt}`); if (S.ownLog.length > 40) S.ownLog.shift(); }
function addLog(p, text) { if (p) p.log.push(`${turn().label}: ${text}`); }
function inbox(k, title, text, pid) { S.inbox.unshift({ id: uid(), k, title, text, pid, t: S.t, read: false }); if (S.inbox.length > 60) S.inbox.length = 60; }
function nextCode() { const c = CODES.find(c => !S.codes.includes(c)) || "X-" + S.codes.length; S.codes.push(c); return c; }
function makeIM(p, code) { if (!p) return; p.status = "im"; p.code = code || nextCode(); if (code) S.codes.push(code); p.lies = 0; S.stats.recruits++; addLog(p, `Recruited as IM „${p.code}“`);
  p.need = p.need || rand(Object.keys(NEEDS)); p.loyal = Math.max(20, p.loyal || 30); p.lastTreff = S.t; if (imCount() >= 6) medal("netz"); }

const A = {
  p: P, people: () => S.people, rand,
  pages: (id, n) => { const p = P(id); if (p) p.pages += n; },
  know: (id, t) => { const p = P(id); if (p && p.traits.includes(t)) p.known[t] = { s: "zeker" }; },
  log: (id, txt) => addLog(P(id), txt),
  setStatus: (id, st) => { const p = P(id); if (p) { p.status = st; if (st === "gevangen") S.stats.arrests++; } },
  makeIM: (id, code) => makeIM(P(id), code),
  spawnIM: (code, work) => { const c = S.people.filter(p => p.work === work && p.status === "vrij" && !p.family && !p.secretIM && p.id.startsWith("p")); const p = rand(c); if (p) makeIM(p, code.replace("-2", "")); },
  workers: w => S.people.filter(p => p.work === w),
  later: (n, id) => S.later.push({ t: S.t + n, id }),
  plantHomeBugs: () => { if (S.homeBugs) return; const sp = ["s_radio", "s_phone", "s_socket", "s_lamp", "s_pic", "s_oven", "s_sofa"].sort(() => R() - 0.5); S.homeBugs = { spots: sp.slice(0, 2), found: [], searched: [], since: S.t }; },
};

// ---------- opslaan ----------
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem(SAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { } }
function endings() { try { return JSON.parse(localStorage.getItem(ENDS) || "[]"); } catch (e) { return []; } }
function addEnding(id) { try { const e = endings(); if (!e.includes(id)) e.push(id); localStorage.setItem(ENDS, JSON.stringify(e)); } catch (e) { } }

// ===================== SPELVERLOOP =====================
function newGame(mods = []) {
  const seed = Math.floor(R() * 1e9);
  S = {
    mods, links: [], inv: { dm: 1, kaffee: 1, buck: 0, kas: 1, minox: 0, set: 0 }, xp: 0, spent: 0, sk: { obs: 0, verh: 0, ueb: 0, tech: 0, geh: 0 }, rep: { buurt: 50, kerk: 40 }, errands: [], promo: 0, warned: [], ownLog: [], homeBugs: null, talked: {}, used: {}, shredded: [],
    seed, t: 0, gunst: 50, geweten: 70, onrust: 18, dossier: 5, gezin: 60, fuchs: 0, rank: 0, mk: 0, mkNext: 0, res: 0, resTotal: 0,
    people: generatePeople(seed), bugs: {}, taps: {}, inbox: [], queue: [], case: null, caseN: 0, wrongs: [], flags: {}, fates: {}, fired: {},
    quota: null, later: [], home: false, tut: 0, stats: { arrests: 0, recruits: 0, zersetzung: 0, solved: 0, wrong: 0, observe: 0, complete: 0 }, codes: [], over: null,
  };
  S.links = makeLinks(S.people, seed);
  if (mods.includes("hase")) { S.rank = 1; S.xp = RANKS[1].xp; S.spent = Math.floor(S.xp / XP_PER_POINT); }
  startTurn();
}

function startTurn() {
  const T = turn();
  if (T.first || !S.quota) { const q = QUOTA[T.y]; S.quota = { res: q.res + (S.mods.includes("kessler") ? 1 : 0), ims: q.ims + (S.mods.includes("hase") ? 1 : 0) }; S.res = 0; if (S.t > 0) { invAdd("dm", 2); inbox("info", "Operative funds", `Kessler signs off this year's operative funds: 100 DM in two envelopes, for informers. They are in your strongbox.`); } }
  S.mk = Math.max(1, rank().mk + S.mkNext - (S.mods.includes("leine") ? 1 : 0)); S.mkNext = 0; S.home = false; S.used = {}; S.talked = {}; S.flags._arrested = null;
  S.buck = R() < 0.4 ? rand(["bananas", "tinned pineapple", "Spreewald gherkins in a jar", "Nordhäuser tights", "a Westpaket-size bag of coffee"]) : null;
  S.later = S.later.filter(l => { if (l.t <= S.t) { runLater(l.id); return false; } return true; });
  S.errands = S.errands.filter(x => { if (x.due >= S.t) return true; const p = P(x.pid); if (p) { p.dis = Math.min(95, p.dis + 5); addLog(p, "Asked you a favour. You never came back to it."); inbox("info", "A favour forgotten", `${p.name} asked you for ${ERRANDS[x.k].t.toLowerCase()}. You never got round to it. The building knows. (District −4)`, p.id); } rep("buurt", -4); return false; });
  const before = { onrust: S.onrust };
  if (S.t > 0) { drift(); imTick(); imReports(); bugReports(); tapReports(); fuchsTick(); homeBugTick(); flights(); S.gezin = clamp(S.gezin - 1 - (S.geweten < 30 ? 2 : 0)); S.gunst = clamp(S.gunst - (S.gunst > 75 ? 3 : 1)); S.rep.buurt += Math.sign(45 - S.rep.buurt); S.rep.kerk += Math.sign(40 - S.rep.kerk); maybeCase(); discoverLinks(); }
  queueEvents();
  save(); refresh();
  if (S.t > 0) briefing(before);
}

// ---------- maandoverzicht ----------
function monthsToReview() { let n = 0; for (let i = S.t; i < TURNS.length; i++) { if (TURNS[i].y !== turn().y) break; n++; if (TURNS[i].review) return n; } return null; }
function briefing(before) {
  if (S.promo) return showPromo(() => briefing(before));
  const T = turn(); const items = S.inbox.filter(i => i.t === S.t);
  const cnt = k => items.filter(i => i.k === k).length;
  const li = [];
  if (S.tut === 99 && S.flags._tutJustDone) { delete S.flags._tutJustDone; li.push("<b>The tutorial is over.</b> From now on, the strip at the bottom always shows your best next move."); }
  if (cnt("im")) li.push(`<b>${cnt("im")} report${cnt("im") > 1 ? "s" : ""}</b> from your informers ${cnt("im") > 1 ? "are" : "is"} waiting in <b>Files</b>.`);
  if (cnt("bug")) li.push(`<b>${cnt("bug")} bugged conversation${cnt("bug") > 1 ? "s" : ""}</b> waiting in <b>Files</b>.`);
  items.filter(i => i.k === "case").forEach(i => li.push(`<b>New case:</b> ${esc(i.title.replace("Case: ", ""))}. Find the culprit within 2 turns.`));
  items.filter(i => i.k === "warn" || i.k === "info").forEach(i => li.push(`<b>${esc(i.title)}</b>`));
  if (!cnt("im") && !cnt("bug")) li.push(`<span class="muted">No new information. Recruit informers or plant bugs.</span>`);
  
  if (S.flags._sp && points() > 0) { delete S.flags._sp; li.unshift(`<b>${points()} skill point${points() > 1 ? "s" : ""}</b> to spend. Tap your rank at the top.`); }
  const due = S.errands.filter(x => x.due === S.t); if (due.length) li.push(`<b>Last chance:</b> ${due.map(x => esc(P(x.pid).name)).join(", ")} still ${due.length > 1 ? "wait" : "waits"} for the favour you promised.`);
  const mr = monthsToReview(); const q = S.quota;
  const hol = HOLIDAYS[monthOf(T)], ov = overtimeKind();
  sfx.telex(12);
  modal(`<div class="kicker">New turn</div><h1>${esc(T.label)}</h1>
   ${newsHTML(T)}${hol ? `<div class="holi"><b>Calendar</b> ${esc(hol)}</div>` : ""}
   <ul class="brief">${li.slice(0, 4).map(x => `<li>${x}</li>`).join("")}${mr ? `<li>Annual target (in ${mr} turn${mr > 1 ? "s" : ""}): <b>${S.res}/${q.res}</b> results · <b>${imCount()}/${q.ims}</b> informers</li>` : ""}<li><b>${S.mk} manpower</b> this turn</li></ul>
   ${ov ? `<button class="ch ot" id="ot"><b>Überstunden: ${esc(MINI[ov].t)}</b><span>Optional, about 30 seconds. Success: +1 manpower this turn.</span></button>` : ""}
   <button class="next" id="nx">Get to work</button>${CHRONICLE[T.key] ? `<button class="next ghost" id="hb">What happened? (Handbook)</button>` : ""}`, m => {
    m.querySelector("#nx").onclick = () => { closeModal(); setMode("office"); };
    const hb = m.querySelector("#hb"); if (hb) hb.onclick = () => handbook("kroniek", () => briefing(before));
    const o = m.querySelector("#ot"); if (o) o.onclick = () => overtime(ov, () => briefing(before));
  }, { lock: true });
}

function newsHTML(T) {
  if (!T.news || !T.news.length) return "";
  return `<div class="news">${T.news.map(([src, t]) => `<div class="nw"><span class="nsrc ${src === "RIAS" || src === "ARD" ? "west" : ""}">${esc(NEWS_SRC[src] || src)}</span>${esc(t)}</div>`).join("")}</div>`;
}
// Überstunden: om de beurt een korte minigame voor 1 extra MP
function overtimeKind() { if (S.t < 2 || S.used.ot || turn().late) return null; return ["darkroom", "tape", "letter"][S.t % 3]; }
function overtime(kind, back) {
  S.used.ot = true; save();
  const opts = kind === "tape" ? { text: "we will see each other on Sunday the coffee was good the children are tired the stove is broken again", keys: rand([["Hungary", "form", "parcel"], ["Hamburg", "border", "lake"], ["leaflet", "stencil", "church"]]) } : kind === "letter" ? { to: rand(S.people.filter(p => free(p))).name, addr: "Berlin 1055" } : { seed: S.t * 7 + 3 };
  playMinigame(kind, mgUI, { ...opts, reward: "+1 manpower if you succeed" }, res => {
    if (res.ok) { S.mk++; save(); refresh(); }
    modal(`<h1>${res.ok ? "Good work" : "Never mind"}</h1><div class="result">${res.ok ? "Kessler notices you stayed late. One more manpower this turn." : "Nobody noticed. Back to your desk."}</div><button class="next" id="nx">Continue</button>`, m => m.querySelector("#nx").onclick = () => back(), { lock: true });
  });
}
const mgUI = { modal: (h, m, o) => modal(h, m, o), closeModal: () => closeModal(), sfx };

function runLater(id) {
  if (id === "anna-leave") { const a = P("anna"); if (a && (a.status === "vrij")) { a.status = "uitgereisd"; inbox("info", "Exit approved", "Anna Weiss has left the GDR. Her flat in Greifswalder Straße has already been reallocated.", "anna"); } }
}

function drift() {
  const y = turn().y; const yd = { 1983: 0, 1984: 0.2, 1985: 0.3, 1986: 0.5, 1987: 0.9, 1988: 1.8, 1989: 3.6 }[y];
  let sum = 0, n = 0;
  S.people.forEach(p => {
    if (!free(p)) return;
    if (y >= 1988 && p.dis > 15 && p.status === "vrij") p.dis = Math.min(95, p.dis + (y === 1989 ? 4 : 2));
    p.fear = Math.max(0, p.fear - 3);
    sum += p.status === "zersetzt" ? 0 : p.dis; n++;
  });
  const avg = sum / Math.max(1, n);
  S.onrust = clamp(S.onrust + (avg / 12 + yd - 1.3) * 1.3);
}

function imTick() {
  S.people.filter(p => p.status === "im").forEach(im => {
    if (S.t - (im.lastTreff ?? S.t) > 3) im.loyal = Math.max(0, (im.loyal || 30) - (im.held ? 3 : 6));
    if ((im.loyal || 0) < 12 && !im.doubleAgent && !im.held && R() < 0.2) { im.doubleAgent = true; addLog(im, "Started talking to the other side"); }
  });
}
function homeBugTick() {
  const hb = S.homeBugs; if (!hb) return; const left = hb.spots.filter(s => !hb.found.includes(s)).length;
  if (left) { S.dossier = clamp(S.dossier + left); S.fuchs = clamp(S.fuchs + 1); }
}
function imReports() {
  S.people.filter(p => p.status === "im").forEach(im => {
    let target = im.assign ? P(im.assign) : null; im.assign = null;
    if (!target || !free(target)) {
      const c = S.people.filter(q => q !== im && free(q) && (q.home === im.home || (q.work && q.work === im.work)));
      target = rand(c); if (!target) return;
    }
    target.pages += 2;
    const head = `IM „${im.code}“ on ${target.name}`;
    if (im.doubleAgent) { inbox("im", head, `‘Nothing unusual. ${target.fn} is a quiet citizen, goes to bed early.’`, target.id); return; }
    if (R() * 100 < im.honesty * (0.7 + (im.loyal || 30) / 300)) {
      const unk = target.traits.filter(t => !target.known[t]);
      if (!unk.length) { inbox("im", head, "‘No new details.’", target.id); return; }
      const t = rand(unk); target.known[t] = { s: "IM", im: im.id }; gainXP(XP.report);
      inbox("im", head, `Reports: ${trLabel(t)}.`, target.id);
      if (im.extra) { im.extra = 0; const t2 = rand(target.traits.filter(x => !target.known[x])); if (t2) { target.known[t2] = { s: "IM", im: im.id }; inbox("im", head + " (under pressure)", `Also reports: ${trLabel(t2)}.`, target.id); } }
    } else {
      const opts = FAKEABLE.filter(t => !target.traits.includes(t) && !target.known[t]);
      const t = rand(opts); if (!t) return;
      target.known[t] = { s: "IM", im: im.id };
      inbox("im", head, `Reports: ${trLabel(t)}.`, target.id);
    }
  });
}

function overheardLine(t, p) {
  if (TRAITS[t] && TRAITS[t].tw) { const lbl = TRAITS[t].l; return `(long clatter of a typewriter) Technical service: ${lbl.toLowerCase()}.`; }
  return rand(OVERHEARD[t] || ["(inaudible)"]);
}
function reveal(p, t, how) { p.known[t] = { s: "zeker" }; return `${how}: ${p.name} — ${trLabel(t)}`; }

function bugReports() {
  Object.keys(S.bugs).forEach(bid => {
    const ppl = S.people.filter(p => (p.home === bid || p.work === bid) && (free(p) || p.status === "im"));
    const cand = ppl.filter(p => p.traits.some(t => !p.known[t] || p.known[t].s !== "zeker"));
    const lines = [];
    for (let k = 0; k < 2; k++) {
      const p = rand(cand); if (!p) break;
      const t = rand(p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker")); if (!t) continue;
      p.known[t] = { s: "zeker" }; p.pages += 3; gainXP(XP.report);
      lines.push(`${p.name}: ${overheardLine(t, p)}\n→ ${trLabel(t)}`);
    }
    if (lines.length) inbox("bug", `Bugged: ${Bd(bid).name}`, lines.join("\n\n"));
    if (ppl.some(p => p.dis > 50 && p.status === "vrij") && R() < 0.09 * (1 - sk("tech") * 0.15)) {
      delete S.bugs[bid]; S.onrust = clamp(S.onrust + 4);
      inbox("warn", "Bug discovered!", `One of your bugs has been found in ${Bd(bid).name}. The story spreads through the district like wildfire.`);
    }
  });
}
function tapReports() {
  Object.keys(S.taps).forEach(pid => {
    const p = P(pid); if (!p || !free(p)) { delete S.taps[pid]; return; }
    const pref = ["westfam", "ausreise", "affaire", "zwart", "schulden", "vlucht", "samizdat"];
    const unk = p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker");
    const t = unk.find(t => pref.includes(t)) || rand(unk);
    if (t) { p.pages += 3; inbox("bug", `Phone tap: ${p.name}`, `${overheardLine(t, p)}\n→ ${reveal(p, t, "Confirmed")}`, p.id); }
  });
}
function fuchsTick() {
  if (!S.flags.fuchsMet || turn().y < 1988) return;
  if (S.fuchs >= 50 && R() < 0.3 - sk("geh") * 0.04) { S.dossier = clamp(S.dossier + 5); inbox("warn", "Fuchs", "Oberleutnant Fuchs has written an internal memo about you. You hear it from the secretary. (Suspicion +5)"); }
  else if (S.fuchs >= 25 && S.res > 0 && R() < 0.2) { S.res--; inbox("warn", "Fuchs", "Fuchs presented one of your results to Kessler as his own. (Results −1)"); }
}
function flights() {
  const T = turn(); if (!T.flight) return;
  S.people.filter(p => p.status === "vrij" && !p.family && (p.traits.includes("vlucht") || p.traits.includes("ausreise")) && p.dis > 20).forEach(p => {
    if (R() < 0.4) { p.status = "gevlucht"; addLog(p, "Fled via Hungary"); inbox("info", "Fled", `${p.name} (${p.job}) has fled to the West via Hungary. The flat is empty, the radio is still on.`, p.id); }
  });
}

// ---------- onderzoeken (puzzels) ----------
function maybeCase() {
  if (S.case || S.t < 2 || turn().late) return;
  if (R() < 0.5) newCase();
}
function matchesShown(p, c) {
  return (!c.shown.includes("place") || p.home === c.home) && (!c.shown.includes("paper") || p.work === c.work);
}
function newCase() {
  let prev = S.wrongs.find(w => !w.revealed && P(w.culprit) && P(w.culprit).status === "vrij");
  let culprit = prev && R() < 0.75 ? P(prev.culprit) : null;
  if (culprit) prev.revealed = true; else prev = null;
  if (!culprit) culprit = rand(S.people.filter(p => p.status === "vrij" && p.dis >= 30 && p.work && !p.family && !p.secretIM));
  if (!culprit) return;
  let tw = twOf(culprit); if (!tw) { tw = rand(TYPEWRITERS).id; culprit.traits.push(tw); culprit.twChecked = false; }
  const r = R(); let shown = r < 0.4 ? ["tw", "paper"] : r < 0.85 ? ["tw", "place"] : ["paper", "place"];
  const tmpls = INCIDENTS.map((x, i) => i).filter(i => (INCIDENTS[i].from || 0) <= turn().y);
  const c = { n: ++S.caseN, tmpl: rand(tmpls), culprit: culprit.id, tw, work: culprit.work, home: culprit.home, shown, turns: 2, geur: {} };
  if (shown.length === 2 && !shown.includes("tw") && S.people.filter(p => p !== culprit && matchesShown(p, c)).length) c.shown = shown = ["tw", "place"];
  // verwarring weghalen: anderen die op alle zichtbare aanwijzingen passen krijgen een andere typemachine
  S.people.forEach(p => { if (p === culprit || !matchesShown(p, c)) return; const ptw = twOf(p); if (ptw === tw && (!p.known[ptw] || p.known[ptw].s !== "zeker")) { p.traits = p.traits.filter(t => t !== ptw); p.traits.push(rand(TYPEWRITERS.filter(x => x.id !== tw)).id); delete p.known[ptw]; p.twChecked = false; } });
  // misleiding: iemand die níet past heeft dezelfde machine
  const decoy = rand(S.people.filter(p => p !== culprit && free(p) && !twOf(p) && !matchesShown(p, c)));
  if (decoy && R() < 0.6) { decoy.traits.push(tw); decoy.twChecked = false; }
  S.case = c;
  let note = "";
  if (prev) { const inn = P(prev.innocent); note = `\n\nTypeface analysis: the same typewriter as in the case of ${prev.month}. But back then ${inn.name} was named as the culprit. So it wasn't ${obj(inn)} after all.`; S.geweten = clamp(S.geweten - 8); prev.note = true; }
  c.note = note;
  inbox("case", `Case: ${INCIDENTS[c.tmpl].t}`, INCIDENTS[c.tmpl].d + note);
}
function clueText(c, k) {
  if (k === "tw") return `Typeface analysis: ${TRAITS[c.tw].l.toLowerCase()}.`;
  if (k === "paper") return `Paper: ${WORKPLACES[c.work].paper}.`;
  if (k === "place") return `Distributed in the stairwell of ${Bd(c.home).name}; the culprit probably lives there.`;
}

// ---------- gebeurtenissen ----------
function ev(q) { return q.src === "story" ? STORY[q.key][q.idx] : CONDITIONAL.find(c => c.id === q.id); }
function queueEvents() {
  const T = turn();
  [T.key, T.key + "b"].forEach(key => (STORY[key] || []).forEach((e, idx) => { if (!e.cond || e.cond(S)) S.queue.push({ src: "story", key, idx }); }));
  if (S.t === 0 || T.late) return;
  const list = CONDITIONAL.filter(c => (!S.fired[c.id] || c.repeat) && c.cond(S, S.t) && (!c.chance || R() < c.chance));
  const c = rand(list);
  if (c) { S.fired[c.id] = true; const q = { src: "cond", id: c.id }; if (c.dyn) { q.ctx = c.dyn(S, A); const p = P(q.ctx.pid); if (p) q.ctx.Z = Pron(p); } S.queue.push(q); }
}
function applyE(e) {
  if (!e) return;
  S.gunst = clamp(S.gunst + (e.g || 0)); S.geweten = clamp(S.geweten + (e.c || 0)); S.onrust = clamp(S.onrust + (e.o || 0));
  if ((e.d || 0) >= 3) ownNote(evCtx || "a note from Kader about your conduct"); 
  const dd = (e.d || 0) > 0 ? Math.round(e.d * (1 - sk("geh") * 0.1)) : (e.d || 0);
  S.dossier = clamp(S.dossier + dd); S.gezin = clamp(S.gezin + (e.fam || 0)); S.fuchs = clamp(S.fuchs + (e.fu || 0));
  if (e.res) { S.res += e.res; S.resTotal += e.res; }
  if (e.mk) S.mkNext += e.mk;
  if (e.xp) gainXP(e.xp);
  if (e.bu) rep("buurt", e.bu); if (e.ki) rep("kerk", e.ki);
}
function chips(e) {
  if (!e) return "";
  const o = []; const f = (k, l, goodUp) => { if (e[k]) { const up = e[k] > 0; o.push(`<span class="chip ${up === goodUp ? "up" : "down"}">${l} ${up ? "+" : ""}${e[k]}</span>`); } };
  f("g", "Favour", true); f("c", "Conscience", true); f("d", "Suspicion", false); f("fam", "Family", true); f("res", "Result", true); f("mk", "Manpower", true); f("bu", "District", true); f("ki", "Church", true); f("xp", "XP", true);
  if (e.fu) o.push(`<span class="chip ${e.fu > 0 ? "down" : "up"}">Rivalry Fuchs ${e.fu > 0 ? "+" : ""}${e.fu}</span>`);
  return o.length ? `<div class="chips">${o.join("")}</div>` : "";
}
const sub = (s, ctx) => ctx ? String(s).replace(/\{Z\}/g, ctx.Z || "He") : s;

function openEvent(q) {
  if (!q || !S.queue.includes(q)) { rerender(); return; }   // al afgehandeld
  const e = ev(q); const ctx = q.ctx;
  const text = sub(ctx && ctx.text ? ctx.text : e.text, ctx);
  const choices = e.choices.filter(c => !c.cond || c.cond(S));
  modal(`<div class="stamp">${e.via === "gezin" ? "PRIVAT" : "STRENG GEHEIM"}</div>
    <div class="kicker">${esc(turn().label)}${e.src ? " · Source: " + esc(e.src) : ""}</div>
    <h1>${esc(e.title)}</h1>${e.who ? `<div class="who">${esc(e.who)}</div>` : ""}
    <div class="report">${esc(text)}</div>${e.note ? `<p class="note"><i>${esc(e.note)}</i></p>` : ""}
    <div class="choices">${choices.map((c, k) => `<button class="ch" data-k="${k}"><b>${esc(c.t)}</b>${c.d ? `<span>${esc(c.d)}</span>` : ""}</button>`).join("")}</div>`,
    m => { const bs = m.querySelectorAll("button.ch"); bs.forEach(b => b.onclick = () => { bs.forEach(x => x.disabled = true); chooseEvent(q, choices[+b.dataset.k]); }); }, { lock: true });
}
function chooseEvent(q, c) {
  if (!S.queue.includes(q)) return;   // dubbel tikken of oud scherm: niets doen
  S.queue = S.queue.filter(x => x !== q);
  evCtx = ev(q).title; applyE(c.e); evCtx = ""; if (c.flag) S.flags[c.flag] = true; sfx.stamp();
  if (c.fx) c.fx(S, A, q.ctx);
  if (c.fate) S.fates[c.fate[0]] = c.fate[1];
  const e = ev(q); if (e.person) addLog(P(e.person), `${e.title}: ${c.t}`);
  if (e.id === "intro") tutDone(0);
  if (e.id === "fuchs") S.flags.fuchsMet = true;
  save(); refresh(); rerender();
  modal(`<div class="kicker">${esc(turn().label)} · ${esc(c.t)}</div><h1>${esc(e.title)}</h1>
    <div class="result">${esc(sub(c.r, q.ctx))}</div>${chips(c.e)}<button class="next" id="nx">${c.end ? "Continue →" : "Back to work"}</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); if (c.end && (c.flag === "shred" || c.flag === "walk")) return shredPicker(c.flag, () => finish()); if (c.end) return finish(c.flag === "fled" ? "overgelopen" : null); if (!checkOver()) { nextPending(); if (S.promo) showPromo(); } }, { lock: true });
}
// ---------- november 1989: welke dossiers vernietig je? ----------
function shredPicker(mode, done) {
  const files = S.people.filter(p => !p.secretIM && p.pages >= 8).sort((a, b) => b.pages - a.pages).slice(0, 8);
  const own = [{ id: "own", name: "Your own personnel file", sub: `${S.ownLog.length} notes about your conduct` }];
  if (mode === "walk") { files.forEach(p => { if (R() < 0.5) S.shredded.push(p.id); }); return done(); }
  const max = 4 + (S.flags.sorted ? 2 : 0); const pick = new Set();
  const draw = () => modal(`<div class="stamp">VERNICHTEN</div><div class="kicker">9 November 1989, 23:40</div><h1>Which files?</h1>
    <div class="result">The shredder overheats every ten minutes. You have time for <b>${max} sacks</b>${S.flags.sorted ? " (you sorted ahead on 4 November)" : ""}. What you shred, nobody reads in 1992. Including the people it was about.</div>
    <div class="choices">${[...own, ...files.map(p => ({ id: p.id, name: p.name, sub: `${p.pages} pages · ${STATUS_L[p.status]}` }))].map(f => `<button class="ch pick${pick.has(f.id) ? " on" : ""}" data-f="${f.id}"><b>${pick.has(f.id) ? "▣" : "□"} ${esc(f.name)}</b><span>${esc(f.sub)}</span></button>`).join("")}</div>
    <button class="next" id="go">Shred ${pick.size} of ${max}</button>`, m => {
    m.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const f = b.dataset.f; if (pick.has(f)) pick.delete(f); else if (pick.size < max) pick.add(f); sfx.paper(); draw(); });
    m.querySelector("#go").onclick = () => { S.shredded = [...pick]; sfx.type(14); closeModal(); done(); };
  }, { lock: true });
  draw();
}
function nextPending() { const q = S.queue.find(q => ev(q).via === "telefoon"); if (q) world.setRinging(true); }

// ---------- acties ----------
function spend(n) { if (S.mk < n) { toast("Not enough manpower this turn."); return false; } S.mk -= n; return true; }
function after(msg, e) { applyE(e); save(); refresh(); if (checkOver()) return; rerender(); if (S.promo && !$("#modal").classList.contains("open")) { if (msg) flash(msg + chips(e)); return showPromo(); } if (msg) flash(msg + chips(e)); }

const ACT = {
  observe(p) {
    if (!spend(1)) return; S.stats.observe++; tutDone(4); p.pages += 5; addLog(p, "Observed"); sfx.shutter();
    const lines = []; const hidden = p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker");
    Object.keys(p.known).forEach(t => { const k = p.known[t]; if (k.s === "IM" && !p.traits.includes(t)) { const im = P(k.im); delete p.known[t]; if (im) { im.lies = (im.lies || 0) + 1; lines.push(`✗ Disproved: „${trLabel(t)}“. IM „${im.code}“ lied.`); } }
      if (k.s === "talk" && !p.traits.includes(t)) { delete p.known[t]; lines.push(`✗ Disproved: „${trLabel(t)}“. Just gossip.`); } });
    let got = 0;
    p.twChecked = true;
    hidden.forEach(t => { if (R() < (TRAITS[t].tw ? 1 : 0.55 + sk("obs") * 0.07)) { lines.push("✓ " + trLabel(t)); p.known[t] = { s: "zeker" }; got++; } });
    const minGot = Math.min(hidden.length, S.inv.minox ? 2 : 1);
    while (got < minGot) { const t = rand(hidden.filter(t => !conf(p, t))); if (!t) break; p.known[t] = { s: "zeker" }; lines.push("✓ " + trLabel(t) + (got ? " (Minox)" : "")); got++; }
    if (S.inv.minox) p.pages += 2;
    if (p.status === "im" && p.doubleAgent && !p.known.dubbel && R() < 0.5) { p.known.dubbel = { s: "zeker" }; lines.push("" + trLabel("dubbel")); }
    if (!lines.length) lines.push("Nothing new. A dull life, or a careful one.");
    discoverLinks();
    after(`<h1>Observation: ${esc(p.name)}</h1><div class="result">${lines.map(esc).join("\n")}</div><div class="advice">${personAdvice(p)}</div>`, { xp: XP.observe + got * XP.trait });
  },
  post(p) {
    if (!spend(1)) return; p.pages += 4; addLog(p, "Post checked");
    const set = ["westfam", "ausreise", "samizdat", "klager", "vlucht", "kindstudie", "affaire", "schulden"];
    playMinigame("letter", mgUI, { to: p.name, addr: Bd(p.home).name + ", 1055 Berlin" }, res => {
      closeModal();
      const pool2 = p.traits.filter(t => set.includes(t)); const found = res.skipped ? pool2.slice(0, 1) : res.ok ? pool2 : pool2.slice(0, 2);
      found.forEach(t => p.known[t] = { s: "zeker" });
      const noticed = !res.ok && !res.skipped && res.msg === "smudged" && R() > sk("tech") * 0.15;
      if (noticed) { p.dis = Math.min(95, p.dis + 6); p.fear += 10; }
      discoverLinks();
      after(`<h1>Post check: ${esc(p.name)}</h1><div class="result">${found.length ? found.map(t => "✓ " + esc(trLabel(t))).join("\n") : "Letters from an aunt about the weather. Nothing of note."}${noticed ? "\n\nThe envelope arrives rippled. " + esc(p.fn) + " looks at it for a long time." : res.skipped ? "\n\n(Abteilung M only skims it.)" : ""}</div>`, { xp: XP.post + found.length * XP.trait });
    });
  },
  tap(p) {
    if (S.taps[p.id]) { delete S.taps[p.id]; return after(null); }
    if (pool() >= bugCap()) return toast(`All your equipment is in use (${bugCap()}).`);
    if (!spend(1)) return; S.taps[p.id] = S.t; addLog(p, "Phone tapped");
    after(`<h1>Phone tap installed</h1><div class="result">From next turn you will be listening in on ${esc(p.name)}.</div>`, { c: -1 });
  },
  warn(p) {
    if (!spend(1)) return; p.dis = Math.max(0, p.dis - 18 - sk("verh") * 3); p.fear += 25 + sk("verh") * 4; p.pages += 3; addLog(p, "Warning interview");
    after(`<h1>Warning interview</h1><div class="result">${esc(p.name)} is picked up for ‘the clarification of a few matters’. Two hours later ${pron(p)} is back outside. Pale.</div>`, { c: -3, g: 1, o: -1, d: p.family ? 3 : 0, bu: -2, ki: churchy(p) ? -2 : 0 });
  },
  recruit(p, how) {
    if (imCount() >= rank().ims) return toast(`As ${rank().id} you can run at most ${rank().ims} IMs.`);
    if (!spend(1)) return;
    const chance = recruitChance(p, how), cost = how === "gunst" ? 2 : 5 + (TRAITS[how].lev || 1) * 2;
    if (R() < chance) {
      makeIM(p); p.pages += 10; sfx.good();
      after(`<h1>Signed</h1><div class="result">${esc(p.name)} signs the Verpflichtungserklärung, the pledge to cooperate. Codename: <b>„${esc(p.code)}“</b>.\n\nFrom next turn ${pron(p)} reports on neighbours and colleagues.</div>`, { c: -cost, g: 3, xp: XP.recruit });
    } else {
      p.dis = Math.min(95, p.dis + 12); p.fear += 10; p.pages += 5; addLog(p, "Refused to become an IM"); sfx.bad();
      const told = R() < 0.35;
      after(`<h1>Refused</h1><div class="result">${esc(p.name)} refuses to sign.${told ? `\n\nWorse: ${pron(p)} tells people in the district.` : ""}</div>`, { c: -Math.ceil(cost / 2), o: told ? 3 : 1, d: told ? 3 : 0, bu: told ? -4 : 0, ki: told && churchy(p) ? -4 : 0 });
    }
  },
  zersetzung(p) {
    if (p.pages < 15) return toast("You know too little about this person (file < 15 pages).");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.dis = Math.max(0, p.dis - 45); p.status = "zersetzt"; p.pages += 25; S.stats.zersetzung++; addLog(p, "Zersetzung");
    after(`<h1>Maßnahme: Zersetzung</h1><div class="result">${esc(rand(ZERS))}\n\nWithin a few months ${esc(p.name)} trusts nobody any more. Exactly as intended.</div>`, { c: -12, g: hostile ? 5 : 1, res: hostile ? 1 : 0, o: -2, xp: XP.zers, bu: -2, ki: churchy(p) ? -5 : 0 });
  },
  arrest(p) {
    if (!evidence(p)) return toast("Not enough evidence: you need at least two confirmed suspicious traits.");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.status = "gevangen"; p.pages += 20; S.stats.arrests++; addLog(p, "Arrested, taken to Hohenschönhausen"); S.flags._arrested = p.name; sfx.stamp();
    if (p.family) { S.flags.betray = true; S.fates[p.id] = "Was arrested by his own brother. Spent fourteen months in Bautzen. Never exchanged another word with you."; }
    const late = turn().y >= 1988;
    after(`<h1>Arrest</h1><div class="result">Five in the morning. ${esc(p.name)} is allowed to pack a bag. The neighbours watch through the cracks of their doors.${late ? "\n\nBut by now fear works differently: the following Sunday the church is fuller than ever." : ""}</div>`, { c: hostile ? -8 : -15, g: hostile ? 6 : 2, res: hostile ? 1 : 0, o: late ? 2 : -4, fam: p.family ? -30 : 0, xp: XP.arrest, bu: -5, ki: churchy(p) ? -8 : 0 });
  },
  assign(im, target) { if (!spend(1)) return; im.assign = target.id; addLog(im, `Assignment: ${target.name}`); after(`<h1>Assignment given</h1><div class="result">Next turn IM „${esc(im.code)}“ will focus on ${esc(target.name)}.</div>`); },
  drop(im) { im.status = "vrij"; addLog(im, "Dropped as an IM"); after(`<h1>IM dropped</h1><div class="result">„${esc(im.code)}“ never hears from you again. The file disappears into the archive.</div>`); },
  geur(p) { if (!S.case || !spend(1)) return; S.case.geur[p.id] = p.id === S.case.culprit; addLog(p, "Scent sample taken"); after(`<h1>Scent sample</h1><div class="result">A tracker dog sniffs the leaflet and a cloth from ${esc(p.name)}'s chair.\n\n${S.case.geur[p.id] ? "The dog reacts." : "The dog shows no interest."}</div>`, { c: -2 }); },
  bug(bid) {
    if (S.bugs[bid]) { delete S.bugs[bid]; return after(null); }
    if (pool() >= bugCap()) return toast(`All your equipment is in use (${bugCap()}).`);
    if (!spend(2)) return; S.bugs[bid] = S.t;
    after(`<h1>Bugs planted</h1><div class="result">A ‘plumber’ and a ‘chimney sweep’ visit ${esc(Bd(bid).name)}. From next turn you are listening in.</div>`, { c: -1 });
  },
  home() { if (S.home) return toast("You already went home early this turn."); if (!spend(1)) return; S.home = true; after(`<h1>Home early</h1><div class="result">${rand(["You eat at the table with Katrin and Jens. Nobody asks how your day was.", "Jens shows you his Russian homework. You help him with the cases.", "Katrin puts a record on. You dance in the kitchen, just for a moment."])}</div>`, { fam: 7, c: 1 }); },
};
function recruitChance(p, how) { let c = how === "gunst" ? 0.2 + p.loyal / 180 - p.dis / 250 : 0.32 + (TRAITS[how].lev || 1) * 0.16 + p.fear / 250 - p.dis / 300; c += sk("ueb") * 0.04 + (p.owes ? 0.15 : 0) + (churchy(p) ? (S.rep.kerk - 50) / 500 : 0); return Math.max(0.05, Math.min(0.95, c)); }
function bestLever(p) { return Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker").sort((a, b) => TRAITS[b].lev - TRAITS[a].lev)[0] || "gunst"; }
function evidence(p) { return p.caught || Object.keys(p.known).filter(t => p.known[t].s === "zeker" && TRAITS[t] && (TRAITS[t].dis || 0) >= 10).length >= 2; }

function accuse(p) {
  const c = S.case; if (!c) return;
  const right = p.id === c.culprit;
  S.case = null; p.caught = true; p.pages += 15; addLog(p, `Named as the culprit: ${INCIDENTS[c.tmpl].t.toLowerCase()}`);
  if (right) { S.stats.solved++; applyE({ g: 6, res: 1, xp: XP.solved }); if (S.stats.solved >= 5) medal("spuer"); }
  else { S.stats.wrong++; S.wrongs.push({ innocent: p.id, culprit: c.culprit, month: turn().label }); applyE({ g: 4, res: 1, xp: XP.wrong }); }
  save(); refresh();
  const opts = [
    { t: "Arrest", d: "Hohenschönhausen. An example.", f: () => { p.status = "gevangen"; S.stats.arrests++; addLog(p, "Arrested"); return { c: -8, o: turn().y >= 1988 ? 2 : -4, g: 3, bu: -4, ki: churchy(p) ? -6 : 0 }; } },
    { t: "Recruit as IM", d: imCount() >= rank().ims ? "No room in your network." : "Those who are caught sign quickly.", dis: imCount() >= rank().ims, f: () => { makeIM(p); return { c: -6 }; } },
    { t: "Let them go", d: "Frighten and release.", f: () => { p.dis = Math.max(0, p.dis - 25); p.fear += 30; return { c: -2, g: -2 }; } },
  ];
  modal(`<div class="stamp">ERMITTELT</div><div class="kicker">Case closed</div><h1>${esc(p.name)}</h1>
   <div class="result">Kessler is pleased: ‘Good work. The culprit has been found.’ He doesn't ask how sure you are.\n\nWhat happens to ${esc(p.name)}?</div>
   <div class="choices">${opts.map((o, k) => `<button class="ch" data-k="${k}" ${o.dis ? "disabled" : ""}><b>${o.t}</b><span>${esc(o.d)}</span></button>`).join("")}</div>`,
    m => m.querySelectorAll("button.ch").forEach(b => b.onclick = () => { const e = opts[+b.dataset.k].f(); applyE(e); save(); refresh(); closeModal(); if (!checkOver()) { if (S.promo) showPromo(); flash(`<h1>Case closed</h1><div class="result">${esc(p.name)}: the file gets its stamp.</div>` + chips(e)); } }), { lock: true });
}

// ---------- maand afsluiten ----------
function endTurn() {
  if (S.queue.length) { toast("Deal with the waiting matters first."); return openEvent(S.queue[0]); }
  const c = S.case;
  if (c) { c.turns--; if (c.turns <= 0) { S.case = null; applyE({ g: -6, o: 4 }); inbox("warn", "Case unsolved", `${INCIDENTS[c.tmpl].t}: the culprit was never found. Kessler makes a note of it. (Favour −6)`); } }
  if (checkOver()) return;
  const T = turn();
  sfx.type(10);
  if (T.review) return review(() => teaser(() => advance()));
  teaser(() => advance());
}
// cliffhanger: een stukje van de volgende beurt
function teaser(next) {
  const N = TURNS[S.t + 1]; if (!N || S.over) return next();
  let hook = "";
  if (S.flags._arrested) hook = `Zugriff 05:00. Tomorrow at five, a grey Wartburg stops outside ${S.flags._arrested}'s door.`;
  else {
    const e = [...(STORY[N.key] || []), ...(STORY[N.key + "b"] || [])].find(e => !e.cond || e.cond(S));
    if (e) hook = e.tease || (e.via === "telefoon" ? `The phone rings as you lock your office. ${(e.who || "").split(" — ")[0]}. ‘Tomorrow. Early.’` : e.via === "gezin" ? `At home the kitchen light is still on. ${(e.who || "Katrin").split(",")[0]} wants to talk.` : `A sealed envelope for the morning, stamped STRENG GEHEIM: ‘${e.title}’.`);
    else if (S.case && S.case.turns === 1) hook = "The case folder is still on your desk. One turn left. Then the culprit is gone for good.";
    else if (N.news && N.news[0]) hook = `On the late news: ${N.news[0][1]}`;
    else hook = rand(["Herr Pohl's door opens a crack as you climb the stairs. Then it closes.", "Someone has left a carnation on your car. Red. You don't know if it is a joke.", "The tram is late. On the platform, a man reads a newspaper upside down."]);
  }
  modal(`<div class="kicker">Tonight · next: ${esc(N.label)}</div><h1>${esc(rand(["On the way home", "Before you sleep", "Late"]))}</h1><div class="report">${esc(hook)}</div><button class="next" id="nx">Next turn →</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); next(); }, { lock: true });
}
function advance() {
  if (checkOver()) return;
  if (S.tut !== undefined && S.tut < 99) { S.tut = 99; S.flags._tutJustDone = true; }
  S.t++;
  if (S.t >= TURNS.length) return finish();
  startTurn();
}
function review(next) {
  const q = S.quota, ims = imCount(); const okR = S.res >= q.res, okI = ims >= q.ims;
  const lines = [`Results: ${S.res} of ${q.res} ${okR ? "✓" : "✗"}`, `Active IMs: ${ims} of ${q.ims} ${okI ? "✓" : "✗"}`];
  let e = {};
  if (okR && okI) { lines.push(`\nKessler: ‘Excellent. I am putting it in your Kaderakte.’ (+${XP.review} XP)`); e = { g: 8, xp: XP.review }; }
  else if (okR || okI) { lines.push("\nKessler: ‘Adequate. But I expect more zeal.’ No promotion this year."); }
  else { lines.push("\nKessler closes the door. ‘I am beginning to wonder whose side you are on, comrade.’ A note goes into your personnel file."); e = S.mods.includes("kessler") ? { g: -24, d: 16 } : { g: -12, d: 8 }; }
  if (turn().y === 1987 && S.flags.leak) { lines.push("\nAs you leave: ‘Someone warned that church. I will find out who.’"); e.d = (e.d || 0) + 6; }
  if (turn().y === 1988 && S.flags.cover) { lines.push("\nKessler puts a copy on the table. The report about your brother. ‘The original went missing. Strange, isn't it?’"); e.d = (e.d || 0) + 8; e.g = (e.g || 0) - 5; }
  evCtx = "annual assessment"; applyE(e); evCtx = ""; save(); refresh();
  modal(`<div class="stamp">BEURTEILUNG</div><div class="kicker">${esc(turn().label)}</div><h1>Annual assessment ${turn().y}</h1><div class="result">${esc(lines.join("\n"))}</div>${chips(e)}<button class="next" id="nx">Continue →</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); if (S.promo) return showPromo(next); next(); }, { lock: true });
}
function checkOver() {
  if (S.over) return true;
  if (S.dossier >= 100) { finish("gearresteerd"); return true; }
  if (S.gunst <= 0) { finish("overgeplaatst"); return true; }
  return false;
}

// ===================== EINDE =====================
function finish(cause) {
  const F = S.flags, g = S.geweten;
  let id = cause;
  if (!id) id = F.refuse && g >= 50 ? "nee" : (S.rank >= 3 && g < 45) ? "major" : g >= 60 ? "kantoor" : g >= 30 ? "werk" : "naam";
  S.over = id; addEnding(id); clearSave();
  const T = {
    overgelopen: ["Defected", "In September 1989 you and your family are in a reception camp in Passau. You tell West German intelligence everything you know. In East Berlin you are sentenced in absentia for ‘Fahnenflucht’, desertion. Two months later the Wall falls, and it no longer matters. Or perhaps it matters more."],
    gearresteerd: ["Now you are the file", "At five in the morning the doorbell rings. Two colleagues you know from the canteen. ‘Kommen Sie bitte mit.’ In Hohenschönhausen they ask you the same questions you asked others. They know everything. Of course they know everything."],
    overgeplaatst: ["Bitterfeld", "Kessler has you transferred to security at a chemical combine in Bitterfeld. The air stinks of sulphur. You check lorries until the Wall falls, and after that nobody at all."],
    nee: ["The man who said no", "After 1990 you become a witness for the commission investigating the Stasi. Your refusal of 7 October is there in black and white in Kessler's notes. It doesn't make everything right. But it counts."],
    major: ["Genosse Major", "You made it: Major, your own department, your own driver. For one year. In 1990 you are out on the street with two thousand other officers. You fight a court case over your pension until 1999. You win."],
    kantoor: ["A small job", "After reunification you are dismissed, like everyone from the Ministry. For years you work as an attendant in a car park. Sometimes someone recognises you. Usually they just nod."],
    werk: ["‘I was doing my job’", "You say it often, after 1990. At birthday parties, to your children, to yourself. The more often you say it, the less it sounds like an answer."],
    naam: ["A name in everyone's file", "When the files were opened, your name was in hundreds of folders. People you had never met knew exactly who you were. You move to a city where nobody knows you."],
  }[id];
  const files = F.shred ? "On 15 January 1990 citizens storm the headquarters on Normannenstraße. They find thousands of sacks of shredded paper. Some of it is still being pieced back together today, your sacks included."
    : F.keep ? "On 15 January 1990 citizens storm the headquarters. Your cupboard is intact. Thanks to files like yours, from 1992 people can read what happened to their lives."
      : F.walk ? "While you stood at Bornholmer Straße, your colleagues shredded half the night. Your files were still there when the citizens came in, in January 1990."
        : "";
  if (!cause || cause === "nee") { medal("treue"); if (g >= 70) medal("rein"); }
  const ownShred = S.shredded.includes("own");
  const own = ownShred ? `In 1992 you request your own file. A few pages are left: you shredded the rest yourself, that night in November. But the reports of IM „Lerche“ were filed elsewhere. Erich Pohl, your neighbour. Every week: when you came home, who visited, whether you drank.${F.pohl ? " You had suspected it." : ""} Even the Stasi did not trust the Stasi.` : `In 1992 you request your own file. ${60 + S.dossier * 3} pages. Informer: IM „Lerche“: Erich Pohl, your neighbour. Every week: when you came home, who visited, whether you drank.${F.pohl ? " You had suspected it. That doesn't make it any less cold." : ""} Even the Stasi did not trust the Stasi.`;
  const fam = F.alone ? "Katrin never came back from Rostock. Jens phones at Christmas." : S.gezin >= 60 ? "Katrin and Jens are still there. In 1996, when he is twenty, Jens asks what you actually did. This time you tell him." : S.gezin >= 30 ? "Katrin stays. At home, nobody talks about the eighties." : "Katrin files for divorce in 1991. ‘I read my own file,’ she says. ‘You weren't in it. But you could have stopped it.’";
  const repTxt = [S.rep.kerk >= 60 ? "In 1991 Pastor Kühn writes to the commission. ‘He warned us more than once,’ the letter says. It is not the whole truth. It is part of it." : S.rep.kerk < 20 ? "In 1990 the congregation pins a list to the church door. Your name is on it." : "",
    S.rep.buurt >= 65 ? "In Kollwitzstraße people still greet you. Some of them have read their files." : S.rep.buurt < 20 ? "Someone sprays one word on your front door in Kollwitzstraße. You paint over it. It comes back." : ""].filter(Boolean).join("\n\n");
  // lotgevallen
  const lines = [];
  const seen = new Set();
  S.shredded.filter(id => id !== "own").forEach(id => { const p = P(id); if (p) { lines.push([p.name, `Requested their file in 1992. It had gone through a shredder in November 1989. Archivists are still piecing the scraps together. ${p.name.split(" ")[0]} never found out who did what.`]); seen.add(id); } });
  Object.entries(S.fates).forEach(([pid, txt]) => { const p = P(pid); if (p && !seen.has(pid)) { lines.push([p.name, txt]); seen.add(pid); } });
  S.wrongs.forEach(w => { const p = P(w.innocent); if (p && !seen.has(p.id)) { lines.push([p.name, `Was named in ${w.month} for something ${P(w.culprit).name} had done. ${p.status === "gevangen" ? "Spent months in prison for nothing." : "For years did not understand why everything went wrong."}`]); seen.add(p.id); } });
  S.people.filter(p => !seen.has(p.id) && !p.secretIM && (p.pages >= 12 || p.status !== "vrij")).sort((a, b) => b.pages - a.pages).slice(0, 12).forEach(p => {
    const txt = { gevangen: `Was held in Hohenschönhausen, then in Bautzen. Rehabilitated in 1990. File: ${p.pages} pages.`, zersetzt: `Lost friends, work and self-confidence without knowing why. Only understood in 1992, on page ${Math.max(3, p.pages - 10)} of ${p.pages}.`, im: `Was IM „${p.code}“. Exposed after 1992 by neighbours reading their own files.`, gevlucht: "Fled via Hungary in 1989 and only came back in 1991 to clear the flat.", uitgereisd: "Was allowed to leave. Only came back to visit after 1990.", vrij: `In 1992 read a file of ${p.pages} pages about themselves.` }[p.status] || "";
    lines.push([p.name, txt]);
  });
  const found = endings();
  const st = S.stats;
  modal(`<div class="stamp">${id === "gearresteerd" ? "VERHAFTET" : "AKTE GEÖFFNET"}</div>
    <div class="kicker">${cause === "gearresteerd" || cause === "overgeplaatst" ? esc(turn().label) : "Epilogue · Stasi Records Act, 1992"}</div>
    <h1>${esc(T[0])}</h1>
    <div class="result">${esc(T[1])}${files ? "\n\n" + esc(files) : ""}\n\n${esc(own)}\n\n${esc(fam)}${repTxt ? "\n\n" + esc(repTxt) : ""}</div>
    <div class="kicker" style="margin-top:8px">What became of them</div>
    ${lines.map(([n, t]) => `<div class="ep-item"><b>${esc(n)}</b><p>${esc(t)}</p></div>`).join("")}
    <div class="ep-item"><b>Your service record</b><p>Rank ${esc(rank().id)} · ${S.xp} XP · ${Object.keys(SKILLS).map(k => `${SKILLS[k].short} ${sk(k)}`).join(" ")} · conscience ${S.geweten} · ${S.stats.errands || 0} favours done · ${st.recruits} IMs recruited · ${st.arrests} arrests · ${st.zersetzung}× Zersetzung · ${st.solved + st.wrong} cases ‘solved’, ${st.wrong} of them with the wrong culprit</p></div>
    <div class="ep-item"><b>Pinboard</b><p>${S.links.filter(l => l.found).length} of ${S.links.length} connections found · ${S.stats.complete || 0} files complete</p></div>
    <div class="ep-item"><b>Endings found: ${found.length} of ${Object.keys(ENDINGS).length}</b><p>${Object.entries(ENDINGS).map(([k, v]) => found.includes(k) ? `✓ ${esc(v)}` : "? ???").join(" · ")}</p></div>
    ${ARCHIVE[found.length - 1] ? `<div class="ep-item arch"><b>New in the archive: ${esc(ARCHIVE[found.length - 1][0])}</b><p>${esc(ARCHIVE[found.length - 1][1])}</p></div>` : ""}
    <p class="note"><i>In 1989 the Stasi had some 91,000 full-time staff and almost 190,000 informers. Since 1992 more than three million people have asked to see their files.</i></p>
    <button class="next" id="nx">Play again</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); showTitle(); }, { lock: true, wide: true });
}

// ===================== UI =====================
function bar10(v) { const n = Math.round(clamp(v) / 10); return `<span class="sus3 l10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`; }
function bar(lbl, v, cls) { const seg = Math.round(v / 10); return `<div class="stat ${cls || ""}"><div class="sl"><span>${lbl}</span><b>${String(v).padStart(3, "0")}</b></div><div class="bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? "on" : ""}"></i>`).join("")}</div></div>`; }
function refresh() {
  if (!S) return;
  const T = turn();
  $("#hud").innerHTML = `<div class="hrow"><span class="date">${esc(T.label)}</span><button class="rk" id="rkBtn">${esc(rank().id)}${points() > 0 ? `<b>+${points()}</b>` : ""}</button><button class="help" id="helpBtn" aria-label="Help">?</button></div>
   <div class="stats">${bar("Favour", S.gunst, "sg")}${bar("Conscience", S.geweten, "sc")}${bar("Suspicion", S.dossier, "sd")}</div>
   <div class="mk"><span class="mkl">MP</span>${"<i class=on></i>".repeat(S.mk)}${"<i></i>".repeat(Math.max(0, rank().mk - S.mk))}<span class="goal">Plan ${T.y}: <b>${S.res}/${S.quota.res}</b> res. · <b>${imCount()}/${S.quota.ims}</b> IM</span></div>`;
  $("#helpBtn").onclick = showHelp; $("#rkBtn").onclick = () => sheet(kaderView);
  // LED's knipperen bij een verandering
  const nowV = { sg: S.gunst, sc: S.geweten, sd: S.dossier };
  Object.entries(nowV).forEach(([k, v]) => { if (lastV[k] !== undefined && lastV[k] !== v) { const e = $(`#hud .stat.${k}`); if (e) { e.classList.add(v > lastV[k] ? "pulseUp" : "pulseDown"); } } lastV[k] = v; });
  $("#hud .stats").onclick = explainMeters; $("#hud .mk").onclick = explainMeters;
  const unread = S.inbox.filter(i => !i.read).length;
  const pend = via => S.queue.filter(q => ev(q).via === via).length;
  const phone = pend("telefoon");
  world.setRinging(phone > 0);
  if (phone > 0 && world.getMode() === "office" && !$("#modal").classList.contains("open")) startRing(); else stopRing();
  world.setOffice({ folders: unread + pend("dossier"), caseOpen: !!S.case, date: T.label.split(" ").slice(0, -1).join(" ").replace(/^\d+ /, m => m), month: String(T.y), badges: { telefoon: phone ? "!" : "", dossiers: (unread + pend("dossier")) || "", gezin: pend("gezin") ? "!" : "", onderzoek: S.case ? `${S.case.turns} t.` : "", typemachine: "" } });
  const ims = {}; S.people.filter(p => p.status === "im").forEach(p => ims[p.home] = (ims[p.home] || 0) + 1);
  const info = {}; BUILDINGS.forEach(b => { let t = ""; if (S.bugs[b.id]) t += " "; if (ims[b.id]) t += ` <b style="background:#2f5a8a">IM ${ims[b.id]}</b>`; if (S.case && S.case.shown.includes("place") && S.case.home === b.id) t += " <b>!</b>"; info[b.id] = t; });
  const mo = monthOf(T);
  world.setDistrict({ info, bugs: S.bugs, ims, winter: !!T.winter, finale: T.key === "1989-nov", year: T.y, festive: mo === 5 || T.key === "1987-okt" || T.key === "1989-okt", subbotnik: mo === 3 || mo === 4, fdj: mo === 5 || T.key === "1989-okt" || T.key === "1987-okt", pioneers: mo === 6, queue: S.buck ? 12 : 4, intershop: T.y >= 1984 });
  world.setNews((T.news.find(n => n[0] === "ND" || n[0] === "AK") || ["", "Plan fulfilled: our factories report record figures."])[1]);
  world.setPinboard({ cards: S.people.filter(p => !p.secretIM && Object.keys(p.known).length).length, threads: S.links.filter(l => l.found).length });
  if (walkTurn !== S.t) assignWalkers();
  $("#navEnd").innerHTML = `End turn<small>to ${esc((TURNS[S.t + 1] || T).label)}</small>`;
  updateCoach();
}

let lastV = {}, walkTurn = -1, walkMap = [];
// voorbijgangers koppelen aan bewoners: zelfde soort figuur, alleen wie vrij rondloopt
const FIGSEX = { fig_burger: "m", fig_arbeider: "m", fig_dominee: "m", fig_punk: "m", fig_burgeres: "f", fig_vrouw: "f" };
function assignWalkers() {
  walkTurn = S.t; walkMap = [];
  const pool = S.people.filter(p => (free(p) || p.status === "im") && !p.family).sort(() => R() - 0.5);
  const used = new Set();
  for (let i = 0; i < 32; i++) {
    const fig = world.walkerFig(i); const sx = FIGSEX[fig];
    let p = null;
    if (fig === "fig_dominee") p = pool.find(q => q.id === "kuehn" && !used.has(q.id));
    else if (fig === "fig_punk") p = pool.find(q => q.traits.includes("punk") && !used.has(q.id)) || pool.find(q => q.sex === "m" && q.age < 30 && !used.has(q.id));
    else if (sx && used.size < 16) p = pool.find(q => q.sex === sx && !used.has(q.id) && (fig !== "fig_vrouw" || q.age > 45));
    if (p) used.add(p.id);
    walkMap[i] = p ? { pid: p.id } : { anon: fig === "fig_vopo" ? "vopo" : fig === "fig_stasi" ? "stasi" : "anon" };
  }
  world.setWalkers(walkMap);
}

// ---------- sheet / modal / toast ----------
let stack = [];
function sheet(fn, push = true) {
  if (push) stack.push(fn); const el = $("#sheet"); el.classList.add("open"); document.body.classList.add("sheet-open");
  const inner = $("#sheetBody"); inner.innerHTML = ""; fn(inner); inner.scrollTop = 0; updateCoach();
  $("#sheetBack").style.visibility = stack.length > 1 ? "visible" : "hidden";
}
function closeSheet() { stack = []; $("#sheet").classList.remove("open"); document.body.classList.remove("sheet-open"); world.select(null); world.setKassette(false); updateCoach(); }
function back() { stack.pop(); const f = stack[stack.length - 1]; if (f) sheet(f, false); else closeSheet(); }
function rerender() { const f = stack[stack.length - 1]; if (f) sheet(f, false); }
function resultSheet(html, e) {
  modal(`${html}${chips(e)}<button class="next" id="nx">OK</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); rerender(); });
}
function modal(html, mount, opt = {}) {
  stopRing();
  const m = $("#modal"); m.className = "modal open" + (opt.wide ? " wide" : ""); m.dataset.lock = opt.lock ? "1" : "";
  $("#modalCard").innerHTML = html; $("#modalCard").scrollTop = 0; if (mount) mount($("#modalCard"));
}
function closeModal() { $("#modal").className = "modal"; }
let flashT;
function flash(html) { const f = $("#flash"); f.innerHTML = html; f.classList.add("show"); clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove("show"), 4500); f.onclick = () => f.classList.remove("show"); }
let toastT;
function toast(html) { const t = $("#toast"); t.innerHTML = html; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

// ---------- schermen ----------
function personRow(p, extra = "") {
  const st = { im: `<span class="tag blue">IM „${esc(p.code)}“</span>`, gevangen: '<span class="tag grey">imprisoned</span>', zersetzt: '<span class="tag red">zersetzt</span>', gevlucht: '<span class="tag grey">fled</span>', uitgereisd: '<span class="tag grey">emigrated</span>' }[p.status] || "";
  const nk = Object.keys(p.known).length;
  return `<button class="row" data-pid="${p.id}"><span class="rn"><b>${esc(p.name)}</b> ${st}${S.taps[p.id] ? ' <span class="tag red">tapped</span>' : ""}<small>${esc(p.job)} · ${p.age}</small></span><span class="rp">${extra}<span>${p.pages}<small> pp.</small></span>${nk ? `<small>${nk} trait${nk > 1 ? "s" : ""}</small>` : ""}</span></button>`;
}
function bindRows(el) { el.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => sheet(e => personView(e, P(b.dataset.pid)))); }

function hostility(p) {
  const ks = Object.keys(p.known).filter(t => TRAITS[t]); if (!ks.length) return "unknown";
  const s = ks.reduce((a, t) => a + (TRAITS[t].dis || 0), 0);
  return s >= 35 ? "high" : s >= 15 ? "medium" : s > 0 ? "low" : "no signs";
}
function personView(el, p) {
  tutDone(3);
  const b = Bd(p.home); const work = p.work ? WORKPLACES[p.work].name : "—";
  const known = Object.entries(p.known).map(([t, k]) => `<li>${esc(trLabel(t))} <span class="tag ${k.s === "zeker" ? "green" : "amber"}">${k.s === "zeker" ? "confirmed" : k.s === "talk" ? "gossip, unconfirmed" : `IM „${esc((P(k.im) || {}).code || "?")}“, unconfirmed`}</span></li>`).join("") || "<li class='muted'>Nothing yet. Observe, bug, or put an informer on them.</li>";
  const pct = completion(p), lk = linksOf(p), lkF = lk.filter(l => l.found);
  const linkHTML = `<div class="kicker">Connections <small class="muted">· ${lkF.length} of ${lk.length}</small></div>${lkF.length ? `<ul class="traits">${lkF.map(l => { const o = P(l.a === p.id ? l.b : l.a); return `<li><span class="thr" style="background:${LINKS[l.k].col}"></span>${l.a === p.id ? "" : esc(o.name) + " "}${esc(LINKS[l.k].l)}${l.a === p.id ? " " + `<a data-pid="${o.id}">${esc(o.name)}</a>` : " " + esc(p.fn)}</li>`; }).join("")}</ul>` : `<p class="muted small">${lk.length ? `${lk.length} hidden thread${lk.length > 1 ? "s" : ""} to someone else. Confirm traits to find out who.` : "No known ties to other residents."}</p>`}`;
  const r = rank(); const info = [], hard = [];
  const can = free(p) || p.status === "im";
  const btn = (arr, k, l, cost, dis, why) => arr.push(`<button class="act" data-a="${k}" ${dis ? "disabled" : ""}><b>${l} <em>${cost ? cost + " MP" : "free"}</em></b><span>${why}</span></button>`);
  if (can) {
    btn(info, "observe", "Observe", 1, S.mk < 1, "Find out what someone is hiding. Also checks what informers claim.");
    if (p.status !== "im") btn(info, "post", "Check post", 1, S.mk < 1, "Abteilung M opens their letters. You can steam it open yourself.");
  }
  if (free(p) && p.status === "vrij") {
    btn(hard, "warn", "Warn", 1, S.mk < 1, "Frighten them. They become less defiant. Light touch.");
    btn(hard, "verhoor", "Interrogate", 2, S.mk < 2 || p.pages < 10 || S.used["v" + p.id], S.used["v" + p.id] ? "Already questioned this turn." : p.pages < 10 ? `You need something to hold against them (file ≥ 10 pages, now ${p.pages}).` : `Kreisdienststelle, room 4. Catch them in a lie. Interrogation ${sk("verh")}.`);
    btn(hard, "arrest", "Arrest", 2, S.mk < 2 || !evidence(p), evidence(p) ? "Counts as a result. The heaviest measure." : `Needs 2 confirmed suspicious traits (now ${susCount(p)}).`);
  }
  const levs = Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev);
  const recruitable = p.status === "vrij" && !p.family && !p.secretIM;
  let caseBox = "";
  if (S.case && free(p)) {
    const c = S.case; const tw = twOf(p); const twKnown = tw && p.known[tw] && p.known[tw].s === "zeker";
    const m = k => k === "tw" ? (twKnown ? (tw === c.tw ? "✓" : "✗") : "?") : k === "paper" ? (p.work === c.work ? "✓" : "✗") : (p.home === c.home ? "✓" : "✗");
    caseBox = `<div class="box red"><div class="kicker">Open case: ${esc(INCIDENTS[c.tmpl].t)}</div>${c.shown.map(k => `<div class="clue">${m(k)} ${esc(clueText(c, k))}</div>`).join("")}${c.geur[p.id] !== undefined ? `<div class="clue">${c.geur[p.id] ? "✓ Scent sample: the dog reacted" : "✗ Scent sample: no reaction"}</div>` : ""}
     <div class="acts"><button class="act danger" data-a="accuse"><b>Name as culprit</b><span>closes the case</span></button></div></div>`;
  }
  let imBox = "";
  if (p.status === "im") {
    const rel = p.known.dubbel ? "Double agent exposed" : p.lies ? `Low: ${p.lies} lie${p.lies > 1 ? "s" : ""} caught` : "Unknown (check reports by observing, or cross-check at a Treff)";
    const targets = S.people.filter(q => q !== p && free(q) && (q.home === p.home || (q.work && q.work === p.work)));
    imBox = `<div class="box blue"><div class="kicker">Informer „${esc(p.code)}“</div><div class="clue">Reliability: ${esc(rel)}</div><div class="clue">Loyalty: ${bar10(p.loyal || 0)} · Wants: ${esc(NEEDS[p.need] || "nothing you know of")}</div>${S.t - (p.lastTreff ?? S.t) > 2 ? `<div class="clue red">No Treff for ${S.t - p.lastTreff} turns. Loyalty is dropping.</div>` : ""}${p.assign ? `<div class="clue">Assignment: ${esc(P(p.assign).name)}</div>` : ""}
      <label class="sel">Give an assignment (1 MP): <select id="assignSel"><option value="">— choose a neighbour or colleague —</option>${targets.map(q => `<option value="${q.id}">${esc(q.name)}</option>`).join("")}</select></label>
      <div class="acts"><button class="act" data-a="treff"><b>Treff in „Linde“</b><span>meet, pay, press or cross-check</span></button><button class="act" data-a="drop"><b>Drop</b><span>0 MP</span></button></div></div>`;
  }
  const er = S.errands.find(x => x.pid === p.id);
  const erBox = er ? (() => { const E = ERRANDS[er.k], ok = E.need ? (S.inv[E.need] || 0) > 0 : S.mk >= (E.mp || 0); return `<div class="box"><div class="kicker">Favour asked · ${er.due - S.t + 1} turn${er.due - S.t ? "s" : ""} left</div><div class="clue">${esc(E.ask)}</div><div class="acts one"><button class="act" data-a="errand" ${ok ? "" : "disabled"}><b>${esc(E.t)} <em>${E.need ? `1×` : `${E.mp} MP`}</em></b><span>${E.need ? `Costs 1 ${esc(INV[E.need][0])} (you have ${S.inv[E.need] || 0}). ` : ""}${ok ? "Do it. They will owe you: easier to recruit, and the district hears about it." : E.need ? `You have no ${esc(INV[E.need][0])}.` : "Not enough manpower."}</span></button></div></div>`; })() : "";
  el.innerHTML = `<div class="ph"><div><div class="kicker">Akte ${4000 + S.people.indexOf(p) * 37}/85 · ${p.pages} pages</div><h2>${esc(p.name)}</h2><div class="who">${esc(p.job)}, ${p.age}</div></div><div class="stampS">${p.complete ? "VOLLSTÄNDIG" : p.status === "vrij" ? "" : esc((STATUS_L[p.status] || p.status).toUpperCase())}</div></div>
   ${p.secretIM ? "" : `<div class="compl"><span>File complete</span><div class="cbar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`}
   <div class="grid2"><div><small>Lives at</small><a data-b="${b.id}">${esc(b.name)}</a></div><div><small>Works at</small>${p.work && Bd(p.work) ? `<a data-b="${p.work}">${esc(work)}</a>` : esc(work)}</div><div><small>How defiant?</small>${hostility(p)}</div><div><small>Status</small>${esc(STATUS_L[p.status] || p.status)}</div></div>
   ${p.secretIM ? `<div class="box"><div class="clue">Card ‘gesperrt’: access for the Hauptabteilung only. This person is not available for measures.</div></div>` : ""}
   <div class="advice">${personAdvice(p)}</div>
   ${erBox}${caseBox}${imBox}
   <div class="kicker">What you know</div><ul class="traits">${known}</ul>${p.secretIM ? "" : linkHTML}
   ${p.secretIM ? "" : `${info.length ? `<div class="kicker">Gather information</div><div class="acts">${info.join("")}</div>` : ""}${hard.length ? `<div class="kicker">Intervene</div><div class="acts">${hard.join("")}</div>` : ""}`}
   ${recruitable ? (() => { const how = bestLever(p); const pct = Math.round(recruitChance(p, how) * 100); return `<div class="kicker">Make an informer <small class="muted">· ${imCount()}/${r.ims}</small></div><div class="acts one"><button class="act" data-a="recruit" data-h="${how}" ${S.mk < 1 || imCount() >= r.ims ? "disabled" : ""}><b>Recruit as IM <em>1 MP · ${pct}% chance</em></b><span>${how !== "gunst" ? `Leverage: ${esc(trLabel(how).toLowerCase())}.` : "Without leverage the chance is small. Observe first."} An IM informs on a neighbour every turn.</span></button></div>`; })() : ""}
   ${p.log.length ? `<div class="kicker">Notes</div><ul class="log">${p.log.slice(-8).reverse().map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}`;
  el.querySelectorAll("[data-b]").forEach(a => a.onclick = () => openBuilding(a.dataset.b));
  el.querySelectorAll("ul.traits a[data-pid]").forEach(a => a.onclick = () => sheet(e => personView(e, P(a.dataset.pid))));
  el.querySelectorAll("button.act").forEach(bt => bt.onclick = () => {
    const a = bt.dataset.a;
    if (a === "accuse") return modal(`<h1>Name ${esc(p.name)}?</h1><div class="result">You can't undo this. If you are wrong, the real culprit stays free.</div><div class="choices"><button class="ch" id="y"><b>Yes, it's ${obj(p)}</b></button><button class="ch" id="n"><b>Not yet</b></button></div>`, m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); accuse(p); }; m.querySelector("#n").onclick = closeModal; });
    if (a === "recruit") return ACT.recruit(p, bt.dataset.h);
    if (a === "drop") return ACT.drop(p);
    if (a === "treff") return treffView(p);
    if (a === "errand") return doErrand(p);
    if (a === "verhoor") return interrogate(p);
    ACT[a](p);
  });
  const sel = el.querySelector("#assignSel"); if (sel) sel.onchange = () => { if (sel.value) ACT.assign(p, P(sel.value)); };
}

function openBuilding(id) {
  if (id === "booth" || id === "litfass") { tutDone(99); return enterInterior(id); }
  world.select(id); sheet(el => buildingView(el, id)); tutDone(2);
}
function buildingView(el, id) {
  const b = Bd(id);
  if (id === "mfs") { el.innerHTML = `<h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p><button class="next" id="go">To your office</button>`; el.querySelector("#go").onclick = () => { closeSheet(); setMode("office"); }; return; }
  const res = S.people.filter(p => p.home === id), wrk = S.people.filter(p => p.work === id);
  const r = rank();
  const inside = INSIDE[id] && !(IX && IX.bid === id);
  el.innerHTML = `<div class="kicker">${b.res ? "Residential" : "Workplace"}</div><h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p>
    ${inside ? `<div class="acts one"><button class="act in" id="goIn"><b>${b.res ? "Into the stairwell" : "Go inside"} <em>free</em></b><span>${{ kollwitz: "Letterboxes, the Hausbuch, your own flat.", lychener: "The Hausbuch, and the Konspirative Wohnung „Linde“ on the third floor.", greif: "Letterboxes, the Hausbuch, the lift.", dimi: "Letterboxes, the Hausbuch, thin walls.", cafe: "Listen in at the tables. Talk to the barman.", konsum: "Queues, gossip and Bückware under the counter." }[id]}</span></button></div>` : ""}
    <div class="acts"><button class="act ${S.bugs[id] ? "danger" : ""}" id="bugBtn" ${!S.bugs[id] && (S.mk < 2 || pool() >= bugCap()) ? "disabled" : ""}><b>${S.bugs[id] ? "Remove bugs" : "Plant bugs"}</b><span>${S.bugs[id] ? "frees the equipment" : `2 MP · bugged conversations every turn · ${pool()}/${bugCap()} in use`}</span></button></div>
    ${res.length ? `<div class="kicker">Residents</div>${res.map(p => personRow(p)).join("")}` : ""}
    ${wrk.length ? `<div class="kicker">Works here</div>${wrk.map(p => personRow(p)).join("")}` : ""}`;
  el.querySelector("#bugBtn").onclick = () => ACT.bug(id);
  const gi = el.querySelector("#goIn"); if (gi) gi.onclick = () => enterInterior(INSIDE[id], id);
  bindRows(el);
}

// ---------- kartotheek: zoeken, filters met tellers, laden per adres ----------
const GONE = ["gevangen", "gevlucht", "uitgereisd", "overgeplaatst"];
const KF = [
  ["", "All", () => true],
  ["sus", "Suspect", p => free(p) && (susCount(p) > 0 || ["medium", "high"].includes(hostility(p)))],
  ["im", "IMs", p => p.status === "im"],
  ["case", "Case", p => S.case && free(p) && matchesShown(p, S.case)],
  ["unk", "Unknown", p => free(p) && !Object.keys(p.known).length],
  ["gone", "Gone", p => GONE.includes(p.status)],
];
function susLevel(p) { const h = hostility(p); return h === "high" ? 3 : h === "medium" ? 2 : h === "low" ? 1 : h === "unknown" ? -1 : 0; }
function cardRow(p, sub) {
  const st = { im: `<span class="tag blue">IM „${esc(p.code)}“</span>`, gevangen: '<span class="tag grey">imprisoned</span>', zersetzt: '<span class="tag red">zersetzt</span>', gevlucht: '<span class="tag grey">fled</span>', uitgereisd: '<span class="tag grey">emigrated</span>', overgeplaatst: '<span class="tag grey">transferred</span>' }[p.status] || "";
  const lv = susLevel(p);
  const leds = lv < 0 ? `<span class="sus3 unk" title="nothing known yet">?</span>` : `<span class="sus3">${[1, 2, 3].map(i => `<i class="${i <= lv ? "on" : ""}"></i>`).join("")}</span>`;
  return `<button class="row card${GONE.includes(p.status) ? " gone" : ""}" data-pid="${p.id}"><span class="rn"><b>${esc(p.name)}</b> ${st}${S.taps[p.id] ? ' <span class="tag red">tapped</span>' : ""}<small>${esc(sub)}</small></span><span class="rp">${leds}<span>${p.pages}<small> pp.</small></span>${p.secretIM ? "" : `<small class="pc${p.complete ? " full" : ""}">${completion(p)}%</small>`}</span></button>`;
}
function cartotheek(el) {
  const f = cartotheek.f || (cartotheek.f = { q: "", c: "", v: "adres", open: {} });
  if (f.c === "case" && !S.case) f.c = "";
  const chipsHTML = () => KF.filter(([k]) => k !== "case" || S.case).map(([k, l, fn]) => { const n = S.people.filter(fn).length; return `<button class="kchip${f.c === k ? " on" : ""}${k === "case" ? " red" : ""}" data-c="${k}" ${!n && k ? "disabled" : ""}>${l}<b>${n}</b></button>`; }).join("");
  el.innerHTML = `<div class="kicker">Kartei F16 · ${S.people.length} cards</div><h2>Card index</h2>
   <input id="fq" class="ksearch" type="search" placeholder="Search name, job or workplace" value="${esc(f.q)}" autocomplete="off">
   <div class="kchips" id="kc"></div>
   <div class="kview"><button data-v="adres" class="${f.v === "adres" ? "on" : ""}">By address</button><button data-v="dik" class="${f.v === "dik" ? "on" : ""}">Thickest files</button></div>
   <div id="rows"></div>
   <p class="muted small klegend"><span class="sus3"><i class="on"></i><i class="on"></i><i></i></span> = what you know about their attitude · <b>?</b> = nothing known yet</p>`;
  const rows = el.querySelector("#rows"), kc = el.querySelector("#kc");
  const wp = p => p.work ? (WORKPLACES[p.work] || {}).name || "" : "";
  const draw = () => {
    kc.innerHTML = chipsHTML();
    kc.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { f.c = f.c === b.dataset.c ? "" : b.dataset.c; draw(); });
    el.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === f.v));
    const fn = (KF.find(x => x[0] === f.c) || KF[0])[2], q = f.q.trim().toLowerCase();
    const list = S.people.filter(fn).filter(p => !q || [p.name, p.job, wp(p), Bd(p.home).name].some(x => x.toLowerCase().includes(q)));
    if (!list.length) { rows.innerHTML = "<p class='muted'>No cards found.</p>"; return; }
    const byPages = (a, b) => b.pages - a.pages || a.name.localeCompare(b.name);
    if (f.v === "dik") {
      rows.innerHTML = list.sort(byPages).map(p => cardRow(p, `${p.job} · ${Bd(p.home).name}`)).join("");
    } else {
      const homes = BUILDINGS.filter(b => b.res && list.some(p => p.home === b.id));
      const auto = !!(q || f.c);   // bij zoeken of filter: alle laden open
      rows.innerHTML = homes.map(b => { const ps = list.filter(p => p.home === b.id).sort(byPages); const ims = ps.filter(p => p.status === "im").length, sus = ps.filter(KF[1][2]).length;
        return `<details class="lade" data-b="${b.id}"${auto || f.open[b.id] ? " open" : ""}><summary><span class="lt">${esc(b.name)}</span><span class="lc">${ims ? `<em class="blue">${ims} IM</em>` : ""}${sus ? `<em class="red">${sus} susp.</em>` : ""}<b>${ps.length}</b></span></summary>${ps.map(p => cardRow(p, `${p.job}${wp(p) ? " · " + wp(p) : ""} · ${p.age}`)).join("")}</details>`; }).join("");
      rows.querySelectorAll("details.lade").forEach(d => d.ontoggle = () => { if (!auto) f.open[d.dataset.b] = d.open; });
    }
    bindRows(rows);
  };
  el.querySelector("#fq").oninput = e => { f.q = e.target.value; draw(); };
  el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { f.v = b.dataset.v; draw(); });
  draw();
}

const KLAB = { im: "IM report", bug: "Bug", warn: "Warning", info: "Info", case: "Case" };
function firstLine(t) {
  const s = String(t || "").trim(), l = s.split("\n")[0];
  const m = l.match(/^.{24,}?[.!?’)](?=\s|$)/); let f = (m ? m[0] : l).trim();
  if (f.length > 96) f = f.slice(0, 90).replace(/\s\S*$/, "") + " …";
  return f;
}
function msgHTML(i) {
  const f = firstLine(i.text), more = f !== String(i.text || "").trim();
  return `<div class="msg k-${i.k}${i.read ? "" : " unread"}${more ? " fold" : ""}" data-i="${i.id}">
    <div class="mh"><span class="mlab">${KLAB[i.k] || "Info"}</span><b>${esc(i.title)}</b>${more ? `<span class="mx">+</span>` : ""}</div>
    <div class="mt short">${esc(f)}</div>${more ? `<div class="mt full">${esc(i.text)}</div>` : ""}
    ${i.pid && P(i.pid) ? `<button class="lnk" data-pid="${i.pid}">Open file ${esc(P(i.pid).name)} →</button>` : ""}</div>`;
}
function inboxView(el) {
  const pend = S.queue.filter(q => ev(q).via === "dossier");
  const nw = S.inbox.filter(i => !i.read), old = S.inbox.filter(i => i.read);
  const turnsOld = [...new Set(old.map(i => i.t))].sort((a, b) => b - a);
  const todo = pend.length + (S.case ? 1 : 0);
  el.innerHTML = `<div class="kicker">In-tray</div><h2>Files</h2>
   ${todo ? `<div class="ibh red">Waiting for you · ${todo}</div>` : ""}
   ${pend.map((q, i) => `<button class="row hot" data-q="${i}"><span class="rn"><b>Order: ${esc(ev(q).title)}</b><small>Awaiting your decision</small></span><span class="rp">!</span></button>`).join("")}
   ${S.case ? `<button class="row red" id="caseRow"><span class="rn"><b>Case: ${esc(INCIDENTS[S.case.tmpl].t)}</b><small>${S.case.turns} turn(s) left to find the culprit</small></span><span class="rp">→</span></button>` : ""}
   ${nw.length ? `<div class="ibh">New · ${nw.length}</div>${nw.map(msgHTML).join("")}` : ""}
   ${turnsOld.map(t => { const its = old.filter(i => i.t === t); const cur = t === S.t;
     return `<details class="ibt"${cur ? " open" : ""}><summary><span>${esc(TURNS[t].label)}</span><small>${its.length} message${its.length > 1 ? "s" : ""}</small></summary>${its.map(msgHTML).join("")}</details>`; }).join("")}
   ${!S.inbox.length && !todo ? "<p class='muted'>No new files. Use IMs or bugs to bring in information.</p>" : ""}`;
  S.inbox.forEach(i => i.read = true);
  el.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { b.disabled = true; openEvent(pend[+b.dataset.q]); });
  el.querySelectorAll(".msg.fold").forEach(m => m.onclick = e => { if (e.target.closest(".lnk")) return; m.classList.toggle("open"); });
  const cr = el.querySelector("#caseRow"); if (cr) cr.onclick = () => sheet(caseView);
  bindRows(el); save(); setTimeout(refresh, 50);
}

function caseView(el) {
  const c = S.case; if (!c) { el.innerHTML = "<h2>No open case</h2>"; return; }
  const sus = S.people.filter(p => free(p) && matchesShown(p, c));
  const mark = (p, k) => { if (k === "tw") { const tw = twOf(p); const tk = tw && p.known[tw] && p.known[tw].s === "zeker"; const noneKnown = !tw && p.twChecked; return tk ? (tw === c.tw ? ["ok", "✓ same machine"] : ["no", "✗ different machine"]) : noneKnown ? ["no", "✗ no machine found"] : ["", "? machine unknown"]; } if (k === "paper") return p.work === c.work ? ["ok", "✓ workplace matches"] : ["no", "✗ workplace"]; return p.home === c.home ? ["ok", "✓ lives there"] : ["no", "✗ lives elsewhere"]; };
  const steps = c.shown.includes("tw") ? `<ol class="howto"><li>The list below only shows people whose ${c.shown.includes("paper") ? "<b>workplace</b>" : "<b>address</b>"} matches.</li><li>Now you need to know <b>who has the right typewriter</b>. Tap <b>Observe</b> on a suspect (1 manpower). Bugs in the building help too.</li><li>See <b>✓ same machine</b>? Tap <b>Culprit!</b></li></ol>` : `<ol class="howto"><li>Workplace and address together usually point to one person. They are listed below.</li><li>Tap <b>Culprit!</b> to close the case.</li></ol>`;
  el.innerHTML = `<div class="stampS">ERMITTLUNG</div><div class="kicker">Case no. ${c.n} · ${c.turns} turn${c.turns > 1 ? "s" : ""} left</div><h2>${esc(INCIDENTS[c.tmpl].t)}</h2>
   <div class="report">${esc(INCIDENTS[c.tmpl].d + (c.note || ""))}</div>
   <div class="kicker">Clues</div>${c.shown.map(k => `<div class="clue">• ${esc(clueText(c, k))}</div>`).join("")}
   <div class="kicker">How do you solve it?</div>${steps}
   <div class="kicker">Suspects (${sus.length})</div>
   ${sus.map(p => `<div class="sus"><div class="sn"><a data-pid="${p.id}"><b>${esc(p.name)}</b></a><small>${esc(p.job)}</small><div class="marks">${c.shown.map(k => { const [cl, t] = mark(p, k); return `<span class="${cl}">${t}</span>`; }).join("")}${c.geur[p.id] !== undefined ? `<span class="${c.geur[p.id] ? "ok" : "no"}">${c.geur[p.id] ? "✓ dog reacts" : "✗ no reaction from dog"}</span>` : ""}</div></div>
     <div class="sb">${c.shown.includes("tw") ? `<button class="mini" data-obs="${p.id}" ${S.mk < 1 ? "disabled" : ""}>Observe<small>1 MP</small></button>` : ""}<button class="mini red" data-acc="${p.id}">Culprit!</button></div></div>`).join("") || "<p class='muted'>Nobody fits. Perhaps the culprit works or lives somewhere you didn't expect.</p>"}
   <p class="muted small">If you pick the wrong person, Kessler won't notice. But the real culprit will strike again.</p>`;
  el.querySelectorAll("[data-obs]").forEach(b => b.onclick = () => ACT.observe(P(b.dataset.obs)));
  el.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => { const p = P(b.dataset.acc); modal(`<h1>Name ${esc(p.name)}?</h1><div class="result">You can't undo this. If you are wrong, the real culprit stays free.</div><div class="choices"><button class="ch" id="y"><b>Yes, it's ${obj(p)}</b></button><button class="ch" id="n"><b>Not yet</b></button></div>`, m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); accuse(p); }; m.querySelector("#n").onclick = closeModal; }); });
  el.querySelectorAll("a[data-pid]").forEach(a => a.onclick = () => sheet(e => personView(e, P(a.dataset.pid))));
}

function familyView(el) {
  const pend = S.queue.filter(q => ev(q).via === "gezin");
  const g = S.gezin;
  const k = S.flags.alone ? "Katrin and Jens live in Rostock. The flat is quiet." : g >= 70 ? "Katrin laughs at your bad jokes again. Jens wants to do ‘something with computers’ when he grows up." : g >= 45 ? "It's quiet at home. Maybe too quiet." : g >= 25 ? "Katrin no longer asks what time you'll be home. Jens stays in his room." : "Katrin sleeps on the sofa. Or you do. It no longer matters who.";
  el.innerHTML = `<div class="kicker">Family</div><h2>Katrin & Jens</h2><div class="statline">${bar("Family", g, "sf")}</div><p class="who">${esc(k)}</p>
   ${pend.map((q, i) => `<button class="row hot" data-q="${i}"><span class="rn"><b>${esc(ev(q).title)}</b><small>${esc(ev(q).who || "")}</small></span><span class="rp">!</span></button>`).join("")}
   <div class="acts"><button class="act" id="home" ${S.home || S.mk < 1 ? "disabled" : ""}><b>Go home early</b><span>1 MP · family +7${S.home ? " · already done" : ""}</span></button></div>
   <p class="muted small">A low family score has consequences. Including for how your story ends.</p>`;
  el.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { b.disabled = true; openEvent(pend[+b.dataset.q]); });
  el.querySelector("#home").onclick = () => ACT.home();
}

function calendarView(el) {
  const q = S.quota, r = rank(), nr = RANKS[S.rank + 1];
  el.innerHTML = `<div class="kicker">Annual targets ${turn().y}</div><h2>Kessler's expectations</h2>
   <div class="grid2"><div><small>Results</small>${S.res} / ${q.res}</div><div><small>Active IMs</small>${imCount()} / ${q.ims}</div><div><small>Rank</small>${esc(r.id)}</div><div><small>Next rank</small>${nr ? `${esc(nr.id)} at ${nr.xp} XP` : "—"}</div></div>
   <p class="who">You earn results by solving cases, arresting enemies of the state or ‘zersetzing’ them, and through some decisions. At the end of every year comes the annual assessment: meet both targets for a bonus of ${XP.review} XP. Promotion comes with experience (XP).</p>
   <div class="acts one"><button class="act" id="kad"><b>Your Kaderakte <em>${S.xp} XP</em></b><span>Rank, skills, reputation and the favours you promised.</span></button></div>
   <div class="kicker">By rank</div><ul class="traits">${RANKS.map((x, i) => `<li class="${i === S.rank ? "" : "muted"}">${x.id} (${x.xp} XP): ${x.mk} manpower, ${x.ims} IMs, ${x.bugs} bugging sets</li>`).join("")}</ul>
   <div class="kicker">Rival</div><p class="who">${S.flags.fuchsMet ? `Oberleutnant Fuchs: ${S.fuchs >= 50 ? "openly hostile" : S.fuchs >= 25 ? "on his guard" : "polite"}.` : "None yet."}</p>`;
  el.querySelector("#kad").onclick = () => sheet(kaderView);
}

function phoneTap() {
  const q = S.queue.find(q => ev(q).via === "telefoon");
  if (q) return openEvent(q);
  const lines = [["Kessler", "‘I hope you will have something to report at the annual assessment.’"], ["Switchboard", "‘Wrong number.’ Click. Still, a moment of static on the line."], ["Katrin", "‘Will you be home on time today? Jens has a football match.’"]];
  const [w, t] = rand(lines); toast(`<b>${w}:</b> ${t}`);
}

function showHelp() {
  modal(`<h1>Help</h1><div class="result"><b>Office</b>: tap objects. Telephone = orders, folder = reports, red folder = case, cabinet = everyone, photo = family, map = district.
<b>District</b>: drag to look around, tap a building.
<b>Observe</b> (1 MP): discover someone's traits.
<b>Recruit</b> (1 MP): make someone an informer (IM). They inform on a neighbour every turn. Leverage makes it more likely. IMs sometimes lie.
<b>Arrest</b> (2 MP): possible with 2 confirmed suspicious traits.
<b>Bugs</b> (2 MP): bugged conversations from a building every turn.
<b>Case</b>: compare typewriter, paper and address. Name the culprit.
<b>Street</b>: tap a passer-by to talk. Tap the phone box or the Litfaßsäule.
<b>Inside</b>: residential buildings, Café Mosaik and the Kaufhalle have a <b>Go inside</b> button.
<b>Pinboard</b>: red threads between residents. A complete file is stamped VOLLSTÄNDIG.
<b>Treff</b>: meet informers in the Konspirative Wohnung (Lychener Straße 40). Keep them loyal.
<b>Kaderakte</b>: tap your rank at the top. XP brings promotion and skill points. Skills raise the chances shown in %.
<b>Interrogate</b> (2 MP): find the lie in someone's story. <b>Favours</b>: people on the street sometimes ask you for one.</div>
<button class="next" id="nx">OK</button><button class="next ghost" id="hb">Handbook: allowed or not, and the history</button><button class="next ghost" id="snd">Sound: ${soundOn() ? "on" : "off"}</button><button class="next ghost" id="ri">Tutorial again</button>`, m => { m.querySelector("#nx").onclick = closeModal; m.querySelector("#ri").onclick = showIntro; m.querySelector("#hb").onclick = () => handbook("regels", showHelp); m.querySelector("#snd").onclick = () => { setSound(!soundOn()); showHelp(); }; });
}

function setMode(m) {
  IX = null; world.setMode(m); document.body.dataset.mode = m; if (m === "district") tutDone(1); if (m !== "office") stopRing(); else refresh();
  $("#navOffice").classList.toggle("on", m === "office"); $("#navWijk").classList.toggle("on", m === "district");
  if (m === "district" && S && !S.flags._wijkHint) { S.flags._wijkHint = true; toast("Drag to look around. Tap a building to see who lives or works there."); }
  updateCoach();
}

function archiveView() {
  const f = endings(), ms = medals();
  modal(`<div class="kicker">Archive · Stasi Records Agency</div><h1>Archive</h1>
    <div class="kicker">Endings · ${f.length} of ${Object.keys(ENDINGS).length}</div><ul class="traits">${Object.entries(ENDINGS).map(([k, v]) => `<li class="${f.includes(k) ? "" : "muted"}">${f.includes(k) ? esc(v) : "???"}</li>`).join("")}</ul>
    <div class="kicker">Documents · one per ending found</div>${ARCHIVE.map(([t, d], i) => i < f.length ? `<details class="rule"><summary><span class="rk dt">No. ${i + 1}</span>${esc(t)}</summary><p>${esc(d)}</p></details>` : `<div class="rule locked">No. ${i + 1} · sealed</div>`).join("")}
    <div class="kicker">Decorations · ${ms.length} of ${Object.keys(MEDALS).length}</div><div class="medals">${Object.entries(MEDALS).map(([k, m]) => `<div class="md${ms.includes(k) ? "" : " off"}"><i style="background:${m.col}"></i><b>${ms.includes(k) ? esc(m.t) : "???"}</b><small>${esc(m.d)}</small></div>`).join("")}</div>
    <div class="kicker">Conditions for a new game</div><ul class="traits">${Object.values(MODS).map(m => `<li class="${f.length >= m.need ? "" : "muted"}"><b>${esc(m.t)}</b>: ${esc(m.d)} ${f.length >= m.need ? "" : `(after ${m.need} ending${m.need > 1 ? "s" : ""})`}</li>`).join("")}</ul>
    <button class="next" id="nx">Close</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); }, { wide: true });
}
function showTitle() {
  const sv = load(); const f = endings();
  $("#title").classList.add("open");
  $("#title").innerHTML = `<div class="tcard"><div class="kicker">East Berlin · 1983–1989</div>
   <h1 class="logo">AKTE<span>.</span></h1><div class="sub">A Stasi simulator</div>
   <p>Spy on your district. Recruit informers. Decide over lives. Until the Wall falls.</p>
   ${sv && !sv.over && TURNS[sv.t] ? `<button class="next" id="cont">Continue · ${esc(TURNS[sv.t].label)}</button>` : ""}<button class="next${sv && !sv.over ? " ghost" : ""}" id="ng">New game</button>
   <div class="trow"><button class="next ghost" id="dly">Daily Akte${dailyResult(todayKey()) ? " ✓" : ""}</button><button class="next ghost" id="arc">Archive</button><button class="next ghost" id="hbk">Handbook</button></div>
   <p class="muted small">Endings found: ${f.length}/${Object.keys(ENDINGS).length} · decorations ${medals().length}/${Object.keys(MEDALS).length} · fictional people, real history</p></div>`;
  const start = mods => { $("#title").classList.remove("open"); newGame(mods); setMode("office"); showIntro(); };
  $("#ng").onclick = () => { unlockAudio(); const um = unlockedMods(); if (!um.length) return start([]); const sel = new Set(); const draw = () => modal(`<div class="kicker">New game</div><h1>Conditions</h1><div class="result">You have found endings, so you can make it harder. Optional.</div><div class="choices">${Object.entries(MODS).map(([k, m]) => `<button class="ch pick${sel.has(k) ? " on" : ""}" data-m="${k}" ${um.includes(k) ? "" : "disabled"}><b>${sel.has(k) ? "▣" : "□"} ${esc(m.t)}</b><span>${um.includes(k) ? esc(m.d) : `Unlocks after ${m.need} ending${m.need > 1 ? "s" : ""}.`}</span></button>`).join("")}</div><button class="next" id="go">Start</button>`, m => { m.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const k = b.dataset.m; sel.has(k) ? sel.delete(k) : sel.add(k); draw(); }); m.querySelector("#go").onclick = () => { closeModal(); start([...sel]); }; }, { lock: true }); draw(); };
  $("#dly").onclick = () => { unlockAudio(); openDaily({ modal, closeModal, toast, sfx, esc, twLabel: t => TRAITS[t].l }, () => { if (dailyResult(todayKey()) && dailyResult(todayKey()).ok) medal("daily"); showTitle(); }); };
  $("#arc").onclick = archiveView;
  $("#hbk").onclick = () => handbook("regels");
  const c = $("#cont"); if (c) c.onclick = () => { unlockAudio(); S = sv; $("#title").classList.remove("open"); if (S.tut === undefined) S.tut = 99; setMode("office"); refresh(); toast(`<b>${esc(turn().label)}</b> · ${S.mk} manpower`); };
}


// ===================== WIJK INTERACTIEF (fase 3D) =====================
const GOSSIP = {
  rias: "never misses the Western charts on a Sunday", westfam: "gets a Westpaket every Christmas, coffee you can smell in the stairwell", kerk: "is at the church more than the pastor",
  ausreise: "has been to the Department of Internal Affairs twice. You know what that means", affaire: "has a visitor on Tuesdays, when the husband is on late shift", schulden: "owes half the building money",
  zwart: "can get you West marks, four to one", drank: "is at the Kneipe from five o'clock", kindstudie: "would do anything to get the kid into the EOS", milieu: "goes on about the air in Bitterfeld",
  vrede: "still wears that badge under the collar", samizdat: "types at night, you can hear it through the wall", vlucht: "keeps asking about Hungary", punk: "goes to those concerts in the church",
  loyaal: "would report their own mother", klager: "writes an Eingabe about everything",
};
const DAILY = ["carries a string bag with three cucumbers and a jar of Spreewald gherkins.", "is reading the Junge Welt on a bench.", "is carrying coal up from the cellar in two buckets.", "has a Westpaket under one arm, wrapped in brown paper.", "is waiting for the tram and smoking a Club.", "walks past with a pram and a net of potatoes.", "stops to read the Litfaßsäule, then walks on quickly.", "comes out of the Kaufhalle with nothing in their hands."];
function gossip(srcName, sure) {
  const c = S.people.filter(q => free(q) && !q.secretIM && q.traits.some(t => !q.known[t] && GOSSIP[t]));
  const q = rand(c); if (!q) return { line: "‘Nothing happens here, comrade. Nothing at all.’" };
  const truth = sure || R() < 0.7 + sk("obs") * 0.05 + (S.rep.buurt - 50) / 500;
  let t = truth ? rand(q.traits.filter(t => !q.known[t] && GOSSIP[t])) : rand(FAKEABLE.filter(t => !q.traits.includes(t) && !q.known[t] && GOSSIP[t]));
  if (!t) t = rand(q.traits.filter(t => !q.known[t] && GOSSIP[t]));
  q.known[t] = { s: sure ? "zeker" : "talk" }; q.pages += 1; if (sure) discoverLinks();
  return { line: `‘${q.name}? ${GOSSIP[t].charAt(0).toUpperCase() + GOSSIP[t].slice(1)}.’`, q, t, sure };
}
function walkerCard(i) {
  const w = walkMap[i]; if (!w || S.over) return; tutDone(99);
  const p = w.pid ? P(w.pid) : null; sfx.click();
  world.selectWalker(i, p ? p.name : w.anon === "vopo" ? "Volkspolizist" : w.anon === "stasi" ? "Leather coat" : "Passer-by");
  if (!p) {
    const t = w.anon === "vopo" ? "A Volkspolizist checks the papers of a Trabant driver. He salutes you without quite knowing why." : w.anon === "stasi" ? "A man in a leather coat. He looks at you, you look at him. Colleagues. Neither of you nods." : `Someone you don't know ${rand(DAILY)}`;
    return modal(`<div class="kicker">On the street</div><h1>${w.anon === "vopo" ? "Volkspolizei" : w.anon === "stasi" ? "A colleague?" : "A passer-by"}</h1><div class="result">${esc(t)}</div><button class="next" id="nx">Walk on</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); world.selectWalker(null); });
  }
  const mood = p.status === "im" ? `IM „${p.code}“. Nods at you, a fraction too quickly.` : p.fear > 40 ? "Sees you and crosses the street." : p.dis > 50 ? "Looks straight through you." : `${p.fn} ${rand(DAILY)}`;
  const talked = S.talked[p.id], er = S.errands.find(x => x.pid === p.id);
  modal(`<div class="kicker">On the street · ${esc(Bd(p.home).name)}</div><h1>${esc(p.name)}</h1><div class="who">${esc(p.job)}, ${p.age}</div><div class="result">${esc(mood)}</div>
    ${er ? `<p class="note">${esc(p.fn)} is still waiting for the favour you promised: ${esc(ERRANDS[er.k].t.toLowerCase())}.</p>` : ""}
    <div class="choices"><button class="ch" id="talk" ${talked ? "disabled" : ""}><b>Talk to ${obj(p)}</b><span>${talked ? "Already spoke this turn." : S.rep.buurt < 20 ? "The district has turned cold on you. Hard going." : "Free. You choose how to play it."}</span></button>
    <button class="ch" id="fol" ${S.mk < 1 ? "disabled" : ""}><b>Follow ${obj(p)}</b><span>1 MP · the same as Observe</span></button>
    <button class="ch" id="fil"><b>Open the file</b><span>${p.pages} pages · ${completion(p)}% complete${er ? " · favour waiting" : ""}</span></button></div>`, m => {
    const end = () => { world.selectWalker(null); };
    m.querySelector("#talk").onclick = () => talkMenu(p, end);
    m.querySelector("#fol").onclick = () => { closeModal(); end(); sheet(e => personView(e, p)); ACT.observe(p); };
    m.querySelector("#fil").onclick = () => { closeModal(); end(); sheet(e => personView(e, p)); };
  });
}
// gesprek op straat: één keuze, met vaardigheidscheck in procenten
function talkMenu(p, end) {
  const cAsk = talkChance(p, "ueb", 50), cPress = talkChance(p, "verh", 40), cold = S.rep.buurt < 20;
  const own = p.traits.filter(t => !conf(p, t) && TRAITS[t] && !TRAITS[t].tw);
  modal(`<div class="kicker">${esc(p.name)} · how do you play it?</div><h1>A word on the street</h1><div class="result">District ${repWord(S.rep.buurt)}${churchy(p) ? ` · church ${repWord(S.rep.kerk)}` : ""}${p.owes ? ` · ${esc(p.fn)} owes you` : ""}.</div>
    <div class="choices">
    <button class="ch" data-c="chat"><b>Small talk <em class="pct">free</em></b><span>${cold ? "People change the subject when you come near." : "Neighbours talk about neighbours. Gossip, unconfirmed."}</span></button>
    <button class="ch" data-c="ask"><b>Ask about the neighbours <em class="pct">${cAsk}%</em></b><span>Persuasion ${sk("ueb")}. Success: something true about someone else. Failure: ${pron(p)} grows wary.</span></button>
    <button class="ch" data-c="press" ${own.length ? "" : "disabled"}><b>Ask for ${p.sex === "f" ? "her" : "his"} papers <em class="pct">${cPress}%</em></b><span>${own.length ? `Interrogation ${sk("verh")}. Success: ${pron(p)} lets something slip about ${obj(p)}self. Failure: the whole street saw it.` : "Nothing left to find out this way."}</span></button>
    <button class="ch" data-c="cof" ${S.inv.kaffee ? "" : "disabled"}><b>Offer West coffee <em class="pct">sure</em></b><span>${S.inv.kaffee ? `You have ${S.inv.kaffee}. Buys a true story about a neighbour.` : "You have no West coffee."}</span></button>
    <button class="ch" data-c="dm" ${S.inv.dm && own.length ? "" : "disabled"}><b>Slip ${obj(p)} 50 DM <em class="pct">sure</em></b><span>${S.inv.dm ? `A bribe in Westgeld (${S.inv.dm} left). ${pron(p).replace(/^./, c => c.toUpperCase())} tells you something about ${obj(p)}self. Suspicion +1.` : "You have no Westgeld."}</span></button>
    </div><button class="next ghost" id="bk">Walk on</button>`, m => {
    m.querySelector("#bk").onclick = () => { closeModal(); end(); };
    m.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      const c = b.dataset.c; S.talked[p.id] = true; sfx.paper(); let h = "", body = "", note = "", e = {}, g = null;
      if (c === "chat") { if (cold && R() < 0.7) body = "‘Weather's turning.’ That is all you get."; else { g = gossip(p.name, false); } h = "Small talk"; }
      if (c === "cof") { invAdd("kaffee", -1); g = gossip(p.name, true); h = "Over coffee"; e = { bu: 1 }; }
      if (c === "ask") { h = "Asking around"; if (R() * 100 < cAsk) { g = gossip(p.name, true); e = { xp: XP.talk }; note = "✓ Check passed"; } else { p.dis = Math.min(95, p.dis + 4); body = `‘Why do you want to know?’ ${Pron(p)} looks at you a moment too long and goes inside.`; e = { bu: -2 }; note = "✗ Check failed"; } }
      if (c === "press") { h = "Your papers, please"; if (R() * 100 < cPress) { const t = rand(own); p.known[t] = { s: "zeker" }; p.pages += 2; p.fear += 8; discoverLinks(); body = `${Pron(p)} fumbles with the Ausweis, talks too much, and says more than intended.\n\n✓ ${trLabel(t)}`; e = { xp: XP.talk, c: -1 }; note = "✓ Check passed"; } else { p.fear += 10; p.dis = Math.min(95, p.dis + 6); body = "The papers are in order. Two women at the tram stop watched the whole thing."; e = { bu: -3, c: -1 }; note = "✗ Check failed"; } }
      if (c === "dm") { invAdd("dm", -1); const t = rand(own); p.known[t] = { s: "zeker" }; p.pages += 2; discoverLinks(); body = `The envelope vanishes into a coat pocket. Then, quietly:\n\n✓ ${trLabel(t)}`; e = { d: 1 }; }
      if (g) body = g.line + (g.q ? `\n\n${g.sure ? "Confirmed" : "Gossip, unconfirmed"}: ${g.q.name} · ${trLabel(g.t).toLowerCase()}.${g.sure ? "" : " Observe to check it."}` : "");
      // soms vraagt iemand je om een gunst (bijmissie)
      const offer = !S.errands.find(x => x.pid === p.id) && S.errands.length < 3 && p.status === "vrij" && !p.owes && !p.family && S.rep.buurt >= 20 && R() < 0.35 ? errandFor(p, R) : null;
      applyE(e); save(); refresh();
      modal(`<div class="kicker">${esc(p.name)} talks${note ? " · " + note : ""}</div><h1>${esc(h)}</h1><div class="report">${esc(body)}</div>${chips(e)}
        ${offer ? `<div class="box"><div class="kicker">Before you go</div><div class="clue">${esc(ERRANDS[offer].ask)}</div></div><div class="choices"><button class="ch" id="yes"><b>‘I'll see what I can do.’</b><span>A favour (3 turns). Do it and ${pron(p)} owes you.</span></button><button class="ch" id="no"><b>‘Not my department.’</b></button></div>` : `<button class="next" id="nx">OK</button>`}
        ${g && g.q ? `<button class="next ghost" id="op">Open file ${esc(g.q.name)}</button>` : ""}`, m2 => {
        const nx = m2.querySelector("#nx"); if (nx) nx.onclick = () => { closeModal(); end(); };
        const y = m2.querySelector("#yes"); if (y) y.onclick = () => { S.errands.push({ pid: p.id, k: offer, due: S.t + 2 }); addLog(p, `Asked a favour: ${ERRANDS[offer].t.toLowerCase()}`); save(); closeModal(); end(); toast(`Favour noted in ${esc(p.name)}'s file. Open the file to do it.`); };
        const n = m2.querySelector("#no"); if (n) n.onclick = () => { closeModal(); end(); };
        const o = m2.querySelector("#op"); if (o) o.onclick = () => { closeModal(); end(); sheet(e2 => personView(e2, g.q)); };
      });
    });
  }, { lock: true });
}
function doErrand(p) {
  const er = S.errands.find(x => x.pid === p.id); if (!er) return; const E = ERRANDS[er.k];
  if (E.need) { if (!S.inv[E.need]) return toast(`You have no ${INV[E.need][0]}.`); invAdd(E.need, -1); } else if (!spend(E.mp)) return;
  S.errands = S.errands.filter(x => x !== er); p.owes = true; p.fear = Math.max(0, p.fear - 10); p.dis = Math.max(0, p.dis - 6); p.loyal = Math.min(100, (p.loyal || 0) + 10);
  S.stats.errands = (S.stats.errands || 0) + 1; addLog(p, `You did them a favour: ${E.t.toLowerCase()}`); sfx.good();
  const t = rand(p.traits.filter(t => !conf(p, t) && TRAITS[t] && !TRAITS[t].tw)); if (t) { p.known[t] = { s: "zeker" }; p.pages += 2; discoverLinks(); }
  if (S.stats.errands >= 4) medal("helfer");
  after(`<h1>Favour: ${esc(E.t)}</h1><div class="result">${esc(E.done)}${t ? `\n\nGrateful, ${esc(p.fn)} tells you more than ${pron(p)} should.\n✓ ${esc(trLabel(t))}` : ""}\n\n${esc(p.fn)} owes you now. Recruiting ${obj(p)} will be easier.</div>`, { ...(E.e || {}), xp: XP.quest, bu: 5, ki: churchy(p) ? 4 : 0 });
}
// ---------- verhoor (Befragung) ----------
function interrogate(p) {
  if (!spend(2)) return; S.used["v" + p.id] = 1; tutDone(99);
  const known = p.traits.filter(t => conf(p, t));
  const nb = rand(S.people.filter(q => q !== p && (q.home === p.home || q.work === p.work)));
  const story = buildStory(p, known, nb && nb.name, R);
  const file = known.filter(t => TRAITS[t] && !TRAITS[t].tw).map(trLabel);
  const kas = (S.inv.kas || 0) > 0, lives = 1 + Math.floor(sk("verh") / 2) + (kas ? 1 : 0);
  addLog(p, "Questioned at the Kreisdienststelle");
  playMinigame("verhoor", mgUI, { kicker: `Befragung · Interrogation ${sk("verh")}${kas ? " · cassette running" : ""}`, name: p.name, story, file, time: 30 + sk("verh") * 4, lives }, res => {
    closeModal(); const base = lives - (kas ? 1 : 0); let kasNote = "";
    if (kas && (res.used || 0) >= base) { invAdd("kas", -1); kasNote = "\n\n(You replayed the cassette to catch your mistake. It is used up.)"; }
    if (res.ok) {
      const unk = p.traits.filter(t => !conf(p, t) && TRAITS[t]); const got = [];
      for (let k = 0; k < 2 && unk.length; k++) { const t = unk.splice(Math.floor(R() * unk.length), 1)[0]; p.known[t] = { s: "zeker" }; got.push(t); }
      p.fear += 20; p.dis = Math.max(0, p.dis - 8); p.pages += 8;
      const conf2 = S.case && S.case.culprit === p.id; if (conf2) S.case.geur[p.id] = true;
      discoverLinks();
      return after(`<h1>${esc(p.name)} breaks</h1><div class="result">‘${esc(story.lines[story.lie])}’ You read it back. Then you read the other line back.${got.length ? "\n\n" + got.map(t => "✓ " + esc(trLabel(t))).join("\n") : "\n\nThere was nothing more to find."}${conf2 ? "\n\nAnd then, unasked: the leaflets. The case file now marks " + esc(p.fn) + "." : ""}${kasNote}</div>`, { c: -3, xp: XP.verhoor, bu: -1 });
    }
    if (res.skipped) return after(`<h1>Let go</h1><div class="result">You close the folder. ‘You may go.’ ${esc(p.fn)} doesn't believe it until the door opens.</div>`, { c: 1 });
    p.dis = Math.min(95, p.dis + 8); p.fear += 10;
    after(`<h1>Nothing</h1><div class="result">Three hours, two ashtrays. ${esc(p.fn)} walks out with the same story ${pron(p)} came in with, and a new reason to hate you.</div>`, { c: -3, bu: -2, ki: churchy(p) ? -2 : 0 });
  });
}
// ---------- Kaderakte: rang, vaardigheden, reputatie, gunsten ----------
function kaderView(el) {
  const r = rank(), nr = RANKS[S.rank + 1], pts = points();
  const prog = nr ? Math.round((S.xp - r.xp) / (nr.xp - r.xp) * 100) : 100;
  const dots = n => "●".repeat(n) + "○".repeat(SK_MAX - n);
  el.innerHTML = `<div class="kicker">Kaderakte · your personnel file</div><h2>${esc(r.id)}</h2>
    <div class="compl"><span>${nr ? `To ${esc(nr.id)}` : "Highest rank"}</span><div class="cbar"><i style="width:${Math.max(0, Math.min(100, prog))}%"></i></div><b>${S.xp} XP</b></div>
    <p class="muted small">${nr ? `${nr.xp - S.xp} XP to go. ` : ""}XP from observations, reports, cases, complete files, recruits, favours and the annual assessment. Every ${XP_PER_POINT} XP: one skill point.</p>
    <div class="kicker">Skills <small class="muted">· ${pts ? `<b class="red">${pts} point${pts > 1 ? "s" : ""} to spend</b>` : "no points to spend"}</small></div>
    <div class="acts one">${Object.entries(SKILLS).map(([k, v]) => `<button class="act sk" data-sk="${k}" ${!pts || sk(k) >= SK_MAX ? "disabled" : ""}><b>${esc(v.t)} <em>${dots(sk(k))}</em></b><span>${esc(v.d)}${pts && sk(k) < SK_MAX ? " Tap: train (+1)." : ""}</span></button>`).join("")}</div>
    <div class="kicker">Reputation</div>
    <div class="reps">${Object.entries(REP).map(([k, v]) => `<div class="rep"><small>${esc(v.t)}</small>${bar10(repV(k))}<span>${repWord(repV(k))}</span></div>`).join("")}</div>
    <p class="muted small">${esc(REP.buurt.d)} ${esc(REP.kerk.d)}</p>
    <div class="kicker">Favours you promised <small class="muted">· ${S.errands.length}/3</small></div>
    ${S.errands.map(x => { const p = P(x.pid); return `<button class="row" data-pid="${p.id}"><span class="rn"><b>${esc(p.name)}</b><small>${esc(ERRANDS[x.k].t)}</small></span><span class="rp">${x.due - S.t + 1}<small> t. left</small></span></button>`; }).join("") || "<p class='muted small'>None. Talk to people in the street; sometimes they ask you for something.</p>"}
    <div class="kicker">Equipment</div><p class="who">${pool()}/${bugCap()} bugging sets in use${S.inv.minox ? " · Minox camera" : ""}${S.inv.kas ? ` · ${S.inv.kas} cassette${S.inv.kas > 1 ? "s" : ""}` : ""}. More from the strongbox: Requisition.</p>`;
  el.querySelectorAll("[data-sk]").forEach(b => b.onclick = () => { const k = b.dataset.sk; if (points() <= 0 || sk(k) >= SK_MAX) return; S.sk[k]++; S.spent++; sfx.stamp(); save(); refresh(); rerender(); toast(`<b>${esc(SKILLS[k].t)}</b> ${sk(k)}/${SK_MAX}`); });
  bindRows(el);
}

// ---------- binnenruimtes ----------
let IX = null;   // { kind, bid }
const INSIDE = { kollwitz: "stairs", lychener: "stairs", greif: "stairs", dimi: "stairs", cafe: "kneipe", konsum: "kaufhalle" };
function enterInterior(kind, bid) {
  closeSheet(); closeModal(); stopRing();
  IX = { kind, bid };
  const T = turn(), res = bid ? S.people.filter(p => p.home === bid) : [];
  const posters = postersFor(T);
  const data = { seed: S.seed % 1000 + S.t, winter: !!T.winter, people: res, platte: bid === "greif" || bid === "dimi", home: bid === "kollwitz", kw: bid === "lychener", bugged: !!(bid && S.bugs[bid]),
    search: kind === "flat" && !!S.homeBugs, alone: !!S.flags.alone, queue: S.buck ? 7 : 3, sign: S.buck ? `HEUTE: ${S.buck.toUpperCase()}` : rand(["HEUTE: RONDO-KAFFEE", "OBST: LEIDER NICHT", "HEUTE: KETWURST"]),
    candle: T.key === "1989-feb", posters, note: !!S.case, rec: Object.keys(S.bugs).length > 0 };
  world.enterInterior(kind, data); document.body.dataset.mode = "interior";
  $("#navOffice").classList.remove("on"); $("#navWijk").classList.remove("on");
  $("#leave").innerHTML = `← ${esc({ stairs: bid ? Bd(bid).name : "Stairwell", flat: "Back to the stairwell", kneipe: "Café Mosaik", kaufhalle: "Kaufhalle", kw: "Back to the stairwell", booth: "Phone box", litfass: "Litfaßsäule" }[kind])}<small>${kind === "flat" || kind === "kw" ? "leave" : "to the street"}</small>`;
  interiorBadges(); sfx.drawer(); updateCoach();
}
function interiorBadges() {
  if (!IX) return; const b = {};
  if (IX.kind === "flat" && S.homeBugs) { S.homeBugs.found.forEach(k => b[k] = "found"); }
  if (IX.kind === "kw") { const low = S.people.filter(p => p.status === "im" && S.t - (p.lastTreff ?? S.t) > 2).length; if (low) b.treff = low; }
  if (IX.kind === "kaufhalle" && S.buck && !S.used.buck) b.counter = "!";
  world.setInteriorBadges(b);
}
function leaveInterior() { if (!IX) return; const k = IX; IX = null; if (k.kind === "flat" || k.kind === "kw") return enterInterior("stairs", k.kind === "flat" ? "kollwitz" : "lychener"); setMode("district"); if (k.bid) world.focus(k.bid); }
function postersFor(T) {
  const y = T.y, P2 = [];
  const yearP = { 1983: ["KARL-MARX-\nJAHR 1983", "The state's big anniversary of the year: 100 years since Marx's death. Every school did a project on it."], 1984: ["35 JAHRE\nDDR", "The GDR was founded on 7 October 1949. Round anniversaries came with parades and new buildings."], 1985: ["40. JAHRESTAG\nDER BEFREIUNG", "8 May 1945, the end of the war in Europe, was celebrated in the GDR as the Day of Liberation by the Soviet Army."], 1986: ["XI. PARTEITAG\nDER SED", "Party congresses set the line for the next five years. Factories made pledges to ‘honour’ them with extra output."], 1987: ["750 JAHRE\nBERLIN", "In 1987 East and West Berlin both celebrated the city's 750th anniversary, each with their own programme. East Berlin restored the Nikolaiviertel for it."], 1988: ["SPRINGSTEEN\nWEISSENSEE\n19. JULI", "The FDJ brought Bruce Springsteen to East Berlin in July 1988. Officially a concert ‘for Nicaragua’."], 1989: T.key === "1989-mei" ? ["7. MAI\nKOMMUNAL-\nWAHLEN", "Elections in the GDR were a vote for one joint list. ‘Folding’ the ballot and dropping it in the box counted as a yes. Using the booth was suspicious."] : ["40 JAHRE\nDDR", "The 40th anniversary on 7 October 1989 was the last big state celebration. Gorbachev was the guest of honour."] };
  const yp = yearP[y]; P2.push({ t: yp[0], s: "", bg: "#c42a1f", fg: "#f3ecd7", lab: "Poster: " + yp[0].split("\n")[0], info: yp[1] });
  P2.push(rand([{ t: "BFC DYNAMO\n–\nUNION", s: "Sportforum\nSonntag 14 Uhr", bg: "#e6dcc0", fg: "#1f4f86", lab: "Football", info: "BFC Dynamo was the club of the Ministry; Mielke was its patron. It won ten league titles in a row from 1979. Union fans in Köpenick sang against them." },
    { t: "ZIRKUS\nAEROS", s: "Am Plänterwald\nab Freitag", bg: "#d8b23e", fg: "#2a1d12", lab: "Circus", info: "State circuses toured the country. Tickets were cheap; the queue was long. Like everything." },
    { t: "KINO\nCOLOSSEUM", s: "Schönhauser Allee\nDEFA-Premiere", bg: "#2a4a7a", fg: "#efe9d8", lab: "Cinema", info: "The Colosseum on Schönhauser Allee was the big cinema of Prenzlauer Berg. DEFA, the state film studio, made around fifteen feature films a year." }]));
  P2.push({ t: "TAUSCHE", s: "2-Raum-Whg., Ofen\ngegen 3-Raum\nmit Bad", bg: "#efe9d8", fg: "#222", torn: true, lab: "Small ads", info: "Flats were allocated by the state. The only way to get a bigger one quickly was to swap. ‘Ofen’ meant coal heating, ‘Bad’ meant you did not have to wash at the kitchen sink." });
  return P2;
}
function onInterior(key) {
  if (!IX || !S || S.over) return; sfx.click(); const k = IX.kind, b = IX.bid ? Bd(IX.bid) : null;
  const info = (h, t, extra = "") => modal(`<h1>${esc(h)}</h1><div class="result">${t}</div>${extra}<button class="next" id="nx">OK</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); interiorBadges(); });
  if (k === "stairs") {
    if (key === "letterboxes" || key === "doors") return sheet(el => buildingView(el, IX.bid));
    if (key === "junction") return ACT.bug(IX.bid);
    if (key === "home") return enterInterior("flat", "kollwitz");
    if (key === "kw") return enterInterior("kw", "lychener");
    if (key === "hausbuch") {
      if (S.used["hb" + IX.bid]) return info("Hausbuch", "You already read this turn's entries.");
      S.used["hb" + IX.bid] = 1;
      const c = S.people.filter(p => p.home === IX.bid && free(p) && p.traits.includes("westfam") && !conf(p, "westfam"));
      const p = rand(c);
      if (p) { p.known.westfam = { s: "zeker" }; p.pages += 2; discoverLinks(); save(); refresh(); return info("Hausbuch", `In blue ink, in the caretaker's careful hand:\n\n<span class="mono">‘Visitor: Gerda ${esc(p.ln || "K.")}, Köln (BRD). Four nights. With: ${esc(p.name)}.’</span>\n\n✓ ${esc(p.name)} has family in West Germany.`, `<p class="note">Every building kept a Hausbuch. Visitors staying several days had to be entered; Western visitors also had to report to the police.</p>`); }
      return info("Hausbuch", "Relatives from Leipzig and Cottbus. A cousin from Rostock, two nights. Nothing from the West.", `<p class="note">Every building kept a Hausbuch. Visitors staying several days had to be entered; Western visitors also had to report to the police.</p>`);
    }
  }
  if (k === "flat") {
    if (S.homeBugs && key.startsWith("s_")) return flatSearch(key);
    if (key === "table") return sheet(familyView);
    if (key === "s_radio") return radioTap();
    const FL = { s_oven: "The tiled stove is still warm. Every morning someone has to carry coal up from the cellar. Today it was Jens.", s_sofa: "The sofa where you sleep when you come home after two.", s_pic: "The Baltic at Ahlbeck. Your honeymoon, 1974.", s_phone: "Your own telephone line: a privilege. Most people in the building queue at the phone box.", s_socket: "A socket. Just a socket.", s_lamp: "A ceiling lamp from the Kaufhalle. Katrin hates it.", s_jens: `Jens's room. A poster of a band you don't know, a model of a Soviet MiG, a Bravo magazine under the mattress that somebody brought from the West. You leave it there.` };
    return info({ s_oven: "Tiled stove", s_sofa: "Sofa", s_pic: "The picture", s_phone: "Telephone", s_socket: "Socket", s_lamp: "Ceiling lamp", s_jens: "Jens's room" }[key] || "At home", esc(FL[key] || ""));
  }
  if (k === "kneipe") {
    if (key === "barman") { if (S.used.bar) return info("The barman", "‘Another one? No? Then I have nothing to tell you, comrade.’"); S.used.bar = 1; const g = gossip("barman"); save(); refresh(); return info("The barman", `He polishes a glass that is already clean.\n\n<span class="mono">${esc(g.line)}</span>${g.q ? `\n\n<i>Gossip, unconfirmed: ${esc(g.q.name)}.</i>` : ""}`); }
    if (key === "table1" || key === "table2") {
      if (S.used[key]) return info("At the table", "They have noticed you. The conversation is now about football.");
      if (!spend(1)) return; S.used[key] = 1;
      const c = S.people.filter(p => free(p) && (p.work === "cafe" || p.traits.some(t => ["samizdat", "punk", "milieu", "drank", "rias"].includes(t))) && p.traits.some(t => !conf(p, t)));
      const p = rand(c); let txt = "Talk about the weather and the Oberliga. Nothing.";
      if (p) { const t = rand(p.traits.filter(t => !conf(p, t))); p.known[t] = { s: "zeker" }; p.pages += 3; txt = `You order a Pilsner and listen.\n\n${esc(p.name)}: ${esc(overheardLine(t, p))}\n\n✓ ${esc(trLabel(t))}`; discoverLinks(); }
      save(); refresh(); return info("Listening in (1 MP)", txt);
    }
    if (key === "note") return info(turn().key === "1989-feb" ? "A note and a candle" : "Notice", turn().key === "1989-feb" ? "A handwritten name, a date: 5 February. A candle that someone keeps relighting.\n\nOfficially nothing happened at the Britzer Zweigkanal." : "‘Room to let? No.’ ‘Searching: Trabant parts, 601, any condition.’ ‘Lost: brown cat, answers to Gorbi.’", turn().key === "1989-feb" ? `<button class="next ghost" id="hb2">Read in the Handbook</button>` : "");
    if (key === "wc") {
      if (S.used.wc) return info("The toilet", "You already checked the cistern.");
      S.used.wc = 1; const c = S.people.filter(p => free(p) && p.traits.includes("samizdat") && !conf(p, "samizdat"));
      if (c.length && R() < 0.6) { const p = rand(c); p.known.samizdat = { s: "zeker" }; p.pages += 4; discoverLinks(); save(); refresh(); return info("A dead drop", `Taped under the lid of the cistern: a plastic bag with six typed pages. The ribbon was nearly worn out. On the back, in pencil, an address: ${esc(Bd(p.home).name)}.\n\n✓ ${esc(p.name)} distributes banned literature.`); }
      return info("The toilet", "The cistern is empty. The lock doesn't work. You checked anyway.");
    }
  }
  if (k === "kaufhalle") {
    if (key === "shelves") return info("Shelves", esc(rand(["Mixed pickles, Spreewald gherkins, Rondo coffee. Three kinds of tinned fish. No oranges.", "A whole shelf of Bulgarian jam. Nothing else on it.", "Club cola, Vita cola, Margonwasser. Bread for 52 Pfennig: the price has not changed in thirty years."])), `<p class="note">Basic food was heavily subsidised and cheap. Anything special was ‘Bückware’ or only available in the Delikat and Intershop shops.</p>`);
    if (key === "till" || key === "queue") { if (S.used[key]) return info(key === "till" ? "The cashier" : "The queue", "Nobody wants to talk to you twice in one day."); S.used[key] = 1; const g = gossip(key); save(); refresh(); return info(key === "till" ? "The cashier" : "The queue", `${key === "queue" ? "Nobody knows what the queue is for. Everyone joins it anyway.\n\n" : ""}<span class="mono">${esc(g.line)}</span>${g.q ? `\n\n<i>Gossip, unconfirmed: ${esc(g.q.name)}.</i>` : ""}`); }
    if (key === "counter") {
      if (!S.buck) return info("Under the counter", "‘We don't have anything under the counter, comrade.’ She says it as if she has said it a thousand times.");
      if (S.used.buck) return info("Under the counter", "You already got yours. The rest is for her regulars.");
      S.used.buck = 1; invAdd("buck"); save(); refresh(); return info("Bückware", `She looks left, looks right, and bends down. ‘For you: ${esc(S.buck)}.’\n\n+1 Bückware in your strongbox. A gift for an informer, or for home.`);
    }
    if (key === "sign") return info("Sign", S.buck ? `Today there is ${esc(S.buck)}. That explains the queue.` : "The sign promises coffee. The shelf does not.");
  }
  if (k === "kw") {
    if (key === "treff") return sheet(kwList);
    if (key === "ledger") return sheet(strongboxView);
    if (key === "window") return info("Window", S.fuchs >= 25 ? "Across the street a grey Wartburg has been parked for two hours, engine off. Fuchs's people? Or yours?" : "Lychener Straße. Children are playing with a ball against the firewall. Nobody looks up.");
    if (key === "tape") {
      const bidB = Object.keys(S.bugs)[0];
      if (!bidB) return info("Tape recorder", "A Smaragd reel-to-reel. No bugs running, so no tapes to listen to.");
      if (S.used.tape) return info("Tape recorder", "You have already been through this turn's tapes.");
      S.used.tape = 1;
      return playMinigame("tape", mgUI, { text: "and then she said the heating is broken again we should ask the caretaker it is cold in the stairwell my sister writes from Cologne", keys: rand([["Hungary", "form", "parcel"], ["Hamburg", "visa", "lake"], ["stencil", "church", "leaflet"]]) }, res => {
        let txt = "Noise, coughing, a radio. Nothing usable.";
        if (res.hits) { const c = S.people.filter(p => (p.home === bidB || p.work === bidB) && free(p) && p.traits.some(t => !conf(p, t))); const p = rand(c); if (p) { const t = rand(p.traits.filter(t => !conf(p, t))); p.known[t] = { s: "zeker" }; p.pages += 3; discoverLinks(); txt = `On the tape from ${Bd(bidB).name}: ${p.name}.\n\n✓ ${trLabel(t)}`; } }
        save(); refresh(); info("The tapes", esc(txt));
      });
    }
  }
  if (k === "booth") {
    if (key === "receiver") return boothCall();
    if (key === "phonebook") return info("Phone book", "Thin. Few households have their own phone; the waiting list is many years long. Most of the district makes its calls from here, with a queue outside.");
    if (key === "scratch") return info("Scratches", "Initials in a heart. Underneath, scratched with a key: a question about the Party, half rubbed out. Someone tried to remove it. Someone else made it deeper again.");
  }
  if (k === "litfass") {
    const ps = postersFor(turn());
    if (key.startsWith("poster")) { const p = ps[+key.slice(6)]; return info(p.lab.replace("Poster: ", ""), `<span class="mono">${esc(p.t.replace(/\n/g, " "))}</span>\n\n${esc(p.info)}`); }
    if (key === "note") {
      const c = S.case; if (!c) return info("A typed note", "Gone. Someone tore it down.");
      if (S.used.litnote) return info("A typed note", "You already took it.");
      S.used.litnote = 1; const hid = ["tw", "paper", "place"].find(x => !c.shown.includes(x));
      if (hid) c.shown.push(hid);
      save(); refresh(); return info("A typed note", `Pinned over a circus poster. The same words as your case: ‘${esc(INCIDENTS[c.tmpl].t)}’.\n\nNew clue: ${esc(clueText(c, hid || "tw"))}`, `<p class="note">The case file now shows this clue too.</p>`);
    }
  }
}
function flatSearch(key) {
  const hb = S.homeBugs, L = { s_radio: "the radio", s_phone: "the telephone", s_socket: "the socket", s_lamp: "the ceiling lamp", s_pic: "the picture", s_oven: "the tiled stove", s_sofa: "the sofa" }[key];
  if (hb.found.includes(key)) return toast(`Already found: behind ${L}.`);
  if (!hb.spots.includes(key)) { if (!hb.searched.includes(key)) hb.searched.push(key); save(); sfx.click(); return toast(`Nothing behind ${L}.`); }
  hb.found.push(key); sfx.good(); save();
  const all = hb.spots.every(s => hb.found.includes(s)); if (all) medal("schweig");
  modal(`<div class="stamp">WANZE</div><h1>Found: ${esc(L)}</h1><div class="result">A microphone no bigger than a sugar cube, with a thin wire. Soviet make. You have installed hundreds of these. ${all ? "\n\nThat was the last one. You think." : "\n\nThere could be more."}</div>
    <div class="choices"><button class="ch" id="rm"><b>Remove it</b><span>Then they know that you know. (Rivalry Fuchs +8, suspicion +2)</span></button><button class="ch" id="lv"><b>Leave it and feed it</b><span>Talk loudly about loyalty at dinner. (Suspicion −5, conscience −1)</span></button></div>`, m => {
    m.querySelector("#rm").onclick = () => { closeModal(); applyE({ fu: 8, d: 2 }); save(); refresh(); interiorBadges(); };
    m.querySelector("#lv").onclick = () => { closeModal(); applyE({ d: -5, c: -1, fu: -3 }); save(); refresh(); interiorBadges(); };
  }, { lock: true });
}
function boothCall() {
  const cand = S.people.filter(p => p.status === "vrij" && !p.secretIM && (evidence(p) || p.pages >= 15)).slice(0, 6);
  modal(`<div class="kicker">20 Pfennig</div><h1>A call from the phone box</h1><div class="result">Nobody can trace a call from here. Probably.</div>
    <div class="choices"><button class="ch" id="home" ${S.used.callHome ? "disabled" : ""}><b>Call home</b><span>‘I'll be late.’ Family +2.</span></button>
    ${cand.map(p => `<button class="ch" data-w="${p.id}" ${p.warned === S.t ? "disabled" : ""}><b>Warn ${esc(p.name)}, anonymously</b><span>‘Be careful. They are watching you.’ They become less defiant and harder to catch. Conscience +5, but it is a risk.</span></button>`).join("")}
    <button class="ch" id="no"><b>Hang up</b></button></div>`, m => {
    m.querySelector("#home").onclick = () => { S.used.callHome = 1; closeModal(); after(null, { fam: 2 }); toast("Katrin: ‘Again? Fine.’"); };
    m.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { const p = P(b.dataset.w); p.warned = S.t; p.fear += 15; p.dis = Math.max(0, p.dis - 10); Object.keys(p.known).forEach(t => { if (p.known[t].s !== "zeker") delete p.known[t]; }); S.warned.push({ id: p.id, t: S.t }); addLog(p, "Received an anonymous warning call"); closeModal(); evCtx = "an anonymous call from a phone box"; after(`<h1>Click</h1><div class="result">A short silence on the line. Then: ‘Who is this?’ You hang up.</div>`, { c: 5, d: R() < 0.5 - sk("geh") * 0.08 ? 4 : 0, ki: churchy(p) ? 3 : 0 }); evCtx = ""; });
    m.querySelector("#no").onclick = closeModal;
  });
}

// ---------- informanten: Treff in de Konspirative Wohnung ----------
function kwList(el) {
  const ims = S.people.filter(p => p.status === "im");
  el.innerHTML = `<div class="kicker">Konspirative Wohnung „Linde“ · Lychener Straße 40</div><h2>Treffs</h2><p class="who">Meet your informers here. An IM you never meet loses loyalty, and starts to lie or to talk to the other side.</p>
   ${ims.map(p => `<button class="row" data-im="${p.id}"><span class="rn"><b>IM „${esc(p.code)}“</b> <small>${esc(p.name)} · wants ${esc((NEEDS[p.need] || "?").split(",")[0])}</small></span><span class="rp">${bar10(p.loyal || 0)}<small>${S.t - (p.lastTreff ?? S.t)} t. ago</small></span></button>`).join("") || "<p class='muted'>You have no informers yet.</p>"}`;
  el.querySelectorAll("[data-im]").forEach(b => b.onclick = () => treffView(P(b.dataset.im)));
}
function treffView(im) {
  if (!IX || IX.kind !== "kw") { enterInterior("kw", "lychener"); }
  sheet(el => {
    const done = S.used["t" + im.id], item = { dm: "dm", kaffee: "kaffee" }[im.need], have = item ? S.inv[item] : 0;
    const cProbe = pc(35 + sk("verh") * 10 + (im.fear || 0) / 4), cWin = pc(40 + sk("ueb") * 10 - (im.lies || 0) * 5);
    const claims = Object.entries(S.people.reduce((a, q) => { Object.entries(q.known).forEach(([t, k]) => { if (k.s === "IM" && k.im === im.id) a[q.id + ":" + t] = 1; }); return a; }, {})).length;
    el.innerHTML = `<div class="kicker">Treff · „Linde“</div><h2>IM „${esc(im.code)}“</h2><div class="who">${esc(im.name)}, ${esc(im.job)}</div>
      <div class="grid2"><div><small>Loyalty</small>${bar10(im.loyal || 0)}</div><div><small>Fear</small>${bar10(Math.min(100, im.fear || 0))}</div><div><small>Wants</small>${esc(NEEDS[im.need] || "?")}</div><div><small>Unchecked claims</small>${claims}</div></div>
      ${done ? `<p class="muted">You have already met this turn.</p>` : ""}
      <div class="acts one">
        <button class="act" data-t="pay" ${done || (item && !have) ? "disabled" : ""}><b>${item ? `Give ${esc(INV[item][0])}` : "Promise it"} <em>${item ? `${have} left` : "Favour −3"}</em></b><span>${item ? "Exactly what they want. Loyalty and honesty go up." : "You pull strings for them. Loyalty goes up a lot."}</span></button>
        <button class="act" data-t="buck" ${done || !S.inv.buck ? "disabled" : ""}><b>Give Bückware <em>${S.inv.buck || 0} left</em></b><span>A small present. Loyalty +10.</span></button>
        <button class="act" data-t="press" ${done ? "disabled" : ""}><b>Press <em>free</em></b><span>Threaten. One extra report next turn, but they will lie more and like you less.</span></button>
        <button class="act" data-t="check" ${done || S.mk < 1 || !claims ? "disabled" : ""}><b>Cross-check <em>1 MP</em></b><span>Lay their reports next to what bugs and other IMs say. Catches lies.</span></button>
        <button class="act" data-t="probe" ${done ? "disabled" : ""}><b>Probe their story <em>${cProbe}%</em></b><span>Interrogation ${sk("verh")}. Free. Success: one claim checked, or a double game exposed. Failure: loyalty −5.</span></button>
        <button class="act" data-t="win" ${done ? "disabled" : ""}><b>Win them over <em>${cWin}%</em></b><span>Persuasion ${sk("ueb")}. Free. Success: loyalty +18. Failure: they see through you.</span></button>
        <button class="act" data-t="rec" ${done || im.held || !S.inv.kas ? "disabled" : ""}><b>Record the meeting <em>${S.inv.kas || 0} cassette${S.inv.kas === 1 ? "" : "s"}</em></b><span>${im.held ? "You already have them on tape." : "Kompromat. Loyalty falls half as fast and they will never turn double."}</span></button>
      </div>`;
    el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
      const t = b.dataset.t; S.used["t" + im.id] = 1; im.lastTreff = S.t; let msg = "", e = {};
      if (t === "pay") { if (item) { invAdd(item, -1); im.loyal = clamp((im.loyal || 0) + 25); im.honesty = Math.min(100, im.honesty + 10); msg = `${im.fn} takes it without looking at you. ‘Thank you.’ It sounds sincere.`; } else { im.loyal = clamp((im.loyal || 0) + 30); e = { g: -3 }; msg = `‘I'll see what I can do.’ You will have to. ${im.fn} believes you.`; } }
      if (t === "buck") { invAdd("buck", -1); im.loyal = clamp((im.loyal || 0) + 10); msg = `${im.fn} puts it in a string bag. ‘My children have never seen one of these.’`; }
      if (t === "press") { im.fear = (im.fear || 0) + 20; im.loyal = clamp((im.loyal || 0) - 10); im.honesty = Math.max(10, im.honesty - 8); im.extra = 1; e = { c: -3 }; msg = `You mention the Kaderakte. ${im.fn}'s hands start to shake. ‘I'll bring more. I promise.’`; }
      if (t === "check") { if (!spend(1)) return; const out = []; S.people.forEach(q => Object.entries(q.known).forEach(([tr, k]) => { if (k.s === "IM" && k.im === im.id) { if (q.traits.includes(tr)) { q.known[tr] = { s: "zeker" }; out.push(`✓ ${q.name}: ${trLabel(tr)}`); } else { delete q.known[tr]; im.lies = (im.lies || 0) + 1; out.push(`✗ ${q.name}: ‘${trLabel(tr)}’ was a lie`); } } })); if (im.doubleAgent && R() < 0.6) { im.known.dubbel = { s: "zeker" }; out.push("! The way they answer: this informer is working for both sides."); } discoverLinks(); msg = out.join("\n") || "Everything checks out."; }
      if (t === "probe") { if (R() * 100 < cProbe) { const cl = []; S.people.forEach(q => Object.entries(q.known).forEach(([tr, k]) => { if (k.s === "IM" && k.im === im.id) cl.push([q, tr]); })); im.honesty = Math.min(100, im.honesty + 5);
          if (im.doubleAgent && !im.known.dubbel && R() < 0.5) { im.known.dubbel = { s: "zeker" }; msg = "✓ The dates don't fit. You push, and it all comes out: they have been talking to the other side."; }
          else if (cl.length) { const [q, tr] = rand(cl); if (q.traits.includes(tr)) { q.known[tr] = { s: "zeker" }; msg = `✓ The details hold. ${q.name}: ${trLabel(tr)}. Confirmed.`; } else { delete q.known[tr]; im.lies = (im.lies || 0) + 1; msg = `✓ The details don't hold. ${q.name}: ‘${trLabel(tr)}’ was made up.`; } discoverLinks(); }
          else msg = "✓ Their story is consistent. For now there is nothing to check.";
          e = { xp: XP.talk }; } else { im.loyal = clamp((im.loyal || 0) - 5); msg = `✗ ${im.fn} goes quiet and looks at the clock. ‘Do you not trust me?’`; } }
      if (t === "win") { if (R() * 100 < cWin) { im.loyal = clamp((im.loyal || 0) + 18); im.honesty = Math.min(100, im.honesty + 5); msg = `✓ You talk about their children, the Black Sea, the future. ${im.fn} leaves smiling.`; e = { xp: XP.talk }; } else { msg = `✗ ${im.fn} nods politely. It is obvious ${pron(im)} doesn't believe a word.`; } }
      if (t === "rec") { invAdd("kas", -1); im.held = true; addLog(im, "Treff recorded on cassette"); msg = `The Smaragd recorder in the cupboard hums. ${im.fn} talks about the neighbours, about money, about a cousin in the Party. All on tape now.`; e = { c: -2 }; }
      sfx.paper(); after(`<h1>Treff: „${esc(im.code)}“</h1><div class="result">${esc(msg)}</div>`, e); interiorBadges();
    });
  });
}

// ---------- kantoor: prikbord, geldkistje, radio, krant ----------
function pinboardView(el) {
  const ppl = S.people.filter(p => !p.secretIM && (Object.keys(p.known).length || linksOf(p).some(l => l.found)));
  const found = S.links.filter(l => l.found);
  el.innerHTML = `<div class="kicker">Pinboard · ${found.length} of ${S.links.length} threads · ${S.stats.complete || 0} files complete</div><h2>Connections</h2>
    <p class="who">Every resident hides two to four secrets: traits, and ties to others. Confirm a trait and a red thread may appear. Complete files get the stamp VOLLSTÄNDIG.</p>
    <div class="board" id="bd"><svg id="bsv"></svg>${ppl.map(p => `<button class="pcard${p.complete ? " full" : ""}" data-pid="${p.id}"><i class="pin"></i><b>${esc(p.fn)}<br>${esc(p.ln || "")}</b><small>${esc(Bd(p.home).name.split(" ")[0])}</small><em>${completion(p)}%</em></button>`).join("") || "<p class='muted'>Nothing pinned yet. Observe people first.</p>"}</div>
    <div class="legend">${Object.entries(LINKS).filter(([k]) => found.some(l => l.k === k)).map(([k, v]) => `<span><i style="background:${v.col}"></i>${esc(v.l)}</span>`).join("")}</div>`;
  bindRows(el);
  requestAnimationFrame(() => {
    const bd = el.querySelector("#bd"), sv = el.querySelector("#bsv"); if (!bd || !sv) return;
    sv.setAttribute("width", bd.scrollWidth); sv.setAttribute("height", bd.scrollHeight);
    const pos = id => { const c = bd.querySelector(`[data-pid="${id}"]`); return c && [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + 8]; };
    sv.innerHTML = found.map(l => { const a = pos(l.a), b = pos(l.b); if (!a || !b) return ""; const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 22; return `<path d="M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}" stroke="${LINKS[l.k].col}" stroke-width="2.5" fill="none" opacity=".85"/>`; }).join("");
  });
}
function strongboxView(el) {
  world.setKassette(true); sfx.drawer();
  const ms = medals();
  el.innerHTML = `<div class="kicker">Strongbox · key on your keyring</div><h2>Strongbox</h2>
    <div class="kicker">Contents</div><ul class="traits">${Object.entries(INV).map(([k, [n, d]]) => `<li><b>${S.inv[k] || 0}×</b> ${esc(n)} <span class="muted small">· ${esc(d)}</span></li>`).join("")}</ul>
    <p class="muted small">Westgeld and coffee pay informers at a Treff (Konspirative Wohnung „Linde“, Lychener Straße 40), or buy a story on the street. New operative funds every January.</p>
    <div class="kicker">Requisition · Abteilung 26 <small class="muted">· once per turn, costs Favour</small></div>
    <div class="acts one">${REQ.map(q => { const ok = !S.used.req && q.ok(); return `<button class="act" data-rq="${q.k}" ${ok ? "" : "disabled"}><b>${esc(INV[q.k][0])} <em>Favour −${q.g}</em></b><span>${S.used.req ? "Already requisitioned this turn." : esc(q.why())}</span></button>`; }).join("")}</div>
    <div class="kicker">What they may have on you</div><p class="who">Suspicion ${S.dossier}. ${S.dossier >= 60 ? "Personnel are asking questions." : S.dossier >= 35 ? "Somebody is keeping notes." : "Nothing you need to worry about. Yet."}${S.homeBugs && S.homeBugs.found.length < S.homeBugs.spots.length ? " Something is wrong at home." : ""}</p>
    <ul class="log">${S.ownLog.slice(-8).reverse().map(l => `<li>${esc(l)}</li>`).join("") || "<li>(nothing yet)</li>"}</ul>
    <div class="kicker">Decorations <small class="muted">· ${ms.length} of ${Object.keys(MEDALS).length}, over all games</small></div>
    <div class="medals">${Object.entries(MEDALS).map(([k, m]) => `<div class="md${ms.includes(k) ? "" : " off"}"><i style="background:${m.col}"></i><b>${ms.includes(k) ? esc(m.t) : "???"}</b><small>${esc(m.d)}</small></div>`).join("")}</div>
    <p class="muted small">Game no. ${S.seed % 100000}${S.mods.length ? " · " + S.mods.map(m => MODS[m].t).join(", ") : ""}</p>`;
  el.querySelectorAll("[data-rq]").forEach(b => b.onclick = () => { const q = REQ.find(x => x.k === b.dataset.rq); if (S.used.req || !q.ok()) return; S.used.req = 1; invAdd(q.k); sfx.drawer(); after(`<h1>Requisitioned</h1><div class="result">A form in triplicate, a signature, a cardboard box. ${esc(INV[q.k][0])}: ${esc(INV[q.k][1])}.</div>`, { g: -q.g }); });
}
const REQ = [
  { k: "kas", g: 1, ok: () => true, why: () => "Record a Treff as kompromat, or replay an interrogation to catch your own mistake." },
  { k: "set", g: 5, ok: () => sk("tech") >= 1 && (S.inv.set || 0) < 3, why: () => sk("tech") < 1 ? "Needs Technique 1. The technicians don't hand sets to amateurs." : (S.inv.set || 0) >= 3 ? "Abteilung 26 has no more for you." : `One more bug or tap at a time (now ${bugCap()}).` },
  { k: "minox", g: 6, ok: () => S.rank >= 1 && !S.inv.minox, why: () => S.inv.minox ? "You already have one." : S.rank < 1 ? "For Oberleutnant and above." : "Every observation turns up at least two things." },
];
function radioTap() {
  const on = !world.__radio; world.__radio = on; world.setRadio(on); radioSound(on);
  if (!on) return toast("Radio off.");
  const T = turn(), w = T.news.find(n => n[0] === "RIAS" || n[0] === "ARD"), o = T.news.find(n => n[0] === "AK" || n[0] === "ND");
  const line = w ? `<b>${esc(NEWS_SRC[w[0]])}</b> (you shouldn't, but everyone does): ${esc(w[1])}` : o ? `<b>Stimme der DDR:</b> ${esc(o[1])}` : `<b>DT64:</b> music, then the weather for Berlin. Cloudy.`;
  flash(`<h1>Radio</h1><div class="result">${line}</div><p class="note">Tap the radio again to switch it off.</p>`);
}
function newspaperTap() {
  const T = turn(), hol = HOLIDAYS[monthOf(T)]; sfx.paper();
  modal(`<div class="kicker">${esc(T.label)} · on your desk</div><h1>Today's news</h1>${newsHTML(T) || "<p class='muted'>Plan figures, harvest figures, a delegation from Mozambique. Nothing you didn't know.</p>"}${hol ? `<div class="holi"><b>Calendar</b> ${esc(hol)}</div>` : ""}
    <p class="note">Neues Deutschland was the Party paper. What it left out was often more telling than what it printed. Everybody checked with West German TV in the evening.</p>
    <button class="next" id="nx">OK</button><button class="next ghost" id="hb">Handbook: what happened, what was allowed</button>`, m => { m.querySelector("#nx").onclick = closeModal; m.querySelector("#hb").onclick = () => handbook("kroniek", newspaperTap); });
}
// ---------- handboek: wat mocht wel/niet + kroniek ----------
function handbook(tab = "regels", back = null) {
  const upto = S && !S.over ? S.t : TURNS.length - 1;
  const cls = { ok: ["ALLOWED", "ok"], grey: ["GREY AREA", "grey"], no: ["CRIME", "no"] };
  const body = tab === "regels"
    ? RULES.map(c => `<div class="kicker">${esc(c.cat)}</div>${c.items.map(([k, t, d]) => `<details class="rule"><summary><span class="rk ${cls[k][1]}">${cls[k][0]}</span>${esc(t)}</summary><p>${esc(d)}</p></details>`).join("")}`).join("")
    : TURNS.slice(0, upto + 1).map(T => ({ T, c: CHRONICLE[T.key] })).filter(x => x.c || x.T.news.length).reverse().map(({ T, c }) => `<details class="rule"${S && !S.over && T === turn() ? " open" : ""}><summary><span class="rk dt">${esc(T.label.replace(/^\d+ /, ""))}</span>${esc(c ? c[0] : T.news[0][1].split(/[.(]/)[0])}</summary>${c ? `<p>${esc(c[1])}</p>` : ""}${T.news.map(([s2, t]) => `<p class="small muted"><b>${esc(NEWS_SRC[s2] || s2)}:</b> ${esc(t)}</p>`).join("")}</details>`).join("");
  modal(`<div class="kicker">Handbuch · for the new Leutnant</div><h1>Handbook</h1>
    <div class="kview"><button data-v="regels" class="${tab === "regels" ? "on" : ""}">Allowed or not?</button><button data-v="kroniek" class="${tab === "kroniek" ? "on" : ""}">Chronicle</button></div>
    ${tab === "regels" ? `<p class="who">What was allowed in the GDR, what was a crime, and the large grey area in between. Paragraphs refer to the GDR criminal code of 1968.</p>` : `<p class="who">What really happened, turn by turn${S && !S.over ? ", up to now" : ""}. The people in the game are invented; the history is not.</p>`}
    ${body}<button class="next" id="nx">${back ? "Back" : "Close"}</button>`, m => {
    m.querySelectorAll("[data-v]").forEach(b => b.onclick = () => handbook(b.dataset.v, back));
    m.querySelector("#nx").onclick = () => { if (back) back(); else closeModal(); };
  }, { lock: !!back, wide: true });
}

// ===================== UITLEG & BEGELEIDING =====================
const TUT = [
  { t: "The phone is ringing. Tap the <b>telephone</b> on your desk to answer.", target: '#labels [data-id="o:telefoon"]', go: () => { setMode("office"); phoneTap(); } },
  { t: "Look at your district: tap <b>District</b> at the bottom.", target: "#navWijk", go: () => { closeSheet(); setMode("district"); } },
  { t: "Tap the building <b>Kollwitz 12</b>. You live there, with your neighbours.", target: '#labels [data-id="b:kollwitz"]', go: () => { setMode("district"); openBuilding("kollwitz"); } },
  { t: "You can see who lives there. Tap <b>Jutta Lang</b> to open her file.", target: '#sheetBody [data-pid="jutta"]', go: () => { openBuilding("kollwitz"); sheet(e => personView(e, P("jutta"))); } },
  { t: "You know nothing about her yet. Tap <b>Observe</b>. It costs 1 manpower (one yellow block).", target: '#sheetBody [data-a="observe"]', go: () => sheet(e => personView(e, P("jutta"))) },
  { t: "That's how you gather information. Use your last manpower: <b>observe someone else</b> in your building. Tap here when you're done.", target: null, go: () => tutDone(5) },
  { t: "Tap <b>End turn</b> (bottom right) or here. Next turn you will receive new reports.", target: "#navEnd", go: () => confirmEnd() },
];
function tutDone(n) { if (!S || S.tut !== n) return; S.tut++; if (S.tut === 5 && S.mk <= 0) S.tut = 6; save(); updateCoach(); }

function nextStep() {
  if (!S || S.over) return null;
  if (S.tut !== undefined && S.tut < TUT.length) {
    if (S.tut === 5 && S.mk <= 0) S.tut = 6;
    const st = TUT[S.tut]; return { text: `<span class="step">Step ${S.tut + 1}/${TUT.length}</span> ${st.t}`, go: st.go, target: st.target, tut: true };
  }
  const pend = via => S.queue.find(q => ev(q).via === via);
  let q;
  if ((q = pend("telefoon"))) return { text: "<b>The phone is ringing.</b> Tap here to answer.", go: () => openEvent(q), target: '#labels [data-id="o:telefoon"]' };
  if ((q = pend("dossier"))) return { text: `<b>Order:</b> ${esc(ev(q).title)}. Tap to decide.`, go: () => openEvent(q) };
  if ((q = pend("gezin"))) return { text: `<b>At home:</b> ${esc(ev(q).title)}. Tap to have a look.`, go: () => openEvent(q) };
  const unread = S.inbox.filter(i => !i.read).length;
  if (unread) return { text: `<b>${unread} new report${unread > 1 ? "s" : ""}.</b> Tap to read what you found out.`, go: () => { setMode("office"); sheet(inboxView); } };
  if (S.homeBugs && S.homeBugs.found.length < S.homeBugs.spots.length && !(IX && IX.kind === "flat")) return { text: "<b>Something is wrong at home.</b> Search your flat: Kollwitzstraße 12 → stairwell → Your flat.", go: () => enterInterior("flat", "kollwitz") };
  if (IX && IX.kind === "flat" && S.homeBugs && S.homeBugs.found.length < S.homeBugs.spots.length) return { text: "Tap the objects in your flat to search them for bugs." };
  const lowIM = S.people.find(p => p.status === "im" && S.t - (p.lastTreff ?? S.t) > 2 && !S.used["t" + p.id]);
  if (lowIM && S.t % 2 === 0 && !(IX && IX.kind === "kw")) return { text: `IM <b>„${esc(lowIM.code)}“</b> has not seen you for a while. Loyalty is dropping. Tap for a Treff.`, go: () => treffView(lowIM) };
  if (points() > 0 && !$("#sheet").classList.contains("open")) return { text: `<b>${points()} skill point${points() > 1 ? "s" : ""}</b> to spend. Tap to open your Kaderakte.`, go: () => sheet(kaderView), target: "#rkBtn" };
  if (S.case && S.mk > 0) return { text: `<b>Case:</b> find the culprit (${S.case.turns} turn${S.case.turns > 1 ? "s" : ""} left). Tap for the suspects.`, go: () => sheet(caseView) };
  if (S.mk > 0) {
    const lev = S.people.find(p => p.status === "vrij" && !p.family && !p.secretIM && Object.keys(p.known).some(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker"));
    if (lev && imCount() < Math.min(rank().ims, S.quota.ims)) return { text: `You have leverage on <b>${esc(lev.name)}</b>. Recruit ${obj(lev)} as an informer (you have ${imCount()}/${S.quota.ims} of the IMs you need).`, go: () => sheet(e => personView(e, lev)) };
    const arr = S.people.find(p => p.status === "vrij" && !p.family && evidence(p) && p.dis >= 30);
    if (arr && S.mk >= 2 && S.res < S.quota.res) return { text: `You have enough evidence against <b>${esc(arr.name)}</b>. An arrest counts as a result. Or will you let it go?`, go: () => sheet(e => personView(e, arr)) };
    if (pool() < bugCap() && S.mk >= 2) return { text: `Plant <b>bugs</b> in a building (2 manpower): you will hear conversations every turn.`, go: () => setMode("district") };
    return { text: `<b>${S.mk} manpower</b> left. Go to the district and observe someone you don't know yet.`, go: () => setMode("district") };
  }
  return { text: "<b>All done.</b> Tap here to end the turn.", go: () => confirmEnd(), target: "#navEnd" };
}
let coachStep = null;
function updateCoach() {
  const el = $("#coach"); if (!el) return;
  coachStep = nextStep();
  if (!coachStep || $("#title").classList.contains("open")) { el.className = ""; return; }
  el.className = "show" + (coachStep.tut ? " tut" : "");
  el.innerHTML = `<div class="ct">${coachStep.text}</div>${coachStep.tut ? `<button class="skip" id="tutSkip">Skip tutorial</button>` : '<span class="arr">›</span>'}`;
  const sk = el.querySelector("#tutSkip"); if (sk) sk.onclick = ev2 => { ev2.stopPropagation(); S.tut = 99; save(); updateCoach(); };
}
setInterval(() => {
  document.querySelectorAll(".coachT").forEach(e => e.classList.remove("coachT"));
  if (coachStep && coachStep.target && !$("#modal").classList.contains("open")) { const t = document.querySelector(coachStep.target); if (t) t.classList.add("coachT"); }
}, 300);

function showIntro() {
  const pages = [
    ["You are the Stasi", "", "East Berlin, 1983. You keep watch over one district for the GDR's secret police.\n\nYour boss <b>Kessler</b> wants results. Your choices decide what happens to the people."],
    ["How to play", "", "<b>1.</b> Decide what happens when the phone rings.\n<b>2.</b> Use your <b>manpower</b> in the district: <b>observe</b> people, <b>recruit informers</b>, <b>arrest</b>.\n<b>3.</b> Tap <b>End turn</b>. On to the next turn.\n\nThe strip at the bottom always shows what you can do now."],
    ["Careful", "", "<b>Favour</b> at 0: you are dismissed.\n<b>Suspicion</b> at 100: you are arrested yourself.\nYour <b>conscience</b> decides how your story ends.\n\n32 turns, from 1983 to the fall of the Wall. 8 endings."],
  ];
  let i = 0;
  const draw = () => {
    const [h, ic, txt] = pages[i];
    modal(`<div class="kicker">Einweisung ${i + 1}/${pages.length}</div><h1>${h}</h1><div class="result">${txt}</div>
      <div class="dots">${pages.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <button class="next" id="nx">${i < pages.length - 1 ? "Next" : "Play"}</button>${i === 0 ? '<button class="next ghost" id="sk">Skip</button>' : ""}`, m => {
      m.querySelector("#nx").onclick = () => { if (i < pages.length - 1) { i++; draw(); } else { closeModal(); updateCoach(); } };
      const sk = m.querySelector("#sk"); if (sk) sk.onclick = () => { S.tut = 99; closeModal(); updateCoach(); };
    }, { lock: true });
  };
  draw();
}

function explainMeters() {
  modal(`<h1>The meters</h1><div class="result"><b class="cg">Favour</b>: how pleased Kessler is. At 0 you are dismissed.
<b class="cc">Conscience</b>: drops when you harm people. Decides your ending.
<b class="cd">Suspicion</b>: how suspect you yourself are. At 100 you are arrested.
<b class="cm">Manpower</b> (MP): actions per turn. What you don't use is lost.
<b>Annual target</b>: what Kessler wants to see by the end of the year. Meet it and you are promoted.</div><button class="next" id="nx">OK</button>`, m => m.querySelector("#nx").onclick = closeModal);
}

function susCount(p) { return Object.keys(p.known).filter(t => p.known[t].s === "zeker" && TRAITS[t] && (TRAITS[t].dis || 0) >= 10).length; }
function personAdvice(p) {
  if (p.secretIM) return "This card is blocked. Someone above you is protecting this person.";
  if (p.status === "im") return p.known.dubbel ? "This informer is a double agent. Dropping them is wise." : p.lies ? "This informer has lied. Distrust the reports, or drop them." : `Informer. Reports on a neighbour or colleague every turn. You can give a specific assignment.`;
  if (!free(p)) return "This person is beyond your reach.";
  const levs = Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker");
  const unconf = Object.keys(p.known).filter(t => p.known[t].s === "IM").length;
  const known = Object.keys(p.known).length;
  const out = [];
  if (!known) out.push("You know nothing yet. <b>Observe</b> to find out what is going on.");
  if (unconf) out.push(`There ${unconf > 1 ? "are" : "is"} ${unconf} unconfirmed trait${unconf > 1 ? "s" : ""} (from an informer). <b>Observe</b> to check whether it is true.`);
  if (levs.length && p.status === "vrij" && !p.family) out.push(`You have <b>leverage</b> (${esc(trLabel(levs[0]).toLowerCase())}). Recruiting them as an informer has a good chance.`);
  if (evidence(p)) out.push("You have <b>enough evidence</b> to arrest.");
  else if (susCount(p) === 1) out.push("One more confirmed suspicious trait needed for an arrest.");
  if (known && !out.length) out.push("Looks like an ordinary citizen. You can dig further, or use your manpower elsewhere.");
  return out.join(" ");
}

// ===================== START =====================
async function boot() {
  // laadscherm: modellen ophalen (fase 2)
  const ld = $("#loader"), bar = $("#loader .lbar i"), pct = $("#loader .lpct");
  const models = await loadModels(f => { const p = Math.round(f * 100); bar.style.width = p + "%"; pct.textContent = String(p).padStart(3, "0") + " %"; });
  ld.classList.add("done"); setTimeout(() => ld.remove(), 450);
  world = createWorld($("#stage"), {
    onOffice: k => {
      if (!S || S.over) return;
      if (k === "wijk") return setMode("district");
      if (k === "telefoon") return phoneTap();
      if (k === "dossiers") return sheet(inboxView);
      if (k === "onderzoek") return sheet(caseView);
      if (k === "kartotheek") return sheet(e => cartotheek(e));
      if (k === "gezin") return sheet(familyView);
      if (k === "kalender") return sheet(calendarView);
      if (k === "typemachine") return confirmEnd();
      if (k === "radio") return radioTap();
      if (k === "krant") return newspaperTap();
      if (k === "kassette") return sheet(strongboxView);
      if (k === "prikbord") return sheet(pinboardView);
      if (k === "boek") return handbook("regels");
    },
    onBuilding: id => { if (S && !S.over) openBuilding(id); },
    onInterior: k => onInterior(k),
    onWalker: i => { if (S && !S.over) walkerCard(i); },
  }, models);
  $("#sheetClose").onclick = closeSheet; $("#sheetBack").onclick = back;
  $("#modal").onclick = e => { if (e.target.id === "modal" && !$("#modal").dataset.lock) closeModal(); };
  $("#navOffice").onclick = () => { closeSheet(); setMode("office"); };
  $("#navWijk").onclick = () => { closeSheet(); setMode("district"); };
  $("#navCart").onclick = () => sheet(e => cartotheek(e));
  $("#navEnd").onclick = confirmEnd;
  $("#coach").onclick = () => { if (coachStep && coachStep.go) coachStep.go(); };
  $("#leave").onclick = leaveInterior;
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  showTitle();
}
function confirmEnd() {
  if (!S || S.over) return;
  if (S.queue.length) { toast("Deal with the waiting matters first."); return openEvent(S.queue[0]); }
  modal(`<h1>End the turn?</h1><div class="result">${S.mk ? `You still have <b>${S.mk} manpower</b> left. It will be lost.\n\nThe next turn is <b>${esc((TURNS[S.t + 1] || turn()).label)}</b>.` : "All manpower has been used."}${S.case ? `\n\nThe case runs for ${S.case.turns} more turn(s).${S.case.turns === 1 ? " After that it is too late." : ""}` : ""}${turn().review ? "\n\nThe annual assessment follows." : ""}</div>
   <div class="choices"><button class="ch" id="y"><b>Type the report and end the turn</b></button><button class="ch" id="n"><b>Not yet</b></button></div>`,
    m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); endTurn(); }; m.querySelector("#n").onclick = closeModal; });
}
boot();
