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
- `js/data.js`: tijdlijn (15 beurten), rangen, gebouwen, kenmerken, personages
- `js/events.js`: verhaal (vaste en voorwaardelijke gebeurtenissen)
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
- Klaar: fase 1, fase 1b en fase 2. Speelbaar op https://akte-ostberlin.vercel.app (alleen deze link gebruiken).

## Volgende fase: FASE 3, gameplay-herziening (wensen van de gebruiker, 17 nov)
De gebruiker wil dit vóór de animaties (die schuiven naar fase 4). Is het te veel voor één chat, doe dan eerst A en B, daarna C–E, en werk de handoff bij met wat nog openstaat.

**A. Twee fixes**
- **Opdrachten zijn herbruikbaar (bug).** Na een beslissing kun je dezelfde opdracht opnieuw openen en kiezen, en dan worden de gevolgen opnieuw toegepast. Oorzaak: `inboxView()` en het telefoonoverzicht (`data-q`-knoppen) houden een verwijzing naar het event vast. Na `chooseEvent()` wordt het open sheet niet opnieuw getekend, en `openEvent()`/`chooseEvent()` controleren niet of `q` nog in `S.queue` staat. Fix: in beide functies stoppen als `!S.queue.includes(q)`, het sheet na een keuze opnieuw renderen (`rerender()`), en de knop direct uitschakelen bij het openen. Test: dezelfde opdracht twee keer proberen → de tweede keer gebeurt er niets.
- **Postvak in overzichtelijker.** Nu is het één lange lijst (`inboxView`). Maak het scanbaar: bovenaan wachtende opdrachten en het onderzoek, daarna berichten per beurt (ongelezen apart), het soort bericht als Dymo-label (IM-rapport, microfoon, waarschuwing, info), alleen de eerste regel met uitklappen, en oudere beurten ingeklapt. Huisstijl aanhouden.

**B. Tempo en tijdlijn: langzamer, eerder beginnen, historisch kloppend**
- Het spel gaat nu te snel (15 beurten, 1985–1989). Voorstel: begin in **1983** en maak het ±30 beurten (vier per jaar, met extra beurten rond 1987 en in de herfst van 1989). Meer tijd per beurt om de wijk te verkennen.
- Gebruik echte gebeurtenissen met kloppende datums en **controleer elke datum met een webbron** voordat je hem gebruikt. Kandidaten: vredesbeweging "Schwerter zu Pflugscharen" (1982–83), ausreisegolf 1984, Gorbatsjov aan de macht (maart 1985), Tsjernobyl (april 1986), Umweltbibliothek in de Zionskirche (1986), Bowie-concert bij de Reichstag en de rellen Unter den Linden (juni 1987), Honecker in Bonn (sept. 1987), aanval van skinheads in de Zionskirche (okt. 1987), inval in de Umweltbibliothek (nov. 1987), Liebknecht-Luxemburg-demonstratie met arrestaties (jan. 1988), verbod op Sputnik (nov. 1988), verkiezingsfraude (mei 1989), Neues Forum (sept. 1989), 40 jaar DDR en 9 oktober in Leipzig, 4 november op de Alexanderplatz, 9 november.
- Pas `TURNS` in `data.js` en de verhaalgebeurtenissen in `events.js` aan, en ook de quota en de jaarbeoordelingen. Oude saves (`akte-save-v3`) ongeldig maken met een nieuwe save-key.

**C. DDR-sfeer**
- Radio (DT64, Stimme der DDR) en *Aktuelle Kamera* met nieuws van de beurt, krantenkoppen van *Neues Deutschland* op de krant op het bureau, de kalender met echte feestdagen (1 mei, 7 oktober).
- In de wijk: rijen voor de Kaufhalle bij "Bückware", Westpakete, Intershop, wachtlijst voor de Trabant, Subbotnik, FDJ-blauwhemden en pioniers, kolenkachelrook in de winter, spandoeken met leuzen die per jaar wisselen.
- Geen clichés zonder context: kleine, concrete details die kloppen.

**D. De wereld interactief**
- Tik op voorbijgangers in de wijk: wie het is, kort gesprek of observatie (koppel ze aan de bewoners uit `data.js`).
- Gebouwen in: trappenhuis en woning als kleine 3D-scène, de Kneipe (Café Mosaik), de Kaufhalle, een Konspirative Wohnung, de telefooncel, de litfaßzuil met affiches.
- Voorwerpen in het kantoor en de wijk die iets doen (radio aan, krant lezen, la open).

**E. RPG-elementen**
- Speler: ervaringspunten uit zaken en rapporten, rang hangt daarvan af. Vaardigheden die je verbetert: Observatie, Verhoor, Overtuigen, Techniek (microfoons), Geheimhouding. Ze beïnvloeden de kansen die het spel al toont.
- Keuzes in gesprekken met vaardigheidschecks (kans in procenten zichtbaar, in de huidige stijl).
- Inventaris: Westgeld, Jacobs-koffie, cassettes, Minox-camera, afluistersets. Te gebruiken om informanten te betalen of mensen om te kopen.
- Relaties en reputatie: bij Kessler/MfS, de buurt, de kerk en het gezin. Bijmissies per bewoner (kleine verhaallijnen).
- Het moet een simulator blijven op de iPhone: kort per scherm, één duidelijke keuze tegelijk.

## Fase 4: animaties (was fase 3)
- Eerste-persoonshanden in het kantoor: hoorn oppakken als de telefoon gaat (node `Handset`), dossier pakken en openslaan, stempelen bij een beslissing ("GENEHMIGT"/"ABGELEHNT", node `Stamp`), typen bij Afsluiten met papier dat eruit wordt getrokken (`Carriage`, `Paper`). Handen eventueel zelf bouwen als low-poly rigid parts.
- Camera: rondkijken in het kantoor, vlucht door het raam naar de wijk, inzoomen op een getikt gebouw.
- Wijk: echte loop-, sta- en praatanimaties voor de figuren. Probeer eerst de Quaternius *Universal Animation Library* (CC0) via GitHub-mirrors. Lukt dat niet, maak dan clips met keyframes op de botten (`AnimationClip` met `QuaternionKeyframeTrack`) en vervang daarmee `posePerson()`.
- `AnimationMixer` met overgangen; één `.glb` per figuur met meerdere clips.
- Korte filmpjes: Wartburg die om 5 uur voorrijdt bij een arrestatie; de Muur die opengaat op 9 november.
- PS2-look, gameplay en mobiele werking blijven zoals ze zijn. Let op prestaties: 32 lopers + 90 figuren in de finale.
