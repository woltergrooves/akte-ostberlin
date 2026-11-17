# AKTE: overdracht voor de volgende chat

Lees dit bestand eerst. Het wordt na elke fase bijgewerkt.

## Project
- Stasi-simulator in de browser: three.js r160 via importmap, ES-modules, geen build-stap.
- Repo: `woltergrooves/akte-ostberlin`. `main` is altijd speelbaar. Roadmap: `ROADMAP.md` (ook in het project als `claude/akte-roadmap.md`).
- Speelbare versie: **Vercel, alleen de hoofdlink (productie)**. Project `akte-ostberlin` (id `prj_0t8lqbjU0Qoo5AbMBypBQmhW0OS1`, team `team_9sTfW7elg4plHXQQzq2Vij2Q`), gekoppeld aan de repo. Elke push naar `main` deployt naar productie; preview-deployments staan uit. Geen artifacts meer gebruiken. `.vercelignore` sluit `tools/` en `.md` uit; geen buildstap (statische site, `.glb` gewoon via fetch).
- Controleer na de push met de Vercel-tools (list_deployments / get_deployment) dat de productie-deployment `READY` is, en geef de gebruiker die ene hoofdlink.
- Doelapparaat: iPhone/iPad Safari.
- **Taal: de game is volledig Engels** (sinds 17 nov). Alle nieuwe teksten in het spel in het Engels schrijven; alleen Duitse periodetermen (IM, Zersetzung, Genosse Major, Kreisdienststelle, Kaufhalle, stempels als STRENG GEHEIM) blijven Duits. Interne sleutels en code-commentaar mogen Nederlands blijven (`vrij`, `gevangen`, `kerk`...; weergave via `STATUS_L`). Met de gebruiker communiceren in het Nederlands.

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
- Klaar: fase 1, 1b, 2, 3 A+B, 3 C+D plus alle ideeën (17 nov) en **3E RPG** (18 nov). Speelbaar op https://akte-ostberlin.vercel.app (alleen deze link).
- Save-key nu `akte-save-v6` (nieuwe velden: `xp`, `spent`, `sk`, `rep {buurt, kerk}`, `errands`, `promo`; per persoon `owes`, `held`). Oude saves worden genegeerd.
- Modules: `js/audio.js`, `js/interiors.js`, `js/minigames.js` (letter/tape/darkroom/**verhoor**), `js/daily.js`, `js/meta.js` (nu ook medaille `helfer`), `js/lexicon.js`, **`js/rpg.js`** (SKILLS, XP-tabel, REP, ERRANDS, `buildStory` voor het verhoor).
- Fase 3E in `game.js`:
  - XP via `gainXP(n)` of `e.xp` in `applyE` (chip "XP +n"). Rang hangt af van `RANKS[i].xp` (0/80/220/420/650; vijfde rang Oberstleutnant). Bevordering zet `S.promo`; `showPromo()` verschijnt na `after()`, na een gebeurtenis, na de jaarbeoordeling of bij de briefing. Jaarbeoordeling geeft nu +25 XP en geen automatische bevordering meer.
  - Vaardigheden `S.sk` (obs, verh, ueb, tech, geh; max 5), één punt per 40 XP (`points()`). Effecten: observeren, roddel, waarschuwen, werfkans, ontdekkingskans microfoons, postcontrole, verdenking (`applyE` schaalt `d`), telefooncel, Fuchs. Tech 3 = +1 afluisterset (`bugCap()`).
  - Kaderakte: `kaderView` (tik op de rang in de HUD; rode +N bij punten). Ook via Jaardoelen.
  - Straat: `walkerCard` → `talkMenu` met keuzes en kansen (`talkChance`): small talk, vragen naar buren (Overtuigen), papieren vragen (Verhoor), koffie, omkopen met DM. Soms vraagt iemand een gunst.
  - Gunsten: `S.errands` (max 3, 3 beurten), uitvoeren in het dossier (`doErrand`): persoon `owes` (+15% werven), buurt +5. Verlopen: buurt −4.
  - Verhoor: knop "Interrogate" (2 MP, dossier ≥ 10 p.) → `interrogate(p)` → minigame `verhoor`. Cassette = extra leven (wordt verbruikt als je hem nodig had). Bekentenis van de dader markeert de zaak.
  - Treff: extra keuzes Probe (Verhoor), Win over (Overtuigen), Record (cassette → `im.held`: trager loyaliteitsverlies, nooit dubbelagent).
  - Geldkistje: Requisitie bij Abteilung 26 (1× per beurt, kost gunst): cassette, afluisterset (Techniek ≥ 1, max 3), Minox (vanaf Oberleutnant; observeren geeft minstens 2 dingen).
  - Reputatie: MfS = Favour, gezin = Family, nieuw `S.rep.buurt` en `S.rep.kerk` (zakken bij arrestaties, Zersetzung, waarschuwingen; stijgen met gunsten; trekken elke beurt 1 punt terug naar 45/40). Effect op gesprekskansen, roddel, werven van kerkmensen, epiloog.
- Test 18 nov: drie volledige rondes 1983 → einde (mobiel 390×844 en desktop) met alle nieuwe schermen, geen consolefouten (alleen de geblokkeerde Google-fonts in de testomgeving). Testscript lag in `/tmp/akt`.

## Volgende fase: FASE 4 (animaties)
Zie hieronder. Kleine RPG-wensen voor later: balans van XP (een speler haalt ±500–800 XP), meer soorten gunsten, gesprekskeuzes ook in de Kneipe en de Kaufhalle.

## Fase 4: animaties
- Eerste-persoonshanden in het kantoor: hoorn oppakken als de telefoon gaat (node `Handset`), dossier pakken en openslaan, stempelen bij een beslissing ("GENEHMIGT"/"ABGELEHNT", node `Stamp`), typen bij Afsluiten met papier dat eruit wordt getrokken (`Carriage`, `Paper`). Handen eventueel zelf bouwen als low-poly rigid parts.
- Camera: rondkijken in het kantoor, vlucht door het raam naar de wijk, inzoomen op een getikt gebouw.
- Wijk: echte loop-, sta- en praatanimaties voor de figuren. Probeer eerst de Quaternius *Universal Animation Library* (CC0) via GitHub-mirrors. Lukt dat niet, maak dan clips met keyframes op de botten (`AnimationClip` met `QuaternionKeyframeTrack`) en vervang daarmee `posePerson()`.
- `AnimationMixer` met overgangen; één `.glb` per figuur met meerdere clips.
- Korte filmpjes: Wartburg die om 5 uur voorrijdt bij een arrestatie; de Muur die opengaat op 9 november.
- PS2-look, gameplay en mobiele werking blijven zoals ze zijn. Let op prestaties: 32 lopers + 90 figuren in de finale.
