# 01 — Monorepo & Docker Compose scaffold

**What to build:** The workspace skeleton every later ticket builds on: a pnpm workspace with `apps/api` (NestJS), `apps/web` (Next.js), and `packages/shared-types`, wired together and runnable via a single Docker Compose command. No feature behavior yet — this is a prefactor ticket, not independently useful to an end visitor, but it makes ticket 02 and 03 straightforward.

**Blocked by:** None — can start immediately

**Status:** done

- [x] pnpm workspace configured, linking `apps/*` and `packages/*`
- [x] `packages/shared-types` exists as a workspace package, importable from both `apps/api` and `apps/web` — placeholder `HealthStatus` type, consumed by both the api health route and the web placeholder page
- [x] `apps/api` is a NestJS app that boots and responds to a request (`GET /health`), connects to Postgres (health route runs a real `select 1` through Drizzle), and has Drizzle configured with a working migration mechanism (drizzle-kit) — decided: migrations run automatically on API container start via `entrypoint.sh` (`drizzle-kit migrate` then exec the app), not a manual step
- [x] `apps/web` is a Next.js app configured with `output: 'export'` that builds to a static bundle and serves a placeholder page
- [x] Docker Compose brings up three services — `postgres`, `api`, `web` — with a single command; `web` is nginx serving the static export and reverse-proxying `/api/*` to `api`, so only one origin is exposed to the browser
- [x] `docker compose up` from a clean checkout results in a working stack: verified — placeholder page returns 200 at `http://localhost:8080/`, and `GET http://localhost:8080/api/health` returns `{"status":"ok"}` through the nginx proxy after migrations ran automatically on api startup
- [x] No CORS configuration exists on the API (not needed given the proxy setup)
