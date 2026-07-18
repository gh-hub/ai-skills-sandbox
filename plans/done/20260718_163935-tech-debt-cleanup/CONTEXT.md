# Context: tech-debt-cleanup

## What we're building
Closing out 15 verified-still-relevant tech-debt items across apps/api and apps/web, carried over from two completed plans.

## Key decisions
- DB access moves to NestJS DI via a global DbModule/DATABASE_CONNECTION token — see grill/ADR-001.md
- drizzle-kit moves to production dependencies; both Dockerfiles get a --prod prune — see grill/ADR-002.md
- Archived plan docs (ticket status/boxes, missing /health in spec.md) get fixed in place, not left alone
- utils.ts stays as-is (shadcn convention) — accepted, not fixed
- Like-count fetch failure gets explicit "Unable to load like count" + retry button
- Swallowed API-client error gets console.error logging; UI message stays generic
- Bare Like button and story-form submit get split into two independent useSubmitLike() instances

## Tickets
1. `01-db-access-via-di` — DbModule + DI wiring for LikesController/AppController (apps/api) — DONE
2. `02-env-var-check-and-test-split` — drizzle.config.ts boundary check + likes.spec.ts split (apps/api) — DONE
3. `03-drizzle-kit-and-docker-pruning` — drizzle-kit to prod deps + Docker pruning (apps/api, apps/web) — DONE
4. `04-generate-openapi-error-handling` — try/catch + process.exit(1) (apps/api) — DONE
5. `05-archived-plan-doc-corrections` — status/checkbox/health-endpoint fixes (plans/done/thanks-claude) — DONE
6. `06-like-feature-robustness` — fetch-failure UX + mutation-state split (apps/web page.tsx) — DONE
7. `07-swallowed-error-logging` — console.error in api-client (apps/web) — DONE
8. `08-share-story-button` — raw button → shadcn Button (apps/web) — DONE
9. `09-remove-unused-dependency` — remove @thanks-claude/shared-types (apps/web) — DONE

## Current state
Plan complete (2026-07-18). Round-2 review: 0 BLOCK, 2 DEBT. User decision: done. All 7 open DEBT items exported to plans/tech-debt/. Archived to plans/done/20260718_163935-tech-debt-cleanup/.
Completed tickets: 01-db-access-via-di, 02-env-var-check-and-test-split, 03-drizzle-kit-and-docker-pruning, 04-generate-openapi-error-handling, 05-archived-plan-doc-corrections, 06-like-feature-robustness, 07-swallowed-error-logging, 08-share-story-button, 09-remove-unused-dependency, review/round-1/tickets/01-scope-ci-true-to-prune-step
Current ticket: (none — plan complete)

## Load this session
- plans/20260718_163935-tech-debt-cleanup/spec.md
- plans/coding-rules/INDEX.md

## Gotchas
- This plan was seeded from plans/tech-debt/ backlog items (via /debt-workflow), not a user feature request.
- Items #4/#5 touch files under plans/done/20260718_115923-thanks-claude/ — archived plan docs, not this plan's own files.
- Full finding evidence (file:line) lives in the original /debt-workflow research; spec.md has the condensed version — re-verify line numbers at implement time since they may drift.
- spec.md's "Further Notes" flags an open question: the apps/web/Dockerfile prune step may be a no-op — confirm before scoping a ticket around it.
- Workspace deps needed a fresh `pnpm install` at the start of ticket 01 (none were installed), plus a one-time `pnpm --filter @thanks-claude/shared-types build` since its `dist/` didn't exist yet. Both are probably already done for later sessions, but check `apps/*/node_modules` exists before assuming a clean environment.
- TS gotcha found in ticket 01: `constructor(@Inject(TOKEN) private readonly db: typeof db)` throws TS2502 (self-referential type) when the parameter property name shadows the imported type name. Fix: import the type under an alias (`import type { db as Database } from "./db/client"`) and type the parameter as `typeof Database`. Relevant if ticket 02 or any later ticket adds another DI consumer of `db`.
- `likes.spec.ts` uses testcontainers and needs a running Docker daemon — `docker info` failing with "Could not find a working container runtime strategy" means Docker Desktop isn't started (`open -a Docker` then wait for `docker info` to succeed).
- Ticket 03 done: apps/web needed no Dockerfile change — its final `nginx` stage never copies `node_modules`, only `nginx.conf` and the static `out/` dir.
- pnpm workspace gotcha (in `plans/coding-rules/node-typescript-docker.md` now): `pnpm prune --prod` must be scoped to the package's own `WORKDIR`, not the workspace root — running it at `/repo` drops that package's own prod-dep symlinks (e.g. `drizzle-kit`) along with the real devDependencies. Also needs `ENV CI=true` or it aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
- Ticket 04 done: `generate-openapi.ts` wrapped in try/catch with `console.error` + `process.exit(1)`. No automated test seam existed (confirmed in spec.md) — verified manually only.
- Local-dev-only gotcha found verifying ticket 04 (not added to coding-rules — it's an artifact of manually `rm -rf`ing `dist/` mid-session, not a real CI/normal-usage bug): with `deleteOutDir: true` in `nest-cli.json`, if `dist/` is deleted by hand while `tsconfig.build.tsbuildinfo` still exists, the next `nest build` reports success but emits nothing. Delete `tsconfig.build.tsbuildinfo` too when this happens.
- Ticket 05 done: doc-only edits, no code/tests touched. Confirmed while cross-checking `apps/web/lib/api-client/likes.ts` against archived ticket 03's acceptance criteria: the frontend uses generated OpenAPI schema types (`components["schemas"][...]` from `schema.d.ts`), not a direct import from `@thanks-claude/shared-types` — this is exactly what ticket 09 (remove unused dependency) is about, so ticket 09 should find `@thanks-claude/shared-types` genuinely has zero remaining call sites in `apps/web`.
- Ticket 06 done: no frontend test harness exists (confirmed again), verified via `docker compose up --build` + Playwright MCP. Note for future manual verification: react-query's default `useQuery` retry (3 attempts, exponential backoff) means a simulated `/likes/count` outage takes ~15s of wall-clock before the error state actually renders — don't assume "still loading…" after a few seconds means the fix is broken, wait it out. Mutations (`useMutation`) do NOT retry by default, so a simulated `POST /likes` failure surfaces immediately. Splitting `useSubmitLike()` into two instances meant the story form lost its implicit error banner (it used to share state with the bare Like button) — had to add a dedicated `storySubmit.isError` banner inside the form so story-submit failures aren't silently invisible; this wasn't spelled out as a separate acceptance box but follows from "each with its own isPending/isError."
- Ticket 07 done: added `console.error(error)` before each existing `throw new Error(...)` in `apps/web/lib/api-client/likes.ts`, no other changes. Verified via Playwright MCP console capture during a simulated `api` outage — nginx's 502 response body is HTML, not JSON, so `openapi-fetch`'s error-parsing fallback (`src/index.js` ~line 268-274: tries `JSON.parse`, keeps raw text on failure) means the logged `error` object is the raw HTML string, not a structured JSON error. That's expected given the current nginx/API setup, not a bug — don't mistake it for the console.error not firing when checking console output during manual verification.
- Ticket 08 done: swapped the raw `<button>` toggle for shadcn `Button` in `apps/web/app/page.tsx`, same `onClick`/text. Verified via `docker compose up --build` + Playwright MCP: toggle now visually matches the other shadcn buttons, and expand/collapse behavior (text change + story form mount/unmount) is unchanged.
- Ticket 09 done: removed `@thanks-claude/shared-types` from `apps/web/package.json` deps, plus the now-dead `COPY packages/shared-types...` and `RUN pnpm --filter @thanks-claude/shared-types build` steps from `apps/web/Dockerfile` (web's build never needed the package staged locally once the dep was gone). `packages/shared-types` itself and `apps/api`'s dependency on it are untouched. All 9 implementation tickets are now complete — next phase is review/round-1.
- Review round-1's BLOCK finding ("Dockerfile-wide `ENV CI=true` at line 3 leaks into the running container") did not match the actual working-tree file when checked during the fix session — `apps/api/Dockerfile` already only had the correctly-scoped `RUN CI=true pnpm prune --prod`, no bare `ENV CI=true` anywhere, in both HEAD and the working tree. Treat review sub-agent line/content citations as claims to re-verify against the live file, not as ground truth — they can misread. No code change was needed; the fix ticket was verified and closed as already-satisfied via a live `docker compose up --build` (confirmed `CI` unset in the running container, `GET /health` returns 200 after migrations).
- Note: `apps/api`'s port isn't published to the host in `docker-compose.yml` — verify `/health` from inside the container (`docker compose exec api node -e "fetch('http://localhost:3000/health')..."`) rather than `curl localhost:3000` from the host.
