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

## Start prompt

At login the kiosk asks **"Open the Camiguin kiosk now?"**

- **Continue** — opens the kiosk full screen.
- **Cancel** — leaves the desktop. The kiosk app keeps running; open `http://127.0.0.1:3000` in a browser when ready.

## Auto-update

Every kiosk checks the branch it was cloned from (`dev` by default) 3 minutes after boot and then every 10 minutes.
When a new commit is pushed it:

1. pulls it and builds it **beside** the running kiosk (`.next-update`, low priority);
2. swaps the new build in with a few-second restart;
3. reopens the kiosk browser on the new version.

If the build or the restart fails, the kiosk keeps the version it had and skips that commit until a newer one is pushed.
When `package.json` / `package-lock.json` change, the app is stopped while packages are reinstalled, so that update takes longer.

```bash
sudo systemctl start camiguin-kiosk-update   # check now
journalctl -u camiguin-kiosk-update -n 50     # what the last check did
```

Turn it off with `KIOSK_AUTO_UPDATE=0` in the kiosk `.env`, or install with `bootstrap.sh --no-auto-update`.

## Windows PC (`deploy/windows/`)

Double-click **Camiguin Kiosk** on the desktop (or `deploy/windows/Start Kiosk.bat`). It:

1. starts PostgreSQL if it is not running;
2. pulls new commits on the current branch — skipped when this copy has uncommitted changes;
3. rebuilds when the code changed since the last build (built beside the running kiosk, then swapped in);
4. starts the kiosk server on the network (port 3000) in the background;
5. asks **Continue / Cancel** — Continue opens the kiosk full screen (Alt+F4 leaves it); Cancel leaves the server running.

| File | Purpose |
|------|---------|
| `Start Kiosk.bat` | Update, start and open the kiosk (`-NoUpdate`, `-NoPrompt`) |
| `Stop Kiosk.bat` | Stop the kiosk server |
| `Allow Kiosk on Network.bat` | One-time firewall rule so other devices can open the kiosk (asks for admin) |
| `start-kiosk.ps1` | The launcher itself; `-CreateShortcut` puts the shortcuts on the desktop |

Server log: `%LOCALAPPDATA%\CamiguinKiosk\server.log`.

## Files (on your dev machine only)

| File | Purpose |
|------|---------|
| `bootstrap.sh` | Full setup: apt, Node, clone, build, systemd |
| `start.sh` | Daily run: install, build, start |
| `install-boot.sh` | systemd + Chromium autostart + auto-update timer |
| `boot-browser.sh` | Asks Continue / Cancel, then opens the fullscreen browser |
| `update.sh` | Auto-update: pull, build beside the live app, swap in |
| `env.example` | Template for kiosk `.env` |

Edit defaults at the top of `bootstrap.sh` (repo URL, sync server, install path).
