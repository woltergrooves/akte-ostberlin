// Verwerkt de CC0-figuren van Quaternius (Ultimate Modular Men/Women) tot zuinige PS2-voetgangers:
// - alle deelmeshes samen in één skinned mesh (één draw call per persoon)
// - materiaalkleuren omgezet naar DDR-tinten en ingebakken als vertexkleuren
// - normalen weggelaten (het spel gebruikt flat shading) zodat de decimering vrij kan werken
// - gedecimeerd tot ±2.000–2.600 driehoeken (meshopt simplify), quantize + meshopt-compressie
// Bronbestanden: tools/src/*.glb (zie CREDITS.md voor herkomst). Gebruik: node build-figures.mjs
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { weld, simplify, quantize, meshopt, prune, dedup } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import { fileURLToPath } from "url";
import path from "path";
import * as THREE from "three";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "src"), OUT = path.join(DIR, "..", "assets", "models");

// Kleuren (sRGB-hex) per materiaalnaam. Wat niet genoemd wordt, houdt de originele kleur.
const SKIN = 0xd8b89a, SKIN2 = 0xc9a888;
export const FIGURES = [
  { out: "fig_arbeider", src: "modular_men_Worker", desc: "Arbeider in blauwe werkjas", col: { Worker_Yellow: 0x3d4a5e, Worker_Vest: 0x34465e, LightBrown: 0x3a3f4a, Grey: 0x2a2a2a, Brown: 0x3a2a1c, Brown2: 0x2a1f16, Skin: SKIN } },
  { out: "fig_vrouw", src: "modular_women_Suit", desc: "Oudere vrouw in grijze mantel", col: { Black: 0x5e5a52, White: 0x8a7a6a, Hair_Blond: 0xa8a49a, Hair_Brown: 0xa8a49a, Skin: SKIN } },
  { out: "fig_punk", src: "modular_men_Punk", desc: "Punk", col: { Red: 0x8a2020, Red_Dark: 0x5a1414, Skin: SKIN } },
  { out: "fig_dominee", src: "modular_men_Suit", desc: "Dominee in zwart pak", col: { Suit: 0x1e1e22, Tie: 0x1a1a1c, White: 0xe0ddd2, Skin: SKIN } },
  { out: "fig_vopo", src: "modular_men_Swat", desc: "Volkspolizist (Bereitschaft) in groengrijs", col: { Swat: 0x56604c, Swat_Black: 0x343a2e, Visor: 0x22262a, Skin: SKIN2 } },
  { out: "fig_stasi", src: "modular_men_Suit", desc: "Stasi-man in leren jas", col: { Suit: 0x2a1e16, Tie: 0x3a3a3a, White: 0x7a7a74, Skin: SKIN2 } },
  { out: "fig_burger", src: "modular_men_Casual2", desc: "Burger in jack", col: { LightBrown: 0x5a4a3a, Red_Dark: 0x3a3a44, White: 0x8a8578, LightBlue: 0x2e3440, Skin: SKIN } },
  { out: "fig_burgeres", src: "modular_women_Casual", desc: "Burgeres in jas", col: { White: 0x7a5a4a, Orange: 0x5a4a5a, Grey: 0x34343a, Skin: SKIN } },
];
const TARGET = 2400; // driehoeken

const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;

const report = [];
for (const F of FIGURES) {
  const doc = await io.read(path.join(SRC, F.src + ".glb"));
  const root = doc.getRoot(); const buf = root.listBuffers()[0];
  const meshNodes = root.listNodes().filter(n => n.getMesh());
  const P = [], N = [], J = [], W = [], C = [], I = [];
  let base = 0;
  for (const node of meshNodes) for (const prim of node.getMesh().listPrimitives()) {
    const mname = prim.getMaterial()?.getName() || "";
    const bc = prim.getMaterial()?.getBaseColorFactor() || [1, 1, 1, 1];
    const c = F.col[mname] !== undefined ? new THREE.Color(F.col[mname]) : new THREE.Color(bc[0], bc[1], bc[2]); // Color(hex) = lineair
    const pos = prim.getAttribute("POSITION"), nor = prim.getAttribute("NORMAL"), jn = prim.getAttribute("JOINTS_0"), wt = prim.getAttribute("WEIGHTS_0");
    const n = pos.getCount();
    for (let i = 0; i < n; i++) { P.push(...pos.getElement(i, [])); N.push(...nor.getElement(i, [])); J.push(...jn.getElement(i, [])); W.push(...wt.getElement(i, [])); C.push(c.r, c.g, c.b); }
    const idx = prim.getIndices(); for (let i = 0; i < idx.getCount(); i++) I.push(idx.getScalar(i) + base);
    base += n;
  }
  const mat = doc.createMaterial("figure").setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(1);
  const prim = doc.createPrimitive().setMaterial(mat)
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(P)).setBuffer(buf))
    .setAttribute("JOINTS_0", doc.createAccessor().setType("VEC4").setArray(new Uint16Array(J)).setBuffer(buf))
    .setAttribute("WEIGHTS_0", doc.createAccessor().setType("VEC4").setArray(new Float32Array(W)).setBuffer(buf))
    .setAttribute("COLOR_0", doc.createAccessor().setType("VEC3").setArray(new Float32Array(C)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(I)).setBuffer(buf));
  const mesh = doc.createMesh("Figure").addPrimitive(prim);
  const keep = meshNodes[0]; keep.getMesh().dispose(); keep.setMesh(mesh).setName("Figure");
  meshNodes.slice(1).forEach(n => { n.getMesh()?.dispose(); n.dispose(); });
  root.listMaterials().filter(m => m !== mat).forEach(m => m.dispose());
  const before = I.length / 3;
  await doc.transform(prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, TARGET / before), error: 0.05, lockBorder: false }), dedup(), prune());
  const after = prim.getIndices().getCount() / 3;
  doc.createExtension(KHRMeshQuantization);
  await doc.transform(quantize({ quantizeNormal: 8, quantizeColor: 8 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  doc.getRoot().getAsset().generator = "Akte tools/build-figures.mjs (bron: Quaternius, CC0)";
  await io.write(path.join(OUT, F.out + ".glb"), doc);
  report.push({ model: F.out, bron: F.src, voor: before, na: after });
}
console.table(report);
