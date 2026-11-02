#!/usr/bin/env bash
URL="http://127.0.0.1:3000/"
BOOT_ID="$(cat /proc/sys/kernel/random/boot_id)"
LOCK="/tmp/kiosk-fullscreen.lock"
PROFILE="${XDG_DATA_HOME:-$HOME/.local/share}/kiosk-browser"
mkdir -p "$PROFILE"
echo "$BOOT_ID" > "$LOCK"

for _ in $(seq 1 90); do
  if (echo >/dev/tcp/127.0.0.1/3000) >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

launch_browser() {
  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --kiosk --no-first-run --disable-session-crashed-bubble --user-data-dir="$PROFILE" "$URL"
  elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --kiosk --no-first-run --disable-session-crashed-bubble --user-data-dir="$PROFILE" "$URL"
  elif command -v chromium >/dev/null 2>&1; then
    chromium --kiosk --no-first-run --disable-session-crashed-bubble --user-data-dir="$PROFILE" "$URL"
  elif command -v firefox >/dev/null 2>&1; then
    firefox --kiosk --no-remote --profile "$PROFILE" "$URL"
  else
    echo "No supported browser found." >&2
    sleep 5
    return 1
  fi
}

while [ "$(cat "$LOCK" 2>/dev/null)" = "$BOOT_ID" ]; do
  launch_browser || true
  sleep 1
done
