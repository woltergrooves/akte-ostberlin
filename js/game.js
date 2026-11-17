// ===================== ENGINE + UI =====================
import { TURNS, RANKS, BUILDINGS, WORKPLACES, TYPEWRITERS, TRAITS, FAKEABLE, generatePeople, INCIDENTS, OVERHEARD } from "./data.js";
import { STORY, CONDITIONAL } from "./events.js";
import { createWorld } from "./world.js";

const SAVE = "akte-save-v3", ENDS = "akte-endings-v2";
const QUOTA = { 1985: { res: 2, ims: 1 }, 1986: { res: 3, ims: 2 }, 1987: { res: 3, ims: 3 }, 1988: { res: 4, ims: 3 }, 1989: { res: 4, ims: 3 } };
const CODES = ["Rose", "Kranich", "Falke", "Tulpe", "Sonne", "Igel", "Birke", "Anker", "Kompass", "Feder", "Linde", "Pinsel", "Rabe", "Kerze", "Glocke", "Adler", "Uhr", "Heide", "Ostsee", "Stein", "Mohn", "Wolke", "Fichte", "Brücke", "Ahorn", "Taube", "Spiegel", "Distel"];
const ENDINGS = { overgelopen: "Overgelopen", gearresteerd: "Zelf een dossier", overgeplaatst: "Bitterfeld", nee: "De man die nee zei", major: "Genosse Major", kantoor: "Een kleine baan", werk: "‘Ik deed mijn werk’", naam: "Een naam in ieders dossier" };
const ZERS = ["Zijn of haar post komt geopend aan, met telkens iets eruit.", "Collega's krijgen anonieme brieven met halve waarheden.", "Meubels in de woning staan verschoven als iemand thuiskomt. Er is niets gestolen.", "De autobanden zijn elke week lek. Steeds weer.", "Vrienden krijgen te horen dat er een informant in de groep zit. De verdenking valt precies op de verkeerde."];

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
const pron = p => p.sex === "f" ? "zij" : "hij";
const Pron = p => p.sex === "f" ? "Ze" : "Hij";
const trLabel = t => t === "dubbel" ? "Heeft heimelijk contact met de oppositie (dubbelspel!)" : (TRAITS[t] ? TRAITS[t].l : t);
const twOf = p => p.traits.find(t => TRAITS[t] && TRAITS[t].tw);

function uid() { return Math.random().toString(36).slice(2, 9); }
function addLog(p, text) { if (p) p.log.push(`${turn().label}: ${text}`); }
function inbox(k, title, text, pid) { S.inbox.unshift({ id: uid(), k, title, text, pid, t: S.t, read: false }); if (S.inbox.length > 60) S.inbox.length = 60; }
function nextCode() { const c = CODES.find(c => !S.codes.includes(c)) || "X-" + S.codes.length; S.codes.push(c); return c; }
function makeIM(p, code) { if (!p) return; p.status = "im"; p.code = code || nextCode(); if (code) S.codes.push(code); p.lies = 0; S.stats.recruits++; addLog(p, `Geworven als IM „${p.code}“`); }

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
  if (S.tut === 99 && S.flags._tutJustDone) { delete S.flags._tutJustDone; li.push("<b>De uitleg is klaar.</b> Vanaf nu staat onderaan steeds wat je het beste kunt doen."); }
  if (cnt("im")) li.push(`<b>${cnt("im")} rapport${cnt("im") > 1 ? "en" : ""}</b> van je informanten liggen in <b>Dossiers</b>.`);
  if (cnt("bug")) li.push(`<b>${cnt("bug")} afgeluisterd${cnt("bug") > 1 ? "e gesprekken" : " gesprek"}</b> liggen in <b>Dossiers</b>.`);
  items.filter(i => i.k === "case").forEach(i => li.push(`<b>Nieuw onderzoek:</b> ${esc(i.title.replace("Onderzoek: ", ""))}. Vind de dader binnen 2 beurten.`));
  items.filter(i => i.k === "warn" || i.k === "info").forEach(i => li.push(`<b>${esc(i.title)}</b>`));
  if (!cnt("im") && !cnt("bug")) li.push(`<span class="muted">Geen nieuwe informatie. Werf informanten of plaats microfoons.</span>`);
  
  const mr = monthsToReview(); const q = S.quota;
  modal(`<div class="kicker">Nieuwe beurt</div><h1>${esc(T.label)}</h1>
   <ul class="brief">${li.slice(0, 4).map(x => `<li>${x}</li>`).join("")}${mr ? `<li>Jaardoel (over ${mr} beurt${mr > 1 ? "en" : ""}): <b>${S.res}/${q.res}</b> resultaten · <b>${imCount()}/${q.ims}</b> informanten</li>` : ""}<li><b>${S.mk} mankracht</b> deze beurt</li></ul>
   <button class="next" id="nx">Aan de slag</button>`, m => m.querySelector("#nx").onclick = () => { closeModal(); setMode("office"); }, { lock: true });
}

function runLater(id) {
  if (id === "anna-leave") { const a = P("anna"); if (a && (a.status === "vrij")) { a.status = "uitgereisd"; inbox("info", "Uitreis goedgekeurd", "Anna Weiss heeft de DDR verlaten. Haar woning in de Greifswalder Straße is al verdeeld.", "anna"); } }
}

function drift() {
  const y = turn().y; const yd = { 1985: 0, 1986: 0.4, 1987: 0.9, 1988: 1.8, 1989: 3.6 }[y];
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
    const head = `IM „${im.code}“ over ${target.name}`;
    if (im.doubleAgent) { inbox("im", head, `‘Niets bijzonders. ${target.fn} is een rustige burger, gaat vroeg slapen.’`, target.id); return; }
    if (R() * 100 < im.honesty) {
      const unk = target.traits.filter(t => !target.known[t]);
      if (!unk.length) { inbox("im", head, "‘Geen nieuwe bijzonderheden.’", target.id); return; }
      const t = rand(unk); target.known[t] = { s: "IM", im: im.id };
      inbox("im", head, `Meldt: ${trLabel(t)}.`, target.id);
    } else {
      const opts = FAKEABLE.filter(t => !target.traits.includes(t) && !target.known[t]);
      const t = rand(opts); if (!t) return;
      target.known[t] = { s: "IM", im: im.id };
      inbox("im", head, `Meldt: ${trLabel(t)}.`, target.id);
    }
  });
}

function overheardLine(t, p) {
  if (TRAITS[t] && TRAITS[t].tw) { const lbl = TRAITS[t].l; return `(lang getik van een typemachine) Technische dienst: ${lbl.toLowerCase()}.`; }
  return rand(OVERHEARD[t] || ["(onverstaanbaar)"]);
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
    if (lines.length) inbox("bug", `Afluisteren: ${Bd(bid).name}`, lines.join("\n\n"));
    if (ppl.some(p => p.dis > 50 && p.status === "vrij") && R() < 0.09) {
      delete S.bugs[bid]; S.onrust = clamp(S.onrust + 4);
      inbox("warn", "Microfoon ontdekt!", `In ${Bd(bid).name} is een van je microfoons gevonden. Het verhaal gaat als een lopend vuurtje door de wijk.`);
    }
  });
}
function tapReports() {
  Object.keys(S.taps).forEach(pid => {
    const p = P(pid); if (!p || !free(p)) { delete S.taps[pid]; return; }
    const pref = ["westfam", "ausreise", "affaire", "zwart", "schulden", "vlucht", "samizdat"];
    const unk = p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker");
    const t = unk.find(t => pref.includes(t)) || rand(unk);
    if (t) { p.pages += 3; inbox("bug", `Telefoontap: ${p.name}`, `${overheardLine(t, p)}\n→ ${reveal(p, t, "Bevestigd")}`, p.id); }
  });
}
function fuchsTick() {
  if (S.t < 12) return;
  if (S.fuchs >= 50 && R() < 0.3) { S.dossier = clamp(S.dossier + 5); inbox("warn", "Fuchs", "Oberleutnant Fuchs heeft een interne notitie over jou geschreven. Je hoort het via de secretaresse. (Eigen dossier +5)"); }
  else if (S.fuchs >= 25 && S.res > 0 && R() < 0.2) { S.res--; inbox("warn", "Fuchs", "Fuchs heeft bij Kessler een van jouw resultaten als het zijne gepresenteerd. (Resultaten −1)"); }
}
function flights() {
  const T = turn(); if (!T.flight) return;
  S.people.filter(p => p.status === "vrij" && !p.family && (p.traits.includes("vlucht") || p.traits.includes("ausreise")) && p.dis > 20).forEach(p => {
    if (R() < 0.4) { p.status = "gevlucht"; addLog(p, "Gevlucht via Hongarije"); inbox("info", "Gevlucht", `${p.name} (${p.job}) is via Hongarije naar het Westen gevlucht. De woning staat leeg, de radio staat nog aan.`, p.id); }
  });
}

// ---------- onderzoeken (puzzels) ----------
function maybeCase() {
  if (S.case || S.t < 2 || turn().key === "1989-nov" || turn().key === "1989-okt") return;
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
  const c = { n: ++S.caseN, tmpl: Math.floor(R() * INCIDENTS.length), culprit: culprit.id, tw, work: culprit.work, home: culprit.home, shown, turns: 2, geur: {} };
  if (shown.length === 2 && !shown.includes("tw") && S.people.filter(p => p !== culprit && matchesShown(p, c)).length) c.shown = shown = ["tw", "place"];
  // verwarring weghalen: anderen die op alle zichtbare aanwijzingen passen krijgen een andere typemachine
  S.people.forEach(p => { if (p === culprit || !matchesShown(p, c)) return; const ptw = twOf(p); if (ptw === tw && (!p.known[ptw] || p.known[ptw].s !== "zeker")) { p.traits = p.traits.filter(t => t !== ptw); p.traits.push(rand(TYPEWRITERS.filter(x => x.id !== tw)).id); delete p.known[ptw]; p.twChecked = false; } });
  // misleiding: iemand die níet past heeft dezelfde machine
  const decoy = rand(S.people.filter(p => p !== culprit && free(p) && !twOf(p) && !matchesShown(p, c)));
  if (decoy && R() < 0.6) { decoy.traits.push(tw); decoy.twChecked = false; }
  S.case = c;
  let note = "";
  if (prev) { const inn = P(prev.innocent); note = `\n\nLetteranalyse: dezelfde typemachine als in de zaak van ${prev.month}. Maar toen werd ${inn.name} aangewezen. Dan was ${pron(inn)} het dus niet.`; S.geweten = clamp(S.geweten - 8); prev.note = true; }
  c.note = note;
  inbox("case", `Onderzoek: ${INCIDENTS[c.tmpl].t}`, INCIDENTS[c.tmpl].d + note);
}
function clueText(c, k) {
  if (k === "tw") return `Lettertype-analyse: ${TRAITS[c.tw].l.toLowerCase()}.`;
  if (k === "paper") return `Papier: ${WORKPLACES[c.work].paper}.`;
  if (k === "place") return `Verspreid in het trappenhuis van ${Bd(c.home).name}; de dader woont daar vermoedelijk.`;
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
  f("g", "Gunst", true); f("c", "Geweten", true); f("d", "Verdenking", false); f("fam", "Gezin", true); f("res", "Resultaat", true); f("mk", "Mankracht", true);
  if (e.fu) o.push(`<span class="chip ${e.fu > 0 ? "down" : "up"}">Rivaliteit Fuchs ${e.fu > 0 ? "+" : ""}${e.fu}</span>`);
  return o.length ? `<div class="chips">${o.join("")}</div>` : "";
}
const sub = (s, ctx) => ctx ? String(s).replace(/\{Z\}/g, ctx.Z || "Hij") : s;

function openEvent(q) {
  const e = ev(q); const ctx = q.ctx;
  const text = sub(ctx && ctx.text ? ctx.text : e.text, ctx);
  const choices = e.choices.filter(c => !c.cond || c.cond(S));
  modal(`<div class="stamp">${e.via === "gezin" ? "PRIVÉ" : "STRENG GEHEIM"}</div>
    <div class="kicker">${esc(turn().label)}${e.src ? " · Bron: " + esc(e.src) : ""}</div>
    <h1>${esc(e.title)}</h1>${e.who ? `<div class="who">${esc(e.who)}</div>` : ""}
    <div class="report">${esc(text)}</div>${e.note ? `<p class="note"><i>${esc(e.note)}</i></p>` : ""}
    <div class="choices">${choices.map((c, k) => `<button class="ch" data-k="${k}"><b>${esc(c.t)}</b>${c.d ? `<span>${esc(c.d)}</span>` : ""}</button>`).join("")}</div>`,
    m => m.querySelectorAll("button.ch").forEach(b => b.onclick = () => chooseEvent(q, choices[+b.dataset.k])), { lock: true });
}
function chooseEvent(q, c) {
  S.queue = S.queue.filter(x => x !== q);
  applyE(c.e); if (c.flag) S.flags[c.flag] = true;
  if (c.fx) c.fx(S, A, q.ctx);
  if (c.fate) S.fates[c.fate[0]] = c.fate[1];
  const e = ev(q); if (e.person) addLog(P(e.person), `${e.title}: ${c.t}`);
  if (e.id === "intro") tutDone(0);
  save(); refresh();
  modal(`<div class="kicker">${esc(turn().label)} · ${esc(c.t)}</div><h1>${esc(e.title)}</h1>
    <div class="result">${esc(sub(c.r, q.ctx))}</div>${chips(c.e)}<button class="next" id="nx">${c.end ? "Verder →" : "Terug naar het werk"}</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); if (c.end) return finish(c.flag === "fled" ? "overgelopen" : null); if (!checkOver()) nextPending(); }, { lock: true });
}
function nextPending() { const q = S.queue.find(q => ev(q).via === "telefoon"); if (q) world.setRinging(true); }

// ---------- acties ----------
function spend(n) { if (S.mk < n) { toast("Niet genoeg mankracht deze beurt."); return false; } S.mk -= n; return true; }
function after(msg, e) { applyE(e); save(); refresh(); if (checkOver()) return; rerender(); if (msg) flash(msg + chips(e)); }

const ACT = {
  observe(p) {
    if (!spend(1)) return; S.stats.observe++; tutDone(4); p.pages += 5; addLog(p, "Geobserveerd");
    const lines = []; const hidden = p.traits.filter(t => !p.known[t] || p.known[t].s !== "zeker");
    Object.keys(p.known).forEach(t => { const k = p.known[t]; if (k.s === "IM" && !p.traits.includes(t)) { const im = P(k.im); delete p.known[t]; if (im) { im.lies = (im.lies || 0) + 1; lines.push(`✗ Weerlegd: „${trLabel(t)}“. IM „${im.code}“ heeft gelogen.`); } } });
    let got = 0;
    p.twChecked = true;
    hidden.forEach(t => { if (R() < (TRAITS[t].tw ? 1 : 0.55)) { lines.push("✓ " + trLabel(t)); p.known[t] = { s: "zeker" }; got++; } });
    if (!got && hidden.length) { const t = rand(hidden); p.known[t] = { s: "zeker" }; lines.push("✓ " + trLabel(t)); }
    if (p.status === "im" && p.doubleAgent && !p.known.dubbel && R() < 0.5) { p.known.dubbel = { s: "zeker" }; lines.push("" + trLabel("dubbel")); }
    if (!lines.length) lines.push("Niets nieuws. Een saai leven, of een voorzichtig leven.");
    after(`<h1>Observatie: ${esc(p.name)}</h1><div class="result">${lines.map(esc).join("\n")}</div><div class="advice">${personAdvice(p)}</div>`);
  },
  post(p) {
    if (!spend(1)) return; p.pages += 4; addLog(p, "Postcontrole");
    const set = ["westfam", "ausreise", "samizdat", "klager", "vlucht", "kindstudie"];
    const found = p.traits.filter(t => set.includes(t)); found.forEach(t => p.known[t] = { s: "zeker" });
    after(`<h1>Postcontrole: ${esc(p.name)}</h1><div class="result">${found.length ? found.map(t => "✓ " + esc(trLabel(t))).join("\n") : "Brieven van een tante over het weer. Niets opvallends."}</div>`);
  },
  tap(p) {
    if (S.taps[p.id]) { delete S.taps[p.id]; return after(null); }
    if (pool() >= rank().bugs) return toast(`Al je apparatuur is in gebruik (${rank().bugs}).`);
    if (!spend(1)) return; S.taps[p.id] = S.t; addLog(p, "Telefoon getapt");
    after(`<h1>Telefoontap geplaatst</h1><div class="result">Vanaf de volgende beurt luister je mee met ${esc(p.name)}.</div>`, { c: -1 });
  },
  warn(p) {
    if (!spend(1)) return; p.dis = Math.max(0, p.dis - 18); p.fear += 25; p.pages += 3; addLog(p, "Waarschuwingsgesprek");
    after(`<h1>Waarschuwingsgesprek</h1><div class="result">${esc(p.name)} wordt opgehaald voor ‘een verduidelijking van enkele zaken’. Twee uur later staat ${pron(p)} weer buiten. Bleek.</div>`, { c: -3, g: 1, o: -1, d: p.family ? 3 : 0 });
  },
  recruit(p, how) {
    if (imCount() >= rank().ims) return toast(`Je kunt als ${rank().id} maximaal ${rank().ims} IM's leiden.`);
    if (!spend(1)) return;
    const chance = recruitChance(p, how), cost = how === "gunst" ? 2 : 5 + (TRAITS[how].lev || 1) * 2;
    if (R() < chance) {
      makeIM(p); p.pages += 10;
      after(`<h1>Getekend</h1><div class="result">${esc(p.name)} tekent de Verpflichtungserklärung. Codenaam: <b>„${esc(p.code)}“</b>.\n\nVanaf de volgende beurt rapporteert ${pron(p)} over buren en collega's.</div>`, { c: -cost, g: 3 });
    } else {
      p.dis = Math.min(95, p.dis + 12); p.fear += 10; p.pages += 5; addLog(p, "Weigerde IM te worden");
      const told = R() < 0.35;
      after(`<h1>Geweigerd</h1><div class="result">${esc(p.name)} weigert te tekenen.${told ? `\n\nErger: ${pron(p)} vertelt het in de wijk rond.` : ""}</div>`, { c: -Math.ceil(cost / 2), o: told ? 3 : 1, d: told ? 3 : 0 });
    }
  },
  zersetzung(p) {
    if (p.pages < 15) return toast("Je weet te weinig van deze persoon (dossier < 15 pagina's).");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.dis = Math.max(0, p.dis - 45); p.status = "zersetzt"; p.pages += 25; S.stats.zersetzung++; addLog(p, "Zersetzung");
    after(`<h1>Maßnahme: Zersetzung</h1><div class="result">${esc(rand(ZERS))}\n\nBinnen een paar maanden vertrouwt ${esc(p.name)} niemand meer. Precies de bedoeling.</div>`, { c: -12, g: hostile ? 5 : 1, res: hostile ? 1 : 0, o: -2 });
  },
  arrest(p) {
    if (!evidence(p)) return toast("Te weinig bewijs: minstens twee bevestigde verdachte kenmerken nodig.");
    if (!spend(2)) return;
    const hostile = p.dis >= 30; p.status = "gevangen"; p.pages += 20; S.stats.arrests++; addLog(p, "Gearresteerd, overgebracht naar Hohenschönhausen");
    if (p.family) { S.flags.betray = true; S.fates[p.id] = "Werd door zijn eigen broer gearresteerd. Zat veertien maanden in Bautzen. Heeft nooit meer een woord met je gewisseld."; }
    const late = turn().y >= 1988;
    after(`<h1>Arrestatie</h1><div class="result">Om vijf uur 's ochtends. ${esc(p.name)} mag een tas inpakken. De buren kijken door de kieren van hun deuren.${late ? "\n\nMaar in 1988 werkt angst anders: de volgende zondag zit de kerk voller dan ooit." : ""}</div>`, { c: hostile ? -8 : -15, g: hostile ? 6 : 2, res: hostile ? 1 : 0, o: late ? 2 : -4, fam: p.family ? -30 : 0 });
  },
  assign(im, target) { if (!spend(1)) return; im.assign = target.id; addLog(im, `Opdracht: ${target.name}`); after(`<h1>Opdracht gegeven</h1><div class="result">IM „${esc(im.code)}“ richt zich de volgende beurt op ${esc(target.name)}.</div>`); },
  drop(im) { im.status = "vrij"; addLog(im, "Afgestoten als IM"); after(`<h1>IM afgestoten</h1><div class="result">„${esc(im.code)}“ hoort niets meer van je. Het dossier verdwijnt in het archief.</div>`); },
  geur(p) { if (!S.case || !spend(1)) return; S.case.geur[p.id] = p.id === S.case.culprit; addLog(p, "Geurmonster afgenomen"); after(`<h1>Geurmonster</h1><div class="result">Een speurhond ruikt aan het pamflet en aan een doek uit de stoel van ${esc(p.name)}.\n\n${S.case.geur[p.id] ? "De hond slaat aan." : "De hond reageert niet."}</div>`, { c: -2 }); },
  bug(bid) {
    if (S.bugs[bid]) { delete S.bugs[bid]; return after(null); }
    if (pool() >= rank().bugs) return toast(`Al je apparatuur is in gebruik (${rank().bugs}).`);
    if (!spend(2)) return; S.bugs[bid] = S.t;
    after(`<h1>Microfoons geplaatst</h1><div class="result">Een ‘loodgieter’ en een ‘schoorsteenveger’ bezoeken ${esc(Bd(bid).name)}. Vanaf de volgende beurt luister je mee.</div>`, { c: -1 });
  },
  home() { if (S.home) return toast("Je bent deze beurt al eens vroeg naar huis gegaan."); if (!spend(1)) return; S.home = true; after(`<h1>Vroeg naar huis</h1><div class="result">${rand(["Je eet met Katrin en Jens aan tafel. Niemand vraagt hoe je dag was.", "Jens laat je zijn huiswerk Russisch zien. Je helpt hem met de naamvallen.", "Katrin zet een plaat op. Jullie dansen in de keuken, heel even."])}</div>`, { fam: 7, c: 1 }); },
};
function recruitChance(p, how) { const c = how === "gunst" ? 0.2 + p.loyal / 180 - p.dis / 250 : 0.32 + (TRAITS[how].lev || 1) * 0.16 + p.fear / 250 - p.dis / 300; return Math.max(0.05, Math.min(0.95, c)); }
function bestLever(p) { return Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker").sort((a, b) => TRAITS[b].lev - TRAITS[a].lev)[0] || "gunst"; }
function evidence(p) { return p.caught || Object.keys(p.known).filter(t => p.known[t].s === "zeker" && TRAITS[t] && (TRAITS[t].dis || 0) >= 10).length >= 2; }

function accuse(p) {
  const c = S.case; if (!c) return;
  const right = p.id === c.culprit;
  S.case = null; p.caught = true; p.pages += 15; addLog(p, `Aangewezen als dader: ${INCIDENTS[c.tmpl].t.toLowerCase()}`);
  if (right) { S.stats.solved++; applyE({ g: 6, res: 1 }); }
  else { S.stats.wrong++; S.wrongs.push({ innocent: p.id, culprit: c.culprit, month: turn().label }); applyE({ g: 4, res: 1 }); }
  save(); refresh();
  const opts = [
    { t: "Arresteren", d: "Hohenschönhausen. Een voorbeeld.", f: () => { p.status = "gevangen"; S.stats.arrests++; addLog(p, "Gearresteerd"); return { c: -8, o: turn().y >= 1988 ? 2 : -4, g: 3 }; } },
    { t: "Werven als IM", d: imCount() >= rank().ims ? "Geen plek in je netwerk." : "Wie betrapt is, tekent snel.", dis: imCount() >= rank().ims, f: () => { makeIM(p); return { c: -6 }; } },
    { t: "Laten lopen", d: "Bang maken en vrijlaten.", f: () => { p.dis = Math.max(0, p.dis - 25); p.fear += 30; return { c: -2, g: -2 }; } },
  ];
  modal(`<div class="stamp">ERMITTELT</div><div class="kicker">Onderzoek afgerond</div><h1>${esc(p.name)}</h1>
   <div class="result">Kessler is tevreden: ‘Goed werk. De dader is gevonden.’ Hij vraagt niet hoe zeker je bent.\n\nWat gebeurt er met ${esc(p.name)}?</div>
   <div class="choices">${opts.map((o, k) => `<button class="ch" data-k="${k}" ${o.dis ? "disabled" : ""}><b>${o.t}</b><span>${esc(o.d)}</span></button>`).join("")}</div>`,
    m => m.querySelectorAll("button.ch").forEach(b => b.onclick = () => { const e = opts[+b.dataset.k].f(); applyE(e); save(); refresh(); closeModal(); if (!checkOver()) flash(`<h1>Zaak gesloten</h1><div class="result">${esc(p.name)}: het dossier krijgt een stempel.</div>` + chips(e)); }), { lock: true });
}

// ---------- maand afsluiten ----------
function endTurn() {
  if (S.queue.length) { toast("Eerst de wachtende zaken afhandelen."); return openEvent(S.queue[0]); }
  const c = S.case;
  if (c) { c.turns--; if (c.turns <= 0) { S.case = null; applyE({ g: -6, o: 4 }); inbox("warn", "Onderzoek onopgelost", `${INCIDENTS[c.tmpl].t}: de dader is nooit gevonden. Kessler noteert het. (Gunst −6)`); } }
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
  const lines = [`Resultaten: ${S.res} van ${q.res} ${okR ? "✓" : "✗"}`, `Actieve IM's: ${ims} van ${q.ims} ${okI ? "✓" : "✗"}`];
  let e = {};
  if (okR && okI) { if (S.rank < RANKS.length - 1) { S.rank++; lines.push(`\nKessler: ‘Uitstekend. Er wordt over u gesproken op de Normannenstraße.’\n\nBevorderd tot ${rank().id}! Meer mankracht (${rank().mk}), ruimte voor ${rank().ims} IM's en ${rank().bugs} afluistersets.${rank().unlock ? ` Nieuw: ${rank().unlock}.` : ""}`); } else lines.push("\nKessler: ‘Ik heb niets op u aan te merken.’ Een premie van 500 mark."); e = { g: 8 }; }
  else if (okR || okI) { lines.push("\nKessler: ‘Voldoende. Maar ik verwacht meer ijver.’ Geen bevordering dit jaar."); }
  else { lines.push("\nKessler sluit de deur. ‘Ik begin me af te vragen aan welke kant u staat, kameraad.’ Er komt een notitie in je personeelsdossier."); e = { g: -12, d: 8 }; }
  if (turn().y === 1987 && S.flags.leak) { lines.push("\nBij het afscheid: ‘Iemand heeft die kerk gewaarschuwd. Ik kom er nog achter wie.’"); e.d = (e.d || 0) + 6; }
  if (turn().y === 1988 && S.flags.cover) { lines.push("\nKessler legt een kopie op tafel. Het rapport over je broer. ‘Het origineel is zoekgeraakt. Vreemd, niet?’"); e.d = (e.d || 0) + 8; e.g = (e.g || 0) - 5; }
  applyE(e); save(); refresh();
  modal(`<div class="stamp">BEURTEILUNG</div><div class="kicker">${esc(turn().label)}</div><h1>Jaarbeoordeling ${turn().y}</h1><div class="result">${esc(lines.join("\n"))}</div>${chips(e)}<button class="next" id="nx">Verder →</button>`,
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
    overgelopen: ["Overgelopen", "In september 1989 sta je met je gezin in een opvangkamp in Passau. Je vertelt de West-Duitse inlichtingendienst alles wat je weet. In Oost-Berlijn word je bij verstek veroordeeld wegens ‘Fahnenflucht’. Twee maanden later valt de muur, en doet het er niet meer toe. Of juist wel."],
    gearresteerd: ["Nu ben jij het dossier", "Om vijf uur 's ochtends wordt er aangebeld. Twee collega's die je kent van de kantine. ‘Kommen Sie bitte mit.’ In Hohenschönhausen stellen ze je dezelfde vragen die jij anderen stelde. Ze weten alles. Natuurlijk weten ze alles."],
    overgeplaatst: ["Bitterfeld", "Kessler laat je overplaatsen naar de bewaking van een chemiekombinaat in Bitterfeld. De lucht stinkt naar zwavel. Je controleert vrachtwagens tot de muur valt, en daarna niemand meer."],
    nee: ["De man die nee zei", "Na 1990 word je getuige bij de commissie die de Stasi onderzoekt. Je weigering van 7 oktober staat zwart op wit in Kesslers notities. Het maakt niet alles goed. Maar het telt."],
    major: ["Genosse Major", "Je hebt het gemaakt: Major, eigen afdeling, eigen chauffeur. Een jaar lang. In 1990 sta je met tweeduizend andere officieren op straat. Je procedeert tot 1999 over je pensioen. Je wint."],
    kantoor: ["Een kleine baan", "Je wordt na de hereniging ontslagen, zoals iedereen van het ministerie. Je werkt jaren als bewaker bij een parkeergarage. Soms herkent iemand je. Meestal knikken ze alleen."],
    werk: ["‘Ik deed mijn werk’", "Je zegt het vaak, na 1990. Op verjaardagen, tegen je kinderen, tegen jezelf. Hoe vaker je het zegt, hoe minder het klinkt als een antwoord."],
    naam: ["Een naam in ieders dossier", "Toen de dossiers opengingen, stond jouw naam in honderden mappen. Mensen die je nooit had ontmoet wisten precies wie je was. Je verhuist naar een stad waar niemand je kent."],
  }[id];
  const files = F.shred ? "Op 15 januari 1990 bestormen burgers het hoofdkwartier aan de Normannenstraße. Ze vinden duizenden zakken versnipperd papier. Een deel ervan wordt tot op de dag van vandaag weer in elkaar gepuzzeld, ook jouw zakken."
    : F.keep ? "Op 15 januari 1990 bestormen burgers het hoofdkwartier. Jouw kast is intact. Dankzij dossiers zoals die van jou kunnen mensen vanaf 1992 lezen wat er met hun leven is gebeurd."
      : F.walk ? "Terwijl jij bij de Bornholmer Straße stond, versnipperden je collega's de halve nacht door. Jouw dossiers lagen er nog toen de burgers in januari 1990 binnenkwamen."
        : "";
  const own = `In 1992 vraag je je eigen dossier op. ${60 + S.dossier * 3} pagina's. Informant: IM „Lerche“: Erich Pohl, je buurman. Elke week: wanneer je thuiskwam, wie er op bezoek kwam, of je dronk.${F.pohl ? " Je had het al vermoed. Het maakt het niet minder koud." : ""} Ook de Stasi vertrouwde de Stasi niet.`;
  const fam = F.alone ? "Katrin is nooit teruggekomen uit Rostock. Jens belt met Kerstmis." : S.gezin >= 60 ? "Katrin en Jens zijn er nog. Jens vraagt in 1996, als hij twintig is, wat je eigenlijk deed. Deze keer vertel je het." : S.gezin >= 30 ? "Katrin blijft. Over de jaren tachtig wordt thuis niet gepraat." : "Katrin vraagt in 1991 de scheiding aan. ‘Ik heb mijn eigen dossier gelezen,’ zegt ze. ‘Jij stond er niet in. Maar je had het kunnen voorkomen.’";
  // lotgevallen
  const lines = [];
  const seen = new Set();
  Object.entries(S.fates).forEach(([pid, txt]) => { const p = P(pid); if (p) { lines.push([p.name, txt]); seen.add(pid); } });
  S.wrongs.forEach(w => { const p = P(w.innocent); if (p && !seen.has(p.id)) { lines.push([p.name, `Werd in ${w.month} aangewezen voor iets wat ${P(w.culprit).name} had gedaan. ${p.status === "gevangen" ? "Zat maanden vast voor niets." : "Begreep jarenlang niet waarom alles misging."}`]); seen.add(p.id); } });
  S.people.filter(p => !seen.has(p.id) && !p.secretIM && (p.pages >= 12 || p.status !== "vrij")).sort((a, b) => b.pages - a.pages).slice(0, 12).forEach(p => {
    const txt = { gevangen: `Zat in Hohenschönhausen en daarna in Bautzen. Werd in 1990 gerehabiliteerd. Dossier: ${p.pages} pagina's.`, zersetzt: `Verloor vrienden, werk en zelfvertrouwen zonder te weten waarom. Begreep het pas in 1992, bij pagina ${Math.max(3, p.pages - 10)} van ${p.pages}.`, im: `Was IM „${p.code}“. Werd na 1992 ontmaskerd door buren die hun eigen dossiers lazen.`, gevlucht: "Vluchtte in 1989 via Hongarije en kwam pas in 1991 terug om de woning op te halen.", uitgereisd: "Mocht uitreizen. Kwam pas na 1990 terug op bezoek.", vrij: `Las in 1992 een dossier van ${p.pages} pagina's over zichzelf.` }[p.status] || "";
    lines.push([p.name, txt]);
  });
  const found = endings();
  const st = S.stats;
  modal(`<div class="stamp">${id === "gearresteerd" ? "VERHAFTET" : "AKTE GEÖFFNET"}</div>
    <div class="kicker">${cause === "gearresteerd" || cause === "overgeplaatst" ? esc(turn().label) : "Epiloog · Stasi-Unterlagen-Gesetz, 1992"}</div>
    <h1>${esc(T[0])}</h1>
    <div class="result">${esc(T[1])}${files ? "\n\n" + esc(files) : ""}\n\n${esc(own)}\n\n${esc(fam)}</div>
    <div class="kicker" style="margin-top:8px">Wat er van hen werd</div>
    ${lines.map(([n, t]) => `<div class="ep-item"><b>${esc(n)}</b><p>${esc(t)}</p></div>`).join("")}
    <div class="ep-item"><b>Jouw staat van dienst</b><p>Rang ${esc(rank().id)} · geweten ${S.geweten} · ${st.recruits} IM's geworven · ${st.arrests} arrestaties · ${st.zersetzung}× Zersetzung · ${st.solved + st.wrong} zaken ‘opgelost’, waarvan ${st.wrong} met de verkeerde dader</p></div>
    <div class="ep-item"><b>Eindes ontdekt: ${found.length} van ${Object.keys(ENDINGS).length}</b><p>${Object.entries(ENDINGS).map(([k, v]) => found.includes(k) ? `✓ ${esc(v)}` : "? ???").join(" · ")}</p></div>
    <p class="note"><i>De Stasi had in 1989 zo'n 91.000 vaste medewerkers en bijna 190.000 informanten. Sinds 1992 hebben meer dan drie miljoen mensen gevraagd hun dossier in te zien.</i></p>
    <button class="next" id="nx">Opnieuw spelen</button>`,
    m => m.querySelector("#nx").onclick = () => { closeModal(); showTitle(); }, { lock: true, wide: true });
}

// ===================== UI =====================
function bar(lbl, v, cls) { const seg = Math.round(v / 10); return `<div class="stat ${cls || ""}"><div class="sl"><span>${lbl}</span><b>${String(v).padStart(3, "0")}</b></div><div class="bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? "on" : ""}"></i>`).join("")}</div></div>`; }
function refresh() {
  if (!S) return;
  const T = turn();
  $("#hud").innerHTML = `<div class="hrow"><span class="date">${esc(T.label)}</span><span class="rk">${esc(rank().id)}</span><button class="help" id="helpBtn" aria-label="Uitleg">?</button></div>
   <div class="stats">${bar("Gunst", S.gunst, "sg")}${bar("Geweten", S.geweten, "sc")}${bar("Verdenking", S.dossier, "sd")}</div>
   <div class="mk"><span class="mkl">MK</span>${"<i class=on></i>".repeat(S.mk)}${"<i></i>".repeat(Math.max(0, rank().mk - S.mk))}<span class="goal">Plan ${T.y}: <b>${S.res}/${S.quota.res}</b> erg. · <b>${imCount()}/${S.quota.ims}</b> IM</span></div>`;
  $("#helpBtn").onclick = showHelp;
  $("#hud .stats").onclick = explainMeters; $("#hud .mk").onclick = explainMeters;
  const unread = S.inbox.filter(i => !i.read).length;
  const pend = via => S.queue.filter(q => ev(q).via === via).length;
  const phone = pend("telefoon");
  world.setRinging(phone > 0);
  world.setOffice({ folders: unread + pend("dossier"), caseOpen: !!S.case, date: T.label.split(" ").slice(0, -1).join(" ").replace(/^\d+ /, m => m), month: String(T.y), badges: { telefoon: phone ? "!" : "", dossiers: (unread + pend("dossier")) || "", gezin: pend("gezin") ? "!" : "", onderzoek: S.case ? `${S.case.turns} mnd` : "", typemachine: "" } });
  const ims = {}; S.people.filter(p => p.status === "im").forEach(p => ims[p.home] = (ims[p.home] || 0) + 1);
  const info = {}; BUILDINGS.forEach(b => { let t = ""; if (S.bugs[b.id]) t += " "; if (ims[b.id]) t += ` <b style="background:#2f5a8a">IM ${ims[b.id]}</b>`; if (S.case && S.case.shown.includes("place") && S.case.home === b.id) t += " <b>!</b>"; info[b.id] = t; });
  world.setDistrict({ info, bugs: S.bugs, ims, winter: !!T.winter, finale: T.key === "1989-nov" });
  $("#navEnd").innerHTML = `Afsluiten<small>naar ${esc((TURNS[S.t + 1] || T).label)}</small>`;
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
  const st = { im: `<span class="tag blue">IM „${esc(p.code)}“</span>`, gevangen: '<span class="tag grey">gevangen</span>', zersetzt: '<span class="tag red">zersetzt</span>', gevlucht: '<span class="tag grey">gevlucht</span>', uitgereisd: '<span class="tag grey">uitgereisd</span>' }[p.status] || "";
  const nk = Object.keys(p.known).length;
  return `<button class="row" data-pid="${p.id}"><span class="rn"><b>${esc(p.name)}</b> ${st}${S.taps[p.id] ? ' <span class="tag red">getapt</span>' : ""}<small>${esc(p.job)} · ${p.age} jaar</small></span><span class="rp">${extra}<span>${p.pages}<small> pag.</small></span>${nk ? `<small>${nk} kenmerk${nk > 1 ? "en" : ""}</small>` : ""}</span></button>`;
}
function bindRows(el) { el.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => sheet(e => personView(e, P(b.dataset.pid)))); }

function hostility(p) {
  const ks = Object.keys(p.known).filter(t => TRAITS[t]); if (!ks.length) return "onbekend";
  const s = ks.reduce((a, t) => a + (TRAITS[t].dis || 0), 0);
  return s >= 35 ? "hoog" : s >= 15 ? "gemiddeld" : s > 0 ? "laag" : "geen aanwijzingen";
}
function personView(el, p) {
  tutDone(3);
  const b = Bd(p.home); const work = p.work ? WORKPLACES[p.work].name : "—";
  const known = Object.entries(p.known).map(([t, k]) => `<li>${esc(trLabel(t))} <span class="tag ${k.s === "zeker" ? "green" : "amber"}">${k.s === "zeker" ? "bevestigd" : `IM „${esc((P(k.im) || {}).code || "?")}“, onbevestigd`}</span></li>`).join("") || "<li class='muted'>Nog niets. Observeer, luister af of zet een informant in.</li>";
  const r = rank(); const info = [], hard = [];
  const can = free(p) || p.status === "im";
  const btn = (arr, k, l, cost, dis, why) => arr.push(`<button class="act" data-a="${k}" ${dis ? "disabled" : ""}><b>${l} <em>${cost ? cost + " MK" : "gratis"}</em></b><span>${why}</span></button>`);
  if (can) {
    btn(info, "observe", "Observeren", 1, S.mk < 1, "Ontdek wat iemand verbergt. Controleert ook wat informanten beweren.");
  }
  if (free(p) && p.status === "vrij") {
    btn(hard, "warn", "Waarschuwen", 1, S.mk < 1, "Bang maken. Wordt minder opstandig. Licht.");
    btn(hard, "arrest", "Arresteren", 2, S.mk < 2 || !evidence(p), evidence(p) ? "Telt als resultaat. Zwaarste ingreep." : `Kan pas met 2 bevestigde verdachte kenmerken (nu ${susCount(p)}).`);
  }
  const levs = Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev);
  const recruitable = p.status === "vrij" && !p.family && !p.secretIM;
  let caseBox = "";
  if (S.case && free(p)) {
    const c = S.case; const tw = twOf(p); const twKnown = tw && p.known[tw] && p.known[tw].s === "zeker";
    const m = k => k === "tw" ? (twKnown ? (tw === c.tw ? "✓" : "✗") : "?") : k === "paper" ? (p.work === c.work ? "✓" : "✗") : (p.home === c.home ? "✓" : "✗");
    caseBox = `<div class="box red"><div class="kicker">Lopend onderzoek: ${esc(INCIDENTS[c.tmpl].t)}</div>${c.shown.map(k => `<div class="clue">${m(k)} ${esc(clueText(c, k))}</div>`).join("")}${c.geur[p.id] !== undefined ? `<div class="clue">${c.geur[p.id] ? "✓ Geurmonster: de hond sloeg aan" : "✗ Geurmonster: geen reactie"}</div>` : ""}
     <div class="acts"><button class="act danger" data-a="accuse"><b>Aanwijzen als dader</b><span>sluit het onderzoek</span></button></div></div>`;
  }
  let imBox = "";
  if (p.status === "im") {
    const rel = p.known.dubbel ? "Dubbelspel ontdekt" : p.lies ? `Laag: ${p.lies} leugen${p.lies > 1 ? "s" : ""} ontdekt` : "Onbekend (controleer rapporten door te observeren)";
    const targets = S.people.filter(q => q !== p && free(q) && (q.home === p.home || (q.work && q.work === p.work)));
    imBox = `<div class="box blue"><div class="kicker">Informant „${esc(p.code)}“</div><div class="clue">Betrouwbaarheid: ${esc(rel)}</div>${p.assign ? `<div class="clue">Opdracht: ${esc(P(p.assign).name)}</div>` : ""}
      <label class="sel">Opdracht geven (1 MK): <select id="assignSel"><option value="">— kies een buur of collega —</option>${targets.map(q => `<option value="${q.id}">${esc(q.name)}</option>`).join("")}</select></label>
      <div class="acts"><button class="act" data-a="drop"><b>Afstoten</b><span>0 MK</span></button></div></div>`;
  }
  el.innerHTML = `<div class="ph"><div><div class="kicker">Akte ${4000 + S.people.indexOf(p) * 37}/85 · ${p.pages} pagina's</div><h2>${esc(p.name)}</h2><div class="who">${esc(p.job)}, ${p.age} jaar</div></div><div class="stampS">${p.status === "vrij" ? "" : esc(p.status.toUpperCase())}</div></div>
   <div class="grid2"><div><small>Woont</small><a data-b="${b.id}">${esc(b.name)}</a></div><div><small>Werkt</small>${p.work && Bd(p.work) ? `<a data-b="${p.work}">${esc(work)}</a>` : esc(work)}</div><div><small>Hoe opstandig?</small>${hostility(p)}</div><div><small>Status</small>${esc(p.status)}</div></div>
   ${p.secretIM ? `<div class="box"><div class="clue">Kaart ‘gesperrt’: inzage alleen voor de Hauptabteilung. Deze persoon is niet beschikbaar voor maatregelen.</div></div>` : ""}
   <div class="advice">${personAdvice(p)}</div>
   ${caseBox}${imBox}
   <div class="kicker">Wat je weet</div><ul class="traits">${known}</ul>
   ${p.secretIM ? "" : `${info.length ? `<div class="kicker">Informatie verzamelen</div><div class="acts">${info.join("")}</div>` : ""}${hard.length ? `<div class="kicker">Ingrijpen</div><div class="acts">${hard.join("")}</div>` : ""}`}
   ${recruitable ? (() => { const how = bestLever(p); const pct = Math.round(recruitChance(p, how) * 100); return `<div class="kicker">Informant maken <small class="muted">· ${imCount()}/${r.ims}</small></div><div class="acts one"><button class="act" data-a="recruit" data-h="${how}" ${S.mk < 1 || imCount() >= r.ims ? "disabled" : ""}><b>Werven als IM <em>1 MK · ${pct}% kans</em></b><span>${how !== "gunst" ? `Chanteren met: ${esc(trLabel(how).toLowerCase())}.` : "Zonder chantagemateriaal is de kans klein. Observeer eerst."} Een IM verklikt elke beurt vanzelf een buur.</span></button></div>`; })() : ""}
   ${p.log.length ? `<div class="kicker">Aantekeningen</div><ul class="log">${p.log.slice(-8).reverse().map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}`;
  el.querySelectorAll("[data-b]").forEach(a => a.onclick = () => openBuilding(a.dataset.b));
  el.querySelectorAll("button.act").forEach(bt => bt.onclick = () => {
    const a = bt.dataset.a;
    if (a === "accuse") return modal(`<h1>${esc(p.name)} aanwijzen?</h1><div class="result">Je kunt dit niet terugdraaien. Als je je vergist, loopt de echte dader vrij rond.</div><div class="choices"><button class="ch" id="y"><b>Ja, ${pron(p)} is het</b></button><button class="ch" id="n"><b>Nog niet</b></button></div>`, m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); accuse(p); }; m.querySelector("#n").onclick = closeModal; });
    if (a === "recruit") return ACT.recruit(p, bt.dataset.h);
    if (a === "drop") return ACT.drop(p);
    ACT[a](p);
  });
  const sel = el.querySelector("#assignSel"); if (sel) sel.onchange = () => { if (sel.value) ACT.assign(p, P(sel.value)); };
}

function openBuilding(id) { world.select(id); sheet(el => buildingView(el, id)); tutDone(2); }
function buildingView(el, id) {
  const b = Bd(id);
  if (id === "mfs") { el.innerHTML = `<h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p><button class="next" id="go">Naar je kantoor</button>`; el.querySelector("#go").onclick = () => { closeSheet(); setMode("office"); }; return; }
  const res = S.people.filter(p => p.home === id), wrk = S.people.filter(p => p.work === id);
  const r = rank();
  el.innerHTML = `<div class="kicker">${b.res ? "Woongebouw" : "Werkplek"}</div><h2>${esc(b.name)}</h2><p class="who">${esc(b.desc)}</p>
    <div class="acts"><button class="act ${S.bugs[id] ? "danger" : ""}" id="bugBtn" ${!S.bugs[id] && (S.mk < 2 || pool() >= r.bugs) ? "disabled" : ""}><b>${S.bugs[id] ? "Microfoons weghalen" : "Microfoons plaatsen"}</b><span>${S.bugs[id] ? "geeft apparatuur vrij" : `2 MK · elke beurt afgeluisterde gesprekken · ${pool()}/${r.bugs} in gebruik`}</span></button></div>
    ${res.length ? `<div class="kicker">Bewoners</div>${res.map(p => personRow(p)).join("")}` : ""}
    ${wrk.length ? `<div class="kicker">Werkt hier</div>${wrk.map(p => personRow(p)).join("")}` : ""}`;
  el.querySelector("#bugBtn").onclick = () => ACT.bug(id);
  bindRows(el);
}

function cartotheek(el) {
  const f = cartotheek.f || (cartotheek.f = { q: "", b: "", s: "" });
  if (f.s === "case" && !S.case) f.s = "";
  el.innerHTML = `<div class="kicker">Kartotheek F16 · ${S.people.length} personen</div><h2>Kartotheek</h2>
   <div class="filters"><input id="fq" placeholder="Zoek naam of beroep" value="${esc(f.q)}"><select id="fb"><option value="">Alle gebouwen</option>${BUILDINGS.filter(b => b.id !== "mfs").map(b => `<option value="${b.id}" ${f.b === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select>
   <select id="fs"><option value="">Iedereen</option>${S.case ? `<option value="case" ${f.s === "case" ? "selected" : ""}>Past bij onderzoek</option>` : ""}<option value="im" ${f.s === "im" ? "selected" : ""}>IM's</option><option value="vrij" ${f.s === "vrij" ? "selected" : ""}>Vrij</option><option value="gevangen" ${f.s === "gevangen" ? "selected" : ""}>Gevangen</option><option value="zersetzt" ${f.s === "zersetzt" ? "selected" : ""}>Zersetzt</option></select></div>
   <div id="rows"></div>`;
  const rows = el.querySelector("#rows");
  const draw = () => {
    f.q = el.querySelector("#fq").value; f.b = el.querySelector("#fb").value; f.s = el.querySelector("#fs").value;
    const list = S.people.filter(p => !f.b || p.home === f.b || p.work === f.b).filter(p => !f.s || (f.s === "case" ? S.case && free(p) && matchesShown(p, S.case) : p.status === f.s)).filter(p => !f.q || p.name.toLowerCase().includes(f.q.toLowerCase()) || p.job.toLowerCase().includes(f.q.toLowerCase()));
    list.sort((a, b) => b.pages - a.pages || a.name.localeCompare(b.name));
    rows.innerHTML = list.map(p => personRow(p)).join("") || "<p class='muted'>Niemand gevonden.</p>";
    bindRows(rows);
  };
  el.querySelector("#fq").oninput = draw; el.querySelector("#fb").onchange = draw; el.querySelector("#fs").onchange = draw;
  draw();
}

function inboxView(el) {
  const pend = S.queue.filter(q => ev(q).via === "dossier");
  el.innerHTML = `<div class="kicker">Postvak in</div><h2>Dossiers</h2>
   ${pend.map((q, i) => `<button class="row hot" data-q="${i}"><span class="rn"><b>Opdracht: ${esc(ev(q).title)}</b><small>Wacht op jouw beslissing</small></span><span class="rp">!</span></button>`).join("")}
   ${S.case ? `<button class="row red" id="caseRow"><span class="rn"><b>Onderzoek: ${esc(INCIDENTS[S.case.tmpl].t)}</b><small>Nog ${S.case.turns} beurt(en) om de dader te vinden</small></span><span class="rp">→</span></button>` : ""}
   ${S.inbox.map(i => `<div class="msg ${i.read ? "" : "unread"} k-${i.k}" data-i="${i.id}"><div class="mh"><b>${esc(i.title)}</b><small>${esc(TURNS[i.t].label)}</small></div><div class="mt">${esc(i.text)}</div>${i.pid ? `<button class="lnk" data-pid="${i.pid}">Open dossier ${esc(P(i.pid).name)} →</button>` : ""}</div>`).join("") || (pend.length || S.case ? "" : "<p class='muted'>Geen nieuwe dossiers. Zet IM's of microfoons in om informatie binnen te krijgen.</p>")}`;
  S.inbox.forEach(i => i.read = true);
  el.querySelectorAll("[data-q]").forEach(b => b.onclick = () => openEvent(pend[+b.dataset.q]));
  const cr = el.querySelector("#caseRow"); if (cr) cr.onclick = () => sheet(caseView);
  bindRows(el); save(); setTimeout(refresh, 50);
}

function caseView(el) {
  const c = S.case; if (!c) { el.innerHTML = "<h2>Geen lopend onderzoek</h2>"; return; }
  const sus = S.people.filter(p => free(p) && matchesShown(p, c));
  const mark = (p, k) => { if (k === "tw") { const tw = twOf(p); const tk = tw && p.known[tw] && p.known[tw].s === "zeker"; const noneKnown = !tw && p.twChecked; return tk ? (tw === c.tw ? ["ok", "✓ zelfde machine"] : ["no", "✗ andere machine"]) : noneKnown ? ["no", "✗ geen machine gevonden"] : ["", "? machine onbekend"]; } if (k === "paper") return p.work === c.work ? ["ok", "✓ werkplek klopt"] : ["no", "✗ werkplek"]; return p.home === c.home ? ["ok", "✓ woont daar"] : ["no", "✗ woont elders"]; };
  const steps = c.shown.includes("tw") ? `<ol class="howto"><li>De lijst hieronder toont alleen mensen bij wie ${c.shown.includes("paper") ? "de <b>werkplek</b>" : "het <b>adres</b>"} klopt.</li><li>Nu moet je weten <b>wie de juiste typemachine heeft</b>. Tik op <b>Observeer</b> bij een verdachte (1 mankracht). Microfoons in het gebouw helpen ook.</li><li>Zie je <b>✓ zelfde machine</b>? Tik op <b>Dader!</b></li></ol>` : `<ol class="howto"><li>Werkplek en adres samen wijzen meestal naar één persoon. Die staat hieronder.</li><li>Tik op <b>Dader!</b> om het onderzoek af te sluiten.</li></ol>`;
  el.innerHTML = `<div class="stampS">ERMITTLUNG</div><div class="kicker">Onderzoek nr. ${c.n} · nog ${c.turns} beurt${c.turns > 1 ? "en" : ""}</div><h2>${esc(INCIDENTS[c.tmpl].t)}</h2>
   <div class="report">${esc(INCIDENTS[c.tmpl].d + (c.note || ""))}</div>
   <div class="kicker">Aanwijzingen</div>${c.shown.map(k => `<div class="clue">• ${esc(clueText(c, k))}</div>`).join("")}
   <div class="kicker">Hoe los je dit op?</div>${steps}
   <div class="kicker">Verdachten (${sus.length})</div>
   ${sus.map(p => `<div class="sus"><div class="sn"><a data-pid="${p.id}"><b>${esc(p.name)}</b></a><small>${esc(p.job)}</small><div class="marks">${c.shown.map(k => { const [cl, t] = mark(p, k); return `<span class="${cl}">${t}</span>`; }).join("")}${c.geur[p.id] !== undefined ? `<span class="${c.geur[p.id] ? "ok" : "no"}">${c.geur[p.id] ? "✓ hond slaat aan" : "✗ hond reageert niet"}</span>` : ""}</div></div>
     <div class="sb">${c.shown.includes("tw") ? `<button class="mini" data-obs="${p.id}" ${S.mk < 1 ? "disabled" : ""}>Observeer<small>1 MK</small></button>` : ""}<button class="mini red" data-acc="${p.id}">Dader!</button></div></div>`).join("") || "<p class='muted'>Niemand past. Misschien werkt of woont de dader buiten wat je dacht.</p>"}
   <p class="muted small">Kies je de verkeerde persoon, dan merkt Kessler het niet. Maar de echte dader slaat later opnieuw toe.</p>`;
  el.querySelectorAll("[data-obs]").forEach(b => b.onclick = () => ACT.observe(P(b.dataset.obs)));
  el.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => { const p = P(b.dataset.acc); modal(`<h1>${esc(p.name)} aanwijzen?</h1><div class="result">Dit kun je niet terugdraaien. Als je je vergist, loopt de echte dader vrij rond.</div><div class="choices"><button class="ch" id="y"><b>Ja, ${pron(p)} is het</b></button><button class="ch" id="n"><b>Nog niet</b></button></div>`, m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); accuse(p); }; m.querySelector("#n").onclick = closeModal; }); });
  el.querySelectorAll("a[data-pid]").forEach(a => a.onclick = () => sheet(e => personView(e, P(a.dataset.pid))));
}

function familyView(el) {
  const pend = S.queue.filter(q => ev(q).via === "gezin");
  const g = S.gezin;
  const k = S.flags.alone ? "Katrin en Jens wonen in Rostock. De flat is stil." : g >= 70 ? "Katrin lacht weer om je flauwe grappen. Jens wil later ‘iets met computers’." : g >= 45 ? "Thuis is het rustig. Misschien te rustig." : g >= 25 ? "Katrin vraagt niet meer hoe laat je thuiskomt. Jens zit op zijn kamer." : "Katrin slaapt op de bank. Of jij. Het maakt niet meer uit wie.";
  el.innerHTML = `<div class="kicker">Gezin</div><h2>Katrin & Jens</h2><div class="statline">${bar("Gezin", g, "sf")}</div><p class="who">${esc(k)}</p>
   ${pend.map((q, i) => `<button class="row hot" data-q="${i}"><span class="rn"><b>${esc(ev(q).title)}</b><small>${esc(ev(q).who || "")}</small></span><span class="rp">!</span></button>`).join("")}
   <div class="acts"><button class="act" id="home" ${S.home || S.mk < 1 ? "disabled" : ""}><b>Vroeg naar huis</b><span>1 MK · gezin +7${S.home ? " · al gedaan" : ""}</span></button></div>
   <p class="muted small">Een laag gezinsniveau heeft gevolgen. Ook voor hoe je verhaal afloopt.</p>`;
  el.querySelectorAll("[data-q]").forEach(b => b.onclick = () => openEvent(pend[+b.dataset.q]));
  el.querySelector("#home").onclick = () => ACT.home();
}

function calendarView(el) {
  const q = S.quota, r = rank(), nr = RANKS[S.rank + 1];
  el.innerHTML = `<div class="kicker">Jaardoelen ${turn().y}</div><h2>Kesslers verwachtingen</h2>
   <div class="grid2"><div><small>Resultaten</small>${S.res} / ${q.res}</div><div><small>Actieve IM's</small>${imCount()} / ${q.ims}</div><div><small>Rang</small>${esc(r.id)}</div><div><small>Volgende rang</small>${nr ? `${esc(nr.id)}${nr.unlock ? " (" + esc(nr.unlock) + ")" : ""}` : "—"}</div></div>
   <p class="who">Resultaten krijg je door onderzoeken op te lossen, vijanden van de staat te arresteren of te ‘zersetzen’, en via sommige beslissingen. In november volgt de jaarbeoordeling. Beide doelen gehaald: bevordering.</p>
   <div class="kicker">Per rang</div><ul class="traits">${RANKS.map((x, i) => `<li class="${i === S.rank ? "" : "muted"}">${x.id}: ${x.mk} mankracht, ${x.ims} IM's, ${x.bugs} microfoonsets</li>`).join("")}</ul>
   <div class="kicker">Rivaal</div><p class="who">${S.t >= 12 ? `Oberleutnant Fuchs: ${S.fuchs >= 50 ? "openlijk vijandig" : S.fuchs >= 25 ? "op zijn hoede" : "beleefd"}.` : "Nog geen."}</p>`;
}

function phoneTap() {
  const q = S.queue.find(q => ev(q).via === "telefoon");
  if (q) return openEvent(q);
  const lines = [["Kessler", "‘Ik hoop dat u iets te melden heeft bij de jaarbeoordeling.’"], ["Centrale", "‘Verkeerd verbonden.’ Klik. Toch even ruis op de lijn."], ["Katrin", "‘Kom je op tijd thuis vandaag? Jens heeft een voetbalwedstrijd.’"]];
  const [w, t] = rand(lines); toast(`<b>${w}:</b> ${t}`);
}

function showHelp() {
  modal(`<h1>Hulp</h1><div class="result"><b>Kantoor</b>: tik op voorwerpen. Telefoon = opdrachten, map = rapporten, rode map = onderzoek, kast = alle personen, foto = gezin, kaart = wijk.
<b>Wijk</b>: sleep om te kijken, tik op een gebouw.
<b>Observeren</b> (1 ): ontdek kenmerken van iemand.
<b>Werven</b> (1 ): maak iemand informant (IM). Die verklikt elke beurt een buur. Met chantagemateriaal lukt het vaker. IM's liegen soms.
<b>Arresteren</b> (2 ): kan met 2 bevestigde verdachte kenmerken.
<b>Microfoons</b> (2 ): elke beurt afgeluisterde gesprekken uit een gebouw.
<b>Onderzoek</b>: vergelijk typemachine, papier en adres. Wijs de dader aan.</div>
<button class="next" id="nx">Oké</button><button class="next ghost" id="ri">Uitleg opnieuw</button>`, m => { m.querySelector("#nx").onclick = closeModal; m.querySelector("#ri").onclick = showIntro; });
}

function setMode(m) {
  world.setMode(m); document.body.dataset.mode = m; if (m === "district") tutDone(1);
  $("#navOffice").classList.toggle("on", m === "office"); $("#navWijk").classList.toggle("on", m === "district");
  if (m === "district" && S && !S.flags._wijkHint) { S.flags._wijkHint = true; toast("Sleep om rond te kijken. Tik op een gebouw om te zien wie er woont of werkt."); }
  updateCoach();
}

function showTitle() {
  const sv = load(); const f = endings();
  $("#title").classList.add("open");
  $("#title").innerHTML = `<div class="tcard"><div class="kicker">Ost-Berlin · 1985–1989</div>
   <h1 class="logo">AKTE<span>.</span></h1><div class="sub">Een Stasi-simulator</div>
   <p>Bespioneer je wijk. Werf informanten. Beslis over levens. Tot de Muur valt.</p>
   <button class="next" id="ng">Nieuw spel</button>${sv && !sv.over && TURNS[sv.t] ? `<button class="next ghost" id="cont">Doorgaan · ${esc(TURNS[sv.t].label)}</button>` : ""}
   <p class="muted small">Eindes ontdekt: ${f.length}/${Object.keys(ENDINGS).length} · fictieve personen, echte geschiedenis</p></div>`;
  $("#ng").onclick = () => { $("#title").classList.remove("open"); newGame(); setMode("office"); showIntro(); };
  const c = $("#cont"); if (c) c.onclick = () => { S = sv; $("#title").classList.remove("open"); if (S.tut === undefined) S.tut = 99; setMode("office"); refresh(); toast(`<b>${esc(turn().label)}</b> · ${S.mk} mankracht`); };
}


// ===================== UITLEG & BEGELEIDING =====================
const TUT = [
  { t: "De telefoon gaat. Tik op de <b>telefoon</b> op je bureau om op te nemen.", target: '#labels [data-id="o:telefoon"]', go: () => { setMode("office"); phoneTap(); } },
  { t: "Bekijk je wijk: tik onderaan op <b>Wijk</b>.", target: "#navWijk", go: () => { closeSheet(); setMode("district"); } },
  { t: "Tik op het gebouw <b>Kollwitz 12</b>. Daar woon jij, met je buren.", target: '#labels [data-id="b:kollwitz"]', go: () => { setMode("district"); openBuilding("kollwitz"); } },
  { t: "Je ziet wie er woont. Tik op <b>Jutta Lang</b> om haar dossier te openen.", target: '#sheetBody [data-pid="jutta"]', go: () => { openBuilding("kollwitz"); sheet(e => personView(e, P("jutta"))); } },
  { t: "Je weet nog niets over haar. Tik op <b>Observeren</b>. Dat kost 1 mankracht (een geel blokje).", target: '#sheetBody [data-a="observe"]', go: () => sheet(e => personView(e, P("jutta"))) },
  { t: "Zo verzamel je informatie. Gebruik je laatste mankracht: <b>observeer nog iemand</b> uit je flat. Tik hier als je klaar bent.", target: null, go: () => tutDone(5) },
  { t: "Tik op <b>Afsluiten</b> (rechtsonder) of hier. In de volgende beurt ontvang je nieuwe rapporten.", target: "#navEnd", go: () => confirmEnd() },
];
function tutDone(n) { if (!S || S.tut !== n) return; S.tut++; if (S.tut === 5 && S.mk <= 0) S.tut = 6; save(); updateCoach(); }

function nextStep() {
  if (!S || S.over) return null;
  if (S.tut !== undefined && S.tut < TUT.length) {
    if (S.tut === 5 && S.mk <= 0) S.tut = 6;
    const st = TUT[S.tut]; return { text: `<span class="step">Stap ${S.tut + 1}/${TUT.length}</span> ${st.t}`, go: st.go, target: st.target, tut: true };
  }
  const pend = via => S.queue.find(q => ev(q).via === via);
  let q;
  if ((q = pend("telefoon"))) return { text: "<b>De telefoon gaat.</b> Tik hier om op te nemen.", go: () => openEvent(q), target: '#labels [data-id="o:telefoon"]' };
  if ((q = pend("dossier"))) return { text: `<b>Opdracht:</b> ${esc(ev(q).title)}. Tik om te beslissen.`, go: () => openEvent(q) };
  if ((q = pend("gezin"))) return { text: `<b>Thuis:</b> ${esc(ev(q).title)}. Tik om het te bekijken.`, go: () => openEvent(q) };
  const unread = S.inbox.filter(i => !i.read).length;
  if (unread) return { text: `<b>${unread} nieuwe rapport${unread > 1 ? "en" : ""}.</b> Tik om te lezen wat je te weten kwam.`, go: () => { setMode("office"); sheet(inboxView); } };
  if (S.case && S.mk > 0) return { text: `<b>Onderzoek:</b> vind de dader (nog ${S.case.turns} beurt${S.case.turns > 1 ? "en" : ""}). Tik voor de verdachten.`, go: () => sheet(caseView) };
  if (S.mk > 0) {
    const lev = S.people.find(p => p.status === "vrij" && !p.family && !p.secretIM && Object.keys(p.known).some(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker"));
    if (lev && imCount() < Math.min(rank().ims, S.quota.ims)) return { text: `<b>${esc(lev.name)}</b> is te chanteren. Werf ${pron(lev)} als informant (je hebt er ${imCount()}/${S.quota.ims} nodig).`, go: () => sheet(e => personView(e, lev)) };
    const arr = S.people.find(p => p.status === "vrij" && !p.family && evidence(p) && p.dis >= 30);
    if (arr && S.mk >= 2 && S.res < S.quota.res) return { text: `Je hebt genoeg bewijs tegen <b>${esc(arr.name)}</b>. Arresteren levert een resultaat op. Of laat je het?`, go: () => sheet(e => personView(e, arr)) };
    if (pool() < rank().bugs && S.mk >= 2) return { text: `Plaats <b>microfoons</b> in een gebouw (2 mankracht): elke beurt hoor je dan gesprekken.`, go: () => setMode("district") };
    return { text: `Nog <b>${S.mk} mankracht</b>. Ga naar de wijk en observeer iemand die je nog niet kent.`, go: () => setMode("district") };
  }
  return { text: "<b>Alles gedaan.</b> Tik hier om de beurt af te sluiten.", go: () => confirmEnd(), target: "#navEnd" };
}
let coachStep = null;
function updateCoach() {
  const el = $("#coach"); if (!el) return;
  coachStep = nextStep();
  if (!coachStep || $("#title").classList.contains("open")) { el.className = ""; return; }
  el.className = "show" + (coachStep.tut ? " tut" : "");
  el.innerHTML = `<div class="ct">${coachStep.text}</div>${coachStep.tut ? `<button class="skip" id="tutSkip">Uitleg overslaan</button>` : '<span class="arr">›</span>'}`;
  const sk = el.querySelector("#tutSkip"); if (sk) sk.onclick = ev2 => { ev2.stopPropagation(); S.tut = 99; save(); updateCoach(); };
}
setInterval(() => {
  document.querySelectorAll(".coachT").forEach(e => e.classList.remove("coachT"));
  if (coachStep && coachStep.target && !$("#modal").classList.contains("open")) { const t = document.querySelector(coachStep.target); if (t) t.classList.add("coachT"); }
}, 300);

function showIntro() {
  const pages = [
    ["Jij bent de Stasi", "", "Oost-Berlijn, 1985. Jij houdt één wijk in de gaten voor de geheime dienst van de DDR.\n\nJe baas <b>Kessler</b> wil resultaten. Jouw keuzes bepalen wat er met de mensen gebeurt."],
    ["Zo speel je", "", "<b>1.</b> Beslis wat er gebeurt als de telefoon gaat.\n<b>2.</b> Gebruik je <b>mankracht</b> in de wijk: mensen <b>observeren</b>, <b>informanten werven</b>, <b>arresteren</b>.\n<b>3.</b> Tik op <b>Afsluiten</b>. Op naar de volgende beurt.\n\nOnderaan staat altijd wat je nu kunt doen."],
    ["Pas op", "", "<b>Gunst</b> op 0: je wordt ontslagen.\n<b>Verdenking</b> op 100: je wordt zelf opgepakt.\nJe <b>geweten</b> bepaalt hoe jouw verhaal afloopt.\n\n15 beurten tot de val van de Muur. 8 eindes."],
  ];
  let i = 0;
  const draw = () => {
    const [h, ic, txt] = pages[i];
    modal(`<div class="kicker">Einweisung ${i + 1}/${pages.length}</div><h1>${h}</h1><div class="result">${txt}</div>
      <div class="dots">${pages.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <button class="next" id="nx">${i < pages.length - 1 ? "Verder" : "Spelen"}</button>${i === 0 ? '<button class="next ghost" id="sk">Overslaan</button>' : ""}`, m => {
      m.querySelector("#nx").onclick = () => { if (i < pages.length - 1) { i++; draw(); } else { closeModal(); updateCoach(); } };
      const sk = m.querySelector("#sk"); if (sk) sk.onclick = () => { S.tut = 99; closeModal(); updateCoach(); };
    }, { lock: true });
  };
  draw();
}

function explainMeters() {
  modal(`<h1>De meters</h1><div class="result"><b class="cg">Gunst</b>: hoe tevreden Kessler is. Op 0 ben je ontslagen.
<b class="cc">Geweten</b>: daalt als je mensen schade doet. Bepaalt je einde.
<b class="cd">Verdenking</b>: hoe verdacht jij zelf bent. Op 100 word je opgepakt.
<b class="cm">Mankracht</b> : acties per beurt. Wat je niet gebruikt, vervalt.
<b>Jaardoel</b>: wat Kessler in de herfst wil zien. Haal het en je krijgt promotie.</div><button class="next" id="nx">Oké</button>`, m => m.querySelector("#nx").onclick = closeModal);
}

function susCount(p) { return Object.keys(p.known).filter(t => p.known[t].s === "zeker" && TRAITS[t] && (TRAITS[t].dis || 0) >= 10).length; }
function personAdvice(p) {
  if (p.secretIM) return "Deze kaart is geblokkeerd. Iemand boven jou beschermt deze persoon.";
  if (p.status === "im") return p.known.dubbel ? "Deze informant speelt dubbelspel. Afstoten is verstandig." : p.lies ? "Deze informant heeft gelogen. Wantrouw de rapporten, of stoot hem af." : `Informant. Rapporteert elke beurt over een buur of collega. Je kunt een specifieke opdracht geven.`;
  if (!free(p)) return "Deze persoon is buiten jouw bereik.";
  const levs = Object.keys(p.known).filter(t => TRAITS[t] && TRAITS[t].lev && p.known[t].s === "zeker");
  const unconf = Object.keys(p.known).filter(t => p.known[t].s === "IM").length;
  const known = Object.keys(p.known).length;
  const out = [];
  if (!known) out.push("Je weet nog niets. <b>Observeer</b> om erachter te komen wat er speelt.");
  if (unconf) out.push(`Er ${unconf > 1 ? "zijn" : "is"} ${unconf} onbevestigd${unconf > 1 ? "e" : ""} kenmerk${unconf > 1 ? "en" : ""} (van een informant). <b>Observeer</b> om te controleren of het klopt.`);
  if (levs.length && p.status === "vrij" && !p.family) out.push(`Je hebt <b>chantagemateriaal</b> (${esc(trLabel(levs[0]).toLowerCase())}). Werven als informant heeft een goede kans.`);
  if (evidence(p)) out.push("Je hebt <b>genoeg bewijs</b> om te arresteren.");
  else if (susCount(p) === 1) out.push("Nog één bevestigd verdacht kenmerk nodig voor een arrestatie.");
  if (known && !out.length) out.push("Lijkt een gewone burger. Je kunt verder kijken, of je mankracht elders gebruiken.");
  return out.join(" ");
}

// ===================== START =====================
function boot() {
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
  });
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
  if (S.queue.length) { toast("Eerst de wachtende zaken afhandelen."); return openEvent(S.queue[0]); }
  modal(`<h1>Beurt afsluiten?</h1><div class="result">${S.mk ? `Je hebt nog <b>${S.mk} mankracht</b> over. Die vervalt.\n\nDe volgende beurt is <b>${esc((TURNS[S.t + 1] || turn()).label)}</b>.` : "Alle mankracht is gebruikt."}${S.case ? `\n\nHet onderzoek loopt nog ${S.case.turns} beurt(en).${S.case.turns === 1 ? " Daarna is het te laat." : ""}` : ""}${turn().review ? "\n\nHierna volgt de jaarbeoordeling." : ""}</div>
   <div class="choices"><button class="ch" id="y"><b>Rapport typen en afsluiten</b></button><button class="ch" id="n"><b>Nog niet</b></button></div>`,
    m => { m.querySelector("#y").onclick = () => { closeModal(); closeSheet(); endTurn(); }; m.querySelector("#n").onclick = closeModal; });
}
boot();
