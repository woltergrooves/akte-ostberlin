// ===================== 3D: kantoor + wijk (Three.js) =====================
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BUILDINGS } from "./data.js";

const SHORT = { kollwitz: "Kollwitz 12", lychener: "Lychener 40", greif: "Greifswalder", dimi: "Dimitroff", kerk: "Zionskirche", fabriek: "Bergmann-Borsig", school: "EOS-school", kliniek: "Poliklinik", cafe: "Café Mosaik", konsum: "Kaufhalle", mfs: "MfS" };
const CELL = 6.5;

function canvasTex(w, h, draw, k = 0.5) {
  const c = document.createElement("canvas"); c.width = Math.max(8, Math.round(w * k)); c.height = Math.max(8, Math.round(h * k));
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.scale(k, k); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.userData = { canvas: c, ctx: g, draw, k };
  return t;
}
// PS2-stijl: Lambert (gouraud) shading, facetten
function lam(o = {}) { const { roughness, metalness, ...rest } = o; return new THREE.MeshLambertMaterial({ flatShading: true, ...rest }); }
const mat = (color, o = {}) => lam({ color, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0, cast = true) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z);
  me.castShadow = cast; me.receiveShadow = true; return me;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 8) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z);
  me.castShadow = true; me.receiveShadow = true; return me;
}
const hex = n => "#" + n.toString(16).padStart(6, "0");
function shade(n, f) { const c = new THREE.Color(n); c.multiplyScalar(f); return "#" + c.getHexString(); }

// ---------- gevelteksturen ----------
function facadeAltbau(color, floors, cols, seed) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = hex(color); g.fillRect(0, 0, w, h);
    // vlekken / roet
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,35,30,${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 30); }
    const fh = h / floors;
    for (let f = 0; f < floors; f++) {
      g.fillStyle = shade(color, 0.8); g.fillRect(0, f * fh + fh - 5, w, 4); // lijst
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.25) * (w / cols), y = f * fh + fh * 0.22, ww = w / cols * 0.5, hh = fh * 0.55;
        g.fillStyle = shade(color, 1.15); g.fillRect(x - 3, y - 4, ww + 6, hh + 8);
        const lit = rnd() < 0.25;
        g.fillStyle = lit ? "#e8c27a" : rnd() < 0.5 ? "#2c3136" : "#3d454c"; g.fillRect(x, y, ww, hh);
        g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * 0.4, ww, 2);
      }
    }
  });
}
function facadePlatte(color, floors, cols, seed) {
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = hex(color); g.fillRect(0, 0, w, h);
    const fh = h / floors, cw = w / cols;
    g.strokeStyle = shade(color, 0.75); g.lineWidth = 2;
    for (let f = 0; f <= floors; f++) { g.beginPath(); g.moveTo(0, f * fh); g.lineTo(w, f * fh); g.stroke(); }
    for (let c = 0; c <= cols; c++) { g.beginPath(); g.moveTo(c * cw, 0); g.lineTo(c * cw, h); g.stroke(); }
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const lit = rnd() < 0.22;
      g.fillStyle = lit ? "#e9c57f" : "#353b40"; g.fillRect(c * cw + cw * 0.2, f * fh + fh * 0.25, cw * 0.6, fh * 0.45);
      if (c % 2 === 0 && rnd() < 0.6) { g.fillStyle = shade(color, 0.85); g.fillRect(c * cw + 2, f * fh + fh * 0.7, cw - 4, fh * 0.25); }
    }
  });
}

export function createWorld(container, H) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(0.5);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.domElement.style.imageRendering = "pixelated";
  // ---- PS2-nabewerking: lage resolutie, 15-bit kleur met ordered dither, lichte vignet ----
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
  const postScene = new THREE.Scene(); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, exposure: { value: 1.1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
      float bayer(vec2 p){ p = mod(floor(p), 4.0); float a = mod(p.x,2.0), b = mod(p.y,2.0), c = floor(p.x/2.0), d = floor(p.y/2.0);
        return (4.0*(a*2.0+b*3.0-4.0*a*b) + (c*2.0+d*3.0-4.0*c*d)) / 16.0; }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb * exposure;
        c = (c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
        c = pow(clamp(c, 0.0, 1.0), vec3(1.0/2.2));
        float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, 1.12); c = (c - 0.5) * 1.06 + 0.5;
        c = floor(c * 31.0 + bayer(gl_FragCoord.xy)) / 31.0;
        vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.55;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  function draw(scene, cam) { renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
  container.appendChild(renderer.domElement);
  const labelsEl = document.getElementById("labels");

  let mode = "office";
  const clock = new THREE.Clock();

  // ======================= KANTOOR =======================
  const O = new THREE.Scene();
  O.background = new THREE.Color(0x1a1a17);
  O.fog = new THREE.Fog(0x1a1a17, 4, 9);
  const oCam = new THREE.PerspectiveCamera(55, 1, 0.05, 30);
  const oTarget = new THREE.Vector3(0, 0.98, -0.45);
  O.add(new THREE.AmbientLight(0x8a8370, 0.75));
  const winLight = new THREE.DirectionalLight(0xbcc6d4, 0.9); winLight.position.set(0.5, 2.6, -3); winLight.target.position.set(0, 0.7, 0);
  winLight.castShadow = true; winLight.shadow.mapSize.set(1024, 1024);
  Object.assign(winLight.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 8 });
  O.add(winLight, winLight.target);
  const lampLight = new THREE.PointLight(0xffc77a, 7, 4.5, 1.4); lampLight.position.set(-0.82, 1.15, -0.28); lampLight.castShadow = true; lampLight.shadow.mapSize.set(512, 512);
  O.add(lampLight);

  const tappables = []; // {obj, key, label, anchor}
  function tappable(obj, key, label, anchor) { obj.traverse(m => m.userData.tap = key); tappables.push({ obj, key, label, anchor: anchor || obj.position.clone().add(new THREE.Vector3(0, 0.2, 0)) }); }

  // vloer & muren
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat(0x5a4c3a, { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; O.add(floor);
  const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#5e503d"; g.fillRect(0, 0, w, h); g.strokeStyle = "#4a3f30"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4, 4); floor.material.map = floorTex; floor.material.color.set(0xffffff);

  const wallMat = mat(0xb8ad8c);
  const back = box(8, 3.2, 0.1, wallMat, 0, 1.6, -1.65, false); O.add(back);
  const left = box(0.1, 3.2, 6, wallMat, -2.4, 1.6, 0, false); O.add(left);
  const right = box(0.1, 3.2, 6, wallMat, 2.4, 1.6, 0, false); O.add(right);
  const panelMat = mat(0x6b5236, { roughness: 0.6 });
  O.add(box(8, 0.95, 0.06, panelMat, 0, 0.475, -1.58, false));
  O.add(box(0.06, 0.95, 6, panelMat, -2.33, 0.475, 0, false));
  O.add(box(0.06, 0.95, 6, panelMat, 2.33, 0.475, 0, false));
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat(0x8e8670)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.2; O.add(ceil);

  // raam met uitzicht
  const cityTex = canvasTex(512, 320, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#5b6472"); grd.addColorStop(1, "#a7a296"); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // tv-toren
    g.fillStyle = "#3a3f46"; g.fillRect(w * 0.7, h * 0.08, 6, h); g.beginPath(); g.arc(w * 0.7 + 3, h * 0.3, 16, 0, Math.PI * 2); g.fill(); g.fillRect(w * 0.7 + 1, 0, 2, h * 0.1);
    let x = 0; while (x < w) { const bw = 30 + Math.random() * 60, bh = 60 + Math.random() * 140; g.fillStyle = `rgb(${60 + Math.random() * 20},${62 + Math.random() * 20},${66 + Math.random() * 20})`; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (Math.random() < 0.25) { g.fillStyle = "#e2c07a"; g.fillRect(xx, yy, 4, 5); } x += bw + 2; }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), new THREE.MeshBasicMaterial({ map: cityTex }));
  win.position.set(0.55, 1.75, -1.595); O.add(win);
  const frameMat = mat(0xe5e0d2);
  [[0, 0.55, 1.6, 0.05], [0, -0.55, 1.6, 0.05], [-0.77, 0, 0.05, 1.15], [0.77, 0, 0.05, 1.15], [0, 0, 0.03, 1.1]].forEach(([x, y, w, h]) => O.add(box(w, h, 0.05, frameMat, 0.55 + x, 1.75 + y, -1.58, false)));
  for (let i = 0; i < 9; i++) O.add(box(1.5, 0.025, 0.02, mat(0xd8d0b8), 0.55, 2.25 - i * 0.055, -1.555, false)); // jaloezie, half open

  // kalender aan de muur
  let calText = ["", ""];
  const calTex = canvasTex(256, 320, (g, w, h) => { }, 1);
  function drawCal() {
    const g = calTex.userData.ctx; g.setTransform(1, 0, 0, 1, 0, 0); const w = 256, h = 320;
    g.fillStyle = "#efe9d8"; g.fillRect(0, 0, w, h); g.fillStyle = "#a3241c"; g.fillRect(0, 0, w, 70);
    g.fillStyle = "#fff"; g.font = "bold 30px Georgia"; g.textAlign = "center"; g.fillText(calText[1] || "", w / 2, 48);
    g.fillStyle = "#2a2620"; g.font = "bold 46px Georgia"; g.fillText(calText[0] || "", w / 2, 140);
    g.strokeStyle = "#999"; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.strokeRect(18 + c * 32, 170 + r * 28, 30, 26);
    calTex.needsUpdate = true;
  }
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.48), lam({ map: calTex, roughness: 0.9 }));
  cal.position.set(-0.45, 1.72, -1.59); O.add(cal);
  tappable(cal, "kalender", "Jaardoelen", new THREE.Vector3(-0.45, 1.42, -1.55));

  // kaart van de wijk aan de muur
  const mapTex = canvasTex(320, 256, (g, w, h) => {
    g.fillStyle = "#ddd5bd"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8f8670"; g.lineWidth = 6; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * w / 6, 0); g.lineTo(i * w / 6, h); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
    g.fillStyle = "#a3241c"; [[60, 50], [200, 120], [130, 190], [250, 60]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); });
    g.strokeStyle = "#555"; g.lineWidth = 8; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(0, h - 12); g.lineTo(w, h - 12); g.stroke();
    g.fillStyle = "#2a2620"; g.font = "bold 18px Georgia"; g.fillText("PRENZLAUER BERG", 12, 24);
  });
  const mapG = new THREE.Group();
  const mapM = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.76), lam({ map: mapTex, roughness: 0.9 }));
  mapG.add(mapM); mapG.add(box(1.0, 0.81, 0.02, mat(0x3a2c1d), 0, 0, -0.012, false));
  mapG.position.set(-1.2, 1.62, -1.58); O.add(mapG);
  tappable(mapG, "wijk", "Kaart: naar de wijk", new THREE.Vector3(-1.2, 2.06, -1.5));

  // klok
  const clockG = new THREE.Group();
  clockG.add(cyl(0.16, 0.16, 0.04, mat(0xf2efe6), 0, 0, 0, 32)); clockG.children[0].rotation.x = Math.PI / 2;
  const hand1 = box(0.012, 0.11, 0.01, mat(0x111111), 0, 0.05, 0.03, false); const hand2 = box(0.016, 0.075, 0.01, mat(0x111111), 0, 0.035, 0.035, false);
  const h1 = new THREE.Group(); h1.add(hand1); const h2 = new THREE.Group(); h2.add(hand2); clockG.add(h1, h2);
  clockG.position.set(-0.45, 2.3, -1.58); O.add(clockG);

  // bureau
  const DESK_Y = 0.76;
  const woodTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#5a3d24"; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(30,18,8,${0.1 + Math.random() * 0.2})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + Math.random() * 10 - 5, w * 2 / 3, y + Math.random() * 10 - 5, w, y); g.stroke(); } });
  const deskMat = mat(0xffffff, { map: woodTex, roughness: 0.55 });
  const desk = new THREE.Group();
  desk.add(box(2.3, 0.06, 2.5, deskMat, 0, DESK_Y - 0.03, 0.4));
  // voorgrond: krant, notitieblok, stempel
  const newsTex = canvasTex(256, 320, (g, w, h) => { g.fillStyle = "#e6e0cf"; g.fillRect(0, 0, w, h); g.fillStyle = "#222"; g.font = "bold 30px Georgia"; g.fillText("DIE TRIBÜNE", 14, 38); g.fillRect(10, 48, w - 20, 3); g.font = "bold 20px Georgia"; g.fillText("Plan zu 104% erfüllt", 14, 80); g.fillStyle = "#555"; for (let y = 96; y < h - 10; y += 9) g.fillRect(14 + ((y / 9) % 3 === 0 ? 120 : 0), y, (y / 9) % 3 === 0 ? 100 : 228, 4); g.fillStyle = "#777"; g.fillRect(14, 100, 110, 80); });
  const news = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), lam({ map: newsTex, roughness: 0.95 })); news.rotation.set(-Math.PI / 2, 0, 0.35); news.position.set(0.32, DESK_Y + 0.004, 0.85); news.receiveShadow = true; desk.add(news);
  const pad = box(0.24, 0.012, 0.32, mat(0xefe9d6), -0.42, DESK_Y + 0.006, 0.8); pad.rotation.y = -0.2; desk.add(pad);
  const pen = cyl(0.008, 0.008, 0.16, mat(0x1b2a4a, { roughness: 0.3 }), -0.38, DESK_Y + 0.02, 0.78, 8); pen.rotation.set(Math.PI / 2, 0, 0.9); desk.add(pen);
  const stamp = new THREE.Group(); stamp.add(cyl(0.035, 0.04, 0.03, mat(0x3a2a1c), 0, DESK_Y + 0.015, 0)); stamp.add(cyl(0.015, 0.015, 0.07, mat(0x5a3d24), 0, DESK_Y + 0.065, 0, 10)); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat(0x2a1d12, { roughness: 0.3 })); knob.position.y = DESK_Y + 0.11; stamp.add(knob);
  stamp.position.set(0.72, 0, 0.5); desk.add(stamp);
  desk.add(cyl(0.05, 0.05, 0.012, mat(0x7a1b16), 0.62, DESK_Y + 0.006, 0.58, 16));
  desk.add(box(0.6, DESK_Y - 0.06, 0.95, deskMat, 0.75, (DESK_Y - 0.06) / 2, -0.25));
  desk.add(box(0.6, DESK_Y - 0.06, 0.95, deskMat, -0.75, (DESK_Y - 0.06) / 2, -0.25));
  for (let i = 0; i < 3; i++) { desk.add(box(0.5, 0.18, 0.01, mat(0x4a321e), 0.75, 0.15 + i * 0.22, 0.226)); desk.add(box(0.12, 0.02, 0.03, mat(0xb8a878, { metalness: 0.7, roughness: 0.3 }), 0.75, 0.2 + i * 0.22, 0.24)); }
  const blotter = box(0.9, 0.006, 0.55, mat(0x2f4a35), 0, DESK_Y + 0.003, -0.15); desk.add(blotter);
  O.add(desk);

  // lamp
  const lamp = new THREE.Group();
  const brass = mat(0xb39a5b, { metalness: 0.8, roughness: 0.35 });
  lamp.add(cyl(0.09, 0.11, 0.03, brass, 0, DESK_Y + 0.015, 0));
  lamp.add(cyl(0.012, 0.012, 0.36, brass, 0, DESK_Y + 0.2, 0));
  const shadeM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.12, 24, 1, true), lam({ color: 0x1e5a34, side: THREE.DoubleSide, roughness: 0.4, emissive: 0x0a2a14 }));
  shadeM.position.set(0, DESK_Y + 0.4, 0); lamp.add(shadeM);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a8 })); bulb.position.set(0, DESK_Y + 0.37, 0); lamp.add(bulb);
  lamp.position.set(-0.82, 0, -0.55); O.add(lamp);
  lampLight.position.set(-0.82, DESK_Y + 0.33, -0.55);

  // telefoon (W63-achtig)
  const phone = new THREE.Group();
  const phMat = mat(0x6d1f1a, { roughness: 0.35 });
  const body = box(0.24, 0.09, 0.2, phMat, 0, DESK_Y + 0.045, 0); phone.add(body);
  const top = box(0.2, 0.04, 0.12, phMat, 0, DESK_Y + 0.1, -0.02); phone.add(top);
  const dial = cyl(0.065, 0.065, 0.012, mat(0xe8e2d0), 0, DESK_Y + 0.095, 0.06, 24); dial.rotation.x = -0.5; phone.add(dial);
  const handset = new THREE.Group();
  handset.add(box(0.26, 0.035, 0.05, phMat, 0, 0, 0)); handset.add(box(0.07, 0.05, 0.065, phMat, -0.11, -0.01, 0)); handset.add(box(0.07, 0.05, 0.065, phMat, 0.11, -0.01, 0));
  handset.position.set(0, DESK_Y + 0.14, -0.02); phone.add(handset);
  phone.position.set(-0.45, 0, -0.08); phone.rotation.y = 0.35; O.add(phone);
  tappable(phone, "telefoon", "Telefoon", new THREE.Vector3(-0.45, DESK_Y + 0.32, -0.08));

  // dossierstapel
  const folders = new THREE.Group(); folders.position.set(0.05, DESK_Y, 0.02); O.add(folders);
  const folderMat = mat(0xcbb98a, { roughness: 0.9 });
  const stripeMat = mat(0xa3241c);
  function setFolders(n) {
    while (folders.children.length) folders.remove(folders.children[0]);
    const k = Math.min(n, 12);
    for (let i = 0; i < Math.max(k, 1); i++) {
      const f = new THREE.Group();
      f.add(box(0.32, 0.018, 0.42, folderMat, 0, 0, 0)); f.add(box(0.33, 0.019, 0.04, stripeMat, 0, 0, -0.15));
      f.position.y = 0.012 + i * 0.021; f.rotation.y = (Math.sin(i * 7.1) * 0.12); f.visible = i < Math.max(k, 1);
      folders.add(f);
    }
    folders.traverse(m => m.userData.tap = "dossiers");
  }
  setFolders(0);
  tappables.push({ obj: folders, key: "dossiers", label: "Dossiers", anchor: new THREE.Vector3(0.05, DESK_Y + 0.33, 0.02) });

  // rode onderzoeksmap
  const caseF = new THREE.Group(); caseF.add(box(0.3, 0.025, 0.4, mat(0x8e2a20), 0, 0, 0)); caseF.add(box(0.12, 0.002, 0.08, mat(0xefe7d2), 0, 0.014, 0.05));
  caseF.position.set(-0.08, DESK_Y + 0.015, 0.32); caseF.rotation.y = -0.25; O.add(caseF);
  tappable(caseF, "onderzoek", "Onderzoek!", new THREE.Vector3(-0.08, DESK_Y + 0.22, 0.32));
  caseF.visible = false;

  // typemachine
  const tw = new THREE.Group();
  const twMat = mat(0x2b2e2c, { roughness: 0.4, metalness: 0.3 });
  tw.add(box(0.42, 0.08, 0.3, twMat, 0, DESK_Y + 0.04, 0));
  const tilt = box(0.42, 0.06, 0.16, twMat, 0, DESK_Y + 0.09, -0.08); tw.add(tilt);
  tw.add(cyl(0.035, 0.035, 0.5, mat(0x111111), 0, DESK_Y + 0.15, -0.12)); tw.children[2].rotation.z = Math.PI / 2;
  const paper = box(0.26, 0.2, 0.004, mat(0xf5f1e6), 0, DESK_Y + 0.24, -0.135, false); paper.rotation.x = -0.25; tw.add(paper);
  const keyMat = mat(0xd9d2bd);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { const k = cyl(0.011, 0.011, 0.01, keyMat, -0.15 + c * 0.033 + r * 0.008, DESK_Y + 0.085 + r * 0.012, 0.11 - r * 0.03, 8); tw.add(k); }
  tw.add(box(0.2, 0.012, 0.025, keyMat, 0, DESK_Y + 0.083, 0.135));
  tw.position.set(0.68, 0, -0.18); tw.rotation.y = -0.3; O.add(tw);
  tappable(tw, "typemachine", "Typemachine", new THREE.Vector3(0.68, DESK_Y + 0.42, -0.18));

  // fotolijst
  const photoTex = canvasTex(160, 200, (g, w, h) => {
    g.fillStyle = "#b7aa8f"; g.fillRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#8ea0a6"); grd.addColorStop(1, "#c9bfa5"); g.fillStyle = grd; g.fillRect(8, 8, w - 16, h - 16);
    const fig = (x, s, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, 110 - 40 * s, 14 * s, 0, 7); g.fill(); g.fillRect(x - 15 * s, 120 - 26 * s, 30 * s, 70 * s); };
    fig(50, 1.1, "#3b3a35"); fig(102, 1.0, "#6a4a45"); fig(78, 0.7, "#2f4f6a");
    g.fillStyle = "rgba(255,240,200,.15)"; g.fillRect(0, 0, w, h);
  });
  const photo = new THREE.Group();
  photo.add(box(0.15, 0.19, 0.012, mat(0x2a1d12), 0, 0, 0));
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), lam({ map: photoTex })); pm.position.z = 0.007; photo.add(pm);
  photo.position.set(-0.6, DESK_Y + 0.095, -0.6); photo.rotation.set(-0.18, 0.4, 0); O.add(photo);
  tappable(photo, "gezin", "Gezin", new THREE.Vector3(-0.6, DESK_Y + 0.3, -0.6));

  // asbak + koffie
  O.add(cyl(0.06, 0.05, 0.025, mat(0x6b7f86, { roughness: 0.2, metalness: 0.5 }), 0.32, DESK_Y + 0.013, 0.28, 16));
  const cup = cyl(0.04, 0.035, 0.085, mat(0xf1ede2, { roughness: 0.3 }), -0.95, DESK_Y + 0.043, 0.1, 16); O.add(cup);
  O.add(cyl(0.036, 0.036, 0.002, mat(0x2b1a0e), -0.95, DESK_Y + 0.08, 0.1, 16));
  // rook
  const smokeO = []; const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcfcac0, transparent: true, opacity: 0.15, depthWrite: false });
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), smokeMat.clone()); s.userData.t = i / 10; O.add(s); smokeO.push(s); }

  // kartotheekkast
  const cab = new THREE.Group();
  const cabMat = mat(0x5f6a5e, { metalness: 0.4, roughness: 0.5 });
  cab.add(box(0.62, 1.3, 0.55, cabMat, 0, 0.65, 0));
  for (let i = 0; i < 4; i++) { cab.add(box(0.56, 0.28, 0.02, mat(0x6d786b, { metalness: 0.4, roughness: 0.45 }), 0, 0.2 + i * 0.31, 0.28)); cab.add(box(0.14, 0.03, 0.03, brass, 0, 0.27 + i * 0.31, 0.3)); cab.add(box(0.1, 0.05, 0.005, mat(0xefe7d2), 0, 0.22 + i * 0.31, 0.292)); }
  cab.position.set(1.3, 0, -1.25); cab.rotation.y = -0.35; O.add(cab);
  tappable(cab, "kartotheek", "Kartotheek", new THREE.Vector3(1.3, 1.45, -1.25));

  // deur
  const door = new THREE.Group(); door.add(box(0.95, 2.1, 0.05, mat(0x6b5236, { roughness: 0.5 }), 0, 1.05, 0)); door.add(cyl(0.03, 0.03, 0.08, brass, 0.38, 1.05, 0.05)); door.children[1].rotation.x = Math.PI / 2;
  door.position.set(-2.33, 0, -0.6); door.rotation.y = Math.PI / 2; O.add(door);

  // ======================= WIJK =======================
  const D = new THREE.Scene();
  const fogCol = new THREE.Color(0xb3ada0);
  D.background = fogCol.clone(); D.fog = new THREE.Fog(fogCol, 100, 185);
  const dCam = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 400);
  dCam.position.set(55, 60, 55); dCam.lookAt(0, 0, 0);
  const controls = new OrbitControls(dCam, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.minPolarAngle = 0.55; controls.maxPolarAngle = 1.1;
  controls.minZoom = 0.55; controls.maxZoom = 3.2; controls.screenSpacePanning = false;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.enabled = false; controls.target.set(3, 0, -4); dCam.position.set(58, 60, 51); dCam.lookAt(controls.target);
  const hemi = new THREE.HemisphereLight(0xd8dbe0, 0x6b6250, 1.1); D.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6); sun.position.set(-30, 50, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 140 }); sun.shadow.bias = -0.0005;
  D.add(sun);

  const groundMat = mat(0x7d7a62, { roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; D.add(ground);
  const streetMat = mat(0x4b4b48, { roughness: 0.95 }); const walkMat = mat(0x9b968a, { roughness: 1 });
  for (let i = -5; i <= 4; i++) {
    const x = (i + 0.5) * CELL;
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 43), walkMat); s1.rotation.x = -Math.PI / 2; s1.position.set(x, 0.01, 0); s1.receiveShadow = true; D.add(s1);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 43), streetMat); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.02, 0); s.receiveShadow = true; D.add(s);
  }
  for (let j = -3; j <= 2; j++) {
    const z = (j + 0.5) * CELL;
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(68, 2.6), walkMat); s1.rotation.x = -Math.PI / 2; s1.position.set(0, 0.012, z); s1.receiveShadow = true; D.add(s1);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(68, 1.7), streetMat); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.022, z); s.receiveShadow = true; D.add(s);
  }

  // gebouwen
  const bGroups = {};
  const dTappables = [];
  BUILDINGS.forEach((b, idx) => {
    const g = new THREE.Group(); const x = b.x * CELL, z = b.z * CELL; g.position.set(x, 0, z);
    const base = b.color;
    if (b.kind === "altbau") {
      const t = facadeAltbau(base, 5, 5, idx * 77 + 3);
      const m = mat(0xffffff, { map: t }); const roof = mat(0x5a3a30);
      g.add(box(4.2, 6, 4.2, [m, m, roof, roof, m, m], 0, 3, 0));
      const r = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.3, 4), mat(0x6e4a3a)); r.rotation.y = Math.PI / 4; r.position.y = 6.65; r.castShadow = true; g.add(r);
      g.add(box(0.4, 1.2, 0.4, mat(0x6a5c50), 1.1, 7, 0.9)); g.add(box(0.4, 1.2, 0.4, mat(0x6a5c50), -1.0, 7, -1));
      g.add(box(1, 1.4, 0.1, mat(0x3a2a1c), 0, 0.7, 2.11, false));
    } else if (b.kind === "platte") {
      const t = facadePlatte(base, 10, 8, idx * 51 + 9); const m = mat(0xffffff, { map: t }); const roof = mat(0x77736a);
      g.add(box(5.2, 11, 3.0, [m, m, roof, roof, m, m], 0, 5.5, 0));
      g.add(box(1.2, 0.6, 1.2, mat(0x77736a), 1.6, 11.3, 0));
    } else if (b.kind === "kerk") {
      const brick = canvasTex(128, 128, (gg, w, h) => { gg.fillStyle = "#8a5e4a"; gg.fillRect(0, 0, w, h); gg.strokeStyle = "#6b4636"; for (let yy = 0; yy < h; yy += 8) { gg.beginPath(); gg.moveTo(0, yy); gg.lineTo(w, yy); gg.stroke(); for (let xx = (yy / 8) % 2 * 8; xx < w; xx += 16) { gg.beginPath(); gg.moveTo(xx, yy); gg.lineTo(xx, yy + 8); gg.stroke(); } } });
      brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(2, 2);
      const m = mat(0xffffff, { map: brick });
      g.add(box(3.2, 4.2, 5.2, m, 0, 2.1, 0.4));
      const sh = new THREE.Shape(); sh.moveTo(-1.75, 0); sh.lineTo(1.75, 0); sh.lineTo(0, 2.2); sh.lineTo(-1.75, 0);
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 5.4, bevelEnabled: false }), mat(0x46433f)); roof.position.set(0, 4.2, -2.3); roof.castShadow = true; g.add(roof);
      g.add(box(1.8, 9, 1.8, m, 0, 4.5, -2.6));
      const sp = new THREE.Mesh(new THREE.ConeGeometry(1.35, 4.5, 4), mat(0x3f5f52, { metalness: 0.3 })); sp.rotation.y = Math.PI / 4; sp.position.set(0, 11.25, -2.6); sp.castShadow = true; g.add(sp);
      [[-1.61, 2.4], [1.61, 2.4]].forEach(([xx, yy]) => { for (let k = 0; k < 3; k++) g.add(box(0.05, 1.4, 0.5, lam({ color: 0xd9b46a, emissive: 0x3a2a10 }), xx, yy, -0.8 + k * 1.4, false)); });
    } else if (b.kind === "fabriek") {
      g.add(box(5.5, 3.2, 5, mat(0x7a7062), 0, 1.6, 0));
      for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.9, 5, 3), mat(0x5d564c)); st.rotation.set(Math.PI / 2, 0, Math.PI / 2); st.scale.set(1, 1, 0.9); st.position.set(-2 + k * 1.33, 3.6, 0); st.castShadow = true; g.add(st); }
      g.add(cyl(0.35, 0.45, 9, mat(0x8a5848), 1.8, 4.5, 1.8)); g.add(cyl(0.3, 0.4, 7, mat(0x8a5848), 0.6, 3.5, 2.0));
      g.userData.chimneys = [new THREE.Vector3(x + 1.8, 9.2, z + 1.8), new THREE.Vector3(x + 0.6, 7.2, z + 2.0)];
    } else if (b.kind === "school") {
      const t = facadeAltbau(base, 3, 6, 999); const m = mat(0xffffff, { map: t });
      g.add(box(5.4, 4, 2.4, [m, m, mat(0x6e4a3a), mat(0x6e4a3a), m, m], 0, 2, -1.2));
      g.add(box(2.2, 4, 3.4, [m, m, mat(0x6e4a3a), mat(0x6e4a3a), m, m], -1.6, 2, 1.3));
      const field = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), mat(0x6a6a3a)); field.rotation.x = -Math.PI / 2; field.position.set(1.3, 0.03, 1.4); g.add(field);
    } else if (b.kind === "kliniek") {
      const t = facadePlatte(0xd6d2c4, 4, 6, 123); const m = mat(0xffffff, { map: t });
      g.add(box(4.8, 4.4, 3.6, [m, m, mat(0x888780), mat(0x888780), m, m], 0, 2.2, 0));
      g.add(box(1.6, 0.6, 0.1, lam({ color: 0x2f5a8a, emissive: 0x0c1f33 }), 0, 3.6, 1.81, false));
    } else if (b.kind === "cafe") {
      const t = facadeAltbau(0x6f5a4a, 3, 3, 444); const m = mat(0xffffff, { map: t });
      g.add(box(3.4, 3.6, 3.2, [m, m, mat(0x4a3a30), mat(0x4a3a30), m, m], 0, 1.8, 0));
      g.add(box(2.6, 1, 0.08, lam({ color: 0xffc26a, emissive: 0x8a5a1a }), 0, 0.9, 1.62, false));
      const aw = box(3, 0.08, 0.9, mat(0x7a2a24), 0, 1.7, 2.0); aw.rotation.x = 0.3; g.add(aw);
    } else if (b.kind === "konsum") {
      g.add(box(5.2, 2.6, 4, mat(0xa7b1a0), 0, 1.3, 0));
      const sign = canvasTex(256, 48, (gg, w, h) => { gg.fillStyle = "#e7e2d2"; gg.fillRect(0, 0, w, h); gg.fillStyle = "#2a4a7a"; gg.font = "bold 30px Arial"; gg.textAlign = "center"; gg.fillText("KAUFHALLE", w / 2, 35); });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.65), lam({ map: sign })); sm.position.set(0, 2.2, 2.01); g.add(sm);
      g.add(box(4, 1, 0.06, lam({ color: 0xcbd8d8, emissive: 0x333a3a }), 0, 0.9, 2.01, false));
    } else if (b.kind === "mfs") {
      const t = facadePlatte(0x6a6d6a, 5, 7, 31); const m = mat(0xffffff, { map: t });
      g.add(box(5, 6, 3.6, [m, m, mat(0x505250), mat(0x505250), m, m], 0, 3, 0));
      g.add(cyl(0.05, 0.05, 3, mat(0x333333), 1.8, 7.5, 0.8)); g.add(cyl(0.05, 0.05, 2, mat(0x333333), 1.4, 7, -0.8));
      for (let k = -6; k <= 6; k++) g.add(box(0.06, 1.6, 0.06, mat(0x444444), k * 0.45, 0.8, 2.8));
      g.add(box(5.6, 0.05, 0.05, mat(0x444444), 0, 1.5, 2.8));
    }
    g.scale.set(0.86, 1, 0.86);
    g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } m.userData.bld = b.id; });
    // selectiering
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.0, 40), new THREE.MeshBasicMaterial({ color: 0xa3241c, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.visible = false; g.add(ring); g.userData.ring = ring;
    // markers
    const bug = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshBasicMaterial({ color: 0xd1302a }));
    bug.visible = false; g.add(bug); g.userData.bug = bug;
    const imM = new THREE.Group(); g.add(imM); g.userData.ims = imM;
    const box3 = new THREE.Box3().setFromObject(g); g.userData.height = box3.max.y;
    bug.position.y = box3.max.y + 1.2; imM.position.y = box3.max.y + 0.6;
    D.add(g); bGroups[b.id] = g; dTappables.push(g);
  });

  // bomen
  const treeMat = mat(0x4f5e3a), trunkMat = mat(0x4a3a2a);
  const treeG = new THREE.Group(); D.add(treeG);
  const treeSpots = [];
  for (let i = -5; i <= 4; i++) for (let j = -3; j <= 3; j++) { treeSpots.push([(i + 0.5) * CELL + 1.6, j * CELL + 1.5]); treeSpots.push([(i + 0.5) * CELL - 1.6, j * CELL - 1.6]); }
  const leaves = [];
  treeSpots.forEach(([x, z], k) => { if (k % 3 !== 0) return; const t = new THREE.Group(); t.add(cyl(0.12, 0.16, 1.6, trunkMat, 0, 0.8, 0, 6)); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), treeMat); l.position.y = 2.1; l.castShadow = true; t.add(l); leaves.push(l); t.position.set(x, 0, z); t.scale.setScalar(0.8 + ((k * 37) % 10) / 20); treeG.add(t); });

  // de Muur
  const WALL_Z = 3.4 * CELL;
  const wallG = new THREE.Group(); D.add(wallG);
  const wallMatD = mat(0xd6d3c9);
  const wallSegs = [];
  for (let x = -40; x <= 40; x += 1.3) { const seg = new THREE.Group(); seg.add(box(1.25, 3.6, 0.3, wallMatD, 0, 1.8, 0)); const tube = cyl(0.25, 0.25, 1.28, mat(0xe0ddd2), 0, 3.7, 0, 10); tube.rotation.z = Math.PI / 2; seg.add(tube); seg.position.set(x, 0, WALL_Z + 6); wallG.add(seg); wallSegs.push(seg); }
  for (let x = -40; x <= 40; x += 2) wallG.add(box(0.08, 2.4, 0.08, mat(0x777777), x, 1.2, WALL_Z));
  wallG.add(box(80, 0.05, 0.05, mat(0x777777), 0, 2.3, WALL_Z)); wallG.add(box(80, 0.05, 0.05, mat(0x777777), 0, 1.4, WALL_Z));
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(80, 5.6), mat(0xc9b993, { roughness: 1 })); strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.015, WALL_Z + 3); strip.receiveShadow = true; wallG.add(strip);
  for (let x = -36; x <= 36; x += 9) { wallG.add(cyl(0.07, 0.07, 4.5, mat(0x555555), x, 2.25, WALL_Z + 1.5, 6)); wallG.add(box(0.6, 0.15, 0.25, lam({ color: 0xfff0c0, emissive: 0x666040 }), x, 4.5, WALL_Z + 1.5)); }
  const tower = new THREE.Group(); tower.add(cyl(0.7, 0.7, 6, mat(0xbfbcb2), 0, 3, 0, 12)); tower.add(cyl(1.3, 1.3, 1.5, mat(0xbfbcb2), 0, 6.6, 0, 12)); tower.add(cyl(1.32, 1.32, 0.5, lam({ color: 0x334455, roughness: 0.2 }), 0, 6.8, 0, 12)); tower.add(box(0.4, 0.4, 0.6, mat(0x222222), 0, 7.6, 0));
  tower.position.set(9, 0, WALL_Z + 3.5); wallG.add(tower);
  // Westen
  const westCols = [0xe7d8b0, 0xc9d6df, 0xe4c4b0, 0xd0d9c0, 0xf0e4cc];
  for (let i = 0; i < 9; i++) { const h = 2.2 + (i * 7) % 3; const wb = box(5, h, 4, mat(westCols[i % 5]), -36 + i * 9, h / 2, WALL_Z + 16); D.add(wb); const neon = box(3, 0.6, 0.08, lam({ color: [0xff4f8a, 0x4fd7ff, 0xffd54f, 0x7dff6a][i % 4], emissive: [0xff2f6a, 0x2fb7ff, 0xffb52f, 0x5ddf4a][i % 4], emissiveIntensity: 1.2 }), -36 + i * 9, h + 0.4, WALL_Z + 13.95, false); D.add(neon); }

  // tv-toren in de verte
  const tv = new THREE.Group(); const silver = mat(0xb8bcc0, { metalness: 0.6, roughness: 0.3 });
  tv.add(cyl(0.5, 1.6, 40, mat(0xd4d2cc), 0, 20, 0, 16)); const ball = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 16), silver); ball.position.y = 34; tv.add(ball); tv.add(cyl(0.2, 0.25, 12, mat(0xcc3333), 0, 43, 0, 8));
  tv.position.set(-34, 0, -48); tv.traverse(m => { if (m.isMesh) m.castShadow = false; }); D.add(tv);

  // auto's
  const carCols = [0xd9d3b8, 0x7f9aa8, 0x9aa87f, 0xc79a6a, 0x8b5a4a, 0xe4e1d6, 0x6a7f6a];
  const cars = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group(); const cm = mat(carCols[i % carCols.length], { roughness: 0.5 });
    c.add(box(1.5, 0.45, 0.75, cm, 0, 0.38, 0)); c.add(box(0.85, 0.35, 0.7, cm, -0.1, 0.78, 0)); c.add(box(0.86, 0.28, 0.72, lam({ color: 0x2a3238, roughness: 0.2 }), -0.1, 0.78, 0, false));
    [[-0.5, 0.36], [0.5, 0.36], [-0.5, -0.36], [0.5, -0.36]].forEach(([xx, zz]) => { const w = cyl(0.17, 0.17, 0.12, mat(0x1a1a1a), xx, 0.17, zz, 10); w.rotation.x = Math.PI / 2; c.add(w); });
    const horiz = i % 2 === 0;
    const lane = horiz ? ((i % 6) / 2 - 1 + 0.5) * CELL : ((i % 8) - 4 + 0.5) * CELL;
    c.userData = { horiz, lane: lane + (i % 4 < 2 ? 0.45 : -0.45), dir: i % 4 < 2 ? 1 : -1, pos: (i * 13) % 60 - 30, speed: 3 + (i % 3) };
    D.add(c); cars.push(c);
  }

  // voetgangers
  const walkers = [];
  const coatCols = [0x4a4a52, 0x5a4a3a, 0x3a4a5a, 0x6a5a4a, 0x4a5a4a, 0x7a6a5a, 0x2f2f33, 0x6a3a3a];
  const torsoGeo = new THREE.BoxGeometry(0.46, 0.55, 0.26); const headGeo = new THREE.IcosahedronGeometry(0.16, 0); const legGeo = new THREE.BoxGeometry(0.17, 0.5, 0.18); legGeo.translate(0, -0.25, 0); const armGeo = new THREE.BoxGeometry(0.12, 0.48, 0.14); armGeo.translate(0, -0.22, 0);
  const skin = mat(0xd8b89a), trouser = mat(0x2e2e34), hair = [mat(0x3a2a1c), mat(0x6a5a3a), mat(0x1c1c1c), mat(0x8a8a8a)];
  function person(col) {
    const p = new THREE.Group(); const cm = mat(col);
    const torso = new THREE.Mesh(torsoGeo, cm); torso.position.y = 0.82; p.add(torso);
    const head = new THREE.Mesh(headGeo, skin); head.position.y = 1.27; p.add(head);
    const hr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), hair[Math.floor(Math.random() * 4)]); hr.position.y = 1.4; p.add(hr);
    const l1 = new THREE.Mesh(legGeo, trouser), l2 = new THREE.Mesh(legGeo, trouser); l1.position.set(-0.11, 0.55, 0); l2.position.set(0.11, 0.55, 0); p.add(l1, l2);
    const a1 = new THREE.Mesh(armGeo, cm), a2 = new THREE.Mesh(armGeo, cm); a1.position.set(-0.3, 1.06, 0); a2.position.set(0.3, 1.06, 0); p.add(a1, a2);
    p.traverse(m => { if (m.isMesh) m.castShadow = true; });
    p.userData.limbs = [l1, l2, a1, a2];
    return p;
  }
  for (let i = 0; i < 32; i++) {
    const p = person(coatCols[i % coatCols.length]);
    const horiz = i % 2 === 0;
    const lane = horiz ? ((i % 6) - 3 + 0.5) * CELL : ((i % 10) - 5 + 0.5) * CELL;
    Object.assign(p.userData, { horiz, lane: lane + (i % 4 < 2 ? 1.05 : -1.05), dir: i % 3 === 0 ? -1 : 1, pos: (i * 7.3) % 60 - 30, speed: 0.6 + (i % 5) * 0.12, ph: i });
    D.add(p); walkers.push(p);
  }
  // rij voor de Kaufhalle
  const kb = BUILDINGS.find(b => b.id === "konsum");
  for (let i = 0; i < 7; i++) { const p = person(coatCols[(i + 3) % coatCols.length]); p.position.set(kb.x * CELL - 2.2 + i * 0.6, 0, kb.z * CELL + 2.6); p.rotation.y = -Math.PI / 2; D.add(p); }

  // fabrieksrook
  const smokeD = []; const sMatD = lam({ color: 0xb7b2a6, transparent: true, opacity: 0.35, depthWrite: false });
  const chim = bGroups.fabriek.userData.chimneys;
  for (let i = 0; i < 24; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), sMatD.clone()); s.userData = { t: i / 24, c: chim[i % 2] }; D.add(s); smokeD.push(s); }

  // sneeuw
  const snowN = 1500; const snowGeo = new THREE.BufferGeometry(); const sp = new Float32Array(snowN * 3);
  for (let i = 0; i < snowN; i++) { sp[i * 3] = (Math.random() - 0.5) * 90; sp[i * 3 + 1] = Math.random() * 40; sp[i * 3 + 2] = (Math.random() - 0.5) * 90; }
  snowGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.85 })); snow.visible = false; D.add(snow);

  // finale: menigte & vuurwerk
  const crowd = new THREE.Group(); crowd.visible = false; D.add(crowd);
  for (let i = 0; i < 90; i++) { const p = person(coatCols[i % coatCols.length]); p.position.set(-8 + Math.random() * 16, 0, WALL_Z + 1 + Math.random() * 9); p.userData.ph = Math.random() * 6; crowd.add(p); }
  const fireworks = [];
  for (let i = 0; i < 5; i++) { const g = new THREE.BufferGeometry(); const n = 80; const arr = new Float32Array(n * 3); g.setAttribute("position", new THREE.BufferAttribute(arr, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: [0xffd54f, 0xff4f8a, 0x4fd7ff, 0xffffff, 0x7dff6a][i], size: 0.5, transparent: true })); pts.userData = { t: Math.random() * 3, n, origin: new THREE.Vector3(-10 + i * 5, 14 + i % 3 * 3, WALL_Z + 5), dirs: Array.from({ length: n }, () => new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()) }; pts.visible = false; D.add(pts); fireworks.push(pts); }

  // ======================= LABELS =======================
  const labelMap = new Map();
  function labelEl(id, text, cls) {
    let el = labelMap.get(id);
    if (!el) { el = document.createElement("button"); el.className = "lbl3d " + (cls || ""); el.dataset.id = id; labelsEl.appendChild(el); labelMap.set(id, el); el.addEventListener("click", ev => { ev.stopPropagation(); const [kind, key] = id.split(":"); if (kind === "o") H.onOffice(key); else H.onBuilding(key); }); }
    if (el._t !== text) { el.innerHTML = text; el._t = text; }
    return el;
  }
  const v = new THREE.Vector3();
  let officeBadges = {};
  let bInfo = {};
  function updateLabels() {
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    labelMap.forEach(el => el.style.display = "none");
    if (mode === "office") {
      tappables.forEach(t => {
        if (!t.obj.visible) return;
        const badge = officeBadges[t.key];
        const el = labelEl("o:" + t.key, t.label + (badge ? ` <b>${badge}</b>` : ""), (t.key === "onderzoek" ? "red " : "") + (badge ? "hot" : ""));
        v.copy(t.anchor).project(oCam);
        if (v.z > 1) return;
        el.style.display = "block"; const lw = el.offsetWidth / 2 + 6; el.style.transform = `translate(-50%,-100%) translate(${Math.min(w - lw, Math.max(lw, (v.x + 1) / 2 * w))}px,${(1 - v.y) / 2 * h}px)`;
      });
    } else {
      BUILDINGS.forEach(b => {
        const g = bGroups[b.id]; v.set(g.position.x, g.userData.height + 2.3, g.position.z).project(dCam);
        const info = bInfo[b.id] || "";
        const el = labelEl("b:" + b.id, SHORT[b.id] + info, b.id === selected ? "sel" : "");
        el.style.display = "block"; el.style.transform = `translate(-50%,-100%) translate(${(v.x + 1) / 2 * w}px,${(1 - v.y) / 2 * h}px)`;
      });
    }
  }

  // ======================= INPUT =======================
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; const dt = performance.now() - down.t; down = null;
    if (dx * dx + dy * dy > 80 || dt > 500) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (mode === "office") {
      ray.setFromCamera(ptr, oCam);
      const hit = ray.intersectObjects(tappables.map(t => t.obj).filter(o => o.visible), true)[0];
      if (hit && hit.object.userData.tap) H.onOffice(hit.object.userData.tap);
    } else {
      ray.setFromCamera(ptr, dCam);
      const hit = ray.intersectObjects(dTappables, true)[0];
      if (hit && hit.object.userData.bld) H.onBuilding(hit.object.userData.bld);
    }
  });

  // ======================= RESIZE =======================
  function resize() {
    const w = container.clientWidth, h = container.clientHeight; const pr = Math.min(1, 460 / h); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); rt.setSize(Math.round(w * pr), Math.round(h * pr));
    const aspect = w / h;
    oCam.aspect = aspect;
    const vfov = aspect < 1 ? 62 : 54; oCam.fov = vfov;
    const halfW = aspect < 1 ? 0.92 : 1.45; // hoeveel bureau in beeld
    const d = Math.max(1.5, halfW / (Math.tan(THREE.MathUtils.degToRad(vfov / 2)) * aspect));
    const dir = new THREE.Vector3(0, aspect < 1 ? 0.36 : 0.42, 1).normalize();
    oTarget.set(0, aspect < 1 ? 1.12 : 1.1, -0.45);
    oCam.position.copy(oTarget).addScaledVector(dir, d);
    oCam.lookAt(oTarget); oCam.updateProjectionMatrix();
    const hw = aspect < 1 ? 15 : 24; const hh = hw / aspect;
    Object.assign(dCam, { left: -hw, right: hw, top: hh, bottom: -hh }); dCam.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  // ======================= LOOP =======================
  let ringing = false, selected = null, finale = false, winter = false;
  const basePhone = phone.position.clone();
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (mode === "office") {
      phone.position.x = basePhone.x + (ringing ? Math.sin(t * 60) * 0.006 * (Math.sin(t * 3) > 0 ? 1 : 0) : 0);
      handset.position.y = DESK_Y + 0.14 + (ringing && Math.sin(t * 3) > 0 ? Math.abs(Math.sin(t * 30)) * 0.01 : 0);
      const now = new Date(); h1.rotation.z = -(now.getMinutes() / 60) * Math.PI * 2; h2.rotation.z = -((now.getHours() % 12) / 12) * Math.PI * 2;
      smokeO.forEach(s => { s.userData.t = (s.userData.t + dt * 0.15) % 1; const k = s.userData.t; s.position.set(0.32 + Math.sin(k * 9 + t) * 0.03 * k, DESK_Y + 0.04 + k * 0.6, 0.28 + Math.cos(k * 7) * 0.02 * k); s.scale.setScalar(0.5 + k * 2.5); s.material.opacity = 0.18 * (1 - k); });
      if (caseF.visible) caseF.position.y = DESK_Y + 0.015 + Math.max(0, Math.sin(t * 4)) * 0.006;
      // lichte camerabeweging
      oCam.position.x += (Math.sin(t * 0.3) * 0.015 - (oCam.position.x - oTarget.x)) * 0.02;
      oCam.lookAt(oTarget);
      draw(O, oCam);
    } else {
      controls.update();
      cars.forEach(c => { const u = c.userData; u.pos += u.dir * u.speed * dt; if (u.pos > 34) u.pos = -34; if (u.pos < -34) u.pos = 34; if (u.horiz) { c.position.set(u.pos, 0, u.lane); c.rotation.y = u.dir > 0 ? 0 : Math.PI; } else { c.position.set(u.lane, 0, u.pos); c.rotation.y = u.dir > 0 ? -Math.PI / 2 : Math.PI / 2; } });
      walkers.forEach(p => { const u = p.userData; u.pos += u.dir * u.speed * dt; if (u.pos > 30) u.pos = -30; if (u.pos < -30) u.pos = 30; if (u.horiz) { p.position.set(u.pos, 0, u.lane); p.rotation.y = u.dir > 0 ? Math.PI / 2 : -Math.PI / 2; } else { p.position.set(u.lane, 0, u.pos); p.rotation.y = u.dir > 0 ? 0 : Math.PI; } const sw = Math.sin(t * 7 * u.speed + u.ph) * 0.6; const L = p.userData.limbs; L[0].rotation.x = sw; L[1].rotation.x = -sw; L[2].rotation.x = -sw * 0.8; L[3].rotation.x = sw * 0.8; });
      smokeD.forEach(s => { const u = s.userData; u.t = (u.t + dt * 0.08) % 1; s.position.set(u.c.x + u.t * 6, u.c.y + u.t * 7, u.c.z - u.t * 2 + Math.sin(u.t * 10) * 0.4); s.scale.setScalar(0.6 + u.t * 3); s.material.opacity = 0.3 * (1 - u.t); });
      BUILDINGS.forEach(b => { const g = bGroups[b.id]; if (g.userData.bug.visible) { g.userData.bug.rotation.y += dt * 2; g.userData.bug.scale.setScalar(1 + Math.sin(t * 5) * 0.15); } if (g.userData.ring.visible) g.userData.ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3; });
      if (snow.visible) { const a = snow.geometry.attributes.position; for (let i = 0; i < snowN; i++) { a.array[i * 3 + 1] -= dt * 3; a.array[i * 3] += Math.sin(t + i) * dt * 0.3; if (a.array[i * 3 + 1] < 0) a.array[i * 3 + 1] = 40; } a.needsUpdate = true; }
      if (finale) {
        crowd.children.forEach(p => { p.position.y = Math.abs(Math.sin(t * 5 + p.userData.ph)) * 0.3; const L = p.userData.limbs; L[2].rotation.x = L[3].rotation.x = -2.6 + Math.sin(t * 6 + p.userData.ph) * 0.4; });
        fireworks.forEach(f => { const u = f.userData; u.t += dt; const k = u.t % 3; const a = f.geometry.attributes.position; for (let i = 0; i < u.n; i++) { const d = u.dirs[i]; a.array[i * 3] = u.origin.x + d.x * k * 4; a.array[i * 3 + 1] = u.origin.y + d.y * k * 4 - k * k * 0.6; a.array[i * 3 + 2] = u.origin.z + d.z * k * 4; } a.needsUpdate = true; f.material.opacity = Math.max(0, 1 - k / 2.2); });
      }
      draw(D, dCam);
    }
    updateLabels();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ======================= API =======================
  return {
    setMode(m) { mode = m; controls.enabled = m === "district"; labelsEl.dataset.mode = m; },
    getMode: () => mode,
    setRinging(b) { ringing = b; },
    setOffice({ folders: n, badges, caseOpen, date, month }) {
      setFolders(n); officeBadges = badges || {}; caseF.visible = !!caseOpen;
      if (calText[0] !== date || calText[1] !== month) { calText = [date, month]; drawCal(); }
    },
    setDistrict({ bugs, ims, info, winter: wtr, finale: fin, gone }) {
      BUILDINGS.forEach(b => {
        const g = bGroups[b.id]; g.userData.bug.visible = !!(bugs && bugs[b.id]);
        const n = (ims && ims[b.id]) || 0; const im = g.userData.ims;
        while (im.children.length > n) im.remove(im.children[0]);
        while (im.children.length < n) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0x3a6db0 })); c.rotation.x = Math.PI; im.add(c); }
        im.children.forEach((c, i) => c.position.set((i - (n - 1) / 2) * 0.55, 0, 0));
      });
      bInfo = info || {};
      if (wtr !== winter) { winter = wtr; snow.visible = winter; groundMat.color.set(winter ? 0xe3e3df : 0x7d7a62); treeMat.color.set(winter ? 0xd9ddd8 : 0x4f5e3a); }
      if (fin !== finale) { finale = fin; if (fin) { const off = new THREE.Vector3().subVectors(dCam.position, controls.target); controls.target.set(0, 0, WALL_Z + 3); dCam.position.copy(controls.target).add(off); } crowd.visible = fin; fireworks.forEach(f => f.visible = fin); [-2, -1, 0, 1, 2].forEach(k => { const s = wallSegs[Math.floor(wallSegs.length / 2) + k]; if (s) s.visible = !fin; }); }
    },
    select(id) { if (selected && bGroups[selected]) bGroups[selected].userData.ring.visible = false; selected = id; if (id && bGroups[id]) bGroups[id].userData.ring.visible = true; },
    focus(id) { const b = bGroups[id]; if (!b) return; const off = new THREE.Vector3().subVectors(dCam.position, controls.target); controls.target.set(b.position.x, 0, b.position.z); dCam.position.copy(controls.target).add(off); },
    resize,
  };
}
