#!/usr/bin/env bash
# Boot-time update check. Runs before the kiosk question.
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
BRANCH="get-updates"
LOG="/tmp/kiosk-update.log"

run_update() {
  echo 10
  echo "# Checking internet..."
  if ! curl -fsS --max-time 5 -o /dev/null https://github.com; then
    sleep 4
    if ! curl -fsS --max-time 5 -o /dev/null https://github.com; then
      echo 100
      echo "# No internet connection. Continuing with the installed kiosk."
      sleep 2
      exit 0
    fi
  fi

  if ! command -v git >/dev/null 2>&1 || [ ! -d "$ROOT/.git" ]; then
    echo 100
    echo "# Update check is not available. Continuing with the installed kiosk."
    sleep 2
    exit 0
  fi

  echo 25
  echo "# Checking the get-updates branch..."
  cd "$ROOT" || exit 0
  export GIT_TERMINAL_PROMPT=0
  if ! git fetch origin "$BRANCH" >>"$LOG" 2>&1; then
    echo 100
    echo "# Could not reach the update branch. Continuing with the installed kiosk."
    sleep 2
    exit 0
  fi

  before="$(git rev-parse HEAD)"
  remote="$(git rev-parse "origin/$BRANCH" 2>/dev/null || true)"
  current="$(git rev-parse --abbrev-ref HEAD)"
  if [ -z "$remote" ]; then
    echo 100
    echo "# The get-updates branch was not found. Continuing with the installed kiosk."
    sleep 2
    exit 0
  fi
  if [ "$current" = "$BRANCH" ] && [ "$before" = "$remote" ]; then
    echo 100
    echo "# Kiosk is up to date."
    sleep 2
    exit 0
  fi

  echo 45
  echo "# Pulling updates from get-updates..."
  if ! git checkout -B "$BRANCH" "origin/$BRANCH" >>"$LOG" 2>&1; then
    echo 100
    echo "# Could not switch to the update branch. Continuing with the installed kiosk."
    sleep 2
    exit 0
  fi
  git branch --set-upstream-to="origin/$BRANCH" "$BRANCH" >>"$LOG" 2>&1 || true
  after="$(git rev-parse HEAD)"
  if [ "$before" = "$after" ]; then
    echo 100
    echo "# Kiosk is up to date."
    sleep 2
    exit 0
  fi

  changed="$(git diff --name-only "$before" "$after")"
  echo "$changed" >>"$LOG"
  if printf '%s\n' "$changed" | grep -Eq '^(package\.json|package-lock\.json)$'; then
    echo 60
    echo "# Installing updates..."
    if ! npm install >>"$LOG" 2>&1; then
      echo 100
      echo "# Install failed. Continuing with the installed kiosk."
      sleep 2
      exit 0
    fi
  fi
  if printf '%s\n' "$changed" | grep -q '^prisma/'; then
    echo 75
    echo "# Updating the database..."
    npm run db:deploy >>"$LOG" 2>&1 || true
  fi
  if [ -n "$changed" ]; then
    echo 85
    echo "# Building the kiosk..."
    if ! npm run build >>"$LOG" 2>&1; then
      echo 100
      echo "# Build failed. Continuing with the installed kiosk."
      sleep 2
      exit 0
    fi
    echo 95
    echo "# Starting the updated kiosk..."
    sudo -n systemctl restart kiosk-guide >>"$LOG" 2>&1 || true
  fi
  echo 100
  echo "# Update installed. The new kiosk is ready."
  sleep 2
}

if command -v zenity >/dev/null 2>&1; then
  run_update | zenity --progress --title="Kiosk Guide" --width=480 --percentage=0 --auto-close
else
  run_update >/dev/null
fi
