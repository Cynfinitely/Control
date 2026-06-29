# Control

Your personal life management helper — an invite-only web app to track todos, goals, food, exercise, religious practice, career, networking, and cross-area reports.

Works on Mac, desktop, and iPhone via a shared cloud database.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (minimal, light theme, mobile-responsive)
- **Prisma ORM** with **PostgreSQL** (Neon, Supabase, or self-hosted)
- **NextAuth** (credentials) with invite-only registration and email verification
- **Vercel** for deployment (recommended)

## Modules

1. **Auth** — invite-only sign-up, email verification, single super-admin
2. **Todos** — simple day-based checkbox lists with optional backlog
3. **Goals** — weekly / monthly / yearly goals (checkbox or counter)
4. **Food** — calories-only diary + daily target; weekly meal planner + shopping list
5. **Exercise** — run, swim, gym, and other activities with type-specific logging
6. **Religious** — on-time / missed prayers, auto qaza backlog, dhikr, Quran, fasting
7. **Career** — career goals, skills, certifications, work history, learning log
8. **Networking** — contacts, interactions, follow-ups
9. **Reports** — daily/weekly/monthly aggregation across all modules
10. **Admin** — invite code management and user overview

## Getting started (local)

Requirements: Node.js 18.18+ and npm.

### Quick start (SQLite — no database install)

```bash
cp .env.example .env   # DATABASE_URL defaults to file:./dev.db
npm install
npm run setup
npm run dev
```

Open http://localhost:3000. The app auto-detects SQLite vs PostgreSQL from your `DATABASE_URL`.

### Option A: Neon (free cloud PostgreSQL — for multi-device sync)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string into `.env`:

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

3. Install and set up:

```bash
npm install
npm run setup   # migrate + seed
npm run dev
```

Open http://localhost:3000.

### Option B: Docker PostgreSQL (local, no cloud account)

```bash
docker compose up -d
cp .env.example .env
# .env.example already uses postgresql://postgres:postgres@localhost:5432/control
npm run setup
npm run dev
```

To stop the database: `docker compose down`. Data persists in the Docker volume until you run `docker compose down -v`.

### Default credentials (created by the seed)

- **Admin email:** `admin@control.local`
- **Admin password:** `admin1234`
- **Invite code** for new sign-ups: `WELCOME-2026`

New users register with an invite code, then verify their email. Since no email service is configured, the verification link is shown on screen after registration and logged to the server console.

## Deploy to Vercel (Mac + desktop + iPhone)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL` — your Neon/Supabase PostgreSQL connection string (with `?sslmode=require` if needed)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel URL (e.g. `https://control.vercel.app`)
4. Deploy — Vercel runs `prisma migrate deploy` then builds the app (see `vercel.json`)
5. Seed the production database once (from your machine):

```bash
DATABASE_URL="your-production-url" npm run db:seed
```

Open the Vercel URL on any device — Safari on iPhone works as a responsive mobile web app.

**Note:** GitHub stores your **code**, not your personal data. All todos, prayers, and workouts live in PostgreSQL, shared across devices via the deployed URL.

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run setup` | Generate client + migrate + seed |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Re-run the seed |
| `npm run db:studio` | Open Prisma Studio |

## Migrating from SQLite

If you had an older local SQLite `dev.db`, export data manually before switching to PostgreSQL, or start fresh with `npm run setup`.

## Security notes

- Registration is invite-only; only the admin can create invite codes.
- Every record is scoped to the signed-in user; no cross-user reads.
- Dashboard and API routes are protected by middleware.
- Deletes are soft (recoverable) where history matters.

## Roadmap

- Native iOS app (requires REST API layer)
- PWA install prompt and offline sync
- Email reminders and notifications
- Data export (JSON/CSV) and report PDF export
- Two-factor authentication
