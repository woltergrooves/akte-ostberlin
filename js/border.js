// ===================== Omgeving van de wijk: stad rondom, de Muur (Grenzmauer 75), West-Berlijn =====================
// Alles hier is goedkoop: gebouwen buiten de speelwijk worden per materiaal samengevoegd tot een paar meshes.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const rng = seed => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// K = gereedschap uit world.js: { canvasTex, mat, lam, facadeOld, facadeWBS, CELL }
export function buildSurroundings(D, K) {
  const { canvasTex, mat, lam, CELL } = K;
  const out = { roofMats: [], groundMats: [], segs: [], gapSegs: [], lamps: [], WALL_Z: 3.4 * CELL };

  // ---------- straatraster op de grond, tot in de mist ----------
  // één tegel = één cel; straat (kinderkopjes) en stoep langs twee randen, blokbinnenterrein in het midden
  const N = 46, SZ = N * CELL;
  const tile = canvasTex(64, 64, (g, w, h) => {
    const r = rng(77);
    g.fillStyle = "#3e3b35"; g.fillRect(0, 0, w, h);                                   // binnenterrein (onder de gebouwen)
    const band = (a, b, col, n) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w, v = y / h; const du = Math.min(u, 1 - u), dv = Math.min(v, 1 - v); if ((du >= a && du < b) || (dv >= a && dv < b)) { const k = n ? (r() * 18 - 9) : 0; g.fillStyle = col(k); g.fillRect(x, y, 1, 1); } } };
    band(0.13, 0.215, k => `rgb(${130 + k},${126 + k},${116 + k})`, true);           // stoep
    band(0, 0.13, k => `rgb(${74 + k},${72 + k},${68 + k})`, true);                    // straat
    g.fillStyle = "rgba(20,20,18,.35)"; for (let i = 0; i < w; i += 3) { g.fillRect(i, Math.round(h * 0.13), 1, 1); g.fillRect(Math.round(w * 0.13), i, 1, 1); g.fillRect(i, Math.round(h * 0.87), 1, 1); g.fillRect(Math.round(w * 0.87), i, 1, 1); }
  }, 1);
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(N, N); tile.offset.set(0.5, 0.5);
  const groundMat = mat(0xffffff, { map: tile });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SZ, SZ), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.005; ground.receiveShadow = true; D.add(ground);
  out.ground = ground; out.groundMat = groundMat;

  // ---------- blokken rondom (Oost) ----------
  const roof = mat(0x3c3833); out.roofMats.push(roof);
  const eastCols = [0x8c8577, 0x7d776c, 0x9a9182, 0x857a68, 0x6f6a62, 0xa0957f];
  const eastTex = [];
  for (let i = 0; i < 6; i++) eastTex.push(mat(0xffffff, { map: K.facadeOld(eastCols[i], 4 + (i % 3), 5, 2000 + i * 41, i % 3 === 0 ? ["HO", "FRISEUR", "KOHLEN"][i % 3] : null) }));
  const wbsTex = [mat(0xffffff, { map: K.facadeWBS(0xbdb6a2, 11, 6, 501, "#b8642e") }), mat(0xffffff, { map: K.facadeWBS(0xa9ae9e, 11, 6, 777, "#6f8a4a") })];
  const westCols = ["#e7d8b0", "#c9d6df", "#e4c4b0", "#d0d9c0", "#f0e4cc", "#d9c8d8"];
  const westTex = westCols.map((c, i) => mat(0xffffff, { map: facadeWest(canvasTex, c, 4 + (i % 3), 3100 + i * 17) }));
  const parts = new Map(); // materiaal -> [geometrie]
  const add = (m, geo) => { if (!parts.has(m)) parts.set(m, []); parts.get(m).push(geo); };
  const tmp = new THREE.Object3D();
  function block(x, z, w, d, h, m, rotY = 0) {
    tmp.position.set(x, h / 2, z); tmp.rotation.set(0, rotY, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix();
    add(m, new THREE.BoxGeometry(w, h, d).applyMatrix4(tmp.matrix));
    tmp.position.set(x, h + 0.06, z); tmp.updateMatrix(); add(roof, new THREE.BoxGeometry(w + 0.12, 0.14, d + 0.12).applyMatrix4(tmp.matrix));
  }
  const R = rng(4242);
  const W = 3.75; // zelfde maat als de blokken in de speelwijk
  for (let bx = -11; bx <= 11; bx++) for (let bz = -11; bz <= 2; bz++) {
    if (Math.abs(bx) <= 5 && bz >= -2) continue;              // speelwijk zelf
    if (bx >= -6 && bx <= -4 && bz >= -7 && bz <= -5) continue; // ruimte rond de tv-toren
    const x = bx * CELL, z = bz * CELL; const r = R();
    if (r < 0.06) continue;                                      // braakliggend
    if ((bx > 5 && bz < -4 && r < 0.45) || (bx < -7 && bz < -6 && r < 0.3)) { block(x, z, W, 2.6, 11 * 1.13 + 0.3, wbsTex[(bx + bz + 30) % 2], (bx + bz) % 2 ? 0 : Math.PI / 2); continue; } // Plattenbau
    const fl = 4 + Math.floor(R() * 3);
    block(x, z, W, W, fl * 1.15 + 0.4, eastTex[Math.floor(R() * eastTex.length)], Math.floor(R() * 4) * Math.PI / 2);
    // schoorstenen
    for (let k = 0; k < 2; k++) { tmp.position.set(x + (R() - 0.5) * 2.4, fl * 1.15 + 0.9, z + (R() - 0.5) * 2.4); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); add(roof, new THREE.BoxGeometry(0.32, 1, 0.32).applyMatrix4(tmp.matrix)); }
  }
  // ---------- West-Berlijn (Wedding) achter de Muur ----------
  for (let bx = -11; bx <= 11; bx++) for (let bz = 6; bz <= 12; bz++) {
    const x = bx * CELL, z = bz * CELL; const fl = 4 + Math.floor(R() * 3);
    if (R() < 0.08) continue;
    block(x, z, W, W, fl * 1.15 + 0.4, westTex[Math.floor(R() * westTex.length)], bz === 6 ? Math.PI : Math.floor(R() * 4) * Math.PI / 2);
  }
  parts.forEach((geos, m) => { const me = new THREE.Mesh(mergeGeometries(geos, false), m); me.receiveShadow = true; me.castShadow = false; D.add(me); geos.forEach(g => g.dispose()); });

  // neon aan de eerste rij in het Westen (naar de Muur gericht)
  const neonCols = [0xff4f8a, 0x4fd7ff, 0xffd54f, 0x7dff6a];
  for (let i = -5; i <= 5; i++) { const n = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.08), lam({ color: neonCols[(i + 8) % 4], emissive: neonCols[(i + 8) % 4], emissiveIntensity: 0.9 })); n.position.set(i * CELL * 2 + (i % 2) * CELL, 4.6 + (i % 3) * 0.8, 6 * CELL - W / 2 - 0.06); D.add(n); }

  // ---------- de grens ----------
  const WZ = out.WALL_Z;                       // grenslijn ±22
  const Z_HINT = WZ - 3.3, Z_FENCE = WZ - 1.9, Z_LIGHT = WZ - 0.5, Z_ROAD = WZ + 1.3, Z_SAND = WZ + 3.9, Z_WALL = WZ + 6;
  const g = new THREE.Group(); D.add(g); out.group = g;
  // ondergrond: hele strook tussen de muren, met zand, Kolonnenweg (Lochbetonplatten) en een sloot
  const sand = canvasTex(64, 64, (c, w, h) => { const r = rng(9); c.fillStyle = "#c2b493"; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { c.fillStyle = `rgba(120,105,80,${0.12 + r() * 0.12})`; c.fillRect(0, y, w, 1); } for (let i = 0; i < 80; i++) { c.fillStyle = "rgba(90,80,60,.25)"; c.fillRect(r() * w, r() * h, 1, 1); } }, 1);
  sand.wrapS = sand.wrapT = THREE.RepeatWrapping; sand.repeat.set(60, 2);
  const slab = canvasTex(64, 32, (c, w, h) => { c.fillStyle = "#8f8c84"; c.fillRect(0, 0, w, h); c.fillStyle = "#57554f"; for (let y = 3; y < h; y += 6) for (let x = 3; x < w; x += 6) c.fillRect(x, y, 3, 3); c.fillStyle = "#6c6a63"; c.fillRect(0, 0, w, 1); c.fillRect(0, 0, 1, h); }, 1);
  slab.wrapS = slab.wrapT = THREE.RepeatWrapping; slab.repeat.set(60, 1);
  const grass = mat(0x5d5f45); out.groundMats.push(grass);
  const flat = (w, d, m, x, z, y) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); s.rotation.x = -Math.PI / 2; s.position.set(x, y, z); s.receiveShadow = true; g.add(s); return s; };
  flat(SZ, Z_WALL - Z_HINT + 0.6, grass, 0, (Z_WALL + Z_HINT) / 2, 0.035);                 // dekt het straatraster af
  const sandM = mat(0xffffff, { map: sand }); out.groundMats.push(sandM);
  flat(SZ, 2.6, sandM, 0, Z_SAND, 0.04);
  flat(SZ, 1.9, mat(0xffffff, { map: slab }), 0, Z_ROAD, 0.045);
  flat(SZ, 0.6, mat(0x4a4a40), 0, Z_SAND + 1.6, 0.042);                                       // Kfz-Sperrgraben
  // Hinterlandmauer: lage betonmuur met witte bovenrand, afgesloten straten
  const hint = canvasTex(64, 32, (c, w, h) => { const r = rng(3); c.fillStyle = "#a9a59a"; c.fillRect(0, 0, w, h); c.fillStyle = "#d9d5c9"; c.fillRect(0, 0, w, 6); for (let x = 0; x < w; x += 16) { c.fillStyle = "#86837a"; c.fillRect(x, 0, 1, h); } for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(60,55,45,${r() * 0.25})`; c.fillRect(r() * w, 6, 1 + r() * 2, h); } }, 1);
  hint.wrapS = THREE.RepeatWrapping; hint.repeat.set(SZ / 4, 1);
  const hm = new THREE.Mesh(new THREE.BoxGeometry(SZ, 2.4, 0.25), [mat(0xa9a59a), mat(0xa9a59a), mat(0xd9d5c9), mat(0xa9a59a), lam({ map: hint }), lam({ map: hint })]);
  hm.position.set(0, 1.2, Z_HINT); hm.castShadow = true; hm.receiveShadow = true; g.add(hm);
  // signaalhek
  const post = mat(0x6d6f68);
  const fenceGeos = [];
  for (let x = -SZ / 2; x <= SZ / 2; x += 2.5) { tmp.position.set(x, 1, Z_FENCE); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); fenceGeos.push(new THREE.BoxGeometry(0.07, 2, 0.07).applyMatrix4(tmp.matrix)); }
  [0.5, 1.1, 1.7].forEach(y => { tmp.position.set(0, y, Z_FENCE); tmp.updateMatrix(); fenceGeos.push(new THREE.BoxGeometry(SZ, 0.03, 0.03).applyMatrix4(tmp.matrix)); });
  const fence = new THREE.Mesh(mergeGeometries(fenceGeos), post); g.add(fence);
  // lichttrasse: lantaarns op de strook, naar de Muur gericht
  const lampHead = lam({ color: 0xfff2c8, emissive: 0x6a6040 }); out.lampMat = lampHead;
  const lampGeos = [], headGeos = [];
  for (let x = -60; x <= 60; x += 7) {
    tmp.position.set(x, 2.6, Z_LIGHT); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); lampGeos.push(new THREE.CylinderGeometry(0.06, 0.08, 5.2, 6).applyMatrix4(tmp.matrix));
    tmp.position.set(x, 5.2, Z_LIGHT + 0.45); tmp.rotation.set(0.35, 0, 0); tmp.updateMatrix(); lampGeos.push(new THREE.BoxGeometry(0.08, 0.08, 1.0).applyMatrix4(tmp.matrix));
    tmp.position.set(x, 5.25, Z_LIGHT + 0.95); tmp.rotation.set(0.2, 0, 0); tmp.updateMatrix(); headGeos.push(new THREE.BoxGeometry(0.5, 0.14, 0.32).applyMatrix4(tmp.matrix));
    out.lamps.push(new THREE.Vector3(x, 5.1, Z_LIGHT + 1));
  }
  g.add(new THREE.Mesh(mergeGeometries(lampGeos), post), new THREE.Mesh(mergeGeometries(headGeos), lampHead));
  // Panzersperren (Tschechenigel), los verspreid
  const igel = mat(0x4e4a44); const igGeos = [];
  for (let x = -54; x <= 54; x += 4.5 + ((x * 7) % 3)) for (let k = 0; k < 3; k++) { tmp.position.set(x, 0.42, Z_SAND - 0.4); tmp.rotation.set(k === 0 ? Math.PI / 4 : 0, k === 1 ? Math.PI / 4 : 0, k === 2 ? Math.PI / 4 : 0); tmp.updateMatrix(); const ax = new THREE.BoxGeometry(k === 0 ? 1.1 : 0.12, k === 1 ? 1.1 : 0.12, k === 2 ? 1.1 : 0.12); ax.applyMatrix4(tmp.matrix); igGeos.push(ax); }
  g.add(new THREE.Mesh(mergeGeometries(igGeos), igel));
  // wachttorens BT-11 (vierkante schacht, achthoekige kanzel)
  const tw = mat(0xbcb8ac), glass = lam({ color: 0x2e3a42, emissive: 0x0a1014 });
  [[-38, 0.3], [9, 0], [44, 0.6]].forEach(([x, rot]) => {
    const t = new THREE.Group();
    t.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 6.4, 1.1), tw)); t.children[0].position.y = 3.2;
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.1, 1.4, 8), tw); cab.position.y = 7.1; t.add(cab);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(1.27, 1.27, 0.55, 8), glass); gl.position.y = 7.2; t.add(gl);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.16, 8), tw); rf.position.y = 7.9; t.add(rf);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.45), mat(0x2a2a2a)); sp.position.set(0, 8.15, 0.2); t.add(sp);
    t.position.set(x, 0, Z_ROAD - 0.2); t.rotation.y = rot; t.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(t);
  });
  // Vorderlandmauer: Grenzmauer 75, L-vormige segmenten van 1,2 m met buisrand. Oostkant kaal, westkant graffiti.
  const segTex = i => canvasTex(48, 144, (c, w, h) => {
    const r = rng(100 + i * 13); c.fillStyle = "#d4d0c4"; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 160; k++) { const v = r() < 0.5 ? 0.93 : 1.04; c.fillStyle = `rgba(${v < 1 ? "70,65,55" : "255,252,240"},${0.06 + r() * 0.08})`; c.fillRect(r() * w, r() * h, 2, 2); }
    for (let k = 0; k < 4; k++) { const x = r() * w; const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(90,70,50,.35)"); gr.addColorStop(1, "rgba(90,70,50,0)"); c.fillStyle = gr; c.fillRect(x, 0, 1 + r() * 2, h * (0.3 + r() * 0.5)); }
    c.fillStyle = "rgba(60,55,48,.5)"; c.fillRect(0, 0, 1, h); c.fillStyle = "rgba(255,255,250,.35)"; c.fillRect(w - 1, 0, 1, h);
    c.fillStyle = "rgba(70,60,45,.22)"; c.fillRect(0, h - 16, w, 16);
  }, 1);
  const graff = i => canvasTex(48, 144, (c, w, h) => {
    const r = rng(500 + i * 29); c.fillStyle = "#d7d2c5"; c.fillRect(0, 0, w, h);
    const cols = ["#c42a1f", "#2a62b8", "#e3b52a", "#2f8a3e", "#e26aa8", "#1d1d1d", "#ff7a1c", "#7a3ab8"];
    for (let k = 0; k < 7; k++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; const y = h * 0.25 + r() * h * 0.65; c.globalAlpha = 0.75; c.fillRect(r() * w * 0.5, y, 10 + r() * 30, 4 + r() * 14); }
    c.globalAlpha = 1; c.lineWidth = 2;
    for (let k = 0; k < 5; k++) { c.strokeStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); let x = r() * w, y = h * 0.3 + r() * h * 0.6; c.moveTo(x, y); for (let s = 0; s < 5; s++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 14; c.lineTo(x, y); } c.stroke(); }
    c.fillStyle = "rgba(70,60,45,.25)"; c.fillRect(0, h - 14, w, 14);
  }, 1);
  const eastM = [0, 1, 2].map(i => lam({ map: segTex(i) })), westM = [0, 1, 2, 3].map(i => lam({ map: graff(i) }));
  const topM = mat(0xdedbd0), sideM = mat(0xbdb9ad);
  const segGeo = new THREE.BoxGeometry(1.18, 3.6, 0.2); segGeo.translate(0, 1.8, 0);
  const footGeo = new THREE.BoxGeometry(1.18, 0.14, 1.1); footGeo.translate(0, 0.07, -0.6);
  const tubeGeo = new THREE.CylinderGeometry(0.21, 0.21, 1.17, 10); tubeGeo.rotateZ(Math.PI / 2); tubeGeo.translate(0, 3.78, 0);
  // samengevoegd per materiaal, behalve de middelste segmenten (die gaan open op 9 november)
  const merged = new Map(); const madd = (m, geo) => { if (!merged.has(m)) merged.set(m, []); merged.get(m).push(geo); };
  let i = 0;
  for (let x = -SZ / 2 + 0.6; x <= SZ / 2; x += 1.2, i++) {
    const gap = Math.abs(x) < 4.3;
    const E = eastM[i % 3], Wm = westM[(i * 7) % 4];
    const mats = [sideM, sideM, topM, sideM, Wm, E];
    if (gap) {
      const s = new THREE.Group(); const slabM = new THREE.Mesh(segGeo, mats); const foot = new THREE.Mesh(footGeo, sideM); const tube = new THREE.Mesh(tubeGeo, topM);
      s.add(slabM, foot, tube); s.position.set(x, 0, Z_WALL); s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.add(s); out.gapSegs.push(s);
    } else {
      tmp.position.set(x, 0, Z_WALL); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
      // BoxGeometry heeft 6 groepen; per vlak samenvoegen kan niet, dus per segment: 3 meshes-in-1 via groups
      const sg = segGeo.clone().applyMatrix4(tmp.matrix);
      madd(`slab:${i % 3}:${(i * 7) % 4}`, sg);
      madd("foot", footGeo.clone().applyMatrix4(tmp.matrix)); madd("tube", tubeGeo.clone().applyMatrix4(tmp.matrix));
    }
  }
  merged.forEach((geos, key) => {
    let m;
    if (key === "foot") m = sideM; else if (key === "tube") m = topM;
    else { const [, e, w] = key.split(":"); m = [sideM, sideM, topM, sideM, westM[+w], eastM[+e]]; }
    const geo = mergeGeometries(geos, false);
    if (Array.isArray(m)) { // groepen van BoxGeometry herstellen: 6 vlakken × n segmenten
      geo.clearGroups(); const per = 6, idxPerFace = 6; const n = geos.length;
      for (let s = 0; s < n; s++) for (let f = 0; f < per; f++) geo.addGroup((s * per + f) * idxPerFace, idxPerFace, f);
    }
    const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; g.add(me); geos.forEach(x => x.dispose());
  });
  out.Z = { hint: Z_HINT, fence: Z_FENCE, light: Z_LIGHT, road: Z_ROAD, sand: Z_SAND, wall: Z_WALL };
  // West: stoep en straat langs de Muur, uitkijkplatform met toeristen
  const pl = new THREE.Group(); pl.add(new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.6), mat(0x6b5a44))); pl.children[0].position.y = 2.4;
  [[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), mat(0x4a3e30)); l.position.set(x, 1.2, z); pl.add(l); });
  const stair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 2.8), mat(0x6b5a44)); stair.position.set(2, 1.2, 1.4); stair.rotation.x = -0.8; pl.add(stair);
  pl.position.set(-14, 0, Z_WALL + 1.4); g.add(pl); out.platform = pl.position.clone().add(new THREE.Vector3(0, 2.5, 0));
  return out;
}

function facadeWest(canvasTex, color, floors, seed) {
  const r = rng(seed);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const fh = h / floors;
    for (let f = 0; f < floors; f++) {
      g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, f * fh + fh - 4, w, 3);
      if (f === floors - 1) { // winkels met luifels
        const cols = ["#c42a1f", "#2a62b8", "#2f8a3e", "#e3b52a"];
        for (let k = 0; k < 2; k++) { g.fillStyle = "#2a3238"; g.fillRect(12 + k * 124, f * fh + fh * 0.35, 108, fh * 0.6); g.fillStyle = cols[Math.floor(r() * 4)]; g.fillRect(8 + k * 124, f * fh + fh * 0.18, 116, fh * 0.18); g.fillStyle = "rgba(255,255,255,.6)"; for (let s = 0; s < 116; s += 12) g.fillRect(8 + k * 124 + s, f * fh + fh * 0.18, 6, fh * 0.18); }
        continue;
      }
      for (let c = 0; c < 4; c++) { const x = c * w / 4 + 10, y = f * fh + fh * 0.2; const lit = r() < 0.3; g.fillStyle = lit ? "#f0d08a" : "#3a4248"; g.fillRect(x, y, w / 4 - 20, fh * 0.55); g.fillStyle = "rgba(255,255,255,.7)"; g.fillRect(x - 2, y + fh * 0.55, w / 4 - 16, 3); }
    }
  });
}
