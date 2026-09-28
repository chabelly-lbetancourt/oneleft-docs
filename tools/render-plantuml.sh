#!/usr/bin/env bash
# Renders the PlantUML diagrams (*.puml) of a directory to PNG (GitHub) and SVG (thesis).
# Uses the official PlantUML Docker image, which includes Graphviz: nothing to install.
# Usage: tools/render-plantuml.sh [directory]   (anteproyecto/diagramas by default)
# Sources live in <directory>/src and the images are written to <directory>.
# The whole repository is mounted at /docs, so diagrams can embed the technology logos:
#   <img:/docs/assets/logos/png/angular.png{scale=0.2}>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$(cd "${1:-anteproyecto/diagramas}" && pwd)"
REL="${DIR#"$ROOT"/}"
IMAGE="plantuml/plantuml:1.2026.8"
for FORMAT in png svg; do
  docker run --rm -v "$ROOT":/docs "$IMAGE" -charset UTF-8 -t"$FORMAT" -o "/docs/$REL" "/docs/$REL/src/*.puml"
done
ls -1 "$DIR"/*.png "$DIR"/*.svg | sed "s|$DIR/||"
