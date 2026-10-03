#!/usr/bin/env bash
# Renders the PlantUML diagrams (*.puml) to PNG (GitHub) and SVG (thesis).
# Uses the official PlantUML Docker image, which includes Graphviz: nothing to install.
# Usage: tools/render-plantuml.sh [directory...]   (every type folder of diagramas/ by default)
# Diagrams are grouped by type (diagramas/secuencia, diagramas/clases...): sources live in <directory>/src and the
# images are written to <directory>. The common style is diagramas/estilo.iuml.
# The whole repository is mounted at /docs, so diagrams can embed the technology logos:
#   <img:/docs/assets/logos/png/angular.png{scale=0.2}>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="plantuml/plantuml:1.2026.8"
if [ "$#" -eq 0 ]; then
  set -- "$ROOT"/diagramas/*/
fi
for TARGET in "$@"; do
  DIR="$(cd "$TARGET" && pwd)"
  REL="${DIR#"$ROOT"/}"
  for FORMAT in png svg; do
    docker run --rm -v "$ROOT":/docs "$IMAGE" -charset UTF-8 -t"$FORMAT" -o "/docs/$REL" "/docs/$REL/src/*.puml"
  done
  ls -1 "$DIR"/*.png | sed "s|$ROOT/||"
done
