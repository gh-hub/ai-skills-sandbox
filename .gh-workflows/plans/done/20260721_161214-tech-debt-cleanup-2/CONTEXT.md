# Context: tech-debt-cleanup-2

## What we're building
Fix 14 surviving DEBT findings from .gh-workflows/plans/tech-debt/ spanning API DI hygiene/error-handling/UI consistency and e2e-suite duplication/robustness issues.

## Key decisions
- Single combined plan covering both API/web and e2e areas — see grill/decisions.md
- 2 Spec-category e2e items (e2e-smoke-spec-out-of-scope, e2e-workflow-dispatch-not-in-spec) intentionally left out — accepted as debt, remain in .gh-workflows/plans/tech-debt/
- likes-error-no-cause (round-1) was deleted as a duplicate of likes-error-console-duplicated (round-2) — see grill/decisions.md

## Current state
Plan complete (archived 2026-07-22)
Completed tickets: 01-api-di-hygiene, 02-web-like-count-cleanup, 03-e2e-like-count-helper, 04-e2e-config-global-setup-consolidation
Review round 1: 0 BLOCK, 6 DEBT. User decision: done. DEBT exported to .gh-workflows/plans/tech-debt/.

## Tickets
- 01-api-di-hygiene — items 1-3 (DB token unexercised, duplicated DI boilerplate, hidden DbModule dependency). Blocked by: none. DONE — live-verified, 5/5 `likes.spec.ts` passing. A regression introduced by this ticket's own change (static import causing a premature `Pool` construction) was found and fixed in the same session — see Gotchas below.
- 02-web-like-count-cleanup — items 4-6 (nested ternary, error cause, retry button shadcn). Blocked by: none. DONE. Live-verified (its affected e2e specs passed in both cold-stack and warm-stack full-suite runs).
- 03-e2e-like-count-helper — item 7 (getLikeCount helper). Blocked by: none. DONE. Live-verified (its specs passed in both the cold-stack and warm-stack full-suite runs).
- 04-e2e-config-global-setup-consolidation — items 10-14 (teardown closure, CI check dedup, docker probe try/catch, full-stack match, fullyParallel drop). Blocked by: none. DONE — live-verified against a real Docker daemon (cold-stack and warm-stack runs both passed, partial-match fix directly verified). One deviation from the spec's literal design: see Gotchas below.

## Load this session
- .gh-workflows/plans/20260721_161214-tech-debt-cleanup-2/spec.md
- .gh-workflows/plans/20260721_161214-tech-debt-cleanup-2/PROGRESS.md (last-session end-state has full detail on all 4 tickets and the Docker-verification findings)
- .claude/skills/dev-workflow/phases/review.md

## Gotchas
- Two backlog files were deliberately NOT carried in (see Key decisions above) — do not re-add them without asking the user first.
- Items 8/9 (e2e multi-assert tests) — resolved in spec.md: kept as single per-journey tests, adopted as intentional project style, not split. No ticket, no code change.
- RESOLVED (ticket 04): Item 10's Playwright API assumption (globalSetup returning a teardown closure) is confirmed correct against the actually-installed `@playwright/test` (1.61.1) — read the runner source directly and also ran the suite live. However, a *different* assumption in the spec's design broke: the ticket said to move `isStackAlreadyRunning()` into `global-setup.ts`, but Playwright starts the `webServer` (i.e. `docker compose up --build`) *before* running the `globalSetup` task, so a probe living in `global-setup.ts` would always see its own just-started stack. The probe was kept in `playwright.config.ts` instead (the only point guaranteed to run before `webServer`), exported as `wasAlreadyRunning` and imported by `global-setup.ts`. Full detail in `tickets/04-e2e-config-global-setup-consolidation.md` and `PROGRESS.md`'s last-session end-state.
- Items 10-14 all touch playwright.config.ts/global-setup.ts/global-teardown.ts and were grouped into one ticket (04) to avoid file conflicts. (Done — global-teardown.ts is now deleted.)
- Docker was NOT running by default in this sandbox, but the daemon (Docker Desktop) *can* be started with `open -a Docker` + a short wait — it just isn't running unless you start it. Once it's up, `apps/api`'s Testcontainers-based suite and the full e2e suite can genuinely run here. Don't assume "Docker unavailable" applies to future sessions in this same sandbox without checking `docker info` / trying `open -a Docker` first.
- RESOLVED (found and fixed by the conductor after ticket 04 finished, correcting an earlier misattribution): ticket 04's session found `apps/api/src/likes/likes.spec.ts` failing (`ECONNREFUSED` on port 5432) and initially logged it as "pre-existing debt, unrelated to this plan." That was wrong — bisected by reverting each of ticket 01's changed files individually and re-running the suite: the pre-plan version of `likes.spec.ts` passes cleanly, so the failure was a genuine regression introduced by ticket 01's own change. Root cause: ticket 01 added a **static** top-level `import { DATABASE_CONNECTION, type DbClient } from "../db/db.module"`. Since `db.module.ts` statically imports `db/client.ts` (which does `export const pool = new Pool({ connectionString: process.env.DATABASE_URL })` at module-load time), that static import forced the `Pool` singleton to be built with `DATABASE_URL` still unset — before `beforeAll` sets the real value from the Testcontainers instance. Fixed: `type DbClient` stays a type-only import (erased at compile time, so no runtime effect), but `DATABASE_CONNECTION` is now dynamically imported inside `beforeAll`, alongside the existing `AppModule` import. Re-verified live: 5/5 passing, reproduced twice. `tickets/01-api-di-hygiene.md` and `PROGRESS.md` have been corrected to reflect this as a found-and-fixed regression, not carried-forward debt.
- Ticket 02: retry button uses shadcn `Button` with `variant="link" size="sm"` (a judgment call within the ticket's "pick whichever variant reads correctly inline" allowance) — no e2e test references "Retry" or the error state, so this was verified only via `tsc --noEmit`/`next build` plus manual diff review, not a live e2e run.
- Ticket 03: root `node_modules` was not installed in this sandbox; had to run `pnpm install --frozen-lockfile` from the repo root before `npx tsc --noEmit` / `npx playwright test --list` would resolve `@playwright/test` (a bare `npx playwright` otherwise pulls a throwaway global install with no access to the workspace's own config). A future session that finds `apps/e2e/node_modules` (or root `node_modules`) missing should do the same.
- Ticket 03: confirmed directly (not just inferred from the spec) that `npx playwright test --list` cannot run in this sandbox even for a no-op change — `playwright.config.ts` line 8/17 calls `isStackAlreadyRunning()` (`execFileSync("docker", ...)`) unconditionally at module-load time with no try/catch, so it throws before any test file is even parsed when Docker isn't running. This is exactly items 12/13, owned by ticket 04. Ticket 04 should verify that fixing the try/catch there also unblocks `--list`/typecheck-only runs in a Docker-less sandbox, not just full runs against a real stack.
