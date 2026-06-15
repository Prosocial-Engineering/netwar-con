#!/usr/bin/env bash
#
# dev.sh — serve the static site locally (no build step).
#
# Usage:
#   ./scripts/dev.sh         # http://localhost:5173
#   ./scripts/dev.sh 3000    # pick a port
#
# Then, in another terminal, expose it with:  ./scripts/share.sh <same-port>

set -euo pipefail

PORT="${1:-${PORT:-5173}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Serving ${ROOT}"
echo "  http://localhost:${PORT}   (Ctrl+C to stop)"
echo

exec python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${ROOT}"
