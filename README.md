# Control

Your personal life management helper — an invite-only web app to track todos, goals, food, exercise, religious practice, career, networking, and cross-area reports.

Works on Mac, desktop, and iPhone via a shared cloud database.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (minimal, light theme, mobile-responsive)
- **Prisma ORM** with **PostgreSQL** (Neon, Supabase, or self-hosted)
- **NextAuth** (credentials) with invite-only registration
- **Vercel** for deployment (recommended)

## Modules

1. **Auth** — invite-only sign-up by invite link, single super-admin
2. **Todos** — simple day-based checkbox lists with optional backlog
3. **Goals** — weekly / monthly / yearly goals (checkbox or counter)
4. **Food** — calories-only diary + daily target; weekly meal planner + shopping list
5. **Exercise** — run, swim, gym, and other activities with type-specific logging
6. **Religious** — on-time / missed prayers, auto qaza backlog, dhikr, Quran, fasting
7. **Career** — career goals, skills, certifications, work history, learning log
8. **Networking** — contacts, interactions, follow-ups
9. **Reports** — daily/weekly/monthly aggregation across all modules
10. **Admin** — invites and user overview

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

Local development only:

- **Admin email:** `admin@control.local`
- **Admin password:** `admin1234`

The seed refuses to use this password on a production database (see the deploy section).

### Inviting people

Registration is invite-only and there is no email service, so the admin shares links by hand:

1. Sign in as admin and open **Admin → Invite a person**.
2. Create an invite (single use and valid for 7 days by default; optionally tied to one email address).
3. Copy the invite link and send it to the person.
4. They open the link, choose a name and password, and are signed in straight away.

Each account is fully separate: a new person starts with an empty account, picks which modules they want, and can never see another user's data. An invite link stops working once it is used up, expired or deleted.

## Deploy to Vercel (Mac + desktop + iPhone)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel:
   - `DATABASE_URL` — Neon **pooled** connection string (host includes `-pooler`), e.g. `postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require`
   - `DIRECT_URL` — Neon **direct** connection string (no `-pooler`, for migrations via GitHub Actions)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel URL (e.g. `https://control.vercel.app`)
4. Add the same `DATABASE_URL` and `DIRECT_URL` as **GitHub repository secrets** (Settings → Secrets → Actions)
5. Deploy — Vercel builds the app only (`prisma generate` + `next build`). Database migrations run via GitHub Actions when `prisma/` changes on `master`.
6. Seed the production database once (from your machine):

```bash
DATABASE_URL="your-pooled-production-url" \
SEED_ADMIN_EMAIL="you@example.com" \
SEED_ADMIN_PASSWORD="a-long-unique-password" \
npm run db:seed
```

The seed only creates the admin account. It will not run against a production database with the development password.

Open the Vercel URL on any device — Safari on iPhone works as a responsive mobile web app.

**Note:** GitHub stores your **code**, not your personal data. All todos, prayers, and workouts live in PostgreSQL, shared across devices via the deployed URL.

### When you change the database schema

1. Create a migration locally: `npm run db:migrate`
2. Push to `master` — the **Database migrations** GitHub Action applies it to Neon (with retries for cold starts)
3. Vercel deploys the new app code in parallel (no DB connection needed at build time)

To apply migrations manually: `DATABASE_URL=... DIRECT_URL=... npm run db:migrate:deploy`

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

- Registration is invite-only; only the admin can create invites. Invite links are long random tokens that are single use and expire by default.
- Every record is scoped to the signed-in user; no cross-user reads.
- Dashboard pages are protected by middleware. API routes and server actions each check the session themselves; the cron endpoint requires `CRON_SECRET`.
- Isolation is covered by tests: `src/lib/isolation` scans every database query for a user filter and runs a two-user test against a temporary database.
- Deletes are soft (recoverable) where history matters.

## Roadmap

- Native iOS app (requires REST API layer)
- PWA install prompt and offline sync
- Email reminders and notifications
- Data export (JSON/CSV) and report PDF export
- Two-factor authentication
