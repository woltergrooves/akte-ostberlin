// ===================== 3D: kleine binnenruimtes (fase 3D) =====================
// Elke ruimte is een doos met een vaste camera, PS2-materialen en tikbare plekken (spots).
// buildInterior(kind, data, M) → { scene, cam, spots:[{key,label,anchor,obj}], update(t,dt), resize(aspect) }
import * as THREE from "three";
import { instance } from "./assets.js";

const lam = (o = {}) => new THREE.MeshLambertMaterial({ flatShading: true, ...o });
const mat = (color, o = {}) => lam({ color, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me; }
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 10) { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me; }
function tex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const tm = (t, o = {}) => lam({ map: t, ...o });
function seeded(s) { return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function label(text, w = 128, h = 32, bg = "#e6dec6", fg = "#1d1d1d", font = "bold 16px Arial") {
  return tex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; String(text).split("\n").forEach((l, i, a) => g.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * 18)); });
}
function plane(w, h, m, x, y, z, ry = 0) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; return p; }

// figuur in een binnenruimte, rechtop met armen omlaag
const AX = new THREE.Vector3(1, 0, 0);
function figure(M, name, x, z, ry = 0, h = 1.68) {
  const f = instance(M, name); if (!f) return fallbackFig(x, z, ry, h);
  f.scale.setScalar(h / 1.75);   // Quaternius-figuren zijn ±1,75 m (in de wijk ×0,78)
  ["UpperArmL", "UpperArmR"].forEach(n => { const b = f.getObjectByName(n); if (b) b.rotateOnAxis(AX, -1.3); });
  const g = new THREE.Group(); g.add(f); g.position.set(x, 0, z); g.rotation.y = ry; return g;
}
function fallbackFig(x, z, ry, h) {
  const g = new THREE.Group(); const c = mat(0x4a4a52);
  g.add(box(0.42, h * 0.38, 0.24, c, 0, h * 0.58, 0)); g.add(box(0.3, h * 0.46, 0.2, mat(0x2e2e34), 0, h * 0.23, 0));
  const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat(0xd8b89a)); hd.position.y = h * 0.88; g.add(hd);
  g.position.set(x, 0, z); g.rotation.y = ry; return g;
}

// standaardkamer: vloer, drie muren, plafond, gloeilamp
function room(S, { w = 4.4, h = 2.8, d = 4.2, wall = 0xb8ad8c, wallTex, floorTex, ceil = 0x8e8670, bulb = 0xffd79a, bulbI = 5, amb = 0x8a8370, ambI = 0.65 }) {
  const fl = plane(w, d, floorTex ? tm(floorTex) : mat(0x5a4c3a), 0, 0, 0); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const wm = wallTex ? tm(wallTex) : mat(wall);
  S.add(box(w, h, 0.08, wm, 0, h / 2, -d / 2)); S.add(box(0.08, h, d, wm, -w / 2, h / 2, 0)); S.add(box(0.08, h, d, wm, w / 2, h / 2, 0));
  const c = plane(w, d, mat(ceil), 0, h, 0); c.rotation.x = Math.PI / 2; S.add(c);
  S.add(new THREE.AmbientLight(amb, ambI));
  const L = new THREE.PointLight(bulb, bulbI, 9, 1.3); L.position.set(0, h - 0.35, -0.2); L.castShadow = true; L.shadow.mapSize.set(512, 512); S.add(L);
  const bm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9b8 })); bm.position.copy(L.position); S.add(bm);
  S.add(cyl(0.005, 0.005, 0.35, mat(0x222222), 0, h - 0.17, -0.2, 4));
  return L;
}
const tiles = (a = "#8a8578", b = "#6f6a60", n = 8) => tex(128, 128, (g, w, h) => { const s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); } }, [3, 3]);
const boards = (c = "#5e4a34") => tex(128, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.35)"; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 12, 2); } }, [3, 3]);
const wallpaper = (base, dot) => tex(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = dot; for (let y = 4; y < h; y += 16) for (let x = (y / 16) % 2 * 8 + 4; x < w; x += 16) { g.fillRect(x, y, 4, 4); g.fillRect(x - 2, y + 2, 8, 1); } g.fillStyle = "rgba(60,40,20,.12)"; g.fillRect(0, h - 10, w, 10); }, [4, 2]);
const plaster = (base) => tex(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(40,30,20,${Math.random() * 0.08})`; g.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 2 + Math.random() * 6); } g.fillStyle = "rgba(30,60,40,.35)"; g.fillRect(0, h * 0.55, w, h * 0.45); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, h * 0.55, w, 2); }, [4, 1]);

// RFT-radio, ook in het kantoor gebruikt
export function radioModel() {
  const g = new THREE.Group();
  const wood = mat(0x5a3a22); g.add(box(0.36, 0.2, 0.14, wood, 0, 0.1, 0));
  const front = tex(64, 32, (c, w, h) => { c.fillStyle = "#c8bc98"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a3226"; for (let y = 4; y < h - 4; y += 3) c.fillRect(4, y, 26, 1); c.fillStyle = "#e9d58a"; c.fillRect(34, 6, 26, 8); c.fillStyle = "#222"; c.fillRect(46, 6, 1, 8); c.font = "bold 7px Arial"; c.fillText("RFT", 38, 26); });
  const f = plane(0.33, 0.16, tm(front), 0, 0.1, 0.071); g.add(f);
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.035), new THREE.MeshBasicMaterial({ color: 0x55462a })); dial.position.set(0.075, 0.13, 0.073); g.add(dial); g.userData.dial = dial;
  [-0.1, 0.12].forEach(x => { const k = cyl(0.018, 0.018, 0.02, mat(0x1e1a14), x + 0.02, 0.04, 0.075, 10); k.rotation.x = Math.PI / 2; g.add(k); });
  return g;
}

const SPOTS = (arr) => arr.filter(Boolean);

export function buildInterior(kind, data = {}, M = {}) {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x151512); S.fog = new THREE.Fog(0x151512, 5, 11);
  const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 30);
  const spots = []; const anim = [];
  const spot = (obj, key, label, anchor) => { obj.traverse(m => m.userData.tap = key); spots.push({ obj, key, label, anchor: anchor || null }); };
  const r = seeded(data.seed || 7);
  let camPos = new THREE.Vector3(0, 1.6, 2.6), look = new THREE.Vector3(0, 1.1, -1), fitW = 3.8;

  if (kind === "stairs") {
    const platte = data.platte;
    room(S, { w: 4.2, d: 4.4, h: 3.2, wallTex: platte ? plaster("#c9c4b2") : plaster("#b9a882"), floorTex: platte ? tiles("#8f8a7c", "#837e72", 6) : tiles("#7d6a55", "#5d4e3e", 10), bulbI: 3.5, ambI: 0.5 });
    // trap omhoog rechts
    const stepM = platte ? mat(0x9a968a) : mat(0x6a5038);
    for (let i = 0; i < 9; i++) S.add(box(1.1, 0.18, 0.32, stepM, 1.4, 0.09 + i * 0.18, 0.9 - i * 0.32));
    S.add(box(0.05, 1.0, 3.0, mat(0x3a2a1c), 0.82, 1.3, -0.4)); S.children[S.children.length - 1].rotation.x = 0.5;
    const stairsHit = box(1.2, 1.8, 3.0, new THREE.MeshBasicMaterial({ visible: false }), 1.4, 0.9, -0.4); S.add(stairsHit);
    spot(stairsHit, "doors", platte ? "Lift & flats" : "Stairs & flats", new THREE.Vector3(1.4, 2.1, -0.6));
    if (platte) { const lift = box(0.9, 2.0, 0.06, mat(0x7a7d78), 1.5, 1.0, -2.15); S.add(lift); S.add(box(0.06, 0.06, 0.02, lam({ color: 0xff5a3a, emissive: 0x802010 }), 2.05, 1.2, -2.1)); }
    // brievenbussen
    const mb = new THREE.Group(); const names = (data.people || []).slice(0, 12);
    const mbTex = tex(256, 128, (g, w, h) => { g.fillStyle = "#4a5a48"; g.fillRect(0, 0, w, h); const cols = 4, rows = 3; for (let i = 0; i < cols * rows; i++) { const x = (i % cols) * (w / cols), y = Math.floor(i / cols) * (h / rows); g.fillStyle = "#5f705c"; g.fillRect(x + 3, y + 3, w / cols - 6, h / rows - 6); g.fillStyle = "#222"; g.fillRect(x + 10, y + 10, w / cols - 20, 4); g.fillStyle = "#e9e2cc"; g.fillRect(x + 8, y + h / rows - 16, w / cols - 16, 10); g.fillStyle = "#222"; g.font = "bold 8px Arial"; g.textAlign = "center"; g.fillText((names[i] && names[i].ln || "").toUpperCase().slice(0, 10), x + w / cols / 2, y + h / rows - 8); } });
    mb.add(box(1.3, 0.65, 0.18, tm(mbTex), 0, 0, 0)); mb.position.set(-2.0, 1.35, -0.7); mb.rotation.y = Math.PI / 2; S.add(mb);
    spot(mb, "letterboxes", "Letterboxes", new THREE.Vector3(-1.95, 1.85, -0.7));
    // Hausbuch op een plankje
    const hb = new THREE.Group(); hb.add(box(0.5, 0.04, 0.3, mat(0x4a3622), 0, 0, 0)); const book = box(0.26, 0.05, 0.34, mat(0x2f4a7a), 0, 0.045, 0); book.rotation.y = 0.2; hb.add(book);
    hb.position.set(-1.85, 1.0, 0.9); S.add(hb); spot(hb, "hausbuch", "Hausbuch", new THREE.Vector3(-1.85, 1.35, 0.9));
    // verdeelkast (microfoons)
    const jb = box(0.45, 0.6, 0.12, mat(0x6b6f63), -0.5, 1.9, -2.13); S.add(jb); S.add(box(0.12, 0.06, 0.02, mat(0xd8b23e), -0.5, 2.05, -2.06));
    spot(jb, "junction", data.bugged ? "Junction box · bugged" : "Junction box", new THREE.Vector3(-0.5, 2.38, -2.0));
    // kolenemmers, kinderwagen
    if (!platte) { S.add(cyl(0.16, 0.13, 0.32, mat(0x2a2a28), -1.6, 0.16, -1.8)); S.add(cyl(0.16, 0.13, 0.32, mat(0x33302b), -1.25, 0.16, -1.9)); for (let i = 0; i < 6; i++) S.add(box(0.08, 0.07, 0.06, mat(0x111111), -1.6 + (i % 3) * 0.05, 0.34, -1.8 + Math.floor(i / 3) * 0.05)); }
    const door = box(0.95, 2.1, 0.06, mat(platte ? 0x8a6a3a : 0x5a3d24), -0.6, 1.05, -2.15); S.add(door);
    if (data.home) { spot(door, "home", "Your flat", new THREE.Vector3(-0.6, 2.35, -2.05)); }
    if (data.kw) { const d2 = box(0.9, 2.0, 0.06, mat(0x6a4a2c), 0.5, 1.0, -2.15); S.add(d2); S.add(box(0.2, 0.06, 0.01, lam({ map: label("LINDE", 64, 16, "#e9e2cc", "#222", "bold 10px Arial") }), 0.5, 1.6, -2.1)); spot(d2, "kw", "3rd floor left", new THREE.Vector3(0.5, 2.3, -2.05)); }
    if (data.winter) { S.add(box(0.5, 0.02, 0.7, mat(0xd9d9d4), -0.6, 0.012, -1.6)); }
    camPos.set(-0.2, 1.65, 2.5); look.set(-0.3, 1.25, -1.2); fitW = 3.8;
  }

  else if (kind === "flat") {
    room(S, { w: 4.6, d: 4.2, h: 3.0, wallTex: wallpaper("#b9a77e", "#9b8558"), floorTex: boards("#6a4a30"), bulb: 0xffc98a, bulbI: 4 });
    // kachelofen
    const ofTex = tex(64, 128, (g, w, h) => { g.fillStyle = "#3f5a4a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a3d32"; g.lineWidth = 2; for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) g.strokeRect(x + 1, y + 1, 14, 14); g.fillStyle = "#1a1a18"; g.fillRect(20, 92, 24, 16); });
    const oven = box(0.7, 2.0, 0.6, tm(ofTex), -1.9, 1.0, -1.6); S.add(oven); spot(oven, "s_oven", "Tiled stove", new THREE.Vector3(-1.9, 2.2, -1.6));
    // bank + tafel + stoelen
    const sofa = new THREE.Group(); const sm = mat(0x7a5a3a); sofa.add(box(1.8, 0.42, 0.8, sm, 0, 0.21, 0)); sofa.add(box(1.8, 0.5, 0.18, sm, 0, 0.6, -0.32)); sofa.position.set(0.9, 0, -1.6); S.add(sofa); spot(sofa, "s_sofa", "Sofa", new THREE.Vector3(0.9, 1.0, -1.6));
    const table = new THREE.Group(); table.add(box(1.1, 0.05, 0.8, mat(0x4a3220), 0, 0.74, 0)); [[-0.48, -0.33], [0.48, -0.33], [-0.48, 0.33], [0.48, 0.33]].forEach(([x, z]) => table.add(box(0.05, 0.72, 0.05, mat(0x3a2818), x, 0.36, z)));
    const cloth = box(0.6, 0.006, 0.6, mat(0xd8cfb8), 0, 0.77, 0); cloth.rotation.y = 0.78; table.add(cloth); table.position.set(-0.3, 0, 0.1); S.add(table);
    spot(table, "table", data.search ? "Kitchen table" : "Katrin & Jens", new THREE.Vector3(-0.3, 1.25, 0.1));
    [[-0.95, 0.1], [0.35, 0.1]].forEach(([x, z]) => { const ch = new THREE.Group(); ch.add(box(0.4, 0.04, 0.4, mat(0x5a3d24), 0, 0.45, 0)); ch.add(box(0.4, 0.5, 0.04, mat(0x5a3d24), 0, 0.72, x < 0 ? -0.18 : 0.18)); ch.position.set(x, 0, z); ch.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; S.add(ch); });
    // radio op de kast, schilderij, telefoon, stopcontact, lamp
    const shelf = box(1.2, 0.9, 0.4, mat(0x4f3520), 1.6, 0.45, 0.4); S.add(shelf); shelf.rotation.y = -Math.PI / 2;
    const rad = radioModel(); rad.position.set(1.75, 0.9, 0.4); rad.rotation.y = -Math.PI / 2; S.add(rad); spot(rad, "s_radio", "Radio", new THREE.Vector3(1.75, 1.35, 0.4));
    const pic = new THREE.Group(); pic.add(box(0.6, 0.45, 0.03, mat(0x2a1d12), 0, 0, 0)); pic.add(plane(0.52, 0.37, tm(tex(64, 48, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8aa0b8"); gr.addColorStop(1, "#c9b98a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#3f5a3a"; g.fillRect(0, h * 0.6, w, h * 0.4); g.fillStyle = "#e9e2cc"; g.fillRect(40, 18, 6, 10); })), 0, 0, 0.02)); pic.position.set(0.9, 1.6, -2.05); S.add(pic); spot(pic, "s_pic", "Picture: the Baltic", new THREE.Vector3(0.9, 2.0, -2.0));
    const ph = instance(M, "telefoon"); const phone = new THREE.Group(); if (ph) phone.add(ph); else phone.add(box(0.22, 0.1, 0.18, mat(0x6d1f1a), 0, 0.05, 0)); phone.position.set(1.65, 0.9, -0.05); phone.rotation.y = -1.2; S.add(phone); spot(phone, "s_phone", "Telephone", new THREE.Vector3(1.65, 1.3, -0.15));
    const sock = box(0.09, 0.09, 0.02, mat(0xe5e0d2), -1.0, 0.3, -2.06); S.add(sock); spot(sock, "s_socket", "Socket", new THREE.Vector3(-1.0, 0.6, -2.0));
    const lampG = new THREE.Group(); lampG.add(cyl(0.12, 0.3, 0.25, lam({ color: 0xd8b878, side: THREE.DoubleSide, emissive: 0x3a2a10 }), 0, 0, 0, 12)); lampG.position.set(0, 2.55, -0.2); S.add(lampG); spot(lampG, "s_lamp", "Ceiling lamp", new THREE.Vector3(0, 2.3, -0.2));
    const jdoor = box(0.85, 2.0, 0.05, mat(0xd8d0b8), -1.0, 1.0, -2.1); S.add(jdoor); S.add(plane(0.3, 0.2, tm(tex(64, 40, (g, w, h) => { g.fillStyle = "#e9e2cc"; g.fillRect(0, 0, w, h); g.fillStyle = "#2a4a7a"; g.font = "bold 12px Arial"; g.fillText("JENS", 14, 16); g.fillStyle = "#c42a1f"; g.fillRect(8, 24, 48, 8); })), -1.0, 1.5, -2.07));
    spot(jdoor, "s_jens", "Jens's room", new THREE.Vector3(-1.0, 2.25, -2.0));
    const win = plane(1.0, 1.1, new THREE.MeshBasicMaterial({ color: data.winter ? 0x9aa4b0 : 0x8aa0b8 }), 2.26, 1.6, -1.2, -Math.PI / 2); S.add(win);
    if (!data.search && !data.alone) { S.add(figure(M, "fig_burgeres", -0.75, 0.75, 2.6)); S.add(figure(M, "fig_burger", 0.25, 0.75, -2.4, 1.38)); }   // Katrin en Jens
    camPos.set(0.1, 1.7, 2.6); look.set(0, 1.0, -1.0); fitW = 4.2;
  }

  else if (kind === "kneipe") {
    room(S, { w: 5.0, d: 4.6, h: 3.0, wallTex: tex(64, 64, (g, w, h) => { g.fillStyle = "#6a4a30"; g.fillRect(0, 0, w, h); g.fillStyle = "#4a3220"; g.fillRect(0, h * 0.5, w, h * 0.5); for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(x, h * 0.5, 1, h * 0.5); } g.fillStyle = "rgba(255,220,150,.08)"; g.fillRect(0, 0, w, h * 0.5); }, [5, 1]), floorTex: tiles("#5a4a3a", "#3f342a", 10), bulb: 0xffb060, bulbI: 4.5, amb: 0x806040, ambI: 0.55 });
    // tapkast
    const bar = new THREE.Group(); bar.add(box(2.6, 1.05, 0.6, mat(0x4a2e1a), 0, 0.52, 0)); bar.add(box(2.7, 0.06, 0.7, mat(0x2a1a0e), 0, 1.07, 0));
    for (let i = 0; i < 3; i++) bar.add(cyl(0.025, 0.025, 0.3, mat(0xb8a878), -0.4 + i * 0.25, 1.25, 0));
    bar.position.set(0.9, 0, -1.4); S.add(bar);
    const bottles = new THREE.Group(); for (let i = 0; i < 14; i++) bottles.add(cyl(0.04, 0.045, 0.28, lam({ color: [0x2a5a2a, 0x6a3a1a, 0xd8d0b0, 0x3a2a5a][i % 4] }), -1.2 + i * 0.18, 1.62, 0)); bottles.add(box(2.8, 0.04, 0.25, mat(0x3a2414), 0, 1.47, 0)); bottles.position.set(0.9, 0, -2.15); S.add(bottles);
    const barman = figure(M, "fig_arbeider", 0.9, -1.85, 0); S.add(barman);
    spot(bar, "barman", "The barman", new THREE.Vector3(0.9, 2.05, -1.6));
    // stamtafels met gasten
    const t1 = new THREE.Group(); t1.add(cyl(0.38, 0.38, 0.05, mat(0x3a2414), 0, 1.05, 0, 14)); t1.add(cyl(0.05, 0.08, 1.05, mat(0x2a1a0e), 0, 0.52, 0, 8));
    t1.add(cyl(0.04, 0.035, 0.16, lam({ color: 0xe8c060, emissive: 0x3a2a08 }), 0.1, 1.16, 0.05)); t1.position.set(-1.5, 0, -0.6); S.add(t1);
    S.add(figure(M, "fig_vrouw", -1.95, -0.7, Math.PI / 2)); S.add(figure(M, "fig_burger", -1.05, -0.45, -Math.PI / 2));
    spot(t1, "table1", "Corner table", new THREE.Vector3(-1.5, 2.05, -0.6));
    const t2 = t1.clone(); t2.position.set(-0.3, 0, 0.6); S.add(t2); S.add(figure(M, "fig_punk", -0.75, 0.55, Math.PI / 2)); S.add(figure(M, "fig_burgeres", 0.12, 0.7, -Math.PI / 2));
    spot(t2, "table2", "Table by the door", new THREE.Vector3(-0.3, 2.05, 0.6));
    // briefje en kaars (1989: Gueffroy)
    const note = plane(0.25, 0.32, tm(tex(32, 40, (g, w, h) => { g.fillStyle = "#efe9d8"; g.fillRect(0, 0, w, h); g.fillStyle = "#333"; for (let y = 6; y < h - 4; y += 5) g.fillRect(4, y, w - 8 - (y % 3) * 4, 1); })), -2.45, 1.5, 0.6, Math.PI / 2); S.add(note);
    if (data.candle) { const cnd = cyl(0.03, 0.03, 0.14, mat(0xf0e8d0), -2.38, 1.07, 0.6); S.add(cnd); S.add(box(0.12, 0.04, 0.2, mat(0x3a2414), -2.4, 1.0, 0.6)); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffc040 })); fl.position.set(-2.38, 1.17, 0.6); S.add(fl); anim.push(t => fl.scale.setScalar(1 + Math.sin(t * 17) * 0.25)); const cl = new THREE.PointLight(0xffa040, 1.2, 2); cl.position.set(-2.3, 1.2, 0.6); S.add(cl); }
    spot(note, "note", data.candle ? "A note and a candle" : "Notice", new THREE.Vector3(-2.4, 1.9, 0.6));
    const wc = box(0.8, 2.0, 0.05, mat(0x5a3d24), 2.45, 1.0, 0.5); wc.rotation.y = Math.PI / 2; S.add(wc); S.add(plane(0.2, 0.12, tm(label("00", 32, 20, "#e9e2cc", "#222", "bold 12px Arial")), 2.42, 1.7, 0.5, -Math.PI / 2));
    spot(wc, "wc", "Toilet", new THREE.Vector3(2.4, 2.25, 0.5));
    // rook
    const sm = []; const smM = new THREE.MeshBasicMaterial({ color: 0xcfc2a8, transparent: true, opacity: 0.05, depthWrite: false });
    for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), smM); s.position.set(-2 + r() * 4, 2.45 + r() * 0.4, -1.8 + r() * 2.4); S.add(s); sm.push(s); }
    anim.push((t) => sm.forEach((s, i) => { s.position.x += Math.sin(t * 0.2 + i) * 0.0015; }));
    camPos.set(0.2, 1.75, 2.9); look.set(-0.1, 1.2, -0.8); fitW = 4.6;
  }

  else if (kind === "kaufhalle") {
    room(S, { w: 5.6, d: 5.0, h: 3.0, wall: 0xd8d4c4, floorTex: tiles("#b8b4a4", "#a8a494", 8), bulb: 0xeef4ff, bulbI: 3.5, amb: 0xc8ccc8, ambI: 0.8 });
    for (let k = 0; k < 2; k++) { const L = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })); L.position.set(-1 + k * 2, 2.95, -0.4); S.add(L); }
    // schappen, half leeg
    const shelves = new THREE.Group(); const cols = [0xc42a1f, 0xd8b23e, 0x2a4a7a, 0x4a6a3a, 0xe6dcc0];
    for (let row = 0; row < 2; row++) { const sx = -1.6 + row * 1.6; shelves.add(box(0.5, 1.7, 3.0, mat(0x8a8f88), sx, 0.85, -0.6)); for (let lvl = 0; lvl < 4; lvl++) for (let i = 0; i < 9; i++) { if (r() < 0.55) continue; const c = cols[Math.floor(r() * cols.length)]; shelves.add(box(0.12, 0.18, 0.18, mat(c), sx + (r() < 0.5 ? -0.27 : 0.27), 0.35 + lvl * 0.4, -1.9 + i * 0.32)); } }
    S.add(shelves); spot(shelves, "shelves", "Shelves", new THREE.Vector3(-0.8, 2.1, -1.0));
    // kassa met caissière
    const till = new THREE.Group(); till.add(box(1.0, 0.85, 0.6, mat(0x6f7570), 0, 0.42, 0)); till.add(box(0.34, 0.22, 0.28, mat(0x3a3d3a), 0.2, 0.96, 0)); till.position.set(1.6, 0, 0.9); S.add(till);
    S.add(figure(M, "fig_burgeres", 1.65, 0.35, 0));
    spot(till, "till", "Checkout", new THREE.Vector3(1.6, 1.85, 0.8));
    // toonbank met Bückware
    const counter = new THREE.Group(); counter.add(box(1.6, 1.0, 0.6, mat(0xa9b0a2), 0, 0.5, 0)); counter.add(box(0.5, 0.35, 0.4, mat(0x8a5a2a), -0.4, 0.2, -0.05)); counter.position.set(1.4, 0, -1.9); S.add(counter);
    S.add(figure(M, "fig_vrouw", 1.4, -2.25, 0));
    spot(counter, "counter", "Under the counter", new THREE.Vector3(1.4, 1.75, -1.9));
    // rij
    const q = new THREE.Group(); const n = data.queue || 4; for (let i = 0; i < n; i++) q.add(figure(M, ["fig_vrouw", "fig_burger", "fig_burgeres", "fig_arbeider"][i % 4], 0.3 + (i % 2) * 0.12, 1.6 - i * 0.55, Math.PI)); S.add(q);
    const qHit = box(0.8, 1.8, Math.max(1, n * 0.55), new THREE.MeshBasicMaterial({ visible: false }), 0.35, 0.9, 1.6 - n * 0.27); S.add(qHit); spot(qHit, "queue", `The queue (${n})`, new THREE.Vector3(0.35, 2.0, 1.4));
    const sign = plane(1.4, 0.35, tm(label(data.sign || "HEUTE: RONDO-KAFFEE", 256, 64, "#f2eedc", "#1f4f86", "bold 20px Arial")), 0, 2.3, -2.45); S.add(sign);
    spot(sign, "sign", "Sign", new THREE.Vector3(0, 2.6, -2.4));
    camPos.set(0.1, 1.8, 3.4); look.set(0.2, 1.1, -0.9); fitW = 4.8;
  }

  else if (kind === "kw") {
    room(S, { w: 4.0, d: 3.8, h: 2.7, wallTex: wallpaper("#a89a7a", "#7a6a4a"), floorTex: tex(64, 64, (g, w, h) => { g.fillStyle = "#6a3a2a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a5a3a"; for (let i = 0; i < w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, h); g.stroke(); } }, [3, 3]), bulb: 0xffd08a, bulbI: 3.5 });
    const tbl = new THREE.Group(); tbl.add(box(0.9, 0.04, 0.6, mat(0x3a2414), 0, 0.5, 0)); tbl.add(box(0.8, 0.48, 0.5, mat(0x2f1d10), 0, 0.24, 0));
    const cupM = instance(M, "koffiekop"), ashM = instance(M, "asbak");
    if (cupM) { const c1 = cupM.clone(); c1.position.set(-0.2, 0.52, 0.08); tbl.add(c1); const c2 = cupM.clone(); c2.position.set(0.22, 0.52, -0.1); tbl.add(c2); }
    if (ashM) { ashM.position.set(0.05, 0.52, 0.12); tbl.add(ashM); }
    tbl.position.set(0, 0, -0.2); S.add(tbl); spot(tbl, "treff", "Treff: meet an IM", new THREE.Vector3(0, 1.1, -0.2));
    const armM = mat(0x6a7a4a); [[-0.85, 0.5], [0.85, -0.5]].forEach(([x, ry]) => { const a = new THREE.Group(); a.add(box(0.7, 0.4, 0.7, armM, 0, 0.2, 0)); a.add(box(0.7, 0.5, 0.15, armM, 0, 0.6, -0.28)); a.add(box(0.12, 0.25, 0.7, armM, -0.3, 0.5, 0)); a.add(box(0.12, 0.25, 0.7, armM, 0.3, 0.5, 0)); a.position.set(x, 0, -0.2); a.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; S.add(a); });
    const cab = new THREE.Group(); cab.add(box(1.3, 1.6, 0.42, mat(0x5a3a22), 0, 0.8, 0)); cab.add(box(1.1, 0.6, 0.02, lam({ color: 0x9ab0b8, transparent: true, opacity: 0.5 }), 0, 1.25, 0.22)); for (let i = 0; i < 5; i++) cab.add(cyl(0.03, 0.025, 0.05, mat(0xe6dcc0), -0.4 + i * 0.2, 1.05, 0.05));
    cab.position.set(1.2, 0, -1.65); S.add(cab); spot(cab, "ledger", "Cupboard: funds & ledger", new THREE.Vector3(1.2, 1.85, -1.6));
    const cur = new THREE.Group(); cur.add(plane(1.2, 1.2, new THREE.MeshBasicMaterial({ color: 0x6a7a8a }), 0, 0, 0)); cur.add(box(0.35, 1.4, 0.04, mat(0xb8823a), -0.5, 0, 0.03)); cur.add(box(0.35, 1.4, 0.04, mat(0xb8823a), 0.5, 0, 0.03));
    cur.position.set(-0.9, 1.5, -1.86); S.add(cur); spot(cur, "window", "Window", new THREE.Vector3(-0.9, 2.3, -1.8));
    const tape = new THREE.Group(); tape.add(box(0.36, 0.1, 0.24, mat(0x2a2a28), 0, 0.05, 0)); [-0.08, 0.08].forEach(x => { const s = cyl(0.06, 0.06, 0.02, mat(0x6a5a4a), x, 0.11, -0.02, 12); tape.add(s); anim.push(t => s.rotation.y = t * (data.rec ? 3 : 0)); });
    tape.position.set(-1.5, 0.0, 0.6); S.add(box(0.5, 0.5, 0.4, mat(0x4a3220), -1.5, 0.25, 0.6)); tape.position.y = 0.5; S.add(tape);
    spot(tape, "tape", "Tape recorder", new THREE.Vector3(-1.5, 1.0, 0.6));
    camPos.set(0.1, 1.6, 2.4); look.set(0, 0.9, -0.6); fitW = 3.6;
  }

  else if (kind === "booth") {
    S.add(new THREE.AmbientLight(0x9aa0a0, 0.7));
    const L = new THREE.PointLight(0xfff0c0, 3, 5, 1.4); L.position.set(0, 2.3, 0); S.add(L);
    const fl = plane(1.2, 1.2, mat(0x4a4945), 0, 0, 0); fl.rotation.x = -Math.PI / 2; S.add(fl);
    const glass = lam({ color: 0x8aa0a8, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const frame = mat(0xd9cfa9);
    S.add(box(1.2, 2.3, 0.04, mat(0xcfc59f), 0, 1.15, -0.6)); S.add(box(0.04, 2.3, 1.2, glass, -0.6, 1.15, 0)); S.add(box(0.04, 2.3, 1.2, glass, 0.6, 1.15, 0));
    [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([x, z]) => S.add(box(0.06, 2.3, 0.06, frame, x, 1.15, z)));
    S.add(box(1.25, 0.12, 1.25, mat(0xd8a92e), 0, 2.36, 0));
    const outside = plane(8, 5, tm(tex(128, 80, (g, w, h) => { g.fillStyle = data.winter ? "#9a9c98" : "#7a7a6a"; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = `rgb(${70 + i * 5},${68 + i * 4},${60 + i * 3})`; g.fillRect(i * 14, 10 + (i % 3) * 6, 13, h); g.fillStyle = "#d8b060"; if (i % 2) g.fillRect(i * 14 + 3, 20, 3, 4); } })), 0, 2, 3.5, Math.PI); S.add(outside);
    // telefoon aan de wand
    const ph = new THREE.Group(); ph.add(box(0.26, 0.4, 0.12, mat(0x3a3d3a), 0, 0, 0)); ph.add(box(0.06, 0.24, 0.07, mat(0x1a1a1a), -0.17, 0.02, 0.04)); const dl = cyl(0.06, 0.06, 0.02, mat(0xd8d0b8), 0.02, 0.06, 0.07, 14); dl.rotation.x = Math.PI / 2; ph.add(dl); ph.add(box(0.06, 0.015, 0.02, mat(0x888888), 0.06, -0.12, 0.065));
    ph.position.set(0, 1.45, -0.54); S.add(ph); spot(ph, "receiver", "Make a call (20 Pf.)", new THREE.Vector3(0, 1.85, -0.5));
    const pb = box(0.3, 0.06, 0.22, mat(0x8a2a1a), 0.32, 1.05, -0.46); S.add(pb); S.add(box(0.5, 0.03, 0.28, mat(0x6a6a60), 0.3, 1.0, -0.46));
    spot(pb, "phonebook", "Phone book", new THREE.Vector3(0.32, 1.3, -0.45));
    const scr = plane(0.4, 0.3, tm(tex(64, 48, (g, w, h) => { g.fillStyle = "#cfc59f"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a7060"; g.lineWidth = 1; g.font = "9px Arial"; g.fillStyle = "#6a6050"; g.fillText(data.scratch || "R. + M.", 6, 16); g.fillText("SED = ?", 10, 34); g.beginPath(); g.moveTo(4, 40); g.lineTo(50, 38); g.stroke(); }), { transparent: false }), -0.3, 1.2, -0.575); S.add(scr);
    spot(scr, "scratch", "Scratches", new THREE.Vector3(-0.3, 1.5, -0.55));
    camPos.set(0, 1.62, 0.5); look.set(0, 1.3, -0.6); cam.fov = 70; fitW = 1.2;
  }

  else if (kind === "litfass") {
    S.background = new THREE.Color(data.winter ? 0xb8b8b0 : 0xa49b88); S.fog = new THREE.Fog(S.background, 6, 16);
    S.add(new THREE.HemisphereLight(0xd8dbe0, 0x6b6250, 1.2)); const sun = new THREE.DirectionalLight(0xfff1d6, 1.2); sun.position.set(-3, 5, 4); sun.castShadow = true; S.add(sun);
    const fl = plane(14, 14, tm(tex(64, 64, (g, w, h) => { g.fillStyle = data.winter ? "#cfcfca" : "#8b877b"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const v = (data.winter ? 190 : 120) + Math.floor(Math.random() * 25); g.fillStyle = `rgb(${v},${v - 3},${v - 10})`; g.fillRect(x, y, 3, 3); } }, [6, 6])), 0, 0, 0); fl.rotation.x = -Math.PI / 2; S.add(fl);
    const P = data.posters || [];
    const colTex = tex(512, 256, (g, w, h) => {
      g.fillStyle = "#d8cfb8"; g.fillRect(0, 0, w, h);
      const pw = w / 6;
      for (let i = 0; i < 6; i++) { const p = P[i % Math.max(1, P.length)] || { t: "", bg: "#e6dcc0", fg: "#222" }; const x = i * pw; g.fillStyle = p.bg; g.fillRect(x + 3, 8, pw - 6, h - 16); g.fillStyle = p.fg; g.font = "bold 18px Arial"; g.textAlign = "center"; String(p.t).split("\n").forEach((l, k) => g.fillText(l, x + pw / 2, 46 + k * 24)); g.font = "12px Arial"; String(p.s || "").split("\n").forEach((l, k) => g.fillText(l, x + pw / 2, 160 + k * 16)); if (p.torn) { g.fillStyle = "#d8cfb8"; g.beginPath(); g.moveTo(x + pw - 6, h - 70); g.lineTo(x + pw - 30, h - 8); g.lineTo(x + pw - 6, h - 8); g.fill(); } }
      if (data.note) { g.fillStyle = "#f4f0e2"; g.save(); g.translate(w * 0.42, 120); g.rotate(0.08); g.fillRect(-26, -18, 52, 40); g.fillStyle = "#333"; for (let y = -12; y < 18; y += 5) g.fillRect(-20, y, 40 - (y % 3) * 3, 1); g.restore(); }
    });
    const col = new THREE.Group(); const c = cyl(0.7, 0.7, 2.6, tm(colTex), 0, 1.3, 0, 18); c.rotation.y = -Math.PI / 2 + 0.25; col.add(c); col.add(cyl(0.82, 0.76, 0.3, mat(0x2f4a3a), 0, 2.75, 0, 18)); col.add(cyl(0.3, 0.82, 0.25, mat(0x2f4a3a), 0, 3.0, 0, 18)); col.add(cyl(0.78, 0.82, 0.18, mat(0x2f4a3a), 0, 0.09, 0, 18));
    S.add(col);
    const front = [[-0.48, "poster0"], [0, "poster1"], [0.48, "poster2"]];
    front.forEach(([x, k], i) => { const hit = box(0.42, 1.8, 0.1, new THREE.MeshBasicMaterial({ visible: false }), x, 1.3, 0.7); S.add(hit); spot(hit, k, (P[i] && P[i].lab) || "Poster", new THREE.Vector3(x, 2.35 - (i % 2) * 0.25, 0.75)); });
    if (data.note) { const nh = box(0.3, 0.3, 0.1, new THREE.MeshBasicMaterial({ visible: false }), 0.05, 1.5, 0.72); S.add(nh); spot(nh, "note", "A typed note", new THREE.Vector3(0.05, 1.7, 0.85)); }
    const lamp = new THREE.Group(); lamp.add(cyl(0.05, 0.07, 4, mat(0x3f4a44), 0, 2, 0, 6)); lamp.position.set(2.2, 0, -1.5); S.add(lamp);
    camPos.set(0.2, 1.55, 2.6); look.set(0, 1.45, 0); cam.fov = 55; fitW = 3.0;
  }

  cam.position.copy(camPos); cam.lookAt(look);
  const base = camPos.clone(), dir = camPos.clone().sub(look), d0 = dir.length(); dir.normalize();
  const f0 = cam.fov;
  S.updateMatrixWorld(true);
  spots.forEach(s => { if (!s.anchor) s.anchor = new THREE.Vector3().setFromMatrixPosition(s.obj.matrixWorld).add(new THREE.Vector3(0, 0.3, 0)); });
  return {
    scene: S, cam, spots,
    update(t, dt) { cam.position.x = base.x + Math.sin(t * 0.35) * 0.04; cam.position.y = base.y + Math.sin(t * 0.5) * 0.015; cam.lookAt(look); anim.forEach(f => f(t, dt)); },
    // portret: verder naar achteren tot de kamer (fitW breed) in beeld past
    resize(aspect) {
      cam.aspect = aspect; cam.fov = aspect < 1 ? Math.min(78, f0 + 10) : f0;
      const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect);
      const d = Math.max(d0, (fitW / 2) / Math.tan(hf) * 0.82);
      base.copy(look).addScaledVector(dir, d); cam.position.copy(base); cam.updateProjectionMatrix();
    },
  };
}
