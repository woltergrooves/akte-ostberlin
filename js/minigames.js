// ===================== MINIGAMES (20–40 seconden) =====================
// playMinigame(kind, ui, opts, done) — ui = { modal, closeModal, sfx }. done({ ok, score, msg })
// kind: "letter" (Abteilung M: brief openstomen), "tape" (bandrecorder: verdachte woorden markeren), "darkroom" (doka: foto ontwikkelen)

const HOLD = (el, down, up) => {
  const d = e => { e.preventDefault(); down(); }, u = e => { e.preventDefault(); up(); };
  el.addEventListener("pointerdown", d); el.addEventListener("pointerup", u); el.addEventListener("pointerleave", u); el.addEventListener("pointercancel", u);
};

export const MINI = {
  letter: { t: "Abteilung M: steam open a letter", d: "Hold the kettle under the flap. Let go when the needle is in the green. Too long and the paper wrinkles: the recipient will notice." },
  tape: { t: "The tape recorder", d: "Tap MARK when a red word passes the line. Three suspicious words are hidden in the conversation." },
  darkroom: { t: "The darkroom", d: "Hold to develop the photo. Let go when the face is sharp. Too long and it goes black." },
};

export function playMinigame(kind, ui, opts = {}, done) {
  const M = MINI[kind]; let over = false, raf = 0, timer = 0;
  const finish = res => { if (over) return; over = true; cancelAnimationFrame(raf); clearInterval(timer); setTimeout(() => done(res), 900); };
  const head = `<div class="kicker">Überstunden · ${opts.reward ? esc(opts.reward) : "about 30 seconds"}</div><h1>${M.t}</h1><p class="who">${M.d}</p>`;
  if (kind === "letter") {
    ui.modal(`${head}<div class="mg letter"><div class="env"><div class="flap" id="flap"></div><div class="addr">${esc(opts.to || "Familie Müller")}<br>${esc(opts.addr || "Berlin 1055")}</div><div class="stampW"></div></div>
      <div class="gauge"><i class="zone"></i><b id="nd"></b></div><div class="mgmsg" id="mm">Hold the button.</div>
      <button class="next" id="hold">Hold: steam</button><button class="next ghost" id="skip">Leave it to Abteilung M</button></div>`, m => {
      let p = 0, held = false, tries = 0; const nd = m.querySelector("#nd"), fl = m.querySelector("#flap"), mm = m.querySelector("#mm");
      const tick = () => { if (held) { p = Math.min(100, p + 1.15); if (Math.random() < 0.12) ui.sfx.steam(); } nd.style.left = p + "%"; fl.style.transform = `rotateX(${Math.min(170, Math.max(0, (p - 40) * 3.5))}deg)`; if (p >= 100) { held = false; mm.textContent = "The paper is soaked. Wrinkled at the edges."; finish({ ok: false, score: 0.2, msg: "smudged" }); } raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      HOLD(m.querySelector("#hold"), () => { if (!over) held = true; }, () => {
        if (!held || over) return; held = false; tries++;
        if (p < 62) { mm.textContent = tries < 4 ? "The glue still holds. Again." : "Out of time."; if (tries >= 4) finish({ ok: false, score: 0.4, msg: "late" }); return; }
        if (p <= 86) { mm.textContent = "Clean. The flap lifts without a trace."; ui.sfx.good(); finish({ ok: true, score: 1, msg: "clean" }); }
        else { mm.textContent = "Open, but the paper has rippled."; ui.sfx.bad(); finish({ ok: false, score: 0.5, msg: "smudged" }); }
      });
      m.querySelector("#skip").onclick = () => finish({ ok: false, score: 0, skipped: true });
    }, { lock: true });
  }
  else if (kind === "tape") {
    const words = (opts.text || "the weather is fine we went to the lake the children are well the heating works again").split(/\s+/).filter(Boolean);
    const keys = opts.keys || ["Hungary", "parcel", "form"];
    const seq = []; let k = 0; for (let i = 0; i < 26; i++) { if (i % 8 === 4 && k < keys.length) seq.push({ w: keys[k++], hot: true }); else seq.push({ w: words[i % words.length], hot: false }); }
    ui.modal(`${head}<div class="mg tape"><div class="reels"><i></i><i></i></div><div class="strip"><div class="line"></div><div class="words" id="ws">${seq.map((s, i) => `<span data-i="${i}" class="${s.hot ? "hot" : ""}">${esc(s.w)}</span>`).join("")}</div></div>
      <div class="mgmsg" id="mm">0 / ${keys.length} marked</div><button class="next" id="mark">Mark</button><button class="next ghost" id="skip">Skip</button></div>`, m => {
      const ws = m.querySelector("#ws"), mm = m.querySelector("#mm"); let x = 0, hits = 0, misses = 0; const done2 = new Set(); const W = m.querySelector(".strip").clientWidth || 300;
      const tick = () => { x += 1.2; ws.style.transform = `translateX(${W / 2 - x}px)`; const last = ws.lastElementChild; if (last && last.offsetLeft + last.offsetWidth < x - 20) { finish({ ok: hits >= 2, score: hits / keys.length, hits }); return; } raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      m.querySelector("#mark").onclick = () => {
        if (over) return; ui.sfx.click();
        const el = [...ws.children].find(s => s.offsetLeft - 8 <= x && s.offsetLeft + s.offsetWidth + 8 >= x);
        if (el && el.classList.contains("hot") && !done2.has(el.dataset.i)) { done2.add(el.dataset.i); el.classList.add("got"); hits++; ui.sfx.good(); }
        else { misses++; if (el) el.classList.add("miss"); }
        mm.textContent = `${hits} / ${keys.length} marked${misses ? ` · ${misses} wrong` : ""}`;
        if (hits >= keys.length) finish({ ok: true, score: 1, hits });
      };
      m.querySelector("#skip").onclick = () => finish({ ok: false, score: 0, skipped: true });
    }, { lock: true });
  }
  else if (kind === "darkroom") {
    ui.modal(`${head}<div class="mg dark"><canvas id="ph" width="160" height="120"></canvas><div class="gauge"><i class="zone dz"></i><b id="nd"></b></div><div class="mgmsg" id="mm">Hold the button.</div>
      <button class="next" id="hold">Hold: develop</button><button class="next ghost" id="skip">Skip</button></div>`, m => {
      const c = m.querySelector("#ph"), g = c.getContext("2d"), nd = m.querySelector("#nd"), mm = m.querySelector("#mm");
      const seed = opts.seed || 3; let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      const scene = []; for (let i = 0; i < 9; i++) scene.push([rnd() * 160, 40 + rnd() * 60, 10 + rnd() * 30, 20 + rnd() * 50]);
      let e = 0, held = false, tries = 0;
      const draw = () => {
        const k = Math.min(1, e); g.fillStyle = `rgb(${200 - k * 60},${30 + k * 10},${20})`; g.fillRect(0, 0, 160, 120);
        const v = Math.max(0, 1 - Math.abs(k - 0.7) * 2.2), dark = Math.max(0, (k - 0.85) * 5);
        g.globalAlpha = Math.min(1, k * 1.3); scene.forEach(([x, y, w, h]) => { g.fillStyle = `rgba(20,10,8,${0.5 + v * 0.4})`; g.fillRect(x, y, w, h); });
        g.fillStyle = `rgba(15,8,6,${0.4 + v * 0.6})`; g.beginPath(); g.arc(80, 52, 16, 0, 7); g.fill(); g.fillRect(62, 68, 36, 50);
        g.globalAlpha = 1; if (dark) { g.fillStyle = `rgba(0,0,0,${Math.min(1, dark)})`; g.fillRect(0, 0, 160, 120); }
      };
      const tick = () => { if (held) e = Math.min(1.1, e + 0.0065); nd.style.left = Math.min(100, e / 1.1 * 100) + "%"; draw(); if (e >= 1.1 && held) { held = false; mm.textContent = "Black. Overexposed."; ui.sfx.bad(); finish({ ok: false, score: 0 }); } raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      HOLD(m.querySelector("#hold"), () => { if (!over) held = true; }, () => {
        if (!held || over) return; held = false; tries++;
        if (e < 0.6) { mm.textContent = tries < 4 ? "Still too pale. Again." : "The developer is exhausted."; if (tries >= 4) finish({ ok: false, score: 0.3 }); return; }
        if (e <= 0.86) { mm.textContent = "Sharp. You recognise the face."; ui.sfx.shutter(); finish({ ok: true, score: 1 }); }
        else { mm.textContent = "Too dark to be sure."; finish({ ok: false, score: 0.4 }); }
      });
      m.querySelector("#skip").onclick = () => finish({ ok: false, score: 0, skipped: true });
    }, { lock: true });
  }
}
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
