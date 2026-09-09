# LGU Information & Visitor Experience Kiosk

A modern, touchscreen-optimized kiosk system for the **Provincial Government of Camiguin**. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Auth.js.

## Features

- **Kiosk Home Screen** — Sidebar branding, Smart Search, service cards, quick access, bottom navigation
- **11 Service Modules** — Citizens' Charter, directories, map, news, downloads, FAQ, tourism, emergency, events, help
- **Smart Search** — Instant cross-module search with result previews
- **Multi-language** — English and Filipino support
- **Accessibility** — Large text, high contrast, keyboard navigation, screen reader ready
- **Admin Dashboard** — Manage all content, users, roles, and settings
- **PostgreSQL** — Prisma migrations for Postgres (local and production)
- **Socket.IO Ready** — Architecture prepared in `lib/socket/`

## Getting Started

```bash
# Install dependencies
npm install

# Set DATABASE_URL in .env (PostgreSQL required)
# DATABASE_URL="postgresql://user:password@localhost:5432/kiosk_guide?schema=public"

# Create / apply migrations (local development)
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the kiosk interface.

## Email (SMTP)

The kiosk sends files by email from **Download Center** and **Citizens' Charter** (PDF attachment). Configure SMTP in either place:

1. **`.env` (recommended for secrets)** — copy from `.env.example` and fill in:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="your@gmail.com"
SMTP_FROM_NAME="LGU Camiguin Kiosk"
```

2. **Admin → Settings → Downloads** — same fields in the dashboard (stored in the database).

When both are set, **`.env` values take priority** at send time.

**Gmail:** use an [App Password](https://support.google.com/accounts/answer/185833), not your normal login password. Host `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`.

**Port 465 (SSL):** set `SMTP_PORT=465` and `SMTP_SECURE=true`.

**Verify locally:**

```bash
npm run smtp:test
npm run smtp:test -- recipient@example.com
```

**Sync `.env` into Admin settings (optional):**

```bash
npm run smtp:sync
```

Ensure **Download email enabled** is on in Admin → Settings → Downloads.

**Internal-only mail server:** If `mail.camiguin.gov.ph` only delivers to `@camiguin.gov.ph` addresses (Gmail never receives mail), that is a **server policy** — the kiosk still sends to the visitor’s address correctly. Ask IT to enable outbound relay, or add a relay in `.env` for external recipients:

```env
# Optional relay for Gmail / Yahoo / etc. (primary SMTP still used for @camiguin.gov.ph)
SMTP_RELAY_HOST="smtp.gmail.com"
SMTP_RELAY_PORT="587"
SMTP_RELAY_SECURE="false"
SMTP_RELAY_USER="your@gmail.com"
SMTP_RELAY_PASSWORD="your-app-password"
SMTP_RELAY_FROM_EMAIL="information@camiguin.gov.ph"
SMTP_RELAY_FROM_NAME="LGU Camiguin Kiosk"
SMTP_INTERNAL_DOMAINS="camiguin.gov.ph"
```

Diagnose delivery:

```bash
npm run smtp:diagnose -- visitor@gmail.com
```

## Admin Access

- URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Email: `admin@camiguin.gov.ph`
- Password: `admin123`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (Credentials) |
| Validation | Zod |

## Database (PostgreSQL)

Set a Postgres connection string in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kiosk_guide?schema=public"
```

**Local (dev):**

```bash
npm run db:migrate
npm run db:seed
```

**Production / server (Docker, VPS):**

```bash
npm run db:deploy
npm run db:seed
```

Use `db:deploy` (`prisma migrate deploy`) on the server — not `db:migrate`.

### Server compile (when `npm run build` fails)

`npm run build` runs `offline:generate` first, which **needs a live PostgreSQL** (`DATABASE_URL`).
If the DB is not ready during compile (common on CI / first deploy), use:

```bash
# 1) Compile the Next.js app only (no DB required)
npm ci
npm run build:server

# 2) After Postgres + .env are ready
npm run db:deploy
npm run db:seed
npm run offline:generate
npm run start
```

Or one-shot start after compile (generates offline data, then serves):

```bash
npm run build:server
npm run start:server
```

Skip offline generation during a normal build when needed:

```bash
SKIP_OFFLINE_GENERATE=1 npm run build
```

If you previously tried SQLite migrations against Postgres, reset the database once, then redeploy:

```bash
# example: drop & recreate empty DB, then
npm run db:deploy
npm run db:seed
```

## Low-power kiosk (4 GB RAM / older CPU)

The kiosk defaults are tuned for hardware like **Intel i5 3rd gen + 4 GB RAM**:

- **Camera tracking** and **idle promo video** are off by default (enable in Admin → Display if needed).
- Heavy modules (3D building, map, charter UI, Cami) load **only when you open that page**.
- Home icons and tourism photos use **lazy loading** at **full resolution** (no compression).
- Offline sync and scenic backdrop wait until the browser is idle.
- Service worker caches fewer assets and skips the 5 MB charter PDF precache.

For faster dev restarts: `npm run dev:fast` (skips offline JSON regeneration).

On a powerful dev PC, set in `.env`:

```env
NEXT_PUBLIC_KIOSK_LOW_POWER=0
```

## System architecture

```text
                    INTERNET / LAN
                          │
    ┌─────────────────────┴─────────────────────┐
    │           WEB SERVER (online)              │
    │  • PostgreSQL — single source of truth     │
    │  • Admin /admin — staff edit anywhere      │
    │  • API — /api/kiosk/offline-data, etc.     │
    └─────────────────────┬─────────────────────┘
                          │  sync when kiosk has network
                          ▼
    ┌───────────────────────────────────────────┐
    │        UBUNTU KIOSK (offline-first)        │
    │  • No PostgreSQL on this machine           │
    │  • Local Next.js UI + IndexedDB cache      │
    │  • Works offline with last downloaded data │
    └───────────────────────────────────────────┘
```

| Role | Where it runs | Database | Network |
|------|---------------|----------|---------|
| **Admin** | Web server (`/admin`) | Server PostgreSQL | Online |
| **Data API** | Web server | Server PostgreSQL | Online |
| **Kiosk UI** | Ubuntu PC (`localhost:3000`) | **None** — local IndexedDB only | Offline OK; syncs when online |

**Flow:** Staff update content in Admin → saved to server DB → kiosk downloads a JSON snapshot when online → visitors use cached data offline.

---

## Offline kiosk + remote data sync

The kiosk device **never connects to PostgreSQL directly**. It only pulls public sync endpoints from your web server.

### Web server (admin + database + sync API)

One server hosts everything that needs the database:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kiosk_guide?schema=public"
AUTH_SECRET="your-production-secret"
AUTH_URL="https://kiosk.camiguin.gov.ph"
# SMTP, etc.
```

Deploy steps:

```bash
npm run db:deploy && npm run db:seed
npm run build && npm run start
```

- **Admin:** `https://your-domain/admin` — edit from any browser, anywhere  
- **Sync API:** `https://your-domain/api/kiosk/offline-data` (and related routes)  
- After admin saves, run `npm run offline:generate` on the server (or restart with `start:server`) so bundled JSON stays fresh  

Optional — allow kiosk PCs to sync cross-origin:

```env
KIOSK_CORS_ORIGINS="http://localhost:3000,http://192.168.1.50:3000"
```

### Ubuntu kiosk (no local database)

On the kiosk, `.env` only needs:

```env
NEXT_PUBLIC_KIOSK_SYNC_URL="https://kiosk.camiguin.gov.ph"
AUTH_SECRET="any-local-random-string"
```

**Do not set `DATABASE_URL` on the kiosk** — there is no local database.

Set `NEXT_PUBLIC_KIOSK_SYNC_URL` to your **web server URL**. The kiosk app will:

1. **Offline:** serve pages from local build + **IndexedDB** (last sync)
2. **Online:** download fresh data from the server, then save locally again
3. **Feedback:** queue offline, POST to server when connection returns

What syncs from the server:

| Endpoint | Content |
|----------|---------|
| `/api/kiosk/offline-data` | Home cards, tourism, news, settings, etc. |
| `/api/kiosk/citizens-charter` | Citizens' Charter edition |
| `/api/kiosk/display-settings` | Display flags |
| `/api/kiosk/feedback/sync` | Queued visitor feedback (upload) |
| `/api/kiosk/quick-start` | Popularity counts (optional) |

### Ubuntu kiosk setup (scripts not in GitHub)

Kiosk install scripts live in **`deploy/kiosk-device/`** on your dev machine. That folder is **gitignored** and is **never pushed** to [github.com/jhonniel/kiosk-guide](https://github.com/jhonniel/kiosk-guide).

See [deploy/README.md](deploy/README.md) for details.

**1. Copy scripts to the Ubuntu kiosk** (USB, SCP, etc.):

```bash
scp -r deploy/kiosk-device kiosk@KIOSK-IP:~/
```

**2. On the kiosk — one command** (clone app, install, build, boot autostart):

```bash
sudo bash ~/kiosk-device/bootstrap.sh
```

Built into `bootstrap.sh` (edit there if needed):

| Setting | Default |
|---------|---------|
| Git repo | `https://github.com/jhonniel/kiosk-guide.git` |
| Branch | `dev` |
| Sync server | `https://kiosk.camiguin.gov.ph` |
| Install path | `/home/kiosk/kiosk-guide` |
| Linux user | `kiosk` |

After setup: **reboot** and enable **auto-login** for user `kiosk`.

```bash
sudo systemctl status camiguin-kiosk
journalctl -u camiguin-kiosk -f
```

**Daily start** (after setup):

```bash
bash /home/kiosk/kiosk-guide/deploy/kiosk-device/start.sh
```

**Rebuild** after pulling app updates:

```bash
bash /home/kiosk/kiosk-guide/deploy/kiosk-device/start.sh --rebuild
sudo systemctl restart camiguin-kiosk
```

---

**Behavior:**

| Network | What happens |
|---------|----------------|
| Offline | Uses IndexedDB + bundled JSON from the local build |
| Online | Syncs from `NEXT_PUBLIC_KIOSK_SYNC_URL` (`/api/kiosk/offline-data`, charter, feedback, etc.) |
| Admin | Only on the web server — not on the kiosk device |

After admin updates content on the web server, kiosks pick up changes on the next online sync (or when the browser regains connectivity).

## Project Structure

```
app/           # Next.js App Router pages
components/    # Reusable UI components
features/      # Feature modules (search, kiosk, admin)
lib/           # Utilities, auth, db, i18n, socket prep
hooks/         # React hooks (kiosk context)
prisma/        # Schema, migrations, seed
types/         # TypeScript definitions
utils/         # Helper functions
public/        # Static assets
```

## License

Private — Provincial Government of Camiguin
