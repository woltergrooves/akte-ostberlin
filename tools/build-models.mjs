// Bouwt de eigen low-poly modellen (DDR-specifiek, geen CC0-bron beschikbaar) als .glb in assets/models/.
// Gebruik: cd tools && npm i && node build-models.mjs
// Maten in meters. Kantoorspullen: voorkant = +Z. Voertuigen: voorkant = +X.
import { THREE, Part, writeModel } from "./lib.mjs";
import { fileURLToPath } from "url";
import path from "path";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "models");
const report = [];
async function save(name, parts) { const t = await writeModel(path.join(OUT, name + ".glb"), parts, { name }); report.push([name, Math.round(t)]); }
const D2R = Math.PI / 180;

// ---------------- KANTOOR ----------------

// Bakelieten telefoon, W63-stijl. Hoorn en kiesschijf zijn losse nodes (voor fase 3).
async function telefoon() {
  const RED = 0x6d1f1a, DARK = 0x3a100d, CREAM = 0xe8e2d0, BLACK = 0x161412;
  const body = new Part("Body");
  body.extZ([[-0.11, 0], [0.11, 0], [0.11, 0.028], [0.072, 0.085], [-0.02, 0.104], [-0.1, 0.1], [-0.11, 0.08]], 0.22, RED, "lam", 0.006);
  body.box(0.235, 0.008, 0.235, 0, 0.004, 0, DARK);                       // voetrand
  // haakgabel: twee vorken bovenop
  for (const sx of [-1, 1]) { body.box(0.022, 0.03, 0.03, sx * 0.08, 0.115, -0.035, RED); body.box(0.022, 0.012, 0.012, sx * 0.08, 0.134, -0.052, RED); body.box(0.022, 0.012, 0.012, sx * 0.08, 0.134, -0.018, RED); }
  body.box(0.03, 0.01, 0.018, 0, 0.11, -0.035, CREAM);                     // gaffelknop
  // krulsnoer van hoorn naar toestel
  const cord = [];
  for (let i = 0; i <= 24; i++) { const k = i / 24; cord.push(new THREE.Vector3(-0.115 - Math.sin(k * Math.PI) * 0.06, 0.1 - k * 0.09 + Math.sin(k * 40) * 0.006, -0.03 + k * 0.05 + Math.cos(k * 40) * 0.006)); }
  body.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 40, 0.004, 3, false), BLACK);
  // kiesschijf op de schuine voorkant
  const dial = new Part("Dial", [0, 0.066, 0.099], [54 * D2R, 0, 0]);
  dial.cyl(0.047, 0.047, 0.006, 16, 0, 0, 0, CREAM);
  dial.cyl(0.02, 0.02, 0.008, 12, 0, 0.001, 0, 0xf4efe0);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 1.65 + 0.9; dial.cyl(0.0075, 0.0075, 0.008, 6, Math.cos(a) * 0.034, 0.0015, Math.sin(a) * 0.034, BLACK); }
  dial.box(0.006, 0.006, 0.018, 0.035, 0.005, 0.03, 0x9a9a9a, "lam", 0, -0.6, 0); // vingeraanslag
  // hoorn: los, ligt in de gabel
  const hs = new Part("Handset", [0, 0.148, -0.035]);
  hs.box(0.15, 0.022, 0.032, 0, 0, 0, RED, "lam", 0, 0, 0);
  for (const sx of [-1, 1]) {
    hs.box(0.03, 0.03, 0.034, sx * 0.082, -0.012, 0, RED, "lam", 0, 0, sx * 0.35);
    hs.cyl(0.03, 0.026, 0.03, 10, sx * 0.1, -0.03, 0, RED);
    hs.cyl(0.02, 0.02, 0.004, 8, sx * 0.1, -0.046, 0, DARK);
  }
  await save("telefoon", [body, dial, hs]);
}

// Typemachine (Erika-achtige draagbare). Wagen en papier als losse nodes.
async function typemachine() {
  const BODY = 0x2f3431, DARK = 0x1a1c1b, KEY = 0xd9d2bd, CHROME = 0xa8aca8;
  const b = new Part("Body");
  b.extZ([[-0.16, 0], [0.15, 0], [0.15, 0.022], [0.02, 0.072], [-0.1, 0.098], [-0.16, 0.098]], 0.36, BODY, "lam", 0.006);
  b.box(0.34, 0.008, 0.29, 0, 0.004, 0, DARK);
  // toetsen op de schuine voorkant: 4 rijen
  const sl = Math.atan2(0.05, 0.13);
  for (let r = 0; r < 4; r++) { const n = 11 - (r === 3 ? 1 : 0); const z = 0.125 - r * 0.03, y = 0.04 + r * 0.0118; for (let c = 0; c < n; c++) b.box(0.019, 0.012, 0.019, -0.15 + c * 0.029 + r * 0.007, y + 0.012, z, KEY, "lam", sl, 0, 0); }
  b.box(0.16, 0.01, 0.022, 0, 0.034, 0.14, KEY, "lam", sl, 0, 0);       // spatiebalk
  b.box(0.2, 0.03, 0.05, 0, 0.1, -0.01, DARK);                           // typekorf
  b.box(0.05, 0.008, 0.002, 0, 0.082, 0.04, 0xc9a23a, "lam", -0.4, 0, 0); // merkplaatje
  for (const sx of [-1, 1]) b.cyl(0.026, 0.026, 0.012, 10, sx * 0.12, 0.104, -0.03, DARK); // lintspoelen
  const w = new Part("Carriage", [0, 0.13, -0.085]);
  w.cyl(0.025, 0.025, 0.4, 12, 0, 0, 0, 0x151515, "lam", "x");          // rol
  for (const sx of [-1, 1]) { w.cyl(0.02, 0.02, 0.025, 10, sx * 0.215, 0, 0, CHROME, "lam", "x"); w.box(0.012, 0.05, 0.06, sx * 0.185, -0.02, 0.0, BODY); }
  w.box(0.38, 0.012, 0.03, 0, -0.03, 0.03, CHROME);                       // papierhouder
  w.box(0.012, 0.012, 0.09, -0.21, 0.01, 0.05, CHROME, "lam", 0, 0.5, 0);  // terugslaghendel
  w.box(0.36, 0.06, 0.006, 0, 0.03, -0.035, BODY, "lam", -0.5, 0, 0);      // papiersteun
  const p = new Part("Paper", [0, 0.2, -0.11], [-0.28, 0, 0]);
  p.box(0.21, 0.24, 0.002, 0, 0, 0, 0xf5f1e6);
  for (let i = 0; i < 9; i++) p.box(0.12 + ((i * 37) % 5) * 0.012, 0.004, 0.003, -0.02, -0.02 - i * 0.012, 0, 0x55524a);
  await save("typemachine", [b, w, p]);
}

// Bureaulamp met groene kap (zoals in de DDR-kantoren). Lampje = "glow".
async function bureaulamp() {
  const BRASS = 0xb39a5b, GREEN = 0x1e5a34;
  const l = new Part("Lamp");
  l.lathe([[0, 0], [0.105, 0], [0.11, 0.012], [0.09, 0.03], [0.02, 0.04], [0, 0.04]], 14, 0, 0, 0, BRASS);
  l.cyl(0.012, 0.012, 0.32, 6, 0, 0.2, 0, BRASS);
  l.cyl(0.02, 0.02, 0.03, 8, 0, 0.36, 0, BRASS);
  l.box(0.012, 0.03, 0.012, 0.03, 0.03, 0.05, 0x222222);                   // schakelaar
  // kap met dikte (dubbelzijdig zichtbaar)
  l.lathe([[0.058, 0.07], [0.16, -0.05], [0.152, -0.054], [0.05, 0.062]], 16, 0, 0.395, 0, GREEN);
  l.lathe([[0, 0.075], [0.06, 0.07], [0.05, 0.062], [0, 0.066]], 12, 0, 0.395, 0, GREEN);
  l.geo(new THREE.SphereGeometry(0.034, 8, 6).translate(0, 0.37, 0), 0xffe2a8, "glow");
  await save("bureaulamp", [l]);
}

// Stempel en stempelkussen (twee nodes).
async function stempel() {
  const WOOD = 0x5a3d24, DARKW = 0x2a1d12;
  const s = new Part("Stamp");
  s.box(0.075, 0.022, 0.05, 0, 0.018, 0, WOOD);
  s.box(0.072, 0.007, 0.047, 0, 0.0035, 0, 0x7a1b16);
  s.lathe([[0.016, 0.029], [0.012, 0.06], [0.014, 0.075], [0.03, 0.095], [0.032, 0.11], [0.022, 0.125], [0, 0.13]], 10, 0, 0, 0, DARKW);
  const pad = new Part("Pad", [-0.1, 0, 0.08]);
  pad.box(0.12, 0.016, 0.085, 0, 0.008, 0, 0x55606a);
  pad.box(0.104, 0.002, 0.07, 0, 0.017, 0, 0x7a1b16);
  pad.box(0.122, 0.07, 0.006, 0, 0.05, -0.044, 0x55606a, "lam", -0.25, 0, 0); // open deksel
  await save("stempel", [s, pad]);
}

async function asbak() {
  const a = new Part("Ashtray");
  a.lathe([[0, 0], [0.058, 0], [0.062, 0.022], [0.054, 0.025], [0.045, 0.008], [0, 0.008]], 14, 0, 0, 0, 0x6b7f86);
  for (const r of [0, 2.1, 4.2]) a.box(0.016, 0.01, 0.02, Math.cos(r) * 0.058, 0.024, Math.sin(r) * 0.058, 0x6b7f86, "lam", 0, -r, 0);
  a.cyl(0.005, 0.005, 0.05, 5, 0.03, 0.027, 0, 0xe8e2d0, "lam", "x");    // sigaret
  a.cyl(0.0052, 0.0052, 0.008, 5, 0.006, 0.027, 0, 0x9a3a1a, "glow", "x");
  await save("asbak", [a]);
}

async function koffiekop() {
  const c = new Part("Cup");
  c.lathe([[0, 0], [0.032, 0], [0.04, 0.08], [0.037, 0.082], [0.03, 0.008], [0, 0.008]], 12, 0, 0, 0, 0xf1ede2);
  c.geo(new THREE.TorusGeometry(0.022, 0.006, 4, 8).translate(0.045, 0.045, 0), 0xf1ede2);
  c.cyl(0.036, 0.036, 0.002, 12, 0, 0.07, 0, 0x2b1a0e);
  c.cyl(0.06, 0.055, 0.008, 12, 0, 0.004, 0, 0xf1ede2);                     // schoteltje
  await save("koffiekop", [c]);
}

// ---------------- VOERTUIGEN ----------------
const GLASS = 0x2a3238, TYRE = 0x1a1a1a, RIM = 0x9a9c96, CHROME = 0xb8bab4, GREY = 0x4a4a48;

function wheels(p, base, track, r, w) {
  for (const x of [base / 2, -base / 2]) for (const z of [track / 2, -track / 2]) {
    p.cyl(r, r, w, 10, x, r, z, TYRE, "lam", "z");
    p.cyl(r * 0.55, r * 0.55, w + 0.01, 8, x, r, z, RIM, "lam", "z");
  }
}
// ruit op een schuin vlak tussen (x1,y1) en (x2,y2), breedte w
function slopeGlass(p, x1, y1, x2, y2, w, out = 0.012) {
  const len = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(a), ny = Math.cos(a); const s = Math.sign(nx * (x1 + x2)) || 1;
  p.box(len * 0.9, 0.01, w, (x1 + x2) / 2 + nx * out * s, (y1 + y2) / 2 + ny * out * s, 0, GLASS, "lam", 0, 0, a);
}

// Trabant 601: L 3,51 · B 1,50 · H 1,44 m
async function trabant() {
  const p = new Part("Body");
  p.ext([[-1.75, 0.27], [1.72, 0.27], [1.76, 0.42], [1.745, 0.62], [1.6, 0.775], [0.72, 0.86], [-1.5, 0.86], [-1.7, 0.83], [-1.76, 0.62], [-1.765, 0.38]], 1.46, 0, "paint", 0.03);
  const cab = [[0.7, 0.86], [0.26, 1.37], [-0.92, 1.39], [-1.32, 0.86]];
  p.ext(cab, 1.32, 0, "paint", 0.02);
  p.ext([[0.6, 0.9], [0.24, 1.32], [-0.88, 1.34], [-1.22, 0.9]], 1.355, GLASS);   // zijruiten
  p.box(0.08, 0.46, 1.36, -0.3, 1.12, 0, 0, "paint", 0, 0, 0.05);                  // B-stijl
  slopeGlass(p, 0.66, 0.89, 0.28, 1.34, 1.22);                                    // voorruit
  slopeGlass(p, -1.29, 0.89, -0.95, 1.36, 1.2);                                    // achterruit
  p.box(1.22, 0.04, 1.3, -0.33, 1.405, 0, 0, "paint");                           // dakrand
  // voorkant: grille-band en ronde koplampen
  p.box(0.04, 0.12, 0.8, 1.755, 0.6, 0, GREY);
  for (const z of [0.52, -0.52]) { p.cyl(0.085, 0.085, 0.05, 10, 1.75, 0.62, z, CHROME, "lam", "x"); p.cyl(0.07, 0.07, 0.06, 10, 1.755, 0.62, z, 0xe8e4cc, "lam", "x"); p.box(0.03, 0.05, 0.12, 1.77, 0.45, z * 1.15, 0xd8a030); }
  p.box(0.08, 0.1, 1.5, 1.77, 0.34, 0, GREY); p.box(0.08, 0.1, 1.5, -1.78, 0.34, 0, GREY); // bumpers
  p.box(0.02, 0.1, 0.42, 1.815, 0.38, 0, 0xe8e6dc); p.box(0.02, 0.1, 0.42, -1.825, 0.5, 0, 0xe8e6dc); // kentekens
  for (const z of [0.58, -0.58]) p.box(0.04, 0.12, 0.16, -1.76, 0.66, z, 0xb02020); // achterlichten
  // deurnaden en handgrepen
  for (const s of [1, -1]) { p.box(0.012, 0.5, 0.01, 0.62, 0.62, s * 0.735, 0x2a2a2a); p.box(0.012, 0.5, 0.01, -0.42, 0.62, s * 0.735, 0x2a2a2a); p.box(0.1, 0.025, 0.02, -0.3, 0.78, s * 0.74, CHROME); }
  p.box(0.06, 0.05, 0.12, 0.62, 0.98, 0.76, GREY);                                // spiegel
  wheels(p, 2.02, 1.27, 0.29, 0.17);
  await save("trabant601", [p]);
}

// Wartburg 353: L 4,22 · B 1,64 · H 1,41 m
async function wartburg() {
  const p = new Part("Body");
  p.ext([[-2.08, 0.3], [2.06, 0.3], [2.11, 0.45], [2.1, 0.72], [1.98, 0.8], [0.8, 0.84], [-1.3, 0.86], [-2.04, 0.84], [-2.12, 0.72], [-2.12, 0.42]], 1.62, 0, "paint", 0.03);
  p.ext([[0.78, 0.84], [0.18, 1.36], [-0.88, 1.37], [-1.34, 0.86]], 1.44, 0, "paint", 0.02);
  p.ext([[0.66, 0.89], [0.16, 1.31], [-0.84, 1.32], [-1.24, 0.9]], 1.475, GLASS);
  p.box(0.08, 0.44, 1.48, -0.36, 1.1, 0, 0, "paint", 0, 0, 0.04);
  slopeGlass(p, 0.74, 0.87, 0.2, 1.33, 1.34);
  slopeGlass(p, -1.31, 0.89, -0.9, 1.34, 1.32);
  p.box(1.06, 0.04, 1.42, -0.35, 1.38, 0, 0, "paint");
  // brede grille met koplampen in vierkante omlijsting
  p.box(0.04, 0.2, 1.1, 2.105, 0.6, 0, 0x2e302e);
  for (let i = 0; i < 4; i++) p.box(0.045, 0.012, 1.08, 2.11, 0.52 + i * 0.05, 0, CHROME);
  for (const z of [0.64, -0.64]) { p.box(0.05, 0.2, 0.22, 2.1, 0.6, z, CHROME); p.cyl(0.075, 0.075, 0.06, 10, 2.11, 0.6, z, 0xe8e4cc, "lam", "x"); p.box(0.03, 0.06, 0.14, 2.1, 0.43, z, 0xd8a030); }
  p.box(0.08, 0.08, 1.66, 2.13, 0.37, 0, CHROME); p.box(0.08, 0.08, 1.66, -2.15, 0.4, 0, CHROME);
  p.box(0.02, 0.1, 0.45, 2.175, 0.27, 0, 0xe8e6dc); p.box(0.02, 0.1, 0.45, -2.165, 0.56, 0, 0xe8e6dc);
  for (const z of [0.6, -0.6]) p.box(0.04, 0.14, 0.26, -2.12, 0.68, z, 0xb02020);
  for (const s of [1, -1]) { p.box(0.012, 0.5, 0.01, 0.72, 0.62, s * 0.815, 0x2a2a2a); p.box(0.012, 0.5, 0.01, -0.38, 0.62, s * 0.815, 0x2a2a2a); p.box(0.012, 0.5, 0.01, -1.32, 0.62, s * 0.815, 0x2a2a2a); p.box(3.9, 0.025, 0.01, 0, 0.7, s * 0.818, CHROME); }
  p.box(0.07, 0.05, 0.12, 0.72, 0.96, 0.84, GREY);
  wheels(p, 2.45, 1.32, 0.31, 0.18);
  await save("wartburg353", [p]);
}

// Tatra KT4D: twee bakken met geleding, L 18,1 · B 2,2 · H 3,1 m. Stroomafnemer als losse node.
async function tatra() {
  const CREAM = 0xe8d8a0, ORANGE = 0xd26a1e, ROOF = 0xbab6aa, DARK = 0x2b3238, UNDER = 0x262624;
  const half = (name, x0, front) => {
    const p = new Part(name, [x0, 0, 0]);
    const L = 8.6, W = 2.18;
    // onderbak en bovenbak (kopse kant iets schuin)
    const f = front ? 0.25 : 0;
    p.ext([[-L / 2, 0.45], [L / 2, 0.45], [L / 2 + f * 0.2, 1.25], [-L / 2, 1.25]].map(([x, y]) => [front ? x : -x, y]), W, ORANGE);
    p.ext([[-L / 2, 1.25], [L / 2 + f * 0.2, 1.25], [L / 2 - f, 2.95], [-L / 2, 2.95]].map(([x, y]) => [front ? x : -x, y]), W, CREAM);
    p.box(L - 0.2, 0.18, W - 0.2, 0, 3.04, 0, ROOF);
    p.box(1.6, 0.25, 1.2, front ? -1.6 : 1.2, 3.2, 0, 0x8a877e);               // dakkasten
    // ramen langs beide zijden
    for (const s of [1, -1]) {
      for (let i = 0; i < 6; i++) { const x = -3.6 + i * 1.32; if (i === 1 || i === 4) { p.box(1.0, 2.25, 0.03, x, 1.6, s * (W / 2 + 0.01), 0x5a5e5a); p.box(0.4, 0.9, 0.04, x - 0.24, 2.0, s * (W / 2 + 0.012), DARK); p.box(0.4, 0.9, 0.04, x + 0.24, 2.0, s * (W / 2 + 0.012), DARK); } else p.box(1.12, 0.95, 0.03, x, 2.05, s * (W / 2 + 0.01), DARK); }
      p.box(L, 0.05, 0.03, 0, 1.25, s * (W / 2 + 0.012), 0xb04a10);
    }
    // kopse kant
    const xe = front ? L / 2 : -L / 2, sg = front ? 1 : -1;
    if (front) { slopeGlass(p, L / 2 + 0.05, 1.5, L / 2 - 0.2, 2.7, 1.9, 0.02); p.box(0.04, 0.32, 1.2, xe + 0.13, 2.78, 0, 0x1d1d1d); p.box(0.05, 0.22, 0.4, xe + 0.12, 2.78, 0, 0xe8e2c8); for (const z of [0.7, -0.7]) p.cyl(0.11, 0.11, 0.06, 10, xe + 0.06, 0.95, z, 0xfff0c0, "glow", "x"); p.box(0.25, 0.2, 0.5, xe + 0.15, 0.5, 0, 0x333333); }
    else p.box(0.05, 1.0, 1.6, xe - 0.01, 2.0, 0, DARK);
    // draaistellen
    for (const bx of [-2.7, 2.7]) { p.box(2.0, 0.35, 1.6, bx, 0.32, 0, UNDER); for (const wx of [-0.6, 0.6]) for (const z of [0.72, -0.72]) p.cyl(0.33, 0.33, 0.08, 10, bx + wx, 0.33, z, 0x333331, "lam", "z"); }
    return p;
  };
  const A = half("SectionA", 4.55, true), B = half("SectionB", -4.55, false);
  const joint = new Part("Joint"); joint.box(0.5, 2.3, 1.9, 0, 1.75, 0, 0x2a2a28); joint.box(0.6, 0.15, 2.0, 0, 3.0, 0, ROOF);
  // pantograaf (schaar) op de voorste bak
  const pg = new Part("Pantograph", [4.0, 3.13, 0]);
  pg.box(1.4, 0.12, 1.0, 0, 0.06, 0, 0x55534e);
  for (const z of [0.38, -0.38]) { pg.box(0.06, 1.45, 0.06, -0.33, 0.78, z, 0x3a3a3a, "lam", 0, 0, -0.42); pg.box(0.06, 1.45, 0.06, 0.33, 0.78, z, 0x3a3a3a, "lam", 0, 0, 0.42); pg.box(0.06, 1.45, 0.06, -0.33, 2.08, z, 0x3a3a3a, "lam", 0, 0, 0.42); pg.box(0.06, 1.45, 0.06, 0.33, 2.08, z, 0x3a3a3a, "lam", 0, 0, -0.42); }
  pg.box(0.12, 0.06, 1.6, 0, 2.72, 0, 0x777777);
  await save("tatra_kt4d", [A, B, joint, pg]);
}

await telefoon(); await typemachine(); await bureaulamp(); await stempel(); await asbak(); await koffiekop();
await trabant(); await wartburg(); await tatra();
console.table(report.map(([n, t]) => ({ model: n, driehoeken: t })));
