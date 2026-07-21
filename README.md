# LGU Information & Visitor Experience Kiosk
sample
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

If you previously tried SQLite migrations against Postgres, reset the database once, then redeploy:

```bash
# example: drop & recreate empty DB, then
npm run db:deploy
npm run db:seed
```

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
