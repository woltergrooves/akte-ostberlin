// Maakt een publiceerbare kopie voor het claude.ai-artifact (dat geen .glb-bestanden serveert):
// de modellen gaan als base64 in assets/models/bundle.js, index.html laadt die bundel.
// De meshopt-compressie wordt eruit gehaald, zodat het artifact geen WebAssembly nodig heeft (CSP).
// Gebruik: node tools/make-artifact.mjs <doelmap>
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(process.argv[2] || "/tmp/akte-artifact");
fs.rmSync(OUT, { recursive: true, force: true });
for (const f of ["index.html", "css/style.css", ...fs.readdirSync(path.join(ROOT, "js")).map(f => "js/" + f)]) { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f)); }
const M = {};
for (const f of fs.readdirSync(path.join(ROOT, "assets/models"))) if (f.endsWith(".glb")) {
  const doc = await io.read(path.join(ROOT, "assets/models", f));
  doc.getRoot().listExtensionsUsed().filter(e => e.extensionName === "EXT_meshopt_compression").forEach(e => e.dispose());
  M[f.slice(0, -4)] = Buffer.from(await io.writeBinary(doc)).toString("base64");
}
fs.mkdirSync(path.join(OUT, "assets/models"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets/models/bundle.js"), "window.AKTE_MODELS=" + JSON.stringify(M) + ";\n");
const idx = path.join(OUT, "index.html"); fs.writeFileSync(idx, fs.readFileSync(idx, "utf8").replace('<script type="module" src="js/game.js">', '<script src="assets/models/bundle.js"></script>\n<script type="module" src="js/game.js">'));
console.log("artifact-kopie in", OUT, Object.keys(M).length, "modellen");
