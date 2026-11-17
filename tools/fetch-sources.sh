#!/bin/sh
# Haalt de CC0-bronbestanden van Quaternius op (via de GitHub-mirror trebeljahr/quaternius-showcase).
# Origineel: https://quaternius.com/packs/ultimatemodularcharacters.html en .../ultimatemodularwomen.html
set -e
cd "$(dirname "$0")" && mkdir -p src
B=https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/HEAD/public/glb
for f in modular_men/Worker modular_men/Punk modular_men/Suit modular_men/Swat modular_men/Casual2 modular_women/Suit modular_women/Casual; do
  curl -fsSL "$B/$f.glb" -o "src/$(echo $f | tr / _).glb"
done
ls -la src
