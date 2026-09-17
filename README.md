# LGU Information & Visitor Experience Kiosk

A modern, touchscreen-optimized kiosk system for the **Provincial Government of Camiguin**. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Auth.js.

## Features

- **Kiosk Home Screen** — Sidebar branding, Smart Search, service cards, quick access, bottom navigation
- **11 Service Modules** — Citizens' Charter, directories, map, news, downloads, FAQ, tourism, emergency, events, help
- **Smart Search** — Instant cross-module search with result previews
- **Multi-language** — English, Filipino, and Bisaya support
- **Accessibility** — Large text, high contrast, keyboard navigation, screen reader ready
- **Admin Dashboard** — Manage all content, users, roles, and settings
- **Offline-first kiosks** — Ubuntu kiosk devices sync from the web server; work without PostgreSQL locally
- **PostgreSQL** — Prisma migrations for Postgres (local and production)
- **DigitalOcean Spaces** — Optional file storage for downloads and uploads

---

## System requirements

### Web server (Admin + database + sync API)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS / Windows 10+ (dev) | Ubuntu 22.04 LTS |
| **CPU** | 2 vCPU | 2–4 vCPU |
| **RAM** | 2 GB | 4 GB |
| **Node.js** | 20.x LTS | 20.x LTS |
| **npm** | 10.x | 10.x |
| **PostgreSQL** | 14+ | 15+ (Managed DB on DigitalOcean) |
| **Disk** | 10 GB | 20 GB+ SSD |

Also needed for production:

- **Domain + HTTPS** (e.g. `kiosk.camiguin.gov.ph`)
- **SMTP** for email delivery (Download Center, Citizens' Charter)
- **DigitalOcean Spaces** (optional but recommended for uploaded PDFs/forms)

### Ubuntu kiosk device (visitor touchscreen PC)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **CPU** | Intel i5 3rd gen | i5/i7 4th gen+ |
| **RAM** | 4 GB | 8 GB |
| **Display** | 1080p touchscreen | 1080p+ touchscreen |
| **Network** | Wi‑Fi or LAN (for sync) | Wired LAN |
| **Database** | **None** — uses IndexedDB cache | — |

The kiosk runs the Next.js UI locally and syncs JSON + files from the web server when online.

---

## Quick start (local development)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Required — PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/kiosk_guide?schema=public"

# Required — Auth.js
AUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Optional — SMTP (Download Center + Citizens' Charter email)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="user@example.com"
SMTP_PASSWORD="your-password"
SMTP_FROM_EMAIL="noreply@example.com"
SMTP_FROM_NAME="LGU Camiguin Kiosk"

# Optional — DigitalOcean Spaces (file uploads in Admin)
DIGITALOCEAN_SPACES_KEY=""
DIGITALOCEAN_SPACES_SECRET=""
DIGITALOCEAN_SPACES_ENDPOINT="https://sgp1.digitaloceanspaces.com"
DIGITALOCEAN_SPACES_BUCKET="your-bucket"
DIGITALOCEAN_SPACES_REGION="sgp1"
DIGITALOCEAN_SPACES_ROOT_PATH="kiosk-downloads"
DIGITALOCEAN_SPACES_PATH="https://your-bucket.sgp1.cdn.digitaloceanspaces.com"

# Optional — allow kiosk PCs to sync cross-origin (production)
# KIOSK_CORS_ORIGINS="http://192.168.1.50:3000"

# Optional — kiosk device points here for sync (do NOT set on the web server)
# NEXT_PUBLIC_KIOSK_SYNC_URL="https://kiosk.camiguin.gov.ph"

# Optional — low-power tuning (default on). Set 0 on a powerful dev PC.
# NEXT_PUBLIC_KIOSK_LOW_POWER=0
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Database setup

```bash
npm run db:migrate
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Kiosk interface |
| http://localhost:3000/admin | Admin dashboard |

**Access from other devices on the same network:** use your PC's LAN IP, e.g. `http://192.168.1.100:3000`.

### Default admin login

- **URL:** http://localhost:3000/admin/login
- **Email:** `admin@camiguin.gov.ph`
- **Password:** `admin123`

Change the password after first login in production.

---

## NPM scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server on `0.0.0.0:3000` (hot reload) |
| `npm run dev:sync` | Dev server + regenerate offline JSON from DB first |
| `npm run dev:fast` | Same as `dev` (alias) |
| `npm run dev:turbo` | Dev server with Turbopack |
| `npm run build` | Generate offline JSON + production build |
| `npm run build:next` | Next.js build only (no offline JSON) |
| `npm run build:server` | Prisma generate + Next.js build (no DB export) |
| `npm run start` | Run production server on `0.0.0.0:3000` |
| `npm run start:server` | Regenerate offline JSON, then start production server |
| `npm run offline:generate` | Export kiosk offline JSON from PostgreSQL |
| `npm run assets:normalize` | Rewrite Spaces URLs in DB to local `/public` paths |
| `npm run db:migrate` | Apply migrations (local dev, interactive) |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:seed` | Seed sample data and default admin |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run lint` | Run ESLint |
| `npm run smtp:test` | Test SMTP connection |
| `npm run smtp:test -- you@example.com` | Send a test email |
| `npm run smtp:diagnose -- you@example.com` | Diagnose SMTP delivery |
| `npm run smtp:sync` | Copy SMTP settings from `.env` into Admin settings |

---

## Running locally

### Development mode

```bash
npm run dev
```

Use when editing code. Hot reload enabled. Service worker disabled in dev.

Regenerate offline bundle after admin content changes:

```bash
npm run offline:generate
```

Or restart with:

```bash
npm run dev:sync
```

### Production mode (local — same as production build)

Use this to test performance, service worker, and production behavior on your PC.

```bash
# 1. Ensure PostgreSQL is running and .env is set
npm run db:deploy
npm run db:seed          # first time only

# 2. Build
npm run build

# 3. Start production server
npm run start
```

Open http://localhost:3000 (kiosk) and http://localhost:3000/admin (admin).

**One-shot** (build + regenerate offline JSON + start):

```bash
npm run build:server
npm run start:server
```

**Skip offline JSON during build** (when DB is unavailable at build time):

```bash
# Windows PowerShell
$env:SKIP_OFFLINE_GENERATE="1"; npm run build

# Linux / macOS
SKIP_OFFLINE_GENERATE=1 npm run build
```

Then generate offline data after the DB is ready:

```bash
npm run offline:generate
npm run start
```

### Network access (LAN)

The dev and production servers bind to `0.0.0.0:3000`, so other devices on the same network can connect.

1. Find your PC IP: `ipconfig` (Windows) or `ip addr` (Linux)
2. Open `http://YOUR-IP:3000` from another device
3. Allow port **3000** in Windows Firewall if needed
4. Set `NEXTAUTH_URL` to the LAN URL if admin login fails cross-device, e.g. `http://192.168.1.100:3000`

---

## Production build

`npm run build` does two things:

1. **`offline:generate`** — exports `public/kiosk-offline-data.json` from PostgreSQL (kiosk offline bundle)
2. **`next build`** — compiles the Next.js app (standalone output enabled in `next.config.ts`)

After every admin content change in production, refresh the offline bundle:

```bash
npm run offline:generate
```

Or restart with `npm run start:server`.

---

## Deploy to DigitalOcean (production)

Recommended stack:

| Service | DigitalOcean product |
|---------|---------------------|
| App + Admin | **Droplet** (Ubuntu 22.04, 2 GB+ RAM) or **App Platform** |
| Database | **Managed PostgreSQL** |
| File uploads | **Spaces** (S3-compatible object storage) |
| HTTPS | **Nginx + Let's Encrypt** on Droplet, or built-in on App Platform |

### Architecture

```text
                    INTERNET
                        │
         ┌──────────────┴──────────────┐
         │   Droplet (Next.js app)      │
         │   • Admin /admin             │
         │   • Sync API /api/kiosk/*    │
         └──────┬──────────────┬────────┘
                │              │
    ┌───────────▼───┐   ┌──────▼──────┐
    │ Managed       │   │ Spaces      │
    │ PostgreSQL    │   │ (PDFs, etc.)│
    └───────────────┘   └─────────────┘
                │
                │  sync when online
                ▼
    ┌───────────────────────┐
    │ Ubuntu kiosk PCs      │
    │ (no database)         │
    └───────────────────────┘
```

---

### Step 1 — Create Managed PostgreSQL

1. DigitalOcean → **Databases** → Create → **PostgreSQL 15**
2. Note the connection string (use the **VPC** connection from your Droplet in the same region)
3. Add your Droplet as a **trusted source**

```env
DATABASE_URL="postgresql://doadmin:PASSWORD@db-host:25060/kiosk_guide?sslmode=require"
```

Create the database if needed:

```sql
CREATE DATABASE kiosk_guide;
```

---

### Step 2 — Create Spaces bucket (optional)

1. DigitalOcean → **Spaces** → Create bucket (e.g. region `sgp1`)
2. Enable CDN if you want a public CDN URL
3. Create **Spaces access keys** (API → Spaces Keys)

```env
DIGITALOCEAN_SPACES_KEY="your-key"
DIGITALOCEAN_SPACES_SECRET="your-secret"
DIGITALOCEAN_SPACES_ENDPOINT="https://sgp1.digitaloceanspaces.com"
DIGITALOCEAN_SPACES_BUCKET="camiguin-kiosk"
DIGITALOCEAN_SPACES_REGION="sgp1"
DIGITALOCEAN_SPACES_ROOT_PATH="kiosk-downloads"
DIGITALOCEAN_SPACES_PATH="https://camiguin-kiosk.sgp1.cdn.digitaloceanspaces.com"
```

Files are stored in Spaces; QR codes and emails use your **app URL** (not the raw Spaces link).

---

### Step 3 — Create Droplet and deploy

1. Create an **Ubuntu 22.04** Droplet (2 GB RAM minimum, same region as DB)
2. SSH into the server:

```bash
ssh root@YOUR_DROPLET_IP
```

3. Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
```

4. Clone the repository:

```bash
cd /var/www
git clone https://github.com/jhonniel/kiosk-guide.git
cd kiosk-guide
git checkout dev   # or main, as appropriate
```

5. Create `.env` on the server (see [Quick start](#quick-start-local-development)). Production values:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://kiosk.camiguin.gov.ph"
AUTH_URL="https://kiosk.camiguin.gov.ph"

# SMTP, Spaces — see above

# QR / email links (use your public domain or LAN IP for local testing)
# Also set in Admin → Settings → Downloads → Public kiosk base URL

KIOSK_CORS_ORIGINS="http://localhost:3000,http://KIOSK-LAN-IP:3000"
```

6. Install, migrate, seed, and build:

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
```

7. Run with PM2 (keeps app running after logout):

```bash
sudo npm install -g pm2
pm2 start npm --name "kiosk-guide" -- start
pm2 save
pm2 startup
```

The app listens on port **3000**.

---

### Step 4 — Nginx reverse proxy + HTTPS

Create `/etc/nginx/sites-available/kiosk-guide`:

```nginx
server {
    listen 80;
    server_name kiosk.camiguin.gov.ph;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/kiosk-guide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d kiosk.camiguin.gov.ph
```

Update `NEXTAUTH_URL` and `AUTH_URL` to `https://kiosk.camiguin.gov.ph`, then:

```bash
pm2 restart kiosk-guide
```

---

### Step 5 — Post-deploy checklist

- [ ] Admin login works: `https://your-domain/admin`
- [ ] Change default admin password
- [ ] Admin → Settings → Downloads → set **Public kiosk base URL** to `https://your-domain`
- [ ] Test QR download — link should be `https://your-domain/api/downloads/file/...`
- [ ] Test email delivery: `npm run smtp:test -- you@example.com`
- [ ] After content updates: `npm run offline:generate` (or `pm2 restart` with `start:server`)

### Updating production

```bash
cd /var/www/kiosk-guide
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart kiosk-guide
```

---

### Alternative: DigitalOcean App Platform

1. Connect your GitHub repo
2. Set **Build command:** `npm run build:server && npm run offline:generate` (or run offline generate as a release phase job after DB is linked)
3. Set **Run command:** `npm run start`
4. Add **Managed PostgreSQL** as a linked resource
5. Add all `.env` variables in the App Platform dashboard
6. App Platform provides HTTPS automatically

Note: `offline:generate` requires database access at build or deploy time. If build fails, use `build:server` in the build step and run `offline:generate` in a post-deploy job or manually after first deploy.

---

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

### Web server `.env`

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://kiosk.camiguin.gov.ph"
AUTH_URL="https://kiosk.camiguin.gov.ph"
```

### Ubuntu kiosk `.env` (no database)

```env
NEXT_PUBLIC_KIOSK_SYNC_URL="https://kiosk.camiguin.gov.ph"
AUTH_SECRET="any-local-random-string"
```

**Do not set `DATABASE_URL` on the kiosk.**

| Endpoint | Content |
|----------|---------|
| `/api/kiosk/offline-data` | Home cards, tourism, news, settings, etc. |
| `/api/kiosk/citizens-charter` | Citizens' Charter edition |
| `/api/kiosk/display-settings` | Display flags |
| `/api/kiosk/feedback/sync` | Queued visitor feedback (upload) |
| `/api/kiosk/quick-start` | Popularity counts (optional) |
| `/api/downloads/*` | QR download links and email delivery |

### Ubuntu kiosk setup (scripts not in GitHub)

Kiosk install scripts live in **`deploy/kiosk-device/`** on your dev machine (gitignored). See [deploy/README.md](deploy/README.md).

```bash
# Copy scripts to kiosk PC
scp -r deploy/kiosk-device kiosk@KIOSK-IP:~/

# On the Ubuntu kiosk
sudo bash ~/kiosk-device/bootstrap.sh --sync-url https://kiosk.camiguin.gov.ph
sudo reboot
```

For local dev server as sync source:

```bash
sudo bash ~/kiosk-device/bootstrap.sh --sync-url http://192.168.1.100:3000
```

---

## Email (SMTP)

The kiosk sends files by email from **Download Center** and **Citizens' Charter** (PDF attachment + local download link).

Configure in **`.env`** (recommended) or **Admin → Settings → Downloads**. When both are set, **`.env` values take priority** at send time.

**Verify locally:**

```bash
npm run smtp:test
npm run smtp:test -- recipient@example.com
npm run smtp:diagnose -- visitor@gmail.com
```

**Sync `.env` into Admin settings:**

```bash
npm run smtp:sync
```

Ensure **Download email enabled** is on in Admin → Settings → Downloads.

**Gmail:** use an [App Password](https://support.google.com/accounts/answer/185833). Host `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`.

**Port 465 (SSL):** set `SMTP_PORT=465` and `SMTP_SECURE=true`.

---

## Static assets (images, PDFs, videos)

All kiosk images and downloads live in **`public/`** and are tracked in Git (73+ image files, 23 PDFs, promo videos).

| Folder | Contents |
|--------|----------|
| `public/images/home-icons/` | Home screen service icons |
| `public/images/tourism/` | Tourism attraction photos |
| `public/images/news/` | News announcement images |
| `public/images/branding/` | Logo, Caring Camiguin, sidebar footer |
| `public/images/cami/` | Cami assistant mascot assets |
| `public/downloads/` | Download Center PDF forms |
| `public/videos/promo/` | Idle attract promo videos |

After `git pull` on production, files are included automatically — **no separate image upload needed**.

### Broken images on production

If images work locally but break on production, the database often still points to **DigitalOcean Spaces URLs** from admin uploads on your dev PC. Fix:

```bash
git pull origin dev
npm ci
npm run assets:normalize    # rewrites Spaces URLs → local /images/ or /downloads/ paths
npm run offline:generate
npm run build
pm2 restart kiosk-guide    # or npm run start
```

Or re-seed (resets content to defaults — use only on a fresh server):

```bash
npm run db:seed
npm run offline:generate
```

---

## QR codes and download links

Files may be stored in DigitalOcean Spaces, but **QR codes and emails always use your app URL**:

- Download Center: `https://your-domain/api/downloads/file/{token}`
- Citizens' Charter: `https://your-domain/api/citizens-charter/pdf`

Set **Admin → Settings → Downloads → Public kiosk base URL** to your public domain (or LAN IP for local testing). Do not use a Spaces CDN URL there.

---

## Low-power kiosk (4 GB RAM / older CPU)

Defaults are tuned for hardware like **Intel i5 3rd gen + 4 GB RAM**:

- Camera tracking and idle promo video off by default
- Heavy modules (3D building, map, charter UI, Cami) load only when you open that page
- Service worker enabled in production for offline caching

On a powerful dev PC:

```env
NEXT_PUBLIC_KIOSK_LOW_POWER=0
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (Credentials) |
| Storage | DigitalOcean Spaces (optional) |
| Offline | Serwist service worker + IndexedDB |
| Validation | Zod |

---

## Project structure

```
app/           # Next.js App Router pages
components/    # Reusable UI components
features/      # Feature modules (search, kiosk, admin, downloads)
lib/           # Utilities, auth, db, i18n, storage
hooks/         # React hooks (kiosk context)
prisma/        # Schema, migrations, seed
public/        # Static assets + generated offline JSON
deploy/        # Kiosk device scripts (local only, gitignored)
```

---

## License

Private — Provincial Government of Camiguin
