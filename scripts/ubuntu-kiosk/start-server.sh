#!/usr/bin/env bash
# Starts the installed kiosk from the get-updates branch.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1
BRANCH="get-updates"
MARKER="${XDG_CONFIG_HOME:-$HOME/.config}/kiosk-guide/running-commit"
mkdir -p "$(dirname "$MARKER")"

if [ -d .git ] && command -v git >/dev/null 2>&1; then
  export GIT_TERMINAL_PROMPT=0
  current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [ "$current" != "$BRANCH" ]; then
    git checkout "$BRANCH" || git checkout -B "$BRANCH" "origin/$BRANCH" || true
  fi
  head="$(git rev-parse HEAD 2>/dev/null || true)"
  built="$(cat "$MARKER" 2>/dev/null || true)"
  if [ -n "$head" ] && [ "$head" != "$built" ]; then
    npm run build || true
    if [ -f .next/BUILD_ID ]; then
      printf '%s\n' "$head" > "$MARKER"
    fi
  fi
fi

exec node "$ROOT/node_modules/next/dist/bin/next" start -H 0.0.0.0 -p 3000
