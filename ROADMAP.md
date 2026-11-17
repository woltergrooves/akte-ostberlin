# Roadmap

We werken in fases. Elke fase krijgt een eigen branch (`fase-N`) en wordt daarna samengevoegd in `main`. `main` is altijd speelbaar.

## ✅ Fase 1: Korter, simpeler, moderner

- [x] Speelduur ingekort: van 31 naar 15 beurten (voorjaar, zomer, herfst)
- [x] Minder meters: Gunst, Geweten, Verdenking (Onrust en Gezin werken op de achtergrond)
- [x] Minder acties: observeren, werven, waarschuwen, arresteren en microfoons
- [x] Werven met één knop, met de kans in procenten
- [x] Resultaten als korte melding, kortere uitleg en beurtoverzicht
- [x] PS2-graphics: rendering op lage resolutie (±460p), 15-bit kleur met ordered dither, Lambert-shading met facetten, pixelige texturen, harde schaduwen, low-poly mensen
- [x] Op GitHub gezet

## ✅ Fase 1b: Eigen stijl en Oost-Berlijn

- [x] Eigen huisstijl: stalen HUD met LED-meters, Dymo-labels, telexstroken, dossierpapier (Oswald, VT323, Plex)
- [x] Geen emoji's of generieke 'app'-look meer
- [x] De wijk als echt Prenzlauer Berg: dichte Altbau-blokken met roet, winkeltjes, brandmuren met reclame
- [x] Plattenbau WBS 70 met loggia's, dakleus, spandoek
- [x] Kinderkopjes, Peitschenleuchten, litfaßzuilen, telefooncel, Tatra-tram, vlaggen, smog

---

## Fase 2: Echte 3D-modellen (asset-pipeline)

Nu is alles opgebouwd uit blokjes in code. In deze fase vervangen we dat door echte low-poly modellen die in Blender worden voorbereid.

**Werkwijze**
- [ ] Map `assets/models/` met `.glb`-bestanden, ingeladen met three.js `GLTFLoader`
- [ ] Blender als werkplaats: modellen importeren, polygonen terugbrengen (Decimate), texturen verkleinen naar 128–256 px, exporteren als `.glb`
- [ ] PS2-budget: rekwisieten ±300–1.500 driehoeken, personages ±1.500–3.000, texturen 128–256 px met *nearest*-filter
- [ ] Compressie (meshopt of Draco) zodat het snel laadt op een iPhone
- [ ] `CREDITS.md` met bron en licentie per model
- [ ] Laadscherm met voortgangsbalk

**Bronnen**

| Bron | Wat | Licentie | Gebruik voor |
|---|---|---|---|
| [Quaternius](https://quaternius.com) | Low-poly packs (mensen, steden, voertuigen) + Universal Animation Library | CC0, geen naamsvermelding nodig | Basis voor voetgangers en animaties |
| [Kenney](https://kenney.nl) | Game-ready props (meubels, straat, auto's) | CC0 | Kantoormeubels, straatmeubilair |
| [Poly Haven](https://polyhaven.com) / [ambientCG](https://ambientcg.com) | Texturen (baksteen, beton, pleister, linoleum) | CC0 | Gevels, vloeren (verkleinen tot PS2-formaat) |
| [Poly Pizza](https://poly.pizza) | Archief van Google Poly | Meestal CC-BY (naamsvermelding) | Losse rekwisieten |
| [Sketchfab](https://sketchfab.com) | Grootste aanbod, ook DDR-specifiek | Wisselend, per model checken | Trabant, Wartburg, tram |
| [itch.io (tag PSX)](https://itch.io/game-assets/tag-psx) | Kant-en-klare PS1/PS2-stijl packs | Per pack (vaak gratis of een paar euro) | Handen, telefooncel, kantoorspullen |
| [Mixamo](https://www.mixamo.com) | Automatisch riggen + duizenden animaties | Gratis met Adobe-account, royaltyvrij in games | Lopen, praten, arresteren |
| [CGTrader](https://www.cgtrader.com) | Betaalde, specifieke modellen | Royalty Free (let op 'Editorial only') | Trabant 601 met interieur (±$16) |

**Modellenlijst**

*Kantoor*
- [ ] Bakelieten telefoon (W63-stijl) met losse hoorn
- [ ] Typemachine (Erika/Robotron), bureaulamp, stempel en stempelkussen, asbak
- [ ] Kartotheekkast met lades die opengaan, archiefdozen, dossiermappen
- [ ] Radio (RFT), koffiekop, bandrecorder (voor afgeluisterde gesprekken)
- [ ] Bureaustoel, kapstok met leren jas, rolluik, plafondlamp

*Wijk*
- [ ] Trabant 601 en 601 Kombi, Wartburg 353, Barkas B1000-busje, Ikarus-bus
- [ ] Tatra KT4D-tram met stroomafnemer
- [ ] Altbau-gevels met erkers, balkons en binnenplaatsen
- [ ] WBS 70-Plattenbau in modulaire delen
- [ ] Peitschenleuchte, litfaßzuil, telefooncel, kiosk, Ampelmännchen-stoplicht, kolenkelderluik
- [ ] Muur (Grenzmauer 75) met wachttoren, Fernsehturm

*Personages*
- [ ] 6–8 basisfiguren (arbeider, oude vrouw, punk, dominee, Vopo, Stasi-man in leren jas) met verwisselbare kleuren
- [ ] Kessler, Fuchs, Katrin en Jens als eigen modellen

## Fase 3: Animaties

**Eerste-persoonshanden in het kantoor** (rigged handen, bijv. via itch.io of Blender Rigify)
- [ ] Hoorn van de telefoon oppakken en tegen het oor houden als hij gaat
- [ ] Dossier van de stapel pakken en openslaan
- [ ] Stempel op een dossier zetten bij een beslissing ("GENEHMIGT", "ABGELEHNT")
- [ ] Typen op de typemachine bij Afsluiten, met een papier dat eruit wordt getrokken
- [ ] Kartotheeklade opentrekken en kaartjes doorbladeren
- [ ] Sigaret aansteken, koffie drinken (idle-animaties als je even niets doet)

**Camera**
- [ ] Rondkijken in het kantoor (naar het raam, de deur, de kast)
- [ ] Overgang kantoor → wijk: camera vliegt door het raam naar buiten
- [ ] Inzoomen op een gebouw als je erop tikt

**Wijk**
- [ ] Voetgangers met loop-, sta- en praatanimaties (Quaternius of Mixamo)
- [ ] Deuren en ramen die opengaan, lichten die 's avonds aangaan
- [ ] Korte filmpjes: Wartburg die om 5 uur 's ochtends voorrijdt bij een arrestatie, de Muur die opengaat op 9 november

**Techniek**
- [ ] three.js `AnimationMixer` met overgangen tussen clips
- [ ] Eén `.glb` per personage met meerdere animaties

## Fase 4: De wijk leeft

- [ ] Bewoners lopen echt rond als personages. Tik op iemand op straat om het dossier te openen.
- [ ] Gebouwen tonen wat je weet (microfoons, informanten, verdachten)
- [ ] Dag en nacht per beurt, straatverlichting
- [ ] Weer: regen, mist, sneeuw

## Fase 5: Nieuwe spelonderdelen

- [ ] **Verhoor**: een gesprek in de verhoorkamer met keuzes. Zoek de tegenstrijdigheid in iemands verhaal.
- [ ] **Bandrecorder**: luister afgeluisterde gesprekken terug op een spoelenrecorder, spoel heen en weer en markeer verdachte zinnen
- [ ] **Brieven openstomen** (Abteilung M): stoom een envelop open, lees hem, plak hem terug zonder sporen. Te lang = de ontvanger merkt het.
- [ ] **Schaduwen**: volg iemand door de wijk zonder gezien te worden
- [ ] **Microfoon plaatsen**: sluip een woning binnen en verstop een microfoon voordat de bewoner thuiskomt
- [ ] **Doka**: ontwikkel observatiefoto's en herken gezichten
- [ ] **Konspirative Wohnung**: geheime afspraken met je informanten. Betaal ze met koffie of Westgeld en houd ze loyaal.
- [ ] **Jouw rapport**: aan het eind van een beurt typ je je rapport. Wat je weglaat beschermt mensen, maar verhoogt de verdenking tegen jou.
- [ ] **Thuis**: een eigen 3D-scène in je flat met Katrin en Jens
- [ ] **Nieuws**: radio en krant met echte gebeurtenissen (Gorbatsjov, Hongarije, Leipzig)
- [ ] **Epiloog in 3D**: in 1992 lees je in de leeszaal van het Stasi-archief je eigen dossier

## Fase 6: Geluid en sfeer

- [ ] Geluid: typemachine, telefoon, radio, regen, tram, voetstappen
- [ ] Muziek per jaar (1985 kil, 1989 opwindend)
- [ ] Trillen bij belangrijke momenten (iPhone)

## Fase 7: Meer verhaal

- [ ] Rivaal Fuchs krijgt een eigen verhaallijn
- [ ] Meer eindes en een galerij van ontdekte eindes
- [ ] Moeilijkheidsgraden en een vrije modus zonder verhaal

## Fase 8: Afwerking

- [ ] Balans (moeilijkheid, kansen)
- [ ] Speelbaar via GitHub Pages en als app-icoon op het beginscherm (PWA)
- [ ] Prestaties op oudere iPhones
