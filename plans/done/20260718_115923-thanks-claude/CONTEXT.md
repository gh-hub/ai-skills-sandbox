# Context: thanks-claude

## What we're building
A monorepo (apps/api NestJS, apps/web static Next.js, packages/ shared types) with a "like Claude" page backed by Postgres via Docker Compose.

## Key decisions
- pnpm workspaces (no Turborepo/Nx) — see grill/decisions.md
- Drizzle ORM for Postgres access — see grill/decisions.md
- No dedup on likes; repeat likes are intentional — see grill/decisions.md
- Static Next.js served by nginx, reverse-proxies /api/* to API (no CORS) — see grill/ADR-001.md
- Swagger + class-validator on all NestJS endpoints — see grill/decisions.md
- Out of scope: auth, admin dashboard, CI/CD, cloud deploy — see grill/requirements.md

## Tickets
- 01-monorepo-scaffold — DONE — pnpm workspace, apps/api, apps/web, packages/shared-types, Docker Compose skeleton
- 02-like-count-api — DONE — likes table, POST /likes, GET /likes/count, Swagger, validation, API tests
- 03-like-button-ui — DONE — like button, count display, story/hours-saved box, verified in-browser via full Docker Compose stack
- review/round-1/tickets/01-frontend-network-error-handling — DONE — page.tsx surfaces visible errors on count-load/like/story-submit failures instead of swallowing them
- review/round-2/tickets/01-fix-error-clear-regression — DONE — removed the redundant `setError(null)` calls in handleLikeClick/handleStorySubmit that were wiping errors fetchCount's internal failure had just set
- review/round-3 DEBT fix (out-of-ticket, user-requested) — DONE — `submitLike` no longer calls `fetchCount()` internally; callers now do it explicitly, making the side effect visible

## Current state
Phase: review
Completed tickets: 01-monorepo-scaffold, 02-like-count-api, 03-like-button-ui, review/round-1/tickets/01-frontend-network-error-handling, review/round-2/tickets/01-fix-error-clear-regression
Current ticket: (none) — Plan complete. 9 open DEBT items exported to plans/tech-debt/.

## Load this session
- plans/20260718_115923-thanks-claude/tickets/*.md — all tickets, for review scope
- apps/web/app/page.tsx — the full like/count/story UI, now with error handling on all three network calls
- apps/api/src/likes/ — the API this UI consumes
- packages/shared-types/src/index.ts — shared wire types
- plans/20260718_115923-thanks-claude/review/tech-debt.md — open DEBT items from rounds 1-2, still unaddressed

## Gotchas
- Like count is a raw click count, not unique visitors — this is intentional, not a bug to fix later.
- `.dockerignore` must exclude `**/*.tsbuildinfo` or Docker builds silently produce an empty `dist/` — see plans/coding-rules/node-typescript-docker.md.
- `apps/api` needs `tsconfig.build.json` (rootDir `./src`) to keep `nest build` output at `dist/main.js` rather than `dist/src/main.js`, because `drizzle.config.ts` sits outside `src/`.
- Migrations run automatically on api container start via `entrypoint.sh` — running `pnpm --filter @thanks-claude/api db:generate` locally (with `DATABASE_URL` pointed at a reachable Postgres) is how new migrations get created; they're picked up automatically next `docker compose up`.
- `apps/api/src/db/client.ts` exports both `db` and `pool` — anything that opens its own Postgres connection for testing/scripting must close `pool` explicitly, since it isn't tied to Nest's DI lifecycle and `app.close()` won't close it.
- API tests use `@testcontainers/postgresql` to spin up a real, throwaway Postgres per test run (no need for `docker compose up` first) — `pnpm --filter @thanks-claude/api test` from repo root works standalone. Frontend testing is out of scope per the spec (manual verification only).
- Swagger is mounted at the internal Nest path `docs` (not `api/docs`) because nginx strips the `/api/` prefix before proxying — same convention as the `/health` route being internally `health`, not `api/health`.
- To simulate a network failure for manual verification, use `docker compose stop api` (not `down`) so postgres/web stay up, then `docker compose start api` to recover — nginx returns 502 for `/api/*` while the api container is stopped.
- To simulate a failure of only one specific endpoint (e.g. POST succeeds but the trailing GET /likes/count fails), stopping the api container isn't precise enough since it fails everything. Instead, use claude-in-chrome's javascript_tool to monkey-patch `window.fetch` in-page (save the original, reject only requests whose URL matches the target endpoint, delegate everything else to the original) — then restore it afterward. Useful for reproducing narrow race/ordering bugs.
