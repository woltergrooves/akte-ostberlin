// ===================== ENGINE + UI =====================
import { TURNS, RANKS, BUILDINGS, WORKPLACES, TYPEWRITERS, TRAITS, FAKEABLE, generatePeople, INCIDENTS, OVERHEARD } from "./data.js";
import { STORY, CONDITIONAL } from "./events.js";
import { createWorld } from "./world.js";
import { loadModels } from "./assets.js";

const SAVE = "akte-save-v4", ENDS = "akte-endings-v2";
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
function addLog(p, text) { if (p) p.log.push(`${turn().label}: ${text}`); }
function inbox(k, title, text, pid) { S.inbox.unshift({ id: uid(), k, title, text, pid, t: S.t, read: false }); if (S.inbox.length > 60) S.inbox.length = 60; }
function nextCode() { const c = CODES.find(c => !S.codes.includes(c)) || "X-" + S.codes.length; S.codes.push(c); return c; }
function makeIM(p, code) { if (!p) return; p.status = "im"; p.code = code || nextCode(); if (code) S.codes.push(code); p.lies = 0; S.stats.recruits++; addLog(p, `Recruited as IM „${p.code}“`); }

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
};

// ---------- opslaan ----------
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem(SAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { } }
function endings() { try { return JSON.parse(localStorage.getItem(ENDS) || "[]"); } catch (e) { return []; } }
function addEnding(id) { try { const e = endings(); if (!e.includes(id)) e.push(id); localStorage.setItem(ENDS, JSON.stringify(e)); } catch (e) { } }

// ===================== SPELVERLOOP =====================
function newGame() {
  const seed = Math.floor(R() * 1e9);
  S = {
    seed, t: 0, gunst: 50, geweten: 70, onrust: 18, dossier: 5, gezin: 60, fuchs: 0, rank: 0, mk: 0, mkNext: 0, res: 0, resTotal: 0,
    people: generatePeople(seed), bugs: {}, taps: {}, inbox: [], queue: [], case: null, caseN: 0, wrongs: [], flags: {}, fates: {}, fired: {},
    quota: null, later: [], home: false, tut: 0, stats: { arrests: 0, recruits: 0, zersetzung: 0, solved: 0, wrong: 0, observe: 0 }, codes: [], over: null,
  };
  startTurn();
}

function startTurn() {
  const T = turn();
  if (T.first || !S.quota) { S.quota = QUOTA[T.y]; S.res = 0; }
  S.mk = Math.max(1, rank().mk + S.mkNext); S.mkNext = 0; S.home = false;
  S.later = S.later.filter(l => { if (l.t <= S.t) { runLater(l.id); return false; } return true; });
  const before = { onrust: S.onrust };
  if (S.t > 0) { drift(); imReports(); bugReports(); tapReports(); fuchsTick(); flights(); S.gezin = clamp(S.gezin - 1 - (S.geweten < 30 ? 2 : 0)); S.gunst = clamp(S.gunst - (S.gunst > 75 ? 3 : 1)); maybeCase(); }
  queueEvents();
  save(); refresh();
  if (S.t > 0) briefing(before);
}

// ---------- maandoverzicht ----------
function monthsToReview() { let n = 0; for (let i = S.t; i < TURNS.length; i++) { if (TURNS[i].y !== turn().y) break; n++; if (TURNS[i].review) return n; } return null; }
function briefing(before) {
  const T = turn(); const items = S.inbox.filter(i => i.t === S.t);
  const cnt = k => items.filter(i => i.k === k).length;
  const li = [];
  if (S.tut === 99 && S.flags._tutJustDone) { delete S.flags._tutJustDone; li.push("<b>The tutorial is over.</b> From now on, the strip at the bottom always shows your best next move."); }
  if (cnt("im")) li.push(`<b>${cnt("im")} report${cnt("im") > 1 ? "s" : ""}</b> from your informers ${cnt("im") > 1 ? "are" : "is"} waiting in <b>Files</b>.`);
  if (cnt("bug")) li.push(`<b>${cnt("bug")} bugged conversation${cnt("bug") > 1 ? "s" : ""}</b> waiting in <b>Files</b>.`);
  items.filter(i => i.k === "case").forEach(i => li.push(`<b>New case:</b> ${esc(i.title.replace("Case: ", ""))}. Find the culprit within 2 turns.`));
  items.filter(i => i.k === "warn" || i.k === "info").forEach(i => li.push(`<b>${esc(i.title)}</b>`));
  if (!cnt("im") && !cnt("bug")) li.push(`<span class="muted">No new information. Recruit informers or plant bugs.</span>`);
  
  const mr = monthsToReview(); const q = S.quota;
  modal(`<div class="kicker">New turn</div><h1>${esc(T.label)}</h1>
   <ul class="brief">${li.slice(0, 4).map(x => `<li>${x}</li>`).join("")}${mr ? `<li>Annual target (in ${mr} turn${mr > 1 ? "s" : ""}): <b>${S.res}/${q.res}</b> results · <b>${imCount()}/${q.ims}</b> informers</li>` : ""}<li><b>${S.mk} manpower</b> this turn</li></ul>
   <button class="next" id="nx">Get to work</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); setMode("office"); }, { lock: true });
}

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
    if (R() * 100 < im.honesty) {
      const unk = target.traits.filter(t => !target.known[t]);
      if (!unk.length) { inbox("im", head, "‘No new details.’", target.id); return; }
      const t = rand(unk); target.known[t] = { s: "IM", im: im.id };
      inbox("im", head, `Reports: ${trLabel(t)}.`, target.id);
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
      p.known[t] = { s: "zeker" }; p.pages += 3;
      lines.push(`${p.name}: ${overheardLine(t, p)}\n→ ${trLabel(t)}`);
    }
    if (lines.length) inbox("bug", `Bugged: ${Bd(bid).name}`, lines.join("\n\n"));
    if (ppl.some(p => p.dis > 50 && p.status === "vrij") && R() < 0.09) {
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
  if (S.fuchs >= 50 && R() < 0.3) { S.dossier = clamp(S.dossier + 5); inbox("warn", "Fuchs", "Oberleutnant Fuchs has written an internal memo about you. You hear it from the secretary. (Suspicion +5)"); }
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
  S.dossier = clamp(S.dossier + (e.d || 0)); S.gezin = clamp(S.gezin + (e.fam || 0)); S.fuchs = clamp(S.fuchs + (e.fu || 0));
  if (e.res) { S.res += e.res; S.resTotal += e.res; }
  if (e.mk) S.mkNext += e.mk;
}
function chips(e) {
  if (!e) return "";
  const o = []; const f = (k, l, goodUp) => { if (e[k]) { const up = e[k] > 0; o.push(`<span class="chip ${up === goodUp ? "up" : "down"}">${l} ${up ? "+" : ""}${e[k]}</span>`); } };
  f("g", "Favour", true); f("c", "Conscience", true); f("d", "Suspicion", false); f("fam", "Family", true); f("res", "Result", true); f("mk", "Manpower", true);
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
  applyE(c.e); if (c.flag) S.flags[c.flag] = true;
  if (c.fx) c.fx(S, A, q.ctx);
  if (c.fate) S.fates[c.fate[0]] = c.fate[1];
  const e = ev(q); if (e.person) addLog(P(e.person), `${e.title}: ${c.t}`);
  if (e.id === "intro") tutDone(0);
  if (e.id === "fuchs") S.flags.fuchsMet = true;
  save(); refresh(); rerender();
  modal(`<div class="kicker">${esc(turn().label)} · ${esc(c.t)}</div><h1>${esc(e.title)}</h1>
    <div class="result">${esc(sub(c.r, q.ctx))}</div>${chips(c.e)}<button class="next" id="nx">${c.end ? "Continue →" : "Back to work"}</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); if (c.end) return finish(c.flag === "fled" ? "overgelopen" : null); if (!checkOver()) nextPending(); }, { lock: true });
}
function nextPending() { const q = S.queue.find(q => ev(q).via === "telefoon"); if (q) world.setRinging(true); }

// ---------- acties ----------
function spend(n) { if (S.mk < n) { toast("Not enough manpower this turn."); return false; } S.mk -= n; return true; }
function after(msg, e) { applyE(e); save(); refresh(); if (checkOver()) return; rerender(); if (msg) flash(msg + chips(e)); }

const ACT = {
  observe(p) {
    if (!spend(1)) return; S.stats.observe++; tutDone(4); p.pages += 5; addLog(p, "Observed");
    const lines = []; const hidden = p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker");
    Object.keys(p.known).forEach(t => { const k = p.known[t]; if (k.s === "IM" && !p.traits.includes(t)) { const im = P(k.im); delete p.known[t]; if (im) { im.lies = (im.lies || 0) + 1; lines.push(`✗ Disproved: „${trLabel(t)}“. IM „${im.code}“ lied.`); } } });
    let got = 0;
    p.twChecked = true;
    hidden.forEach(t => { if (R() < (TRAITS[t].tw ? 1 : 0.55)) { lines.push("✓ " + trLabel(t)); p.known[t] = { s: "zeker" }; got++; } });
    if (!got && hidden.length) { const t = rand(hidden); p.known[t] = { s: "zeker" }; lines.push("✓ " + trLabel(t)); }
    if (p.status === "im" && p.doubleAgent && !p.known.dubbel && R() < 0.5) { p.known.dubbel = { s: "zeker" }; lines.push("" + trLabel("dubbel")); }
    if (!lines.length) lines.push("Nothing new. A dull life, or a careful one.");
    after(`<h1>Observation: ${esc(p.name)}</h1><div class="result">${lines.map(esc).join("\n")}</div><div class="advice">${personAdvice(p)}</div>`);
  },
  post(p) {
    if (!spend(1)) return; p.pages += 4; addLog(p, "Post checked");
    const set = ["westfam", "ausreise", "samizdat", "klager", "vlucht", "kindstudie"];
    const found = p.traits.filter(t => set.includes(t)); found.forEach(t => p.known[t] = { s: "zeker" });
    after(`<h1>Post check: ${esc(p.name)}</h1><div class="result">${found.length ? found.map(t => "✓ " + esc(trLabel(t))).join("\n") : "Letters from an aunt about the weather. Nothing of note."}</div>`);
  },
  tap(p) {
    if (S.taps[p.id]) { delete S.taps[p.id]; return after(null); }
    if (pool() >= rank().bugs) return toast(`All your equipment is in use (${rank().bugs}).`);
    if (!spend(1)) return; S.taps[p.id] = S.t; addLog(p, "Phone tapped");
    after(`<h1>Phone tap installed</h1><div class="result">From next turn you will be listening in on ${esc(p.name)}.</div>`, { c: -1 });
  },
  warn(p) {
    if (!spend(1)) return; p.dis = Math.max(0, p.dis - 18); p.fear += 25; p.pages += 3; addLog(p, "Warning interview");
    after(`<h1>Warning interview</h1><div class="result">${esc(p.name)} is picked up for ‘the clarification of a few matters’. Two hours later ${pron(p)} is back outside. Pale.</div>`, { c: -3, g: 1, o: -1, d: p.family ? 3 : 0 });
  },
  recruit(p, how) {
    if (imCount() >= rank().ims) return toast(`As ${rank().id} you can run at most ${rank().ims} IMs.`);
    if (!spend(1)) return;
    const chance = recruitChance(p, how), cost = how === "gunst" ? 2 : 5 + (TRAITS[how].lev || 1) * 2;
    if (R() < chance) {
      makeIM(p); p.pages += 10;
      after(`<h1>Signed</h1><div class="result">${esc(p.name)} signs the Verpflichtungserklärung, the pledge to cooperate. Codename: <b>„${esc(p.code)}“</b>.\n\nFrom next turn ${pron(p)} reports on neighbours and colleagues.</div>`, { c: -cost, g: 3 });
    } else {
      p.dis = Math.min(95, p.dis + 12); p.fear += 10; p.pages += 5; addLog(p, "Refused to become an IM");
      const told = R() < 0.35;
      after(`<h1>Refused</h1><div class="result">${esc(p.name)} refuses to sign.${told ? `\n\nWorse: ${pron(p)} tells people in the district.` : ""}</div>`, { c: -Math.ceil(cost / 2), o: told ? 3 : 1, d: told ? 3 : 0 });
    }
  },
  zersetzung(p) {
    if (p.pages < 15) return toast("You know too little about this person (file < 15 pages).");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.dis = Math.max(0, p.dis - 45); p.status = "zersetzt"; p.pages += 25; S.stats.zersetzung++; addLog(p, "Zersetzung");
    after(`<h1>Maßnahme: Zersetzung</h1><div class="result">${esc(rand(ZERS))}\n\nWithin a few months ${esc(p.name)} trusts nobody any more. Exactly as intended.</div>`, { c: -12, g: hostile ? 5 : 1, res: hostile ? 1 : 0, o: -2 });
  },
  arrest(p) {
    if (!evidence(p)) return toast("Not enough evidence: you need at least two confirmed suspicious traits.");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.status = "gevangen"; p.pages += 20; S.stats.arrests++; addLog(p, "Arrested, taken to Hohenschönhausen");
    if (p.family) { S.flags.betray = true; S.fates[p.id] = "Was arrested by his own brother. Spent fourteen months in Bautzen. Never exchanged another word with you."; }
    const late = turn().y >= 1988;
    after(`<h1>Arrest</h1><div class="result">Five in the morning. ${esc(p.name)} is allowed to pack a bag. The neighbours watch through the cracks of their doors.${late ? "\n\nBut by now fear works differently: the following Sunday the church is fuller than ever." : ""}</div>`, { c: hostile ? -8 : -15, g: hostile ? 6 : 2, res: hostile ? 1 : 0, o: late ? 2 : -4, fam: p.family ? -30 : 0 });
  },
  assign(im, target) { if (!spend(1)) return; im.assign = target.id; addLog(im, `Assignment: ${target.name}`); after(`<h1>Assignment given</h1><div class="result">Next turn IM „${esc(im.code)}“ will focus on ${esc(target.name)}.</div>`); },
  drop(im) { im.status = "vrij"; addLog(im, "Dropped as an IM"); after(`<h1>IM dropped</h1><div class="result">„${esc(im.code)}“ never hears from you again. The file disappears into the archive.</div>`); },
  geur(p) { if (!S.case || !spend(1)) return; S.case.geur[p.id] = p.id === S.case.culprit; addLog(p, "Scent sample taken"); after(`<h1>Scent sample</h1><div class="result">A tracker dog sniffs the leaflet and a cloth from ${esc(p.name)}'s chair.\n\n${S.case.geur[p.id] ? "The dog reacts." : "The dog shows no interest."}</div>`, { c: -2 }); },
  bug(bid) {
    if (S.bugs[bid]) { delete S.bugs[bid]; return after(null); }
    if (pool() >= rank().bugs) return toast(`All your equipment is in use (${rank().bugs}).`);
    if (!spend(2)) return; S.bugs[bid] = S.t;
    after(`<h1>Bugs planted</h1><div class="result">A ‘plumber’ and a ‘chimney sweep’ visit ${esc(Bd(bid).name)}. From next turn you are listening in.</div>`, { c: -1 });
  },
  home() { if (S.home) return toast("You already went home early this turn."); if (!spend(1)) return; S.home = true; after(`<h1>Home early</h1><div class="result">${rand(["You eat at the table with Katrin and Jens. Nobody asks how your day was.", "Jens shows you his Russian homework. You help him with the cases.", "Katrin puts a record on. You dance in the kitchen, just for a moment."])}</div>`, { fam: 7, c: 1 }); },
};
function recruitChance(p, how) { const c = how === "gunst" ? 0.2 + p.loyal / 180 - p.dis / 250 : 0.32 + (TRAITS[how].lev || 1) * 0.16 + p.fear / 250 - p.dis / 300; return Math.max(0.05, Math.min(0.95, c)); }
function bestLever(p) { return Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker").sort((a, b) => TRAITS[b].lev - TRAITS[a].lev)[0] || "gunst"; }
function evidence(p) { return p.caught || Object.keys(p.known).filter(t => p.known[t].s === "zeker" && TRAITS[t] && (TRAITS[t].dis || 0) >= 10).length >= 2; }

function accuse(p) {
  const c = S.case; if (!c) return;
  const right = p.id === c.culprit;
  S.case = null; p.caught = true; p.pages += 15; addLog(p, `Named as the culprit: ${INCIDENTS[c.tmpl].t.toLowerCase()}`);
  if (right) { S.stats.solved++; applyE({ g: 6, res: 1 }); }
  else { S.stats.wrong++; S.wrongs.push({ innocent: p.id, culprit: c.culprit, month: turn().label }); applyE({ g: 4, res: 1 }); }
  save(); refresh();
  const opts = [
    { t: "Arrest", d: "Hohenschönhausen. An example.", f: () => { p.status = "gevangen"; S.stats.arrests++; addLog(p, "Arrested"); return { c: -8, o: turn().y >= 1988 ? 2 : -4, g: 3 }; } },
    { t: "Recruit as IM", d: imCount() >= rank().ims ? "No room in your network." : "Those who are caught sign quickly.", dis: imCount() >= rank().ims, f: () => { makeIM(p); return { c: -6 }; } },
    { t: "Let them go", d: "Frighten and release.", f: () => { p.dis = Math.max(0, p.dis - 25); p.fear += 30; return { c: -2, g: -2 }; } },
  ];
  modal(`<div class="stamp">ERMITTELT</div><div class="kicker">Case closed</div><h1>${esc(p.name)}</h1>
   <div class="result">Kessler is pleased: ‘Good work. The culprit has been found.’ He doesn't ask how sure you are.\n\nWhat happens to ${esc(p.name)}?</div>
   <div class="choices">${opts.map((o, k) => `<button class="ch" data-k="${k}" ${o.dis ? "disabled" : ""}><b>${o.t}</b><span>${esc(o.d)}</span></button>`).join("")}</div>`,
    m => m.querySelectorAll("button.ch").forEach(b => b.onclick = () => { const e = opts[+b.dataset.k].f(); applyE(e); save(); refresh(); closeModal(); if (!checkOver()) flash(`<h1>Case closed</h1><div class="result">${esc(p.name)}: the file gets its stamp.</div>` + chips(e)); }), { lock: true });
}

// ---------- maand afsluiten ----------
function endTurn() {
  if (S.queue.length) { toast("Deal with the waiting matters first."); return openEvent(S.queue[0]); }
  const c = S.case;
  if (c) { c.turns--; if (c.turns <= 0) { S.case = null; applyE({ g: -6, o: 4 }); inbox("warn", "Case unsolved", `${INCIDENTS[c.tmpl].t}: the culprit was never found. Kessler makes a note of it. (Favour −6)`); } }
  if (checkOver()) return;
  const T = turn();
  if (T.review) return review(() => advance());
  advance();
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
  if (okR && okI) { if (S.rank < RANKS.length - 1) { S.rank++; lines.push(`\nKessler: ‘Excellent. They are talking about you at Normannenstraße.’\n\nPromoted to ${rank().id}! More manpower (${rank().mk}), room for ${rank().ims} IMs and ${rank().bugs} bugging sets.${rank().unlock ? ` New: ${rank().unlock}.` : ""}`); } else lines.push("\nKessler: ‘I have nothing to criticise.’ A bonus of 500 marks."); e = { g: 8 }; }
  else if (okR || okI) { lines.push("\nKessler: ‘Adequate. But I expect more zeal.’ No promotion this year."); }
  else { lines.push("\nKessler closes the door. ‘I am beginning to wonder whose side you are on, comrade.’ A note goes into your personnel file."); e = { g: -12, d: 8 }; }
  if (turn().y === 1987 && S.flags.leak) { lines.push("\nAs you leave: ‘Someone warned that church. I will find out who.’"); e.d = (e.d || 0) + 6; }
  if (turn().y === 1988 && S.flags.cover) { lines.push("\nKessler puts a copy on the table. The report about your brother. ‘The original went missing. Strange, isn't it?’"); e.d = (e.d || 0) + 8; e.g = (e.g || 0) - 5; }
  applyE(e); save(); refresh();
  modal(`<div class="stamp">BEURTEILUNG</div><div class="kicker">${esc(turn().label)}</div><h1>Annual assessment ${turn().y}</h1><div class="result">${esc(lines.join("\n"))}</div>${chips(e)}<button class="next" id="nx">Continue →</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); next(); }, { lock: true });
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
  const own = `In 1992 you request your own file. ${60 + S.dossier * 3} pages. Informer: IM „Lerche“: Erich Pohl, your neighbour. Every week: when you came home, who visited, whether you drank.${F.pohl ? " You had suspected it. That doesn't make it any less cold." : ""} Even the Stasi did not trust the Stasi.`;
  const fam = F.alone ? "Katrin never came back from Rostock. Jens phones at Christmas." : S.gezin >= 60 ? "Katrin and Jens are still there. In 1996, when he is twenty, Jens asks what you actually did. This time you tell him." : S.gezin >= 30 ? "Katrin stays. At home, nobody talks about the eighties." : "Katrin files for divorce in 1991. ‘I read my own file,’ she says. ‘You weren't in it. But you could have stopped it.’";
  // lotgevallen
  const lines = [];
  const seen = new Set();
  Object.entries(S.fates).forEach(([pid, txt]) => { const p = P(pid); if (p) { lines.push([p.name, txt]); seen.add(pid); } });
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
    <div class="result">${esc(T[1])}${files ? "\n\n" + esc(files) : ""}\n\n${esc(own)}\n\n${esc(fam)}</div>
    <div class="kicker" style="margin-top:8px">What became of them</div>
    ${lines.map(([n, t]) => `<div class="ep-item"><b>${esc(n)}</b><p>${esc(t)}</p></div>`).join("")}
    <div class="ep-item"><b>Your service record</b><p>Rank ${esc(rank().id)} · conscience ${S.geweten} · ${st.recruits} IMs recruited · ${st.arrests} arrests · ${st.zersetzung}× Zersetzung · ${st.solved + st.wrong} cases ‘solved’, ${st.wrong} of them with the wrong culprit</p></div>
    <div class="ep-item"><b>Endings found: ${found.length} of ${Object.keys(ENDINGS).length}</b><p>${Object.entries(ENDINGS).map(([k, v]) => found.includes(k) ? `✓ ${esc(v)}` : "? ???").join(" · ")}</p></div>
    <p class="note"><i>In 1989 the Stasi had some 91,000 full-time staff and almost 190,000 informers. Since 1992 more than three million people have asked to see their files.</i></p>
    <button class="next" id="nx">Play again</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); showTitle(); }, { lock: true, wide: true });
}

// ===================== UI =====================
function bar(lbl, v, cls) { const seg = Math.round(v / 10); return `<div class="stat ${cls || ""}"><div class="sl"><span>${lbl}</span><b>${String(v).padStart(3, "0")}</b></div><div class="bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? "on" : ""}"></i>`).join("")}</div></div>`; }
function refresh() {
  if (!S) return;
  const T = turn();
  $("#hud").innerHTML = `<div class="hrow"><span class="date">${esc(T.label)}</span><span class="rk">${esc(rank().id)}</span><button class="help" id="helpBtn" aria-label="Help">?</button></div>
   <div class="stats">${bar("Favour", S.gunst, "sg")}${bar("Conscience", S.geweten, "sc")}${bar("Suspicion", S.dossier, "sd")}</div>
   <div class="mk"><span class="mkl">MP</span>${"<i class=on></i>".repeat(S.mk)}${"<i></i>".repeat(Math.max(0, rank().mk - S.mk))}<span class="goal">Plan ${T.y}: <b>${S.res}/${S.quota.res}</b> res. · <b>${imCount()}/${S.quota.ims}</b> IM</span></div>`;
  $("#helpBtn").onclick = showHelp;
  $("#hud .stats").onclick = explainMeters; $("#hud .mk").onclick = explainMeters;
  const unread = S.inbox.filter(i => !i.read).length;
  const pend = via => S.queue.filter(q => ev(q).via === via).length;
  const phone = pend("telefoon");
  world.setRinging(phone > 0);
  world.setOffice({ folders: unread + pend("dossier"), caseOpen: !!S.case, date: T.label.split(" ").slice(0, -1).join(" ").replace(/^\d+ /, m => m), month: String(T.y), badges: { telefoon: phone ? "!" : "", dossiers: (unread + pend("dossier")) || "", gezin: pend("gezin") ? "!" : "", onderzoek: S.case ? `${S.case.turns} t.` : "", typemachine: "" } });
  const ims = {}; S.people.filter(p => p.status === "im").forEach(p => ims[p.home] = (ims[p.home] || 0) + 1);
  const info = {}; BUILDINGS.forEach(b => { let t = ""; if (S.bugs[b.id]) t += " "; if (ims[b.id]) t += ` <b style="background:#2f5a8a">IM ${ims[b.id]}</b>`; if (S.case && S.case.shown.includes("place") && S.case.home === b.id) t += " <b>!</b>"; info[b.id] = t; });
  world.setDistrict({ info, bugs: S.bugs, ims, winter: !!T.winter, finale: T.key === "1989-nov" });
  $("#navEnd").innerHTML = `End turn<small>to ${esc((TURNS[S.t + 1] || T).label)}</small>`;
  updateCoach();
}

// ---------- sheet / modal / toast ----------
let stack = [];
function sheet(fn, push = true) {
  if (push) stack.push(fn); const el = $("#sheet"); el.classList.add("open"); document.body.classList.add("sheet-open");
  const inner = $("#sheetBody"); inner.innerHTML = ""; fn(inner); inner.scrollTop = 0; updateCoach();
  $("#sheetBack").style.visibility = stack.length > 1 ? "visible" : "hidden";
}
function closeSheet() { stack = []; $("#sheet").classList.remove("open"); document.body.classList.remove("sheet-open"); world.select(null); updateCoach(); }
function back() { stack.pop(); const f = stack[stack.length - 1]; if (f) sheet(f, false); else closeSheet(); }
function rerender() { const f = stack[stack.length - 1]; if (f) sheet(f, false); }
function resultSheet(html, e) {
  modal(`${html}${chips(e)}<button class="next" id="nx">OK</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); rerender(); });
}
function modal(html, mount, opt = {}) {
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
  const known = Object.entries(p.known).map(([t, k]) => `<li>${esc(trLabel(t))} <span class="tag ${k.s === "zeker" ? "green" : "amber"}">${k.s === "zeker" ? "confirmed" : `IM „${esc((P(k.im) || {}).code || "?")}“, unconfirmed`}</span></li>`).join("") || "<li class='muted'>Nothing yet. Observe, bug, or put an informer on them.</li>";
  const r = rank(); const info = [], hard = [];
  const can = free(p) || p.status === "im";
  const btn = (arr, k, l, cost, dis, why) => arr.push(`<button class="act" data-a="${k}" ${dis ? "disabled" : ""}><b>${l} <em>${cost ? cost + " MP" : "free"}</em></b><span>${why}</span></button>`);
  if (can) {
    btn(info, "observe", "Observe", 1, S.mk < 1, "Find out what someone is hiding. Also checks what informers claim.");
  }
  if (free(p) && p.status === "vrij") {
    btn(hard, "warn", "Warn", 1, S.mk < 1, "Frighten them. They become less defiant. Light touch.");
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
    const rel = p.known.dubbel ? "Double agent exposed" : p.lies ? `Low: ${p.lies} lie${p.lies > 1 ? "s" : ""} caught` : "Unknown (check reports by observing)";
    const targets = S.people.filter(q => q !== p && free(q) && (q.home === p.home || (q.work && q.work === p.work)));
    imBox = `<div class="box blue"><div class="kicker">Informer „${esc(p.code)}“</div><div class="clue">Reliability: ${esc(rel)}</div>${p.assign ? `<div class="clue">Assignment: ${esc(P(p.assign).name)}</div>` : ""}
      <label class="sel">Give an assignment (1 MP): <select id="assignSel"><option value="">— choose a neighbour or colleague —</option>${targets.map(q => `<option value="${q.id}">${esc(q.name)}</option>`).join("")}</select></label>
      <div class="acts"><button class="act" data-a="drop"><b>Drop</b><span>0 MP</span></button></div></div>`;
  }
  el.innerHTML = `<div class="ph"><div><div class="kicker">Akte ${4000 + S.people.indexOf(p) * 37}/85 · ${p.pages} pages</div><h2>${esc(p.name)}</h2><div class="who">${esc(p.job)}, ${p.age}</div></div><div class="stampS">${p.status === "vrij" ? "" : esc((STATUS_L[p.status] || p.status).toUpperCase())}</div></div>
   <div class="grid2"><div><small>Lives at</small><a data-b="${b.id}">${esc(b.name)}</a></div><div><small>Works at</small>${p.work && Bd(p.work) ? `<a data-b="${p.work}">${esc(work)}</a>` : esc(work)}</div><div><small>How defiant?</small>${hostility(p)}</div><div><small>Status</small>${esc(STATUS_L[p.status] || p.status)}</div></div>
   ${p.secretIM ? `<div class="box"><div class="clue">Card ‘gesperrt’: access for the Hauptabteilung only. This person is not available for measures.</div></div>` : ""}
   <div class="advice">${personAdvice(p)}</div>
   ${caseBox}${imBox}
   <div class="kicker">What you know</div><ul class="traits">${known}</ul>
   ${p.secretIM ? "" : `${info.length ? `<div class="kicker">Gather information</div><div class="acts">${info.join("")}</div>` : ""}${hard.length ? `<div class="kicker">Intervene</div><div class="acts">${hard.join("")}</div>` : ""}`}
   ${recruitable ? (() => { const how = bestLever(p); const pct = Math.round(recruitChance(p, how) * 100); return `<div class="kicker">Make an informer <small class="muted">· ${imCount()}/${r.ims}</small></div><div class="acts one"><button class="act" data-a="recruit" data-h="${how}" ${S.mk < 1 || imCount() >= r.ims ? "disabled" : ""}><b>Recruit as IM <em>1 MP · ${pct}% chance</em></b><span>${how !== "gunst" ? `Leverage: ${esc(trLabel(how).toLowerCase())}.` : "Without leverage the chance is small. Observe first."} An IM informs on a neighbour every turn.</span></button></div>`; })() : ""}
   ${p.log.length ? `<div class="kicker">Notes</div><ul class="log">${p.log.slice(-8).reverse().map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}`;
  el.querySelectorAll("[data-b]").forEach(a => a.onclick = () => openBuilding(a.dataset.b));
  el.querySelectorAll("button.act").forEach(bt => bt.onclick = () => {
    const a = bt.dataset.a;
    if (a === "accuse") return modal(`<h1>Name ${esc(p.name)}?</h1><div class="result">You can't undo this. If you are wrong, the real culprit stays free.</div><div class="choices"><button class="ch" id="y"><b>Yes, it's ${obj(p)}</b></button><button class="ch" id="n"><b>Not yet</b></button></div>`, m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); accuse(p); }; m.querySelector("#n").onclick = closeModal; });
    if (a === "recruit") return ACT.recruit(p, bt.dataset.h);
    if (a === "drop") return ACT.drop(p);
    ACT[a](p);
  });
  const sel = el.querySelector("#assignSel"); if (sel) sel.onchange = () => { if (sel.value) ACT.assign(p, P(sel.value)); };
}

function openBuilding(id) { world.select(id); sheet(el => buildingView(el, id)); tutDone(2); }
function buildingView(el, id) {
  const b = Bd(id);
  if (id === "mfs") { el.innerHTML = `<h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p><button class="next" id="go">To your office</button>`; el.querySelector("#go").onclick = () => { closeSheet(); setMode("office"); }; return; }
  const res = S.people.filter(p => p.home === id), wrk = S.people.filter(p => p.work === id);
  const r = rank();
  el.innerHTML = `<div class="kicker">${b.res ? "Residential" : "Workplace"}</div><h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p>
    <div class="acts"><button class="act ${S.bugs[id] ? "danger" : ""}" id="bugBtn" ${!S.bugs[id] && (S.mk < 2 || pool() >= r.bugs) ? "disabled" : ""}><b>${S.bugs[id] ? "Remove bugs" : "Plant bugs"}</b><span>${S.bugs[id] ? "frees the equipment" : `2 MP · bugged conversations every turn · ${pool()}/${r.bugs} in use`}</span></button></div>
    ${res.length ? `<div class="kicker">Residents</div>${res.map(p => personRow(p)).join("")}` : ""}
    ${wrk.length ? `<div class="kicker">Works here</div>${wrk.map(p => personRow(p)).join("")}` : ""}`;
  el.querySelector("#bugBtn").onclick = () => ACT.bug(id);
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
  return `<button class="row card${GONE.includes(p.status) ? " gone" : ""}" data-pid="${p.id}"><span class="rn"><b>${esc(p.name)}</b> ${st}${S.taps[p.id] ? ' <span class="tag red">tapped</span>' : ""}<small>${esc(sub)}</small></span><span class="rp">${leds}<span>${p.pages}<small> pp.</small></span></span></button>`;
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
   <div class="grid2"><div><small>Results</small>${S.res} / ${q.res}</div><div><small>Active IMs</small>${imCount()} / ${q.ims}</div><div><small>Rank</small>${esc(r.id)}</div><div><small>Next rank</small>${nr ? `${esc(nr.id)}${nr.unlock ? " (" + esc(nr.unlock) + ")" : ""}` : "—"}</div></div>
   <p class="who">You earn results by solving cases, arresting enemies of the state or ‘zersetzing’ them, and through some decisions. At the end of every year comes the annual assessment. Meet both targets: promotion.</p>
   <div class="kicker">By rank</div><ul class="traits">${RANKS.map((x, i) => `<li class="${i === S.rank ? "" : "muted"}">${x.id}: ${x.mk} manpower, ${x.ims} IMs, ${x.bugs} bugging sets</li>`).join("")}</ul>
   <div class="kicker">Rival</div><p class="who">${S.flags.fuchsMet ? `Oberleutnant Fuchs: ${S.fuchs >= 50 ? "openly hostile" : S.fuchs >= 25 ? "on his guard" : "polite"}.` : "None yet."}</p>`;
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
<b>Case</b>: compare typewriter, paper and address. Name the culprit.</div>
<button class="next" id="nx">OK</button><button class="next ghost" id="ri">Tutorial again</button>`, m => { m.querySelector("#nx").onclick = closeModal; m.querySelector("#ri").onclick = showIntro; });
}

function setMode(m) {
  world.setMode(m); document.body.dataset.mode = m; if (m === "district") tutDone(1);
  $("#navOffice").classList.toggle("on", m === "office"); $("#navWijk").classList.toggle("on", m === "district");
  if (m === "district" && S && !S.flags._wijkHint) { S.flags._wijkHint = true; toast("Drag to look around. Tap a building to see who lives or works there."); }
  updateCoach();
}

function showTitle() {
  const sv = load(); const f = endings();
  $("#title").classList.add("open");
  $("#title").innerHTML = `<div class="tcard"><div class="kicker">East Berlin · 1983–1989</div>
   <h1 class="logo">AKTE<span>.</span></h1><div class="sub">A Stasi simulator</div>
   <p>Spy on your district. Recruit informers. Decide over lives. Until the Wall falls.</p>
   <button class="next" id="ng">New game</button>${sv && !sv.over && TURNS[sv.t] ? `<button class="next ghost" id="cont">Continue · ${esc(TURNS[sv.t].label)}</button>` : ""}
   <p class="muted small">Endings found: ${f.length}/${Object.keys(ENDINGS).length} · fictional people, real history</p></div>`;
  $("#ng").onclick = () => { $("#title").classList.remove("open"); newGame(); setMode("office"); showIntro(); };
  const c = $("#cont"); if (c) c.onclick = () => { S = sv; $("#title").classList.remove("open"); if (S.tut === undefined) S.tut = 99; setMode("office"); refresh(); toast(`<b>${esc(turn().label)}</b> · ${S.mk} manpower`); };
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
  if (S.case && S.mk > 0) return { text: `<b>Case:</b> find the culprit (${S.case.turns} turn${S.case.turns > 1 ? "s" : ""} left). Tap for the suspects.`, go: () => sheet(caseView) };
  if (S.mk > 0) {
    const lev = S.people.find(p => p.status === "vrij" && !p.family && !p.secretIM && Object.keys(p.known).some(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker"));
    if (lev && imCount() < Math.min(rank().ims, S.quota.ims)) return { text: `You have leverage on <b>${esc(lev.name)}</b>. Recruit ${obj(lev)} as an informer (you have ${imCount()}/${S.quota.ims} of the IMs you need).`, go: () => sheet(e => personView(e, lev)) };
    const arr = S.people.find(p => p.status === "vrij" && !p.family && evidence(p) && p.dis >= 30);
    if (arr && S.mk >= 2 && S.res < S.quota.res) return { text: `You have enough evidence against <b>${esc(arr.name)}</b>. An arrest counts as a result. Or will you let it go?`, go: () => sheet(e => personView(e, arr)) };
    if (pool() < rank().bugs && S.mk >= 2) return { text: `Plant <b>bugs</b> in a building (2 manpower): you will hear conversations every turn.`, go: () => setMode("district") };
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
    },
    onBuilding: id => { if (S && !S.over) openBuilding(id); },
  }, models);
  $("#sheetClose").onclick = closeSheet; $("#sheetBack").onclick = back;
  $("#modal").onclick = e => { if (e.target.id === "modal" && !$("#modal").dataset.lock) closeModal(); };
  $("#navOffice").onclick = () => { closeSheet(); setMode("office"); };
  $("#navWijk").onclick = () => { closeSheet(); setMode("district"); };
  $("#navCart").onclick = () => sheet(e => cartotheek(e));
  $("#navEnd").onclick = confirmEnd;
  $("#coach").onclick = () => { if (coachStep && coachStep.go) coachStep.go(); };
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
