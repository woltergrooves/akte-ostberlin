// ===================== Animaties voor de figuren (fase 4) =====================
// De Quaternius-figuren hebben een skelet maar geen clips. Hier bouwen we clips met keyframes op de botten
// (QuaternionKeyframeTrack), één set per figuursoort, en spelen ze af met een AnimationMixer met overgangen.
// Assen (zie HANDOFF): armen omlaag = lokale X −1,3; zwaaien om lokale Z. Links naar voren = +Z, rechts = −Z.
import * as THREE from "three";

const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const BONES = ["Hips", "Abdomen", "Torso", "Chest", "Neck", "Head", "UpperArmL", "LowerArmL", "HandL", "UpperArmR", "LowerArmR", "HandR", "UpperLegL", "LowerLegL", "FootL", "UpperLegR", "LowerLegR", "FootR"];
const qa = new THREE.Quaternion();
const TAU = Math.PI * 2;

// pose(ph) geeft per bot een lijst [as, hoek]; ph loopt van 0 tot 1 over de clip
const POSES = {
  // lopen: benen ±0,5, knie buigt als het been naar voren zwaait, armen tegengesteld, romp draait mee
  // (gekalibreerd: been L voor = +Z, R voor = −Z; arm L voor = −Z, R voor = +Z; knie = +X; elleboog L = −Z, R = +Z; voorover = Abdomen +X)
  walk: { dur: 1.0, pose: ph => { const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU), k = v => Math.max(0, v);
    return {
      UpperLegL: [[AZ, s * 0.5]], UpperLegR: [[AZ, s * 0.5]],
      LowerLegL: [[AX, 0.08 + k(c) * 0.7]], LowerLegR: [[AX, 0.08 + k(-c) * 0.7]],
      UpperArmL: [[AX, -1.3], [AZ, s * 0.4]], UpperArmR: [[AX, -1.3], [AZ, s * 0.4]],
      LowerArmL: [[AZ, -0.2 - k(-s) * 0.3]], LowerArmR: [[AZ, 0.2 + k(s) * 0.3]],
      Abdomen: [[AX, 0.04]], Torso: [[AY, s * 0.08]], Head: [[AY, -s * 0.05]],
    }; } },
  // rennen (de menigte op 9 november)
  run: { dur: 0.62, pose: ph => { const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU), k = v => Math.max(0, v);
    return {
      UpperLegL: [[AZ, s * 0.8]], UpperLegR: [[AZ, s * 0.8]],
      LowerLegL: [[AX, 0.25 + k(c) * 1.3]], LowerLegR: [[AX, 0.25 + k(-c) * 1.3]],
      UpperArmL: [[AX, -1.2], [AZ, s * 0.75]], UpperArmR: [[AX, -1.2], [AZ, s * 0.75]],
      LowerArmL: [[AZ, -1.3]], LowerArmR: [[AZ, 1.3]],
      Abdomen: [[AX, 0.2]], Torso: [[AY, s * 0.12]],
    }; } },
  // stilstaan: ademen, rondkijken, gewicht verplaatsen
  idle: { dur: 4.0, pose: ph => { const s = Math.sin(ph * TAU), s2 = Math.sin(ph * TAU * 2);
    return {
      UpperArmL: [[AX, -1.32], [AZ, s2 * 0.03]], UpperArmR: [[AX, -1.32], [AZ, -s2 * 0.03]],
      LowerArmL: [[AZ, -0.14]], LowerArmR: [[AZ, 0.14]],
      Chest: [[AX, s2 * 0.025]], Head: [[AY, Math.sin(ph * TAU + 1) * 0.35]],
      UpperLegL: [[AZ, 0.04]], LowerLegR: [[AX, 0.08]], Hips: [[AY, s * 0.04]],
    }; } },
  // praten: rechterhand gebaart naar voren, hoofd knikt
  talk: { dur: 2.4, pose: ph => { const s = Math.sin(ph * TAU), s3 = Math.sin(ph * TAU * 3);
    return {
      UpperArmL: [[AX, -1.3]], LowerArmL: [[AZ, -0.2]],
      UpperArmR: [[AX, -1.15 + s * 0.1], [AZ, 0.45 + s * 0.12]], LowerArmR: [[AZ, 1.15 + s3 * 0.25]], HandR: [[AY, s3 * 0.4]],
      Head: [[AY, s * 0.18]], Torso: [[AY, s * 0.06]], Abdomen: [[AX, 0.03 + s3 * 0.02]],
    }; } },
  // juichen: armen omhoog, zwaaien
  cheer: { dur: 0.8, pose: ph => { const s = Math.sin(ph * TAU);
    return {
      UpperArmL: [[AX, 0.85 + s * 0.3]], UpperArmR: [[AX, 0.85 - s * 0.3]],
      LowerArmL: [[AZ, -0.3 - s * 0.3]], LowerArmR: [[AZ, 0.3 - s * 0.3]],
      Abdomen: [[AX, -0.08]], Hips: [[AY, s * 0.08]],
    }; } },
  // vegen (Subbotnik): beide armen naar voren, heen en weer, licht door de knieën
  sweep: { dur: 1.4, pose: ph => { const s = Math.sin(ph * TAU);
    return {
      UpperArmL: [[AX, -1.1], [AZ, -0.6 - s * 0.2]], UpperArmR: [[AX, -1.1], [AZ, 0.45 - s * 0.2]],
      LowerArmL: [[AZ, -0.5]], LowerArmR: [[AZ, 0.5]],
      Torso: [[AY, s * 0.3]], Abdomen: [[AX, 0.3]],
      UpperLegL: [[AZ, 0.2]], UpperLegR: [[AZ, -0.2]], LowerLegL: [[AX, 0.35]], LowerLegR: [[AX, 0.35]],
    }; } },
};

const cache = new Map();
function restOf(root) {
  const rest = {};
  BONES.forEach(n => { const b = root.getObjectByName(n); if (b) rest[n] = b.quaternion.clone(); });
  return rest;
}
function buildClips(rest) {
  const clips = {};
  Object.entries(POSES).forEach(([name, P]) => {
    const steps = name === "idle" ? 16 : 12; const times = []; const vals = {};
    for (let i = 0; i <= steps; i++) {
      const ph = i / steps; times.push(ph * P.dur); const pose = P.pose(ph % 1);
      Object.keys(rest).forEach(bn => {
        const q = rest[bn].clone(); (pose[bn] || []).forEach(([ax, a]) => q.multiply(qa.setFromAxisAngle(ax, a)));
        (vals[bn] || (vals[bn] = [])).push(q.x, q.y, q.z, q.w);
      });
    }
    const tracks = Object.keys(rest).map(bn => new THREE.QuaternionKeyframeTrack(`${bn}.quaternion`, times, vals[bn]));
    clips[name] = new THREE.AnimationClip(name, P.dur, tracks);
  });
  return clips;
}

// Koppel een mixer aan een figuur (de skinned kopie van instance()). kind = figuursoort (cache-sleutel)
export function animate(root, kind) {
  let clips = cache.get(kind);
  if (!clips) { clips = buildClips(restOf(root)); cache.set(kind, clips); }
  const mixer = new THREE.AnimationMixer(root);
  const acts = {}; Object.keys(clips).forEach(n => { acts[n] = mixer.clipAction(clips[n]); });
  const A = { mixer, acts, cur: null,
    play(name, fade = 0.3, ts = 1, phase) {
      const a = acts[name]; if (!a) return;
      a.timeScale = ts;
      if (A.cur === a) return;
      a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
      if (phase !== undefined) a.time = phase * a.getClip().duration;
      if (A.cur && fade > 0) A.cur.crossFadeTo(a, fade, false); else if (A.cur) A.cur.stop();
      A.cur = a;
    },
    speed(ts) { if (A.cur) A.cur.timeScale = ts; },
    name: () => A.cur && A.cur.getClip().name,
    update(dt) { mixer.update(dt); },
  };
  return A;
}
