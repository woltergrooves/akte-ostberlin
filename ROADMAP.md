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

## ✅ Fase 2: Echte 3D-modellen (asset-pipeline)

De belangrijkste blokjes zijn vervangen door echte low-poly modellen. Lukt het laden niet, dan valt het spel terug op de oude blokjes.

**Werkwijze**
- [x] Map `assets/models/` met 17 `.glb`-bestanden, ingeladen met three.js `GLTFLoader` (`js/assets.js`)
- [x] Werkplaats in Node in plaats van Blender: `tools/build-models.mjs` (eigen modellen, three.js → glTF Transform) en `tools/build-figures.mjs` (Quaternius samenvoegen, herkleuren, decimeren met meshopt)
- [x] PS2-budget: rekwisieten 180–1.000 driehoeken, tram 1.600, personages 2.400. Geen texturen nodig: vertexkleuren met Lambert-facetten
- [x] Compressie met meshopt + quantisatie: alle modellen samen ±375 kB
- [x] `CREDITS.md` met bron en licentie per model
- [x] Laadscherm met voortgangsbalk (LED-balk op staal)

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
- [x] Bakelieten telefoon (W63-stijl) met losse hoorn en kiesschijf (nodes `Handset`, `Dial`)
- [x] Typemachine (Erika/Robotron, wagen en papier los), bureaulamp, stempel en stempelkussen, asbak
- [ ] Kartotheekkast met lades die opengaan, archiefdozen, dossiermappen
- [x] Koffiekop
- [ ] Radio (RFT), bandrecorder (voor afgeluisterde gesprekken)
- [ ] Bureaustoel, kapstok met leren jas, rolluik, plafondlamp

*Wijk*
- [x] Trabant 601, Wartburg 353 (lak per auto in een andere kleur)
- [ ] Trabant 601 Kombi, Barkas B1000-busje, Ikarus-bus
- [x] Tatra KT4D-tram met stroomafnemer (rijdraad hangt nu op de juiste hoogte)
- [ ] Altbau-gevels met erkers, balkons en binnenplaatsen
- [ ] WBS 70-Plattenbau in modulaire delen
- [ ] Peitschenleuchte, litfaßzuil, telefooncel, kiosk, Ampelmännchen-stoplicht, kolenkelderluik
- [ ] Muur (Grenzmauer 75) met wachttoren, Fernsehturm

*Personages*
- [x] 8 basisfiguren (arbeider, oude vrouw, punk, dominee, Vopo, Stasi-man in leren jas, burger, burgeres) met skelet; armen en benen bewegen al mee bij het lopen
- [ ] Kessler, Fuchs, Katrin en Jens als eigen modellen

## Fase 3: Tempo, geschiedenis, sfeer en RPG

**Fixes**
- [x] Opdrachten verdwijnen na één beslissing (getest: tweede poging doet niets)
- [x] Postvak in overzichtelijker: opdrachten bovenaan, nieuw apart, soort als Dymo-label, eerste regel met uitklappen, oudere beurten ingeklapt
- [x] Kartotheek overzichtelijk: zoeken (ook op werkplek/adres), filters met tellers (Verdacht, IM's, Onderzoek, Onbekend, Weg), laden per adres of dikste dossiers eerst, verdenkingsmeter per kaart
- [x] iPhone: invoervelden 16px (Safari zoomt niet meer in), kop van het sheet schuift niet meer over de inhoud

**Tempo en geschiedenis**
- [x] Langzamer: begin in maart 1983, 32 beurten (vier per jaar, vijf in 1987, zeven in 1989); nieuwe jaardoelen; save-key `akte-save-v4`
- [x] Echte gebeurtenissen met gecontroleerde datums, 9 nieuwe verhaalscènes; losse pamfletten pas vanaf het jaar waarin ze passen

  Gecontroleerd (17 nov 2026): Schwerter zu Pflugscharen in Wittenberg, 24-9-1983 (evangelisch.de) · arrestatie Bohley en Poppe, 12-12-1983, zes weken vast (jugendopposition.de, dissidenten.eu) · uitreisgolf 1984, ±40.000 (germanhistorydocs.org) · Ständige Vertretung gesloten 27-6 t/m 31-7-1984 (bpb.de) · Gorbatsjov gekozen 11-3-1985 (bpb.de) · Tsjernobyl 26-4-1986, ND drukt TASS-melding (bpb.de, freitag.de) · Umwelt-Bibliothek geopend 2-9-1986 (germanhistorydocs.org) · Concert for Berlin 6–8-6-1987 (museum-digital.de) · Honecker in de BRD 7–11-9-1987, Olof-Palme-mars 1–18-9 (bundesarchiv.de) · skinheads in de Zionskirche 17-10-1987, ±30 man (stasi-mediathek.de) · Aktion „Falle“ 24/25-11-1987 (stasi-mediathek.de) · Liebknecht-Luxemburg-demo 17-1-1988 (bundesarchiv.de) · Springsteen Weißensee 19-7-1988, 160.000 kaarten (l-iz.de) · Sputnik geschrapt 18/19-11-1988 (stasi-mediathek.de) · Chris Gueffroy 5-2-1989, rouwadvertentie 21-2 (chronik-der-mauer.de) · verkiezingen 7-5-1989, 98,85% (bundestag.de) · Hongaarse grens: afbraak vanaf 2-5, picknick 19-8, open 11-9-1989 · Neues Forum 9/10-9-1989 (bpb.de) · Alexanderplatz 4-11-1989, ADN-gebouw, live op tv (dhm.de, germanhistorydocs.org) · Bornholmer Straße open ±23.30 uur, 9-11-1989

**DDR-sfeer**
- [ ] Radio, *Aktuelle Kamera*, krantenkoppen van *Neues Deutschland*, feestdagen op de kalender
- [ ] Rijen voor Bückware, Westpakete, Intershop, Subbotnik, FDJ, kolenkachelrook, leuzen per jaar

**Interactieve wereld**
- [ ] Tik op voorbijgangers: wie is het, kort gesprek of observatie
- [ ] Gebouwen in: trappenhuis, woning, Kneipe, Kaufhalle, Konspirative Wohnung, telefooncel
- [ ] Voorwerpen die iets doen (radio, krant, lades)

**RPG**
- [ ] Ervaringspunten en vaardigheden (Observatie, Verhoor, Overtuigen, Techniek, Geheimhouding)
- [ ] Gesprekskeuzes met vaardigheidschecks
- [ ] Inventaris (Westgeld, koffie, cassettes, Minox, afluistersets) om informanten te betalen of om te kopen
- [ ] Reputatie (MfS, buurt, kerk, gezin) en bijmissies per bewoner

**Publicatie**
- [x] Vercel-project `akte-ostberlin`, gekoppeld aan GitHub: elke push naar `main` gaat live op de hoofdlink (geen previews)

## Fase 4: Animaties

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

## Fase 5: De wijk leeft

- [ ] Bewoners lopen echt rond als personages. Tik op iemand op straat om het dossier te openen.
- [ ] Gebouwen tonen wat je weet (microfoons, informanten, verdachten)
- [ ] Dag en nacht per beurt, straatverlichting
- [ ] Weer: regen, mist, sneeuw

## Fase 6: Nieuwe spelonderdelen

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

## Fase 7: Geluid en sfeer

- [ ] Geluid: typemachine, telefoon, radio, regen, tram, voetstappen
- [ ] Muziek per jaar (1985 kil, 1989 opwindend)
- [ ] Trillen bij belangrijke momenten (iPhone)

## Fase 8: Meer verhaal

- [ ] Rivaal Fuchs krijgt een eigen verhaallijn
- [ ] Meer eindes en een galerij van ontdekte eindes
- [ ] Moeilijkheidsgraden en een vrije modus zonder verhaal

## Fase 9: Afwerking

- [ ] Balans (moeilijkheid, kansen)
- [ ] Speelbaar via GitHub Pages en als app-icoon op het beginscherm (PWA)
- [ ] Prestaties op oudere iPhones
