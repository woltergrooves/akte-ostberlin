// Gedeelde hulpfuncties voor de modelbouw: three.js-geometrie -> .glb (gltf-transform), met meshopt-compressie.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { weld, quantize, meshopt, dedup, prune } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";

export { THREE };

// Een "part" is een los te bewegen onderdeel (wordt een node in de .glb).
// Stukken krijgen een klasse: "lam" (vaste kleur), "paint" (kleur per exemplaar in het spel), "glow" (licht, ongeschaduwd).
export class Part {
  constructor(name, pos = [0, 0, 0], rot = [0, 0, 0]) { this.name = name; this.pos = pos; this.rot = rot; this.pieces = []; }
  add(geo, color, cls = "lam") {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute("uv"); g.deleteAttribute("normal");
    for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
    g.computeVertexNormals();
    const c = new THREE.Color(cls === "paint" ? 0xffffff : color); // Color(hex) = lineaire kleur, zoals glTF verwacht
    const n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    this.pieces.push({ g, cls });
    return this;
  }
  // vormen
  box(w, h, d, x, y, z, color, cls, rx = 0, ry = 0, rz = 0) { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return this.add(g, color, cls); }
  // cilinder; as = "y" | "x" | "z"
  cyl(rt, rb, h, seg, x, y, z, color, cls, axis = "y", open = false) { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open); if (axis === "x") g.rotateZ(Math.PI / 2); if (axis === "z") g.rotateX(Math.PI / 2); g.translate(x, y, z); return this.add(g, color, cls); }
  // zijprofiel in het XY-vlak, uitgetrokken over de breedte (Z), gecentreerd
  ext(pts, width, color, cls, bevel = 0, x = 0, y = 0, z = 0) {
    const s = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(s, { depth: width - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 4 });
    g.translate(x, y, z - (width - bevel * 2) / 2); return this.add(g, color, cls);
  }
  // zijprofiel in het ZY-vlak (voorkant = +Z), uitgetrokken over X
  extZ(pts, width, color, cls, bevel = 0, x = 0, y = 0, z = 0) {
    const s = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(s, { depth: width - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 4 });
    g.translate(0, 0, -(width - bevel * 2) / 2); g.rotateY(-Math.PI / 2); g.translate(x, y, z); return this.add(g, color, cls);
  }
  lathe(pts, seg, x, y, z, color, cls) { const g = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg); g.translate(x, y, z); return this.add(g, color, cls); }
  geo(g, color, cls) { return this.add(g, color, cls); }
  tris() { return this.pieces.reduce((s, p) => s + p.g.attributes.position.count / 3, 0); }
}

export async function writeModel(file, parts, meta = {}) {
  const doc = new Document(); const buf = doc.createBuffer();
  const scene = doc.createScene(meta.name || "Scene");
  const mats = {};
  const matFor = cls => mats[cls] || (mats[cls] = doc.createMaterial(cls).setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(1).setMetallicFactor(0));
  const root = doc.createNode(meta.name || "Root"); scene.addChild(root);
  let total = 0;
  for (const part of parts) {
    const node = doc.createNode(part.name).setTranslation(part.pos);
    if (part.rot.some(v => v)) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...part.rot)); node.setRotation([q.x, q.y, q.z, q.w]); }
    const byCls = {};
    part.pieces.forEach(p => (byCls[p.cls] ||= []).push(p.g));
    const mesh = doc.createMesh(part.name);
    for (const [cls, geos] of Object.entries(byCls)) {
      const m = mergeGeometries(geos);
      const prim = doc.createPrimitive().setMaterial(matFor(cls));
      for (const [attr, name] of [["position", "POSITION"], ["normal", "NORMAL"], ["color", "COLOR_0"]]) {
        prim.setAttribute(name, doc.createAccessor().setType("VEC3").setArray(new Float32Array(m.attributes[attr].array)).setBuffer(buf));
      }
      total += m.attributes.position.count / 3;
      mesh.addPrimitive(prim);
    }
    node.setMesh(mesh); root.addChild(node);
  }
  await MeshoptEncoder.ready;
  doc.createExtension(KHRMeshQuantization);
  await doc.transform(weld(), dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeColor: 8 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
  await io.write(file, doc);
  return total;
}
