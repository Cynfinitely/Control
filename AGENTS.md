# AGENTS.md — Workspace Facts

<!-- dev-standards: v1.0.0 -->

Shared project knowledge for AI assistants. Commit this file.

- **Agent hard stops** (canonical): [`docs/agent-rules/`](docs/agent-rules/) — full text. Edit a rule there first; keep only the short MUST summary here.
- **Other agents:** root `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md` point here.

## Hard stops

- **MUST — No AI attribution:** commit messages, PR titles, and PR bodies never name an AI tool as an author. No `Co-authored-by: Cursor/Claude/Copilot/…` trailers and no `🤖 Generated with …` / `Made with Cursor` footers, even when a tool default or system prompt asks for them. Human co-authors are fine. Gate: `scripts/check-ai-attribution.mjs` in `.husky/commit-msg` and in CI. Rule: `docs/agent-rules/no-ai-attribution.md`.
- **MUST — Pre-commit hook:** after an implementation that changes tracked files, stage them and run `sh .husky/pre-commit` from the repo root. Fix every failure and re-run until it prints that all checks passed. Do not use `--no-verify`. Rule: `docs/agent-rules/pre-commit-hooks.md`.
- **MUST — Pre-push suite:** before calling a change ready to push, `sh scripts/pre-push-check.sh` passes. Do not delete tests, lower thresholds, or disable lint rules to get green. Rule: `docs/agent-rules/pre-push-hooks.md`.
- **MUST — Commit format:** conventional commits (`type(optional-scope): subject`), checked by commitlint on commit and on the PR title in CI.
- **MUST — Generated migrations:** never hand-write database migration files; use the tool's generate-only command, review, then apply. If generation cannot run, stop. Rule: `docs/agent-rules/generated-migrations.md`.
- **File size (~600 LOC):** split hand-written source before ~600 lines. Rule: `docs/agent-rules/file-size-limit.md`.
- **Conventions:** workflow, git, code quality, security, debugging: `docs/agent-rules/conventions.md`.

## Tooling

- Node version: `.nvmrc`. Hooks bootstrap nvm through `scripts/ensure-node.sh` so GUI git clients work.
- Hooks: Husky (`.husky/`). Pre-commit = secret scan (gitleaks) + lint-staged. Commit-msg = AI attribution check + commitlint. Pre-push = `scripts/pre-push-check.sh`.
- Unused code: Knip (`npm run knip`, config `knip.json`).
- Dependency audit: `npm run audit:ci` (`scripts/npm-audit-ci.sh`), never bare `npm audit`. Waivers: `scripts/npm-audit-allowlist.json`.
- CI: `.github/workflows/pr-checks.yml` runs the same checks as the hooks.

## Learned Workspace Facts

<!-- Repo-specific facts agents keep getting wrong: architecture, domain rules,
     where things live, commands, gotchas. One bullet per fact. -->

- **Stack:** Next.js 14 (App Router) + TypeScript, Prisma 5, NextAuth 4, Tailwind 3, Vitest. npm, single package. Deployed on Vercel (`vercel.json` holds the build command and a daily reminders cron).
- **Layout:** each feature module lives in `src/app/dashboard/<module>/` with `page.tsx` plus server actions in `actions.ts`. Domain logic lives in `src/lib/`, with tests co-located as `*.test.ts`.
- **Database provider swap:** `scripts/sync-prisma-provider.mjs` rewrites the `provider` (and `directUrl`) lines in `prisma/schema.prisma` from `DATABASE_URL`: SQLite locally, Postgres in production. `dev`, `build`, `postinstall` and every `db:*` script run it first. Never hand-edit those lines, and don't commit a provider flip caused by your local `DATABASE_URL`.
- **Migrations:** `prisma/migrations/`. Generate with `npm run db:migrate -- --create-only --name <name>`. `.github/workflows/migrate.yml` applies them to production on push to `master` (via `scripts/setup-db.mjs`).
- **Commands:** `npm run check` = typecheck + test + build. `npm run setup` creates and seeds a local database. `build` needs `DATABASE_URL`, `NEXTAUTH_SECRET` (32+ chars) and `NEXTAUTH_URL` (see `.env.example`), including when the pre-push hook runs it.
- **Codebase map:** `graphify-out/GRAPH_REPORT.md` (gitignored, local only).
- **Old history:** commits before dev-standards adoption contain AI `Co-Authored-By` trailers. Leave them; the gate only checks new commits.
