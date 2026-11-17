// ===================== DAILY AKTE: één dossierpuzzel per dag, voor iedereen gelijk =====================
import { INCIDENTS, TYPEWRITERS, WORKPLACES, makeRng } from "./data.js";

const FN = ["Uwe", "Petra", "Jörg", "Sabine", "Frank", "Kerstin", "Ralf", "Heike", "Holger", "Birgit", "Steffen", "Ute", "Bernd", "Monika", "Lutz", "Gabi"];
const LN = ["Krüger", "Lehmann", "Neumann", "Hartmann", "Krause", "Fiedler", "Seidel", "Köhler", "Pietsch", "Böhme", "Winkler", "Lorenz", "Jahn", "Frenzel", "Engel", "Kaiser"];
const HOMES = ["Kollwitzstraße 12", "Lychener Straße 40", "Greifswalder Straße", "Dimitroffstraße", "Husemannstraße 7", "Rykestraße 31"];
const WORKS = ["kerk", "fabriek", "school", "kliniek", "cafe", "konsum"];

export const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

export function makeDaily(key = todayKey()) {
  const r = makeRng(hash("akte" + key)), pick = a => a[Math.floor(r() * a.length)];
  const work = pick(WORKS), tw = pick(TYPEWRITERS).id;
  const nCand = 4, used = new Set(), people = [];
  const name = () => { let n; do n = pick(FN) + " " + pick(LN); while (used.has(n)); used.add(n); return n; };
  const others = TYPEWRITERS.map(t => t.id).filter(t => t !== tw);
  for (let i = 0; i < nCand; i++) people.push({ name: name(), work, home: HOMES[i], tw: i === 0 ? tw : (r() < 0.75 ? others[(i + Math.floor(r() * 3)) % 3] : null) });
  for (let i = 0; i < 2; i++) people.push({ name: name(), work: pick(WORKS.filter(w => w !== work)), home: pick(HOMES), tw: i === 0 ? tw : pick(others) });   // lokvogel met dezelfde machine
  // schudden, schuldige onthouden
  const culprit = people[0].name;
  for (let i = people.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [people[i], people[j]] = [people[j], people[i]]; }
  const inc = pick(INCIDENTS);
  return { key, inc, work, tw, people, culprit, max: 3 };
}

export function dailyResult(key = todayKey()) { try { return JSON.parse(localStorage.getItem("akte-daily-" + key) || "null"); } catch (e) { return null; } }
function saveResult(key, res) { try { localStorage.setItem("akte-daily-" + key, JSON.stringify(res)); } catch (e) { } }

export function shareText(d, res) {
  const [y, m, dd] = d.key.split("-");
  return `AKTE · DAILY ${dd}.${m}.${y}\nCase: ${d.inc.t}\nObserved: ${"■".repeat(res.used)}${"□".repeat(d.max - res.used)} (${res.used}/${d.max})\n${res.ok ? "ERMITTELT ✓" : "WRONG PERSON ✗"}\nakte-ostberlin.vercel.app`;
}

// ui = { modal, closeModal, toast, sfx, esc, twLabel }
export function openDaily(ui, onDone) {
  const d = makeDaily(), prev = dailyResult(d.key);
  let st = { seen: {}, used: 0 };
  try { st = JSON.parse(localStorage.getItem("akte-daily-st-" + d.key) || "null") || st; } catch (e) { }
  const keep = () => { try { localStorage.setItem("akte-daily-st-" + d.key, JSON.stringify(st)); } catch (e) { } };
  const paper = WORKPLACES[d.work].paper, twl = ui.twLabel(d.tw);
  const resultView = res => {
    const txt = shareText(d, res);
    ui.modal(`<div class="stamp">${res.ok ? "ERMITTELT" : "FALSCH"}</div><div class="kicker">Daily Akte · ${d.key}</div><h1>${res.ok ? "Case closed" : "Wrong person"}</h1>
      <div class="result">${res.ok ? "You found the culprit." : `It was ${ui.esc(d.culprit)}.`} Observations used: ${res.used} of ${d.max}.\n\nA new case tomorrow. The same one for everyone.</div>
      <pre class="telexS">${ui.esc(txt)}</pre><button class="next" id="sh">Share result</button><button class="next ghost" id="ok">Close</button>`, m => {
      m.querySelector("#sh").onclick = async () => { try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); ui.toast("Copied to the clipboard."); } } catch (e) { try { await navigator.clipboard.writeText(txt); ui.toast("Copied to the clipboard."); } catch (e2) { } } };
      m.querySelector("#ok").onclick = () => { ui.closeModal(); onDone && onDone(); };
    }, { lock: true });
  };
  if (prev) return resultView(prev);
  const draw = () => {
    ui.modal(`<div class="stamp">DAILY</div><div class="kicker">Daily Akte · ${d.key} · same case for everyone</div><h1>${ui.esc(d.inc.t)}</h1>
      <div class="report">${ui.esc(d.inc.d)}</div>
      <div class="kicker">Clues</div><div class="clue">• Typeface analysis: ${ui.esc(twl.toLowerCase())}.</div><div class="clue">• Paper: ${ui.esc(paper)}.</div>
      <div class="kicker">Suspects · ${d.max - st.used} observation${d.max - st.used === 1 ? "" : "s"} left</div>
      ${d.people.map((p, i) => { const s = st.seen[i]; const wp = WORKPLACES[p.work].name; return `<div class="sus"><div class="sn"><b>${ui.esc(p.name)}</b><small>${ui.esc(wp)} · ${ui.esc(p.home)}</small><div class="marks"><span class="${p.work === d.work ? "ok" : "no"}">${p.work === d.work ? "✓ workplace" : "✗ workplace"}</span>${s ? `<span class="${p.tw === d.tw ? "ok" : "no"}">${p.tw ? (p.tw === d.tw ? "✓ same machine" : "✗ other machine") : "✗ no machine"}</span>` : `<span>? machine</span>`}</div></div>
        <div class="sb">${s ? "" : `<button class="mini" data-o="${i}" ${st.used >= d.max ? "disabled" : ""}>Observe</button>`}<button class="mini red" data-a="${i}">Culprit!</button></div></div>`; }).join("")}
      <p class="muted small">Observe to see who owns which typewriter. Fewer observations is better.</p><button class="next ghost" id="cl">Close (the case waits)</button>`, m => {
      m.querySelectorAll("[data-o]").forEach(b => b.onclick = () => { if (st.used >= d.max) return; st.seen[+b.dataset.o] = true; st.used++; keep(); ui.sfx.shutter(); draw(); });
      m.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { const p = d.people[+b.dataset.a]; const res = { ok: p.name === d.culprit, used: st.used }; saveResult(d.key, res); ui.sfx.stamp(); resultView(res); });
      m.querySelector("#cl").onclick = () => { ui.closeModal(); onDone && onDone(); };
    }, { lock: true });
  };
  draw();
}
