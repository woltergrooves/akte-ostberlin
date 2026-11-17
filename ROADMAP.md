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
- [x] Hele game vertaald naar het Engels (interface, verhaal, data, 3D-labels); Duitse periodetermen blijven

**Tempo en geschiedenis**
- [x] Langzamer: begin in maart 1983, 32 beurten (vier per jaar, vijf in 1987, zeven in 1989); nieuwe jaardoelen; save-key `akte-save-v4`
- [x] Echte gebeurtenissen met gecontroleerde datums, 9 nieuwe verhaalscènes; losse pamfletten pas vanaf het jaar waarin ze passen

  Gecontroleerd (17 nov 2026): Schwerter zu Pflugscharen in Wittenberg, 24-9-1983 (evangelisch.de) · arrestatie Bohley en Poppe, 12-12-1983, zes weken vast (jugendopposition.de, dissidenten.eu) · uitreisgolf 1984, ±40.000 (germanhistorydocs.org) · Ständige Vertretung gesloten 27-6 t/m 31-7-1984 (bpb.de) · Gorbatsjov gekozen 11-3-1985 (bpb.de) · Tsjernobyl 26-4-1986, ND drukt TASS-melding (bpb.de, freitag.de) · Umwelt-Bibliothek geopend 2-9-1986 (germanhistorydocs.org) · Concert for Berlin 6–8-6-1987 (museum-digital.de) · Honecker in de BRD 7–11-9-1987, Olof-Palme-mars 1–18-9 (bundesarchiv.de) · skinheads in de Zionskirche 17-10-1987, ±30 man (stasi-mediathek.de) · Aktion „Falle“ 24/25-11-1987 (stasi-mediathek.de) · Liebknecht-Luxemburg-demo 17-1-1988 (bundesarchiv.de) · Springsteen Weißensee 19-7-1988, 160.000 kaarten (l-iz.de) · Sputnik geschrapt 18/19-11-1988 (stasi-mediathek.de) · Chris Gueffroy 5-2-1989, rouwadvertentie 21-2 (chronik-der-mauer.de) · verkiezingen 7-5-1989, 98,85% (bundestag.de) · Hongaarse grens: afbraak vanaf 2-5, picknick 19-8, open 11-9-1989 · Neues Forum 9/10-9-1989 (bpb.de) · Alexanderplatz 4-11-1989, ADN-gebouw, live op tv (dhm.de, germanhistorydocs.org) · Bornholmer Straße open ±23.30 uur, 9-11-1989

**DDR-sfeer (3C, 17 nov)**
- [x] Nieuws per beurt (`NEWS` in `data.js`): *Neues Deutschland*, *Aktuelle Kamera*, RIAS/ARD. In de briefing, op de krant op het bureau en op de radio (RFT op de kast, aan/uit met ruis)
- [x] Feestdagen per maand (`HOLIDAYS`) in briefing en krant; spandoek met leuze per jaar (`SLOGANS`)
- [x] Wijk: kolenkachelrook uit alle Altbau-schoorstenen in de winter, rij voor de Kaufhalle (lang bij Bückware), Intershop-paviljoen, Subbotnik in maart/april, FDJ-blauwhemden en extra vlaggen op 1 mei en 7 oktober, pioniers in juni
- [x] **Handboek** (boek op het bureau, ?-knop, briefing, titelscherm): *Allowed or not?* (wat mocht wel/niet, met wetsartikelen §106, §213, §215, §219, §220, §249) en *Chronicle* (achtergrond per beurt, alleen tot de huidige beurt). `js/lexicon.js`

  Nieuws gecontroleerd (17 nov 2026): SM-70 weg eind 1984 (bpb.de, chronik-der-mauer.de) · Tiedge 19-8-1985 (bpb.de) · Honecker in Polen dec. 1985 (SED-documenten 1985) · Vijfjarenplan 27-11-1986, 1.064.000 woningen (GBl. DDR I nr. 36/1986) · kerkpers 1988 meest gecensureerd (communicatio-socialis.de) · Honecker–Leich 3-3-1988, ND ingekort (gospelstudies/RCL) · Ossietzky-school 30-9-1988 (stasi-mediathek.de) · overige uit algemene kronieken (Karl-Marx-/Lutherjaar 1983, Strauß-krediet 29-6-1983, KAL 007 1-9-1983, Pershing 22-11-1983, Olympische boycot 10-5-1984, Honecker-bezoek afgezegd 4-9-1984, Nicholson 24-3-1985, Glienicker Brücke 11-6-1985, cultuurakkoord 6-5-1986, 750 jaar Berlijn, Reagan 12-6-1987, amnestie en afschaffing doodstraf juli 1987, Gorbatsjov 2-11-1987, Lenné-driehoek 1-7-1988, Honecker ‘50 en 100 jaar’ jan. 1989, Tiananmen-steun Volkskammer 8-6-1989, Fackelzug 6-10-1989, Praagse treinen, Honecker af 18-10-1989, Schabowski 9-11-1989)

**Interactieve wereld (3D, 17 nov)**
- [x] Tik op voorbijgangers: 32 lopers gekoppeld aan bewoners (`assignWalkers`), kaartje met praatje (roddel, onbevestigd), West-koffie (ware roddel), volgen (= observeren), dossier
- [x] Binnenruimtes als kleine 3D-scènes (`js/interiors.js`): trappenhuis (brievenbussen, Hausbuch, verdeelkast = microfoons), eigen flat, Café Mosaik (tafels afluisteren, barman, dode brievenbus), Kaufhalle (rij, Bückware), Konspirative Wohnung „Linde“ (Treffs), telefooncel (anoniem waarschuwen), litfaßzuil (affiches per jaar met uitleg, getypt briefje = extra aanwijzing)
- [x] Kantoor: radio, krant, geldkistje (inventaris, eigen dossier, onderscheidingen), prikbord, handboek. Labels ontwarren zichzelf

**Ideeën (17 nov, uit `claude/akte-ideeen.md`)**
- [x] Cliffhanger aan het eind van elke beurt (`teaser()`, eigen `tease` per scène, "Zugriff 05:00" na een arrestatie)
- [x] Prikbord met draden: verborgen verbanden per run (`makeLinks`), 2–4 geheimen per bewoner, percentage per dossier, stempel VOLLSTÄNDIG (+2 gunst)
- [x] Uitgestelde gevolgen: 9 scènes op vlaggen van eerder (Brandt, Anna, Herta, Lena, Kühn, het lek, Micha op de Alex, anonieme waarschuwing)
- [x] Informanten met loyaliteit, angst en behoefte; loyaliteit zakt zonder Treff; betalen, onder druk zetten, kruiscontrole op leugens; dubbelagenten
- [x] Fuchs: microfoons in je eigen flat zoeken (weghalen of laten zitten); eigen dossier groeit mee (`ownLog`)
- [x] Gezin raakt betrokken: Jens bij het concert, Katrins handtekening, drie jaar NVA
- [x] Run-seed, archief met 8 documenten (één per einde), onderscheidingen over runs heen, startvoorwaarden (Strenger Kessler, Kurze Leine, Alter Hase)
- [x] Daily Akte: dagelijkse puzzel, voor iedereen gelijk, deelbaar als telexstrook (`js/daily.js`)
- [x] Geluid (WebAudio, `js/audio.js`): stempel, telex, typemachine, telefoonbel, radio; trillen; LED's knipperen bij verandering. Uit te zetten in Help
- [x] Promotieceremonie met schouderstukken; minigames brief openstomen, bandrecorder, doka (`js/minigames.js`) als Überstunden (+1 MP), bij postcontrole en in de KW
- [x] November 1989: kies welke dossiers je vernietigt; bepaalt de epiloog en je eigen dossier in 1992

**RPG (fase 3E, 18 nov)**
- [x] Ervaringspunten (XP) uit observaties, rapporten, zaken, complete dossiers, werving, gunsten en de jaarbeoordeling; bevordering via XP, vijfde rang Oberstleutnant
- [x] Vaardigheden (Observatie, Verhoor, Overtuigen, Techniek, Geheimhouding), elke 40 XP een punt, in de Kaderakte (tik op je rang)
- [x] Gesprekskeuzes met vaardigheidscheck in procenten op straat en bij een Treff
- [x] Verhoor-minigame: vind de leugen in iemands verhaal (tegen een andere bewering of het dossier)
- [x] Inventaris: cassettes, Minox, afluistersets via Requisitie (kost gunst); omkopen met Westgeld
- [x] Reputatie (MfS, buurt, kerk, gezin) en bijmissies (gunsten) per bewoner

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

- [x] **Verhoor**: zoek de tegenstrijdigheid in iemands verhaal (fase 3E, als Befragung)
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
