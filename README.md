# LGU Information & Visitor Experience Kiosk

A modern, touchscreen-optimized kiosk system for the **Provincial Government of Camiguin**. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Auth.js.

## Features

- **Kiosk Home Screen** — Sidebar branding, Smart Search, service cards, quick access, bottom navigation
- **11 Service Modules** — Citizens' Charter, directories, map, news, downloads, FAQ, tourism, emergency, events, help
- **Smart Search** — Instant cross-module search with result previews
- **Multi-language** — English and Filipino support
- **Accessibility** — Large text, high contrast, keyboard navigation, screen reader ready
- **Admin Dashboard** — Manage all content, users, roles, and settings
- **SQLite (dev)** — PostgreSQL-ready schema for production migration
- **Socket.IO Ready** — Architecture prepared in `lib/socket/`

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
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
| Database | SQLite (dev), Prisma ORM |
| Auth | Auth.js (Credentials) |
| Validation | Zod |

## PostgreSQL Migration

Update `DATABASE_URL` in `.env` to your PostgreSQL connection string. The schema uses portable types compatible with both SQLite and PostgreSQL.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kiosk_guide?schema=public"
```

Then run:

```bash
npm run db:migrate
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
