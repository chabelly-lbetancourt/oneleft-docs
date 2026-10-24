#!/usr/bin/env bash
# Runs the health check of the web (infra#70) against the nginx image and configuration of the web, with IPv6 off and
# on in the container, and renders the result as a terminal screenshot. Needs Docker and oneleft-frontend cloned next
# to oneleft-docs. Usage: tools/capture-healthcheck.sh [output.png]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-capturas/infraestructura/60-healthcheck-ipv6.png}"
IMAGE=nginxinc/nginx-unprivileged:1.29-alpine
CONF="$(cd ../oneleft-frontend/docker && pwd)/nginx.conf"
NAME=oneleft-healthcheck-capture

check() {
  docker run -d --rm --name "$NAME" --sysctl net.ipv6.conf.all.disable_ipv6="$1" \
    --sysctl net.ipv6.conf.lo.disable_ipv6="$1" -v "$CONF:/etc/nginx/conf.d/default.conf:ro" "$IMAGE" >/dev/null
  until docker exec "$NAME" wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1; do :; done
  docker exec "$NAME" sh -c '
    echo "IPv6 on the loopback: $(grep -c " lo$" /proc/net/if_inet6)   nginx listens on: $(netstat -tln | awk "/:8080/ {print \$4}")"
    for host in localhost 127.0.0.1; do
      if wget -qO- http://$host:8080/healthz >/dev/null 2>/tmp/error; then result="exit 0  healthy"
      else result="exit 1  $(sed "s/^wget: //" /tmp/error)"; fi
      printf "  wget http://%-9s:8080/healthz  ->  %s\n" "$host" "$result"
    done'
  docker stop "$NAME" >/dev/null
}

docker pull -q "$IMAGE" >/dev/null
{
  echo "# IPv6 disabled in the container (Docker Desktop on macOS)"
  check 1
  echo
  echo "# IPv6 enabled in the container"
  check 0
} | tools/capture-terminal.sh "oneleft-web · health check (infra#70)" "$OUT" "$ tools/capture-healthcheck.sh"
