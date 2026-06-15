#!/usr/bin/env bash
#
# share.sh — expose a local dev server to the internet with a free
# Cloudflare Quick Tunnel (no account, no domain, no config).
#
# Usage:
#   ./scripts/share.sh            # tunnels http://localhost:5173 (default)
#   ./scripts/share.sh 3000       # tunnels http://localhost:3000
#   PORT=8080 ./scripts/share.sh  # set the port via env var
#
# Press Ctrl+C to tear the tunnel down.

set -euo pipefail

PORT="${1:-${PORT:-5173}}"
TARGET="http://localhost:${PORT}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "✗ cloudflared not found. Install it with:" >&2
  echo "    brew install cloudflared" >&2
  exit 1
fi

# Friendly heads-up if nothing is listening yet — not fatal, the tunnel will
# connect as soon as your dev server comes up.
if ! curl -sf -o /dev/null --max-time 2 "${TARGET}"; then
  echo "⚠️  Nothing is responding at ${TARGET} yet."
  echo "    Start your dev server on port ${PORT}, then this tunnel will reach it."
  echo
fi

echo "🌐 Opening a free Cloudflare Quick Tunnel → ${TARGET}"
echo "   Your shareable link is the https://<random>.trycloudflare.com URL below."
echo "   Ctrl+C to stop."
echo

exec cloudflared tunnel --url "${TARGET}"
