#!/usr/bin/env bash
# Ubuntu setup for Kiosk Guide. Run: bash Setup-Kiosk.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

REAL_USER="${SUDO_USER:-}"
if [ -z "$REAL_USER" ] || [ "$REAL_USER" = "root" ]; then
  echo "Run Setup-Kiosk.sh as your normal user. It will ask for your password."
  exit 1
fi
REAL_HOME="$(getent passwd "$REAL_USER" | cut -d: -f6)"
REAL_UID="$(id -u "$REAL_USER")"

step() { echo; echo "== $1"; }
check() {
  if [ "$2" = "yes" ]; then
    echo "[OK     ] $1 - $3"
  else
    echo "[MISSING] $1 - $3"
  fi
}

step "Operating system"
if [ ! -f /etc/os-release ]; then
  echo "This setup supports Ubuntu only. No OS release file was found."
  exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
echo "OS:      ${PRETTY_NAME:-unknown}"
echo "User:    $REAL_USER"
if [ "${ID:-}" != "ubuntu" ]; then
  echo "This setup supports Ubuntu only."
  exit 1
fi
echo "Supported. Continuing."

step "Project folder"
export DEBIAN_FRONTEND=noninteractive
ROOT="$REAL_HOME/Documents/KIOSK"
if [ -x "$(command -v xdg-user-dir)" ]; then
  DOCS="$(sudo -u "$REAL_USER" -H xdg-user-dir DOCUMENTS 2>/dev/null || true)"
  if [ -n "${DOCS:-}" ] && [ "$DOCS" != "$REAL_HOME" ]; then
    ROOT="$DOCS/KIOSK"
  fi
fi
echo "Install folder: $ROOT"
mkdir -p "$(dirname "$ROOT")"
chown "$REAL_USER:$REAL_USER" "$(dirname "$ROOT")"
if [ -f "$ROOT/package.json" ]; then
  echo "Project is already in Documents. Clone will be skipped."
else
  if [ -d "$ROOT" ] && [ -n "$(ls -A "$ROOT" 2>/dev/null)" ]; then
    echo "Documents/KIOSK exists but does not contain the kiosk project. Move that folder aside, then run setup again."
    exit 1
  fi
  echo "Cloning the get-updates branch into Documents..."
  apt-get update -y
  apt-get install -y git ca-certificates
  sudo -u "$REAL_USER" -H git clone --branch get-updates --single-branch "https://github.com/jhonniel/kiosk-guide.git" "$ROOT"
fi

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$ROOT/scripts/ubuntu-kiosk"
if [ "$SRC" != "$DEST" ]; then
  mkdir -p "$DEST"
  cp -a "$SRC/." "$DEST/"
  SETUP_BAT="$(cd "$SRC/../.." && pwd)/Setup-Kiosk.sh"
  if [ -f "$SETUP_BAT" ]; then
    cp -a "$SETUP_BAT" "$ROOT/Setup-Kiosk.sh"
  fi
  chown -R "$REAL_USER:$REAL_USER" "$DEST" "$ROOT/Setup-Kiosk.sh" 2>/dev/null || true
  echo "Copied the Ubuntu setup files into Documents."
fi
chmod +x "$DEST/"*.sh "$ROOT/Setup-Kiosk.sh" 2>/dev/null || true

step "Checking what is already installed"
node_ok=no
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
  if [ "${NODE_MAJOR:-0}" -ge 20 ]; then node_ok=yes; fi
fi
pg_ok=no
if systemctl is-active --quiet postgresql || dpkg -s postgresql >/dev/null 2>&1; then pg_ok=yes; fi
env_ok=no; [ -f "$ROOT/.env" ] && env_ok=yes
modules_ok=no; [ -f "$ROOT/node_modules/next/package.json" ] && modules_ok=yes
build_ok=no; [ -f "$ROOT/.next/BUILD_ID" ] && build_ok=yes
service_ok=no; systemctl is-enabled --quiet kiosk-guide 2>/dev/null && service_ok=yes
question_ok=no; [ -f "$REAL_HOME/.config/autostart/kiosk-question.desktop" ] && question_ok=yes
desktop_dir="$REAL_HOME/Desktop"
if [ -x "$(command -v xdg-user-dir)" ]; then
  MAYBE="$(sudo -u "$REAL_USER" -H xdg-user-dir DESKTOP 2>/dev/null || true)"
  if [ -n "${MAYBE:-}" ]; then desktop_dir="$MAYBE"; fi
fi
shortcut_ok=no; [ -f "$desktop_dir/Kiosk Fullscreen.desktop" ] && shortcut_ok=yes
full_ok=no; [ -f "$REAL_HOME/.config/systemd/user/kiosk-fullscreen.service" ] && full_ok=yes

check "Node.js 20+" "$node_ok" "$( [ "$node_ok" = yes ] && echo installed || echo will install )"
check "PostgreSQL" "$pg_ok" "$( [ "$pg_ok" = yes ] && echo installed || echo will install )"
check "Kiosk app" yes "$ROOT"
check "Environment" "$env_ok" "$( [ "$env_ok" = yes ] && echo .env found || echo will create .env )"
check "Packages" "$modules_ok" "$( [ "$modules_ok" = yes ] && echo node_modules found || echo will run npm install )"
check "Production build" "$build_ok" "$( [ "$build_ok" = yes ] && echo .next found || echo will build )"
check "Background server" "$service_ok" "$( [ "$service_ok" = yes ] && echo kiosk-guide service enabled || echo will register )"
check "Boot question" "$question_ok" "$( [ "$question_ok" = yes ] && echo login asks the kiosk question || echo will add login question )"
check "Desktop shortcut" "$shortcut_ok" "$( [ "$shortcut_ok" = yes ] && echo Kiosk Fullscreen shortcut found || echo will create )"
check "Fullscreen guard" "$full_ok" "$( [ "$full_ok" = yes ] && echo registered || echo will register )"

if [ "$node_ok" = yes ] && [ "$pg_ok" = yes ] && [ "$env_ok" = yes ] && [ "$modules_ok" = yes ] && [ "$build_ok" = yes ] && [ "$service_ok" = yes ] && [ "$question_ok" = yes ] && [ "$shortcut_ok" = yes ] && [ "$full_ok" = yes ]; then
  step "Already set up"
  echo "This PC already has the kiosk. No install steps will be repeated."
  systemctl start kiosk-guide
  echo
  echo "Sign in after each restart to be asked whether to open the kiosk."
  echo "Desktop shortcut: Kiosk Fullscreen"
  echo "Address: http://localhost:3000"
  exit 0
fi

step "Installing only what is missing"
apt-get update -y
apt-get install -y postgresql postgresql-contrib zenity curl ca-certificates
if ! command -v firefox >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1 && ! command -v google-chrome >/dev/null 2>&1; then
  apt-get install -y firefox
fi
if [ "$node_ok" != yes ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
systemctl enable --now postgresql

DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="kiosk_guide"
if [ -f "$ROOT/.env" ]; then
  ENV_LINE="$(grep -E '^[[:space:]]*DATABASE_URL=' "$ROOT/.env" | head -1 || true)"
  if [[ "$ENV_LINE" =~ postgresql://([^:]+):([^@]+)@[^/]+/([^?\"[:space:]]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_NAME="${BASH_REMATCH[3]}"
  fi
else
  SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  sudo -u "$REAL_USER" tee "$ROOT/.env" >/dev/null <<EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/kiosk_guide?schema=public"
AUTH_SECRET="$SECRET"
NEXTAUTH_URL="http://localhost:3000"
EOF
  chown "$REAL_USER:$REAL_USER" "$ROOT/.env"
  echo "Created .env"
fi

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" >/dev/null
if [ "$DB_USER" != "postgres" ]; then
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD';"
fi
CREATED_DB=no
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
  CREATED_DB=yes
  echo "Created database $DB_NAME"
else
  echo "Database $DB_NAME already exists"
fi

if [ "$modules_ok" != yes ]; then
  sudo -u "$REAL_USER" -H bash -lc "cd '$ROOT' && npm install"
else
  echo "Packages already installed"
fi
if [ "$CREATED_DB" = yes ] || [ "$build_ok" != yes ]; then
  sudo -u "$REAL_USER" -H bash -lc "cd '$ROOT' && npm run db:deploy"
  if [ "$CREATED_DB" = yes ]; then
    sudo -u "$REAL_USER" -H bash -lc "cd '$ROOT' && npm run db:seed"
  fi
fi
if [ "$build_ok" != yes ]; then
  sudo -u "$REAL_USER" -H bash -lc "cd '$ROOT' && npm run build"
else
  echo "Production build already exists"
fi

NODE_BIN="$(command -v node)"
cat > /etc/systemd/system/kiosk-guide.service <<EOF
[Unit]
Description=Kiosk Guide
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$ROOT
ExecStart=/bin/bash $ROOT/scripts/ubuntu-kiosk/start-server.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now kiosk-guide
printf '%s\n' "$REAL_USER ALL=(root) NOPASSWD: /bin/systemctl restart kiosk-guide, /bin/systemctl start kiosk-guide" > /etc/sudoers.d/kiosk-guide
chmod 440 /etc/sudoers.d/kiosk-guide

mkdir -p "$REAL_HOME/.config/systemd/user" "$REAL_HOME/.config/autostart" "$desktop_dir"
cat > "$REAL_HOME/.config/systemd/user/kiosk-fullscreen.service" <<EOF
[Unit]
Description=Kiosk fullscreen
After=graphical-session.target

[Service]
Type=simple
ExecStart=$DEST/start-fullscreen.sh
Restart=always
RestartSec=1

[Install]
WantedBy=default.target
EOF

cat > "$REAL_HOME/.config/autostart/kiosk-question.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Kiosk Question
Exec=$DEST/ask-kiosk.sh
X-GNOME-Autostart-enabled=true
Terminal=false
NoDisplay=true
EOF

cat > "$desktop_dir/Kiosk Fullscreen.desktop" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Kiosk Fullscreen
Comment=Open the kiosk fullscreen. It stays open until this PC restarts.
Exec=$DEST/open-fullscreen.sh
Terminal=false
Categories=Utility;
EOF
chmod +x "$DEST/"*.sh "$desktop_dir/Kiosk Fullscreen.desktop"
chown -R "$REAL_USER:$REAL_USER" "$REAL_HOME/.config/systemd" "$REAL_HOME/.config/autostart" "$desktop_dir/Kiosk Fullscreen.desktop"
if command -v gio >/dev/null 2>&1; then
  sudo -u "$REAL_USER" -H gio set "$desktop_dir/Kiosk Fullscreen.desktop" metadata::trusted true 2>/dev/null || true
fi
sudo -u "$REAL_USER" -H XDG_RUNTIME_DIR="/run/user/$REAL_UID" systemctl --user daemon-reload 2>/dev/null || true

echo
echo "Setup finished."
echo "Sign in after each restart. Ubuntu will ask whether to open the kiosk."
echo "Desktop shortcut: Kiosk Fullscreen"
echo "Address: http://localhost:3000"
echo "Admin: http://localhost:3000/admin/login"
echo "Email: admin@camiguin.gov.ph"
echo "Password: admin123"
