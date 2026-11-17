// ===================== GELUID: kleine synth-effecten (WebAudio, geen bestanden) =====================
// Start pas na de eerste tik (iOS). Alles is kort en zacht. Uit te zetten via de knop in Help.
let ctx = null, master = null, on = true, ringT = null, radioNode = null;
try { on = localStorage.getItem("akte-sound") !== "off"; } catch (e) { }

function ac() {
  if (!on) return null;
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { return null; } }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export function unlock() { ac(); }
export function soundOn() { return on; }
export function setSound(v) { on = v; try { localStorage.setItem("akte-sound", v ? "on" : "off"); } catch (e) { } if (!v) { stopRing(); radio(false); } }

function noise(dur, { f = 1200, q = 0.8, g = 0.4, type = "bandpass", at = 0, decay = dur } = {}) {
  const c = ac(); if (!c) return;
  const n = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const gn = c.createGain(); const t0 = c.currentTime + at;
  gn.gain.setValueAtTime(g, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + decay);
  s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
}
function tone(freq, dur, { type = "square", g = 0.12, at = 0, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), gn = c.createGain(), t0 = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  gn.gain.setValueAtTime(g, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(gn); gn.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

export const sfx = {
  click() { noise(0.03, { f: 3000, g: 0.15 }); },
  stamp() { noise(0.12, { f: 180, q: 0.6, g: 0.9, type: "lowpass" }); tone(70, 0.12, { type: "sine", g: 0.4, slide: 0.5 }); buzz(40); },
  type(n = 6) { for (let i = 0; i < n; i++) noise(0.025, { f: 2500 + Math.random() * 1500, g: 0.25, at: i * (0.07 + Math.random() * 0.05) }); },
  bell() { noise(0.02, { f: 4000, g: 0.2, at: 0 }); tone(1760, 0.5, { type: "triangle", g: 0.08, at: 0.02 }); },
  telex(n = 10) { for (let i = 0; i < n; i++) { noise(0.02, { f: 1800, q: 2, g: 0.18, at: i * 0.05 }); } tone(800, 0.04, { g: 0.04, at: n * 0.05 }); },
  paper() { noise(0.18, { f: 5000, q: 0.4, g: 0.12, type: "highpass" }); },
  drawer() { noise(0.25, { f: 400, q: 0.5, g: 0.25, type: "lowpass" }); tone(110, 0.05, { type: "square", g: 0.06, at: 0.24 }); },
  good() { tone(523, 0.09, { g: 0.07 }); tone(784, 0.14, { g: 0.07, at: 0.09 }); },
  bad() { tone(196, 0.18, { g: 0.08 }); tone(147, 0.25, { g: 0.08, at: 0.16 }); buzz([30, 40, 30]); },
  fanfare() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.22, { type: "sawtooth", g: 0.05, at: i * 0.16 })); tone(1047, 0.6, { type: "sawtooth", g: 0.05, at: 0.66 }); },
  steam() { noise(0.6, { f: 6000, q: 0.3, g: 0.05, type: "highpass" }); },
  shutter() { noise(0.05, { f: 2000, g: 0.3 }); noise(0.05, { f: 1200, g: 0.25, at: 0.08 }); },
};

// telefoon: W63-bel, rinkelen tot stopRing()
export function startRing() { if (ringT || !on) return; const ring = () => { for (let i = 0; i < 14; i++) tone(i % 2 ? 1040 : 1120, 0.05, { type: "square", g: 0.035, at: i * 0.055 }); }; ring(); ringT = setInterval(ring, 2600); }
export function stopRing() { clearInterval(ringT); ringT = null; }

// radio: zacht ruisen met een gedempte toon
export function radio(play) {
  const c = ac();
  if (!play || !c) { if (radioNode) { try { radioNode.g.gain.setTargetAtTime(0, ctx.currentTime, 0.1); const n = radioNode; setTimeout(() => { try { n.s.stop(); n.o.stop(); } catch (e) { } }, 400); } catch (e) { } radioNode = null; } return; }
  if (radioNode) return;
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 900));
  const s = c.createBufferSource(); s.buffer = b; s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 1400; fl.Q.value = 0.7;
  const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 220; const og = c.createGain(); og.gain.value = 0.015;
  const g = c.createGain(); g.gain.value = 0.0; g.gain.setTargetAtTime(0.05, c.currentTime, 0.2);
  s.connect(fl); fl.connect(g); o.connect(og); og.connect(g); g.connect(master); s.start(); o.start();
  radioNode = { s, o, g };
}
