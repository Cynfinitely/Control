# Control

Your personal life management helper — an invite-only web app to track todos, goals, food, exercise, religious practice, career, networking, and to generate cross-area reports.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (minimal, light theme)
- **Prisma ORM** with **SQLite** for local dev (portable to PostgreSQL for production)
- **NextAuth** (credentials) with invite-only registration and email verification

## Modules

1. **Auth** — invite-only sign-up, email verification, single super-admin
2. **Todos** — tasks with priority, category, due dates
3. **Goals** — numeric/boolean/habit goals with progress check-ins
4. **Food** — manual diary, calorie/macro targets, weekly meal planner + auto shopping list
5. **Exercise** — workouts with exercises & sets, body weight and measurements (kg/cm)
6. **Religious** — daily prayers, dhikr, Quran pages, fasting, prayer streak
7. **Career** — career goals, skills, certifications, work history, learning log
8. **Networking** — contacts, interactions, follow-ups
9. **Reports** — daily/weekly/monthly aggregation across all modules
10. **Admin** — invite code management and user overview

## Getting started

Requirements: Node.js 18.18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Generate the Prisma client, create the SQLite DB, and seed an admin + invite code
npm run setup

# 3. Start the dev server
npm run dev
```

Open http://localhost:3000.

### Default credentials (created by the seed)

- **Admin email:** `admin@control.local`
- **Admin password:** `admin1234`
- **Invite code** for new sign-ups: `WELCOME-2026`

New users register with an invite code, then verify their email. Since no email service
is configured in this version (in-app notifications only), the verification link is shown
on screen right after registration and also logged to the server console.

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run setup` | Generate client + push schema + seed |
| `npm run db:push` | Apply schema changes to the DB |
| `npm run db:seed` | Re-run the seed |
| `npm run db:studio` | Open Prisma Studio to inspect data |

## Switching to PostgreSQL (production)

1. In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set `DATABASE_URL` in `.env` to your Postgres connection string and set a strong
   `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`).
3. Run `npx prisma migrate dev` to create migrations.

## Security notes

- Registration is invite-only; only the admin can create invite codes.
- Every record is scoped to the signed-in user; no cross-user reads.
- Dashboard and API routes are protected by middleware.
- Deletes are soft (recoverable) where history matters.

## Roadmap (deferred from v1)

- Auto-linking goals to module activity (workouts, food, prayers)
- Email reminders and notifications
- Data export (JSON/CSV) and report PDF export
- Two-factor authentication
- Mobile client on the shared API
