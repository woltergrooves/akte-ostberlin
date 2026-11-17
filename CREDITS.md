# Credits en licenties

Alle 3D-modellen staan in `assets/models/` als `.glb`. Ze zijn gecomprimeerd met meshopt (`EXT_meshopt_compression`) en gequantiseerd (`KHR_mesh_quantization`). Samen zijn ze ±375 kB.

## Eigen modellen (Akte)

Deze modellen zijn voor dit project gemaakt met `tools/build-models.mjs` (three.js en gltf-transform). Er bestaan geen CC0-versies van deze DDR-voorwerpen, dus ze zijn zelf gebouwd. Ze vallen onder dezelfde licentie als de rest van dit project.

| Bestand | Wat | Driehoeken | Losse onderdelen (nodes) |
|---|---|---|---|
| `telefoon.glb` | Bakelieten telefoon in W63-stijl, met krulsnoer | 932 | `Body`, `Dial` (kiesschijf), `Handset` (hoorn) |
| `typemachine.glb` | Draagbare typemachine (Erika-achtig) | 996 | `Body`, `Carriage` (wagen), `Paper` |
| `bureaulamp.glb` | Bureaulamp met groene kap | 456 | `Lamp` (lampje als onbelicht materiaal) |
| `stempel.glb` | Stempel en stempelkussen | 180 | `Stamp`, `Pad` |
| `asbak.glb` | Asbak met sigaret | 216 | `Ashtray` |
| `koffiekop.glb` | Kop en schotel | 280 | `Cup` |
| `trabant601.glb` | Trabant 601 | 804 | `Body` (lak wordt per auto gekleurd) |
| `wartburg353.glb` | Wartburg 353 | 820 | `Body` (lak wordt per auto gekleurd) |
| `tatra_kt4d.glb` | Tatra KT4D-tram met geleding | 1.596 | `SectionA`, `SectionB`, `Joint`, `Pantograph` |

## Voetgangers: Quaternius (CC0)

- **Bron:** [Quaternius](https://quaternius.com), packs *Ultimate Modular Men* en *Ultimate Modular Women*. Opgehaald via de GitHub-mirror [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase).
- **Licentie:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (publiek domein). Naamsvermelding is niet verplicht, maar wel netjes.
- **Bewerkingen** (`tools/build-figures.mjs`): de deelmeshes zijn samengevoegd tot één skinned mesh, kleuren zijn omgezet naar DDR-tinten en ingebakken als vertexkleuren, en elk model is gedecimeerd van ±5.200–6.600 naar ±2.400 driehoeken. Het skelet is behouden voor de animaties in fase 3.

| Bestand | Origineel | Rol in het spel |
|---|---|---|
| `fig_arbeider.glb` | Modular Men · Worker | Arbeider in blauwe werkjas |
| `fig_vrouw.glb` | Modular Women · Suit | Oudere vrouw in grijze mantel |
| `fig_punk.glb` | Modular Men · Punk | Punk |
| `fig_dominee.glb` | Modular Men · Suit | Dominee in zwart pak |
| `fig_vopo.glb` | Modular Men · Swat | Volkspolizist (Bereitschaft) in groengrijs |
| `fig_stasi.glb` | Modular Men · Suit | Stasi-man in leren jas |
| `fig_burger.glb` | Modular Men · Casual2 | Burger in jack |
| `fig_burgeres.glb` | Modular Women · Casual | Burgeres in jas |

## Software

- [three.js](https://threejs.org) r160 (MIT): rendering, `GLTFLoader`, `SkeletonUtils`, meshopt-decoder
- [glTF Transform](https://gltf-transform.dev) (MIT) en [meshoptimizer](https://github.com/zeux/meshoptimizer) (MIT): de modelpijplijn in `tools/`

## Modellen opnieuw bouwen

```sh
cd tools
npm install
./fetch-sources.sh      # alleen nodig voor de voetgangers
node build-models.mjs   # eigen modellen
node build-figures.mjs  # voetgangers
```
