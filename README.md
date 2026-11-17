# AKTE. Ost-Berlin 1983–1989

Een Stasi-simulator in de browser. Je bent Leutnant bij de geheime dienst van de DDR en houdt één wijk in Prenzlauer Berg in de gaten. Je werft informanten, lost onderzoeken op en beslist over levens, tot de Muur valt. Daarna lees je in 1992 wat er van iedereen geworden is.

Fictieve personen, echte geschiedenis.

## Spelen

Open `index.html` via een lokale webserver (ES-modules werken niet via `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Of zet **GitHub Pages** aan (Settings → Pages → branch `main`, map `/ (root)`). Dan speel je op je iPhone of iPad via de link.

De 3D-graphics laden [three.js](https://threejs.org) (r160) via jsDelivr, dus de eerste keer is internet nodig.

## Hoe het werkt

- **32 beurten** (1983–1989): vier per jaar, extra beurten in 1987 en in de herfst van 1989. Elke beurt hoort bij een echte gebeurtenis met een gecontroleerde datum.
- **Kantoor** (3D): telefoon = opdrachten, map = rapporten, rode map = onderzoek, kast = alle personen, foto = gezin, kaart = wijk.
- **Wijk** (3D): elf gebouwen, ongeveer dertig bewoners. Tik op een gebouw.
- **Acties** (mankracht): observeren, werven als informant (IM), waarschuwen, arresteren en microfoons plaatsen.
- **Meters**: Gunst (0 = ontslagen), Geweten (bepaalt je einde) en Verdenking (100 = opgepakt).
- **8 eindes**.

## Projectstructuur

```
index.html        pagina, laadt three.js via importmap
css/style.css     huisstijl DDR × PS2 (staal, Dymo, telex, dossierpapier)
js/data.js        tijdlijn, rangen, gebouwen, kenmerken, personages
js/events.js      verhaal: vaste en voorwaardelijke gebeurtenissen
js/assets.js      laadt de 3D-modellen (GLTFLoader + meshopt)
js/world.js       3D: kantoor + wijk, PS2-stijl (lage resolutie, dither, Lambert-shading)
js/game.js        spelregels, interface, uitleg en begeleiding
assets/models/    3D-modellen (.glb), zie CREDITS.md
tools/            bouwscripts voor de modellen (niet nodig om te spelen)
```

Zie [ROADMAP.md](ROADMAP.md) voor de fases.
