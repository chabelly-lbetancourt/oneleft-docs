#!/usr/bin/env bash
# Renders the PlantUML diagrams (*.puml) of a directory to PNG (GitHub) and SVG (thesis).
# Uses the official PlantUML Docker image, which includes Graphviz: nothing to install.
# Usage: tools/render-plantuml.sh [directory]   (anteproyecto/diagramas by default)
# Sources live in <directory>/src and the images are written to <directory>.
set -euo pipefail
DIR="$(cd "${1:-anteproyecto/diagramas}" && pwd)"
IMAGE="plantuml/plantuml:1.2026.8"
for FORMAT in png svg; do
  docker run --rm -v "$DIR":/data "$IMAGE" -charset UTF-8 -t"$FORMAT" -o /data "/data/src/*.puml"
done
ls -1 "$DIR"/*.png "$DIR"/*.svg | sed "s|$DIR/||"
