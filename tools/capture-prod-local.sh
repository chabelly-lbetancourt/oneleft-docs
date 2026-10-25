#!/usr/bin/env bash
# Checks the production Compose running on this machine (oneleft-infra/docker/PRODUCCION.md, «Producción en local»)
# through Caddy on https://localhost, and renders the result as a terminal screenshot (infra#4).
# Usage: tools/capture-prod-local.sh [output.png]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-capturas/infraestructura/61-produccion-en-local.png}"
BASE=https://localhost
FILTER=label=com.docker.compose.project=oneleft-prod

code() { curl -sk -o /dev/null -w '%{http_code}' "$@"; }
row() { printf '  %-48s %s\n' "$1" "$2"; }
# Service name of a container (oneleft-prod-gateway-1 -> gateway)
short() { sed 's/^oneleft-prod-//; s/-1$//' <<<"$1"; }
names() { docker ps --filter "$FILTER" "$@" --format '{{.Names}}' | while read -r n; do short "$n"; done | sort | paste -sd ' ' -; }

{
  echo "# Containers of oneleft-prod and the ports they publish"
  row "healthy" "$(docker ps --filter "$FILTER" --filter health=healthy -q | wc -l | tr -d ' ')"
  not_ready=$(names --filter health=unhealthy; names --filter health=starting)
  row "unhealthy or starting" "${not_ready:-none}"
  row "without a health check" "$(names --filter health=none)"
  docker ps --filter "$FILTER" --format '{{.Names}} {{.Ports}}' | while read -r name ports; do
    published=$(grep -oE '0\.0\.0\.0:[0-9]+->[0-9]+/(tcp|udp)' <<<"$ports" | sed 's/0\.0\.0\.0://' | tr '\n' ' ' || true)
    if [ -n "$published" ]; then row "$(short "$name")" "$published"; fi
  done
  echo
  echo "# Through Caddy"
  row "GET $BASE/" "$(code "$BASE/") $(curl -sk "$BASE/" | grep -o '<title>[^<]*' | sed 's/<title>//' | head -1)"
  row "GET $BASE/plans/abc (app route)" "$(code "$BASE/plans/abc")"
  row "GET $BASE/api/v1/users/me (no token)" "$(code "$BASE/api/v1/users/me")"
  row "GET $BASE/swagger-ui/index.html" "$(code "$BASE/swagger-ui/index.html")"
  row "issuer of $BASE/auth/realms/oneleft" "$(curl -sk "$BASE/auth/realms/oneleft/.well-known/openid-configuration" \
    | python3 -c 'import json, sys; print(json.load(sys.stdin)["issuer"])')"
  row "GET $BASE/grafana/ (no session)" "$(curl -sk -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE/grafana/")"
  row "GET http://localhost/" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://localhost/)"
  echo
  echo "# Memory in use (limit)"
  docker ps --filter "$FILTER" -q | xargs docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' | sort \
    | while read -r name used _ limit; do row "$(short "$name")" "$used ($limit)"; done
} | tools/capture-terminal.sh "compose.prod.yaml on https://localhost (infra#4)" "$OUT" "$ tools/capture-prod-local.sh"
