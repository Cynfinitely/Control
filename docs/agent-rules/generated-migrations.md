# Database migrations are generated — HARD STOP

Applies to any repo with a schema-migration tool (Prisma, Drizzle, Django, Rails, Alembic, EF Core, Flyway, …). Delete this file if the repo has no database.

A “simple ADD COLUMN”, matching a sibling migration, a missing database URL, or “I know what the tool would emit” are **not** exceptions.

## Never

- Create or paste a migration file by hand (for example `prisma/migrations/<timestamp>_<name>/migration.sql`).
- Copy DDL from an older migration and tweak it.
- Pick a timestamp or sequence number yourself.
- Apply a migration (to a local, shared, or deployed database) before its generated file has been reviewed.
- Edit a migration that has already been applied to any environment. Ship a new one instead.

## Required workflow

1. Change only the schema source (for example `schema.prisma`, the ORM models).
2. Run the tool's generate-only command, for example:

   ```bash
   npx prisma migrate dev --create-only --name <descriptive_snake_case>
   # this repo: npm run db:migrate -- --create-only --name <descriptive_snake_case>
   npx drizzle-kit generate
   python manage.py makemigrations
   ```

3. Review the generated file. Look for dropped columns or tables, and prefer a rename over drop + create.
4. Only after the file exists, you may edit it for data-preserving SQL (renames, backfills). Edit the file the tool created; do not replace it.
5. Only then apply it, and only to a database the human confirmed is safe to change.

## If generation cannot run

**Stop.** Tell the human you cannot produce a migration without the tool (missing database URL, shadow database, credentials) and give them the command to run. Do not substitute hand-written SQL.

Check where the database URL points before running any migrate command. A local `.env` often targets a shared dev database.
