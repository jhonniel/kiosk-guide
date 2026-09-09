# Kiosk device scripts (local only — not in Git)

Deploy scripts for **offline Ubuntu kiosks** that sync content from the **online web server** (where PostgreSQL and Admin live).

The Ubuntu kiosk has **no database**. Admin staff edit content on the server; kiosks **download** updates when they have network.

## Architecture

```text
  WEB SERVER                          KIOSK PC
  ──────────                          ────────
  PostgreSQL                          IndexedDB (local cache)
  Admin /admin  ──── sync JSON ────►  Offline UI
  /api/kiosk/*                        localhost:3000
```

## Give scripts to a kiosk PC

Copy the whole folder via **USB**, **SCP**, or shared drive:

```bash
scp -r deploy/kiosk-device kiosk@KIOSK-IP:~/
```

On the Ubuntu kiosk:

```bash
sudo bash ~/kiosk-device/bootstrap.sh
```

The bootstrap script clones the app from GitHub, installs dependencies, builds, and registers boot autostart.

## Files (on your dev machine only)

| File | Purpose |
|------|---------|
| `bootstrap.sh` | Full setup: apt, Node, clone, build, systemd |
| `start.sh` | Daily run: install, build, start |
| `install-boot.sh` | systemd + Chromium autostart |
| `boot-browser.sh` | Opens fullscreen browser after boot |
| `env.example` | Template for kiosk `.env` |

Edit defaults at the top of `bootstrap.sh` (repo URL, sync server, install path).
