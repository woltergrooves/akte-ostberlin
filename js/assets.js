// ===================== 3D-modellen laden (GLTFLoader + meshopt) =====================
// Alle modellen staan in assets/models/ (zie CREDITS.md). Mislukt een model, dan valt world.js terug op de blokjes.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

export const PROPS = ["telefoon", "typemachine", "bureaulamp", "stempel", "asbak", "koffiekop", "trabant601", "wartburg353", "tatra_kt4d"];
export const FIGURES = ["fig_arbeider", "fig_vrouw", "fig_punk", "fig_dominee", "fig_vopo", "fig_stasi", "fig_burger", "fig_burgeres"];

// PS2-materialen: Lambert met facetten en vertexkleuren. "paint" krijgt per exemplaar een eigen kleur, "glow" is onbelicht.
const MATS = {
  lam: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
};
function ps2(scene, skinned) {
  scene.traverse(o => {
    if (!o.isMesh) return;
    const n = o.material && o.material.name;
    if (n === "glow") o.material = MATS.glow;
    else if (n === "paint") { o.material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, color: 0xcccccc }); o.material.userData.paint = true; }
    else o.material = MATS.lam;
    o.castShadow = n !== "glow"; o.receiveShadow = !skinned;
    if (skinned) o.frustumCulled = false;
  });
  return scene;
}

export function loadModels(onProgress = () => {}) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const names = [...PROPS, ...FIGURES]; const out = {}; let done = 0;
  const step = () => onProgress(++done / names.length);
  return Promise.all(names.map(n => loader.loadAsync(`assets/models/${n}.glb`)
    .then(g => { out[n] = ps2(g.scene, n.startsWith("fig_")); })
    .catch(e => { console.warn("Model niet geladen:", n, e && e.message); out[n] = null; })
    .finally(step)))
    .then(() => out);
}

// Kopie van een model. Figuren hebben een skelet en worden met SkeletonUtils gekloond.
export function instance(M, name) {
  const src = M && M[name]; if (!src) return null;
  if (name.startsWith("fig_")) return cloneSkinned(src);
  const c = src.clone(true);
  c.traverse(o => { if (o.isMesh && o.material.userData.paint) { o.material = o.material.clone(); o.material.userData.paint = true; } });
  return c;
}
