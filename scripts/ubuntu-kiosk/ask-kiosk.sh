#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$DIR/check-updates.sh" || true
TEXT="Continue to the kiosk?

Yes — fullscreen kiosk. This PC shows only the kiosk.

No — use Ubuntu normally. The kiosk keeps running in the background.
Use the Kiosk Fullscreen shortcut on the desktop to open it fullscreen.
That stays open until you restart the PC.
Or open http://localhost:3000 in a browser. That stays a normal window."

if zenity --question --title="Kiosk Guide" --width=520 --ok-label="Yes" --cancel-label="No" --text="$TEXT"; then
  bash "$DIR/open-fullscreen.sh"
fi
