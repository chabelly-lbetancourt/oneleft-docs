#!/usr/bin/env bash
# Renderiza los diagramas PlantUML (*.puml) de un directorio a PNG (GitHub) y SVG (memoria).
# Usa la imagen Docker oficial de PlantUML, que incluye Graphviz: no hay que instalar nada.
# Uso: tools/render-plantuml.sh [directorio]   (por defecto anteproyecto/diagramas)
# Las fuentes están en <directorio>/src y las imágenes se generan en <directorio>.
set -euo pipefail
DIR="$(cd "${1:-anteproyecto/diagramas}" && pwd)"
IMAGE="plantuml/plantuml:1.2026.8"
for FORMAT in png svg; do
  docker run --rm -v "$DIR":/data "$IMAGE" -charset UTF-8 -t"$FORMAT" -o /data "/data/src/*.puml"
done
ls -1 "$DIR"/*.png "$DIR"/*.svg | sed "s|$DIR/||"
