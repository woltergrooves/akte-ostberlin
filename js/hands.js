// ===================== Eerste-persoonshanden in het kantoor (fase 4) =====================
// Low-poly handen als losse starre delen (PS2-stijl), armen met een eenvoudige twee-botten-IK vanaf de schouders.
// Tijdens een handeling buigt de camera naar het voorwerp toe (je leunt over het bureau), daarna terug.
import * as THREE from "three";

const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...o });
const SKIN = lam(0xd6b394), SLEEVE = lam(0x59604f), CUFF = lam(0xe6e0cf), NAIL = lam(0xe8c9b0);
const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const easeOut = k => 1 - (1 - k) * (1 - k);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let L1 = 0.42, L2 = 0.4; // bovenarm, onderarm (schalen mee met de afstand)

function makeHand(side) {
  // side = 1 (rechts) of −1 (links). Vingers wijzen langs +Z, handpalm naar −Y.
  const h = new THREE.Group(); const fingers = [];
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.026, 0.09), SKIN); palm.position.z = 0.045; h.add(palm);
  const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.02, 0.02), SKIN); knuckle.position.set(0, 0.004, 0.088); h.add(knuckle);
  [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
    const len = [0.036, 0.042, 0.04, 0.03][side > 0 ? i : 3 - i];
    const f1 = new THREE.Group(); f1.position.set(x, 0, 0.09); h.add(f1);
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, len), SKIN); s1.position.z = len / 2; f1.add(s1);
    const f2 = new THREE.Group(); f2.position.z = len; f1.add(f2);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, len * 0.85), SKIN); s2.position.z = len * 0.42; f2.add(s2);
    const nail = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.012), NAIL); nail.position.set(0, 0.009, len * 0.7); f2.add(nail);
    fingers.push([f1, f2]);
  });
  const th = new THREE.Group(); th.position.set(-0.045 * side, -0.004, 0.03); th.rotation.set(0, -0.7 * side, 0); h.add(th);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.045), SKIN); t1.position.z = 0.022; th.add(t1);
  const th2 = new THREE.Group(); th2.position.z = 0.045; th.add(th2);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.035), SKIN); t2.position.z = 0.017; th2.add(t2);
  h.userData = { fingers, thumb: [th, th2], side };
  h.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return h;
}
function curlHand(h, c, point = 0) {
  h.userData.fingers.forEach(([a, b], i) => { const cc = i === (h.userData.side > 0 ? 0 : 3) ? c * (1 - point) : c; a.rotation.x = cc * 1.25; b.rotation.x = cc * 1.4; });
  const [t, t2] = h.userData.thumb; t.rotation.x = c * 0.5; t2.rotation.x = c * 0.6;
}
const cylGeo = new THREE.CylinderGeometry(1, 0.9, 1, 7); cylGeo.translate(0, 0.5, 0);
function limb(r, mat) { const m = new THREE.Mesh(cylGeo, mat); m.userData.r = r; m.castShadow = true; return m; }
const UP = V(0, 1, 0);
function placeLimb(m, a, b) { const d = new THREE.Vector3().subVectors(b, a); const l = d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(UP, d.normalize()); m.scale.set(m.userData.r, l, m.userData.r); }

// refs: { handset, phone, stamp, folders, tw, carriage, paperNode, cup, ash, desk } ; base(): { pos, look }
export function createHands(scene, cam, refs, sfx = {}) {
  const root = new THREE.Group(); scene.add(root); root.visible = false;
  const H = [1, -1].map(side => {
    const hand = makeHand(side); root.add(hand);
    const up = limb(0.05, SLEEVE), lo = limb(0.044, SLEEVE), cuff = limb(0.047, CUFF); root.add(up, lo, cuff);
    return { side, hand, up, lo, cuff, W: V(0, 0, 0), roll: 0, pitch: 0, curl: 0.15, point: 0, on: false, yaw: 0 };
  });
  const R = H[0], Lh = H[1];
  const tw = []; let busy = false, speed = 1, held = null;
  const camO = { pos: V(), look: V(), w: 0 }; const cur = { pos: V(), look: V() };
  let baseNow = { pos: V(0, 2, 2.5), look: V(0, 1, 0) };
  function tween(dur, fn, ez = ease) { return new Promise(res => tw.push({ t: 0, dur, fn, res, ez })); }
  const wait = d => tween(d, () => { });

  // ----- geometrie: schouders volgen de camera -----
  const right = V(), upv = V(), fwd = V();
  function basis() { fwd.subVectors(cur.look, cur.pos).normalize(); right.crossVectors(fwd, UP).normalize(); upv.crossVectors(right, fwd).normalize(); }
  // De 'schouder' ligt net onder de onderrand van het beeld, op de afstand van de hand: zo komen de armen altijd van onderen in beeld.
  const TANV = Math.tan(THREE.MathUtils.degToRad((cam.fov || 60) / 2));
  function shoulder(h) { const d = Math.max(0.25, Math.min(3, h.W.clone().sub(cur.pos).dot(fwd) - 0.42)); return cur.pos.clone().addScaledVector(fwd, d).addScaledVector(upv, -d * TANV * 1.25 - 0.06).addScaledVector(right, (0.1 + d * 0.12) * h.side); }
  function restPos(h) { return cur.pos.clone().addScaledVector(fwd, 0.32).addScaledVector(upv, -0.62).addScaledVector(right, 0.24 * h.side); }
  const m4 = new THREE.Matrix4(), qr = new THREE.Quaternion();
  function solve(h) {
    if (!h.on) { h.hand.visible = h.up.visible = h.lo.visible = h.cuff.visible = false; return; }
    h.hand.visible = h.up.visible = h.lo.visible = h.cuff.visible = true;
    const S = shoulder(h), W = h.W; const d = new THREE.Vector3().subVectors(W, S); let len = d.length(); L1 = Math.max(0.3, len * 0.58); L2 = L1 * 0.95;
    const reach = L1 + L2 - 0.005; if (len > reach) { d.setLength(reach); len = reach; }
    const dir = d.clone().normalize(); const a = (L1 * L1 - L2 * L2 + len * len) / (2 * len); const hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const pole = upv.clone().multiplyScalar(-1).addScaledVector(right, 0.7 * h.side); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const E = S.clone().addScaledVector(dir, a).addScaledVector(pole, hh); const Wp = S.clone().add(d);
    placeLimb(h.up, S, E); placeLimb(h.lo, E, Wp); const cuffA = Wp.clone().lerp(E, 0.13); placeLimb(h.cuff, cuffA, Wp.clone().lerp(E, 0.02));
    // hand: Z langs de onderarm (met knik), palm omlaag, dan rol
    const z = new THREE.Vector3().subVectors(Wp, E).normalize(); z.addScaledVector(upv, -h.pitch).normalize();
    const x = new THREE.Vector3().crossVectors(UP, z).normalize(); if (x.lengthSq() < 0.01) x.copy(right); const y = new THREE.Vector3().crossVectors(z, x);
    m4.makeBasis(x, y, z); h.hand.quaternion.setFromRotationMatrix(m4); h.hand.quaternion.multiply(qr.setFromAxisAngle(V(0, 0, 1), h.roll * h.side)); h.hand.quaternion.multiply(qr.setFromAxisAngle(V(0, 1, 0), h.yaw * h.side));
    h.hand.position.copy(Wp); curlHand(h.hand, h.curl, h.point);
  }
  // ----- bewegingen -----
  function move(h, to, dur, o = {}) {
    const a = h.W.clone(), r0 = h.roll, c0 = h.curl, p0 = h.pitch, pt0 = h.point, y0 = h.yaw; h.on = true;
    return tween(dur * speed, k => { const T = typeof to === "function" ? to() : to; h.W.lerpVectors(a, T, k); if (o.roll !== undefined) h.roll = r0 + (o.roll - r0) * k; if (o.curl !== undefined) h.curl = c0 + (o.curl - c0) * k; if (o.pitch !== undefined) h.pitch = p0 + (o.pitch - p0) * k; if (o.point !== undefined) h.point = pt0 + (o.point - pt0) * k; if (o.yaw !== undefined) h.yaw = y0 + (o.yaw - y0) * k; if (o.arc) h.W.addScaledVector(UP, Math.sin(k * Math.PI) * o.arc); }, o.ez || ease);
  }
  function enter(h) { h.W.copy(restPos(h)); h.on = true; h.curl = 0.2; h.roll = 0; h.pitch = 0; h.point = 0; h.yaw = 0; }
  async function leave(h, dur = 0.35) { await move(h, () => restPos(h), dur, { curl: 0.2 }); h.on = false; }
  function lean(pos, look, dur = 0.45) {
    const p0 = camO.w > 0 ? camO.pos.clone() : baseNow.pos.clone(), l0 = camO.w > 0 ? camO.look.clone() : baseNow.look.clone(), w0 = camO.w;
    return tween(dur * speed, k => { camO.pos.lerpVectors(p0, pos, k); camO.look.lerpVectors(l0, look, k); camO.w = w0 + (1 - w0) * k; });
  }
  function unlean(dur = 0.5) { const w0 = camO.w; return tween(dur * speed, k => { camO.w = w0 * (1 - k); }); }
  const wp = o => o.getWorldPosition(new THREE.Vector3());
  // half naar het voorwerp toe leunen: niet te dichtbij, anders vult het hele beeld
  function leanAt(P, amt = 0.45, dur = 0.45) { const view = P.clone().add(V(0.12, 0.95, 1.15)); return lean(baseNow.pos.clone().lerp(view, amt), baseNow.look.clone().lerp(P, 0.75), dur); }
  async function run(fn) { if (busy) return false; busy = true; root.visible = true; speed = 1; try { await fn(); } finally { busy = false; if (!R.on && !Lh.on && !held) root.visible = false; } return true; }

  // ----- telefoon -----
  let hsParent = null, hsLocal = null;
  async function phoneUp(cb) {
    if (held || !refs.handset) { cb && cb(); return; }
    const ok = await run(async () => {
      const hs = refs.handset; const P0 = wp(hs);
      enter(R);
      await Promise.all([leanAt(P0, 0.5), move(R, V(P0.x + 0.02, P0.y + 0.12, P0.z + 0.1), 0.45, { curl: 0.2, roll: 0.25 })]);
      await move(R, V(P0.x + 0.01, P0.y + 0.035, P0.z + 0.04), 0.16, { curl: 0.85, roll: 0.35 });
      sfx.click && sfx.click();
      hsParent = hs.parent; hsLocal = { p: hs.position.clone(), q: hs.quaternion.clone(), s: hs.scale.clone() };
      R.hand.attach(hs); held = hs;
      // naar het oor: rechts van het beeld, dicht bij de camera
      await Promise.all([move(R, () => cur.pos.clone().addScaledVector(fwd, 0.3).addScaledVector(right, 0.085).addScaledVector(upv, -0.13), 0.5, { curl: 0.85, roll: 1.1, pitch: -0.5 }), lean(baseNow.pos.clone().add(V(-0.05, -0.05, -0.15)), baseNow.look.clone().add(V(-0.25, 0, 0)), 0.5)]);
    });
    cb && cb(); return ok;
  }
  async function phoneDown(cb) {
    if (!held || !hsParent) { cb && cb(); return; }
    busy = false; // ophangen mag altijd
    await run(async () => {
      const hs = held; const tmp = new THREE.Object3D(); hsParent.add(tmp); tmp.position.copy(hsLocal.p); const P0 = wp(tmp); hsParent.remove(tmp);
      await Promise.all([leanAt(P0, 0.5, 0.4), move(R, V(P0.x + 0.01, P0.y + 0.035, P0.z + 0.04), 0.42, { roll: 0.35, pitch: 0, arc: 0.06 })]);
      hsParent.attach(hs); hs.position.copy(hsLocal.p); hs.quaternion.copy(hsLocal.q); hs.scale.copy(hsLocal.s); held = null;
      sfx.click && sfx.click();
      await Promise.all([leave(R, 0.35), unlean(0.5)]);
    });
    cb && cb();
  }

  // ----- dossier pakken en openslaan -----
  const fTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 80; const g = c.getContext("2d"); g.fillStyle = "#efe9d8"; g.fillRect(0, 0, 64, 80); g.fillStyle = "#3a352c"; g.fillRect(6, 6, 30, 4); for (let y = 16; y < 76; y += 5) g.fillRect(6, y, 20 + ((y * 7) % 30), 2); g.strokeStyle = "#a3241c"; g.lineWidth = 2; g.strokeRect(40, 6, 18, 10); const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const fold = new THREE.Group(); fold.visible = false; scene.add(fold);
  fold.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.006, 0.42), lam(0xcbb98a)));
  const sheetM = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.37), lam(0xffffff, { map: fTex })); sheetM.rotation.x = -Math.PI / 2; sheetM.position.y = 0.0045; fold.add(sheetM);
  const hinge = new THREE.Group(); hinge.position.set(-0.16, 0.007, 0); fold.add(hinge);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.005, 0.42), lam(0xcbb98a)); cover.position.x = 0.16; hinge.add(cover);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.006, 0.04), lam(0xa3241c)); stripe.position.set(0.16, 0.001, -0.15); hinge.add(stripe);
  async function openFile(cb) {
    const f = refs.folders && refs.folders.children[refs.folders.children.length - 1];
    if (!f) { cb && cb(); return; }
    await run(async () => {
      const P0 = wp(f); enter(Lh); enter(R);
      await Promise.all([leanAt(P0, 0.45), move(Lh, V(P0.x - 0.17, P0.y + 0.03, P0.z + 0.08), 0.45, { curl: 0.55, roll: 0.9 })]);
      // map vastpakken: echte map verstoppen, leesmap op dezelfde plek
      f.visible = false; fold.visible = true; fold.position.copy(P0); fold.quaternion.copy(f.getWorldQuaternion(new THREE.Quaternion())); hinge.rotation.z = 0; sfx.paper && sfx.paper();
      const q0 = fold.quaternion.clone(), p0 = fold.position.clone();
      const readPos = () => cur.pos.clone().addScaledVector(fwd, 0.95).addScaledVector(upv, -0.2);
      const qRead = () => { const m = new THREE.Matrix4(); const z = upv.clone().multiplyScalar(-1).addScaledVector(fwd, -0.9).normalize(); const y = fwd.clone().multiplyScalar(-1).addScaledVector(upv, 0.4).normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize(); const z2 = new THREE.Vector3().crossVectors(x, y); m.makeBasis(x, y, z2); return new THREE.Quaternion().setFromRotationMatrix(m); };
      await Promise.all([
        tween(0.45 * speed, k => { fold.position.lerpVectors(p0, readPos(), k); fold.quaternion.slerpQuaternions(q0, qRead(), k); Lh.W.copy(fold.localToWorld(V(-0.15, 0.01, 0.1))); }),
        move(R, () => fold.localToWorld(V(0.14, 0.03, 0.12)), 0.45, { curl: 0.3, roll: -0.4 }),
      ]);
      // omslag openslaan
      await tween(0.35 * speed, k => { hinge.rotation.z = k * 2.9; Lh.W.copy(fold.localToWorld(V(-0.15, 0.01, 0.1))); R.W.copy(hinge.localToWorld(V(0.3, 0.02, 0.12))); });
      sfx.paper && sfx.paper();
      cb && cb(); cb = null;
      await wait(0.25);
      fold.visible = false; f.visible = true; R.on = Lh.on = false; camO.w = 0;
    });
    if (cb) cb();
  }

  // ----- stempelen -----
  const pTex = document.createElement("canvas"); pTex.width = 96; pTex.height = 128; const pg = pTex.getContext("2d");
  const paperTex = new THREE.CanvasTexture(pTex); paperTex.magFilter = paperTex.minFilter = THREE.NearestFilter; paperTex.colorSpace = THREE.SRGBColorSpace;
  function drawPaper(word) {
    pg.setTransform(1, 0, 0, 1, 0, 0); pg.fillStyle = "#f1ecdd"; pg.fillRect(0, 0, 96, 128); pg.fillStyle = "#2e2a24"; pg.fillRect(8, 8, 46, 5);
    for (let y = 22; y < 118; y += 6) pg.fillRect(8, y, 30 + ((y * 13) % 48), 2);
    if (word) { pg.translate(50, 80); pg.rotate(-0.22); pg.strokeStyle = word === "GENEHMIGT" ? "#a3241c" : "#1f3f86"; pg.fillStyle = pg.strokeStyle; pg.lineWidth = 3; pg.strokeRect(-42, -13, 84, 26); pg.font = "bold 13px Arial"; pg.textAlign = "center"; pg.fillText(word, 0, 5); }
    paperTex.needsUpdate = true;
  }
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), lam(0xffffff, { map: paperTex })); paper.rotation.x = -Math.PI / 2; paper.visible = false; paper.receiveShadow = true; scene.add(paper);
  async function stamp(word, cb) {
    const st = refs.stamp; if (!st) { cb && cb(); return; }
    await run(async () => {
      drawPaper(null); const D = refs.desk; paper.position.set(0.5, D + 0.008, 0.2); paper.rotation.z = 0.25; paper.visible = true;
      const S0 = wp(st), home = { p: st.position.clone(), parent: st.parent, q: st.quaternion.clone() };
      enter(R); enter(Lh);
      await Promise.all([leanAt(V(0.55, D, 0.32), 0.5), move(R, V(S0.x, S0.y + 0.15, S0.z + 0.05), 0.42, { curl: 0.4, roll: 0.2 }), move(Lh, V(0.36, D + 0.03, 0.36), 0.42, { curl: 0.15 })]);
      await move(R, V(S0.x, S0.y + 0.075, S0.z + 0.02), 0.12, { curl: 0.9 });
      R.hand.attach(st);
      const pad = refs.pad ? wp(refs.pad) : V(S0.x - 0.1, S0.y, S0.z + 0.07);
      await move(R, V(pad.x, pad.y + 0.16, pad.z + 0.02), 0.22, { arc: 0.05 });
      await move(R, V(pad.x, pad.y + 0.1, pad.z + 0.02), 0.08, {}); await move(R, V(pad.x, pad.y + 0.16, pad.z + 0.02), 0.1, {});
      const tgt = V(paper.position.x + 0.01, D, paper.position.z + 0.02);
      await move(R, V(tgt.x, tgt.y + 0.3, tgt.z), 0.25, { arc: 0.04 });
      await move(R, V(tgt.x, tgt.y + 0.105, tgt.z), 0.07, {}, easeOut);
      drawPaper(word); sfx.stamp && sfx.stamp(); pulse = 0.2;
      await wait(0.18);
      await move(R, V(tgt.x, tgt.y + 0.28, tgt.z), 0.16, {});
      await move(R, V(S0.x, S0.y + 0.075, S0.z + 0.02), 0.3, { arc: 0.05 });
      home.parent.attach(st); st.position.copy(home.p); st.quaternion.copy(home.q);
      await Promise.all([leave(R), leave(Lh), unlean(0.5), tween(0.4, k => { paper.position.x = 0.5 - k * 0.5; paper.position.z = 0.2 - k * 0.15; paper.position.y = D + 0.008 + k * 0.03; })]);
      paper.visible = false;
    });
    cb && cb();
  }

  // ----- typen bij Afsluiten -----
  async function type(cb) {
    const T = refs.tw; if (!T) { cb && cb(); return; }
    await run(async () => {
      const kb = T.localToWorld(V(0, refs.desk + 0.1, 0.08)), K = (dx, dz = 0) => T.localToWorld(V(dx, refs.desk + 0.11, 0.07 + dz));
      enter(R); enter(Lh);
      await Promise.all([leanAt(kb, 0.5), move(R, K(0.07), 0.45, { curl: 0.55, pitch: 0.35 }), move(Lh, K(-0.07), 0.45, { curl: 0.55, pitch: 0.35 })]);
      const car = refs.carriage, c0 = car ? car.position.x : 0;
      for (let i = 0; i < 14; i++) {
        const h = i % 2 ? R : Lh; const x = (h.side * 0.035) + ((i * 37) % 7 - 3) * 0.012, z = ((i * 13) % 3) * 0.02;
        await move(h, K(x, -z).add(V(0, -0.025, 0)), 0.05, { point: 0.8 }); sfx.key && sfx.key();
        if (car) car.position.x = c0 - (i + 1) * 0.0065;
        await move(h, K(x, -z), 0.05, {});
      }
      // papier eruit trekken
      const pp = refs.paperNode; const pw = pp ? wp(pp) : kb;
      await Promise.all([move(R, V(pw.x, pw.y + 0.1, pw.z), 0.25, { curl: 0.85, point: 0, pitch: 0, roll: 1.3 }), leave(Lh, 0.3)]);
      sfx.paper && sfx.paper();
      if (pp) { const y0 = pp.position.y; await Promise.all([move(R, V(pw.x, pw.y + 0.36, pw.z + 0.06), 0.3, {}), tween(0.3, k => { pp.position.y = y0 + k * 0.26; })]); pp.visible = false; pp.position.y = y0; }
      if (car) await tween(0.25, k => { car.position.x = car.position.x + (c0 - car.position.x) * k; });
      sfx.ding && sfx.ding();
      await Promise.all([leave(R), unlean(0.45)]);
      if (pp) pp.visible = true;
    });
    cb && cb();
  }

  // ----- even niets doen: koffie drinken of een sigaret -----
  const cig = new THREE.Group(); const cigB = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.075, 6), lam(0xefebe2)); cigB.rotation.z = Math.PI / 2; cig.add(cigB);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.008, 6), new THREE.MeshBasicMaterial({ color: 0xff7a2a })); tip.rotation.z = Math.PI / 2; tip.position.x = 0.04; cig.add(tip);
  cig.visible = false; scene.add(cig);
  const puffs = []; const puffMat = new THREE.MeshBasicMaterial({ color: 0xd8d4cc, transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), puffMat.clone()); m.visible = false; scene.add(m); puffs.push(m); }
  let puffT = -1, pulse = 0;
  async function idle(kind) {
    await run(async () => {
      if (kind === "coffee" && refs.cup) {
        const c = refs.cup, P0 = wp(c), home = { parent: c.parent, p: c.position.clone(), q: c.quaternion.clone() };
        enter(Lh);
        await move(Lh, V(P0.x + 0.05, P0.y + 0.06, P0.z + 0.03), 0.6, { curl: 0.7, roll: 1.3 });
        Lh.hand.attach(c);
        await move(Lh, () => cur.pos.clone().addScaledVector(fwd, 0.2).addScaledVector(upv, -0.16), 0.6, { pitch: 0.2 });
        await tween(0.5, k => { Lh.pitch = 0.2 - Math.sin(k * Math.PI) * 0.6; });
        await wait(0.3);
        await move(Lh, V(P0.x + 0.05, P0.y + 0.06, P0.z + 0.03), 0.55, { pitch: 0 });
        home.parent.attach(c); c.position.copy(home.p); c.quaternion.copy(home.q);
        await leave(Lh, 0.5);
      } else if (refs.ash) {
        const A = refs.ash.clone(); enter(R);
        cig.visible = true; cig.position.copy(A).add(V(0.03, 0.025, 0)); cig.rotation.set(0, 0.4, 0.1);
        await move(R, V(A.x + 0.04, A.y + 0.06, A.z + 0.03), 0.6, { curl: 0.5, point: 0.5, roll: 0.5 });
        R.hand.attach(cig);
        await move(R, () => cur.pos.clone().addScaledVector(fwd, 0.17).addScaledVector(upv, -0.12).addScaledVector(right, 0.04), 0.6, {});
        await tween(0.6, k => { tip.material.color.setHSL(0.06, 1, 0.5 + Math.sin(k * Math.PI) * 0.25); });
        await move(R, () => cur.pos.clone().addScaledVector(fwd, 0.35).addScaledVector(upv, -0.3).addScaledVector(right, 0.12), 0.45, {});
        puffT = 0; await wait(0.9);
        await move(R, V(A.x + 0.04, A.y + 0.06, A.z + 0.03), 0.55, {});
        scene.attach(cig); cig.visible = false;
        await leave(R, 0.5);
      }
    });
  }

  return {
    busy: () => busy || !!held,
    holding: () => !!held,
    skip() { speed = 0.25; },
    phoneUp, phoneDown, openFile, stamp, type, idle,
    // na elke frame: camera-correctie toepassen en armen oplossen
    update(dt, base) {
      baseNow = base;
      for (let i = tw.length - 1; i >= 0; i--) { const x = tw[i]; x.t += dt / Math.max(0.001, speed) * speed; const k = Math.min(1, x.t / (x.dur || 0.001)); x.fn(x.ez(k)); if (k >= 1) { tw.splice(i, 1); x.res(); } }
      const w = camO.w; cur.pos.copy(base.pos).lerp(camO.pos, w); cur.look.copy(base.look).lerp(camO.look, w);
      if (pulse > 0) { pulse -= dt; cur.pos.y -= Math.max(0, pulse) * 0.08; }
      cam.position.copy(cur.pos); cam.lookAt(cur.look);
      basis(); if (root.visible) { solve(R); solve(Lh); }
      if (puffT >= 0) { puffT += dt; puffs.forEach((m, i) => { const k = puffT - i * 0.08; m.visible = k > 0 && k < 1.6; if (!m.visible) return; m.position.copy(cur.pos).addScaledVector(fwd, 0.25 + k * 0.5).addScaledVector(upv, -0.1 + k * 0.15).addScaledVector(right, Math.sin(i * 2 + k * 3) * 0.06); m.scale.setScalar(1 + k * 3); m.material.opacity = 0.35 * (1 - k / 1.6); }); if (puffT > 2.2) { puffT = -1; puffs.forEach(m => m.visible = false); } }
      return w;
    },
  };
}
