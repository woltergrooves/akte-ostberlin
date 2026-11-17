# AKTE: overdracht voor de volgende chat

Lees dit bestand eerst. Het wordt na elke fase bijgewerkt.

## Project
- Stasi-simulator in de browser: three.js r160 via importmap, ES-modules, geen build-stap.
- Repo: `woltergrooves/akte-ostberlin`. `main` is altijd speelbaar. Roadmap: `ROADMAP.md` (ook in het project als `claude/akte-roadmap.md`).
- Speelbare versie: artifact-slug `da2f9866-80d4-47bd-99ec-b3ab77febc71`. Na elke fase alle bestanden opnieuw publiceren (publish_files, inclusief assets).
- Doelapparaat: iPhone/iPad Safari.

## Bestanden
- `index.html`: pagina en importmap
- `css/style.css`: huisstijl DDR × PS2 (stalen HUD met LED-meters, Dymo-labels, telexstrook, dossierpapier; fonts Oswald, VT323, IBM Plex Sans Condensed). Geen emoji's, geen generieke app-look.
- `js/data.js`: tijdlijn (15 beurten), rangen, gebouwen, kenmerken, personages
- `js/events.js`: verhaal (vaste en voorwaardelijke gebeurtenissen)
- `js/world.js`: 3D-kantoor en -wijk. PS2-nabewerking: render op ±460p, 15-bit dither, Lambert flatShading, nearest-texturen.
- `js/game.js`: regels, interface, uitleg, coach

## Werkwijze
1. Clone de repo en maak branch `fase-N`.
2. Testen met Playwright en Chrome op `/usr/bin/google-chrome` (`--use-gl=swiftshader`), mobiel formaat 390×844: geen consolefouten en een volledige speelronde. Zet voor tests tijdelijk `window.__akte` in een testkopie, niet in de repo.
3. Commit, merge met `--ff-only` in `main` en push.
4. Werk de vinkjes in `ROADMAP.md` bij, en ook dit bestand (sectie "Volgende fase"). Schrijf beide naar het project (`claude/akte-roadmap.md`, `claude/akte-handoff.md`).
5. Publiceer het artifact opnieuw.
6. Antwoord kort en in het Nederlands. Eindig met de korte prompt voor de volgende chat.

## Status
- Klaar: fase 1 en fase 1b.

## Volgende fase: FASE 2, echte 3D-modellen
- Map `assets/models/` met `.glb`-bestanden, geladen met GLTFLoader, plus een laadscherm.
- Download alleen wat vanuit de werkomgeving lukt, CC0 eerst (Quaternius, Kenney, Poly Pizza CC0). Lukt dat niet, bouw de modellen dan zelf als `.glb` (Blender headless of three.js GLTFExporter).
- PS2-budget: rekwisieten 300–1.500 driehoeken, texturen 128–256 px.
- Prioriteit: telefoon met losse hoorn (voorbereid op fase 3), typemachine, bureaulamp, stempel, Trabant 601, Wartburg 353, Tatra-tram, 6 basisfiguren voor voetgangers.
- `CREDITS.md` met bron en licentie per model.
- PS2-look, gameplay en mobiele werking blijven zoals ze zijn.
