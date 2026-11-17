# AKTE: overdracht voor de volgende chat

Lees dit bestand eerst. Het wordt na elke fase bijgewerkt.

## Project
- Stasi-simulator in de browser: three.js r160 via importmap, ES-modules, geen build-stap.
- Repo: `woltergrooves/akte-ostberlin`. `main` is altijd speelbaar. Roadmap: `ROADMAP.md` (ook in het project als `claude/akte-roadmap.md`).
- Speelbare versie: **Vercel, alleen de hoofdlink (productie)**. Project `akte-ostberlin` (id `prj_0t8lqbjU0Qoo5AbMBypBQmhW0OS1`, team `team_9sTfW7elg4plHXQQzq2Vij2Q`), gekoppeld aan de repo. Elke push naar `main` deployt naar productie; preview-deployments staan uit. Geen artifacts meer gebruiken. `.vercelignore` sluit `tools/` en `.md` uit; geen buildstap (statische site, `.glb` gewoon via fetch).
- Controleer na de push met de Vercel-tools (list_deployments / get_deployment) dat de productie-deployment `READY` is, en geef de gebruiker die ene hoofdlink.
- Doelapparaat: iPhone/iPad Safari.

## Bestanden
- `index.html`: pagina en importmap, laadscherm `#loader`
- `css/style.css`: huisstijl DDR × PS2 (stalen HUD met LED-meters, Dymo-labels, telexstrook, dossierpapier; fonts Oswald, VT323, IBM Plex Sans Condensed). Geen emoji's, geen generieke app-look.
- `js/data.js`: tijdlijn `TURNS` (32 beurten, maart 1983 – 9 nov. 1989, sleutels als `1987-okt`; `turnIndex(key)`), rangen, gebouwen, kenmerken, personages, `INCIDENTS` (met `from`-jaar)
- `js/events.js`: `STORY` per beurtsleutel (plus `<sleutel>b` voor een tweede scène), `CONDITIONAL` (voorwaarden op jaartal/vlag, niet op beurtnummer)
- `js/assets.js`: laadt alle `.glb` (GLTFLoader + MeshoptDecoder), zet materialen om naar PS2-Lambert (vertexkleuren, flatShading). `instance(M, naam)` geeft een kopie (figuren via SkeletonUtils).
- `js/world.js`: 3D-kantoor en -wijk. `createWorld(container, H, models)`. Elk model heeft een fallback naar de oude blokjes als het niet laadt. PS2-nabewerking: render op ±460p, 15-bit dither.
- `js/game.js`: regels, interface, uitleg, coach. `boot()` is async: eerst modellen laden, dan de wereld.
- `assets/models/`: 17 `.glb` (±375 kB, meshopt). Bron en licentie: `CREDITS.md`.
- `tools/`: `build-models.mjs` (eigen modellen), `build-figures.mjs` (Quaternius-figuren), `fetch-sources.sh`, `make-artifact.mjs` (oud, alleen voor claude.ai-artifacts). `cd tools && npm i` eerst.

## Technische notities (fase 2)
- Netwerk in de werkomgeving: Kenney en Poly Pizza geven 403, de Google Drive van Quaternius geeft "quota exceeded". `raw.githubusercontent.com` werkt wel (mirror `trebeljahr/quaternius-showcase`). jsDelivr en npm werken.
- Modelnodes voor animatie: telefoon `Handset`, `Dial`; typemachine `Carriage`, `Paper`; stempel `Stamp`, `Pad`; tram `SectionA`, `SectionB`, `Joint`, `Pantograph`.
- Figuren: één skinned mesh, skelet van Quaternius, **geen animatieclips**. three.js haalt de punt uit botnamen: `UpperArmL`, `UpperLegR`, enz. Vanuit de T-pose: armen omlaag = lokale X −1,3; zwaaien = lokale Z. Been links naar voren = +Z, rechts naar voren = −Z. Zie `posePerson()` in `world.js`. Schaal in de wijk 0,78.
- Materiaal `paint` = lakkleur per exemplaar (auto's), `glow` = onbelicht (lampjes).
- Testen: Playwright staat in `/opt/npm-tools/node_modules/playwright`. Mobiel 390×844, `--use-gl=swiftshader --enable-unsafe-swiftshader`.

## Werkwijze
1. Clone de repo en maak branch `fase-N`.
2. Testen met Playwright en Chrome op `/usr/bin/google-chrome` (`--use-gl=swiftshader`), mobiel formaat 390×844: geen consolefouten en een volledige speelronde. Zet voor tests tijdelijk `window.__akte` in een testkopie, niet in de repo.
3. Commit, merge met `--ff-only` in `main` en push.
4. Werk de vinkjes in `ROADMAP.md` bij, en ook dit bestand (sectie "Volgende fase"). Schrijf beide naar het project (`claude/akte-roadmap.md`, `claude/akte-handoff.md`).
5. Push naar `main` (Vercel deployt productie). Controleer dat de deployment `READY` is. Werk alleen op de hoofdlink, geen preview-links.
6. Antwoord kort en in het Nederlands. Eindig met de korte prompt voor de volgende chat.

## Status
- Klaar: fase 1, 1b, 2 en **fase 3 A+B** (17 nov). Speelbaar op https://akte-ostberlin.vercel.app (alleen deze link gebruiken).
- 3A: `openEvent`/`chooseEvent` stoppen als `q` niet meer in `S.queue` staat; keuzeknoppen gaan direct uit; na een keuze `rerender()`. Postvak (`inboxView`, `msgHTML`, `KLAB`): wacht-op-jou bovenaan, nieuw apart, Dymo-label per soort, eerste regel + uitklappen, oudere beurten in `<details>`.
- 3B: 32 beurten, 9 nieuwe scènes (embleem, Frauen für den Frieden, Ständige Vertretung, Gorbatsjov, Umwelt-Bibliothek, Palme-mars, skinheads Zionskirche, Gueffroy, Alexanderplatz). Bronnen staan in `ROADMAP.md` bij fase 3. Jaardoelen `QUOTA` 1983–1989, save-key `akte-save-v4`. Fuchs-vlag `S.flags.fuchsMet`. Lege beurten (zonder vaste scène): dec. 1984, mrt. 1986, dec. 1986.
- Test 17 nov: volledige ronde 1983 → epiloog zonder consolefouten (Playwright-script lag in `/tmp`, niet in de repo).

## Volgende fase: FASE 3 C–E (de rest van de gameplay-herziening)
Te veel voor één chat? Doe dan C en D, en zet E in de handoff. Houd elk scherm kort: één duidelijke keuze tegelijk (iPhone).

**C. DDR-sfeer**
- Per beurt een nieuwsregel: radio (DT64, Stimme der DDR), *Aktuelle Kamera*, kop van *Neues Deutschland* op de krant op het bureau. Voeg een veld `news` toe aan `TURNS` en toon het in `briefing()` en op de krant. Alleen feiten die je met een bron kunt controleren; geen verzonnen letterlijke koppen, wel een omschrijving.
- Kalender met echte feestdagen (1 mei, 7 oktober). In de wijk: rijen voor de Kaufhalle bij ‘Bückware’, Westpakete, Intershop, wachtlijst voor de Trabant, Subbotnik, FDJ-blauwhemden en pioniers, kolenkachelrook in de winter (`T.winter`), spandoeken met leuzen die per jaar wisselen.
- Geen clichés zonder context: kleine, concrete details die kloppen.

**D. De wereld interactief**
- Tik op voorbijgangers in de wijk: wie het is, kort gesprek of observatie (koppelen aan bewoners uit `data.js`).
- Gebouwen in: trappenhuis en woning als kleine 3D-scène, de Kneipe (Café Mosaik), de Kaufhalle, een Konspirative Wohnung, de telefooncel, de litfaßzuil met affiches.
- Voorwerpen in kantoor en wijk die iets doen (radio aan, krant lezen, la open).

**E. RPG-elementen**
- Ervaringspunten uit zaken en rapporten; rang hangt daarvan af. Vaardigheden: Observatie, Verhoor, Overtuigen, Techniek (microfoons), Geheimhouding. Ze beïnvloeden de kansen die het spel al toont.
- Gesprekskeuzes met vaardigheidscheck (kans in procenten, in de huidige stijl).
- Inventaris: Westgeld, Jacobs-koffie, cassettes, Minox-camera, afluistersets; om informanten te betalen of mensen om te kopen.
- Reputatie bij Kessler/MfS, de buurt, de kerk en het gezin. Bijmissies per bewoner.
- Let op: met 6 jaarbeoordelingen kun je snel Major worden. Overweeg bij E een vijfde rang of bevordering via ervaringspunten.

## Fase 4: animaties (was fase 3)
- Eerste-persoonshanden in het kantoor: hoorn oppakken als de telefoon gaat (node `Handset`), dossier pakken en openslaan, stempelen bij een beslissing ("GENEHMIGT"/"ABGELEHNT", node `Stamp`), typen bij Afsluiten met papier dat eruit wordt getrokken (`Carriage`, `Paper`). Handen eventueel zelf bouwen als low-poly rigid parts.
- Camera: rondkijken in het kantoor, vlucht door het raam naar de wijk, inzoomen op een getikt gebouw.
- Wijk: echte loop-, sta- en praatanimaties voor de figuren. Probeer eerst de Quaternius *Universal Animation Library* (CC0) via GitHub-mirrors. Lukt dat niet, maak dan clips met keyframes op de botten (`AnimationClip` met `QuaternionKeyframeTrack`) en vervang daarmee `posePerson()`.
- `AnimationMixer` met overgangen; één `.glb` per figuur met meerdere clips.
- Korte filmpjes: Wartburg die om 5 uur voorrijdt bij een arrestatie; de Muur die opengaat op 9 november.
- PS2-look, gameplay en mobiele werking blijven zoals ze zijn. Let op prestaties: 32 lopers + 90 figuren in de finale.
