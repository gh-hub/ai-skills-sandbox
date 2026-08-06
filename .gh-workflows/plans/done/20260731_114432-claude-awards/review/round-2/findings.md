# Review round 2 — findings

## Verdict: FAIL

## Spec-match findings

**(a) Missing or partial requirements:** none. Round-1's previously-fixed gap (DELETE-cascade HTTP-level test) was independently re-verified as present and correct (`apps/api/src/apps/awards/awards.spec.ts` lines 218-258).

**(b) Scope creep:** none of consequence. `UpdateAwardRequest` was added to `packages/shared-types/src/index.ts` even though `spec.md`'s "Shared types" section doesn't explicitly enumerate it — but it's a necessary supporting type for the spec-required `PATCH /awards/:id`, so it does not count as a scope-creep finding.

**(c) Wrong implementations:** none.

## Step 4 gate checklist

| Check | Result | Notes |
|---|---|---|
| Lint | N/A | No dedicated lint script/config in this project (same as round 1). |
| Build | PASS | `pnpm --filter api build` (nest build) — clean, no errors. `pnpm --filter web build` (next build, includes typecheck + Next's lint step) — clean, no errors; all 3 routes (`/`, `/_not-found`, `/awards`) built successfully. |
| Unit/integration tests | PASS | `pnpm --filter api test` (jest, Testcontainers-backed) — 10 suites / 102 tests, all passed. |
| E2E tests | FAIL | `cd apps/e2e && pnpm exec playwright test` (after the usual temporary port-8080→8081 workaround for this machine's unrelated port-8080 conflict, reverted immediately after via `git checkout -- docker-compose.yml apps/e2e/playwright.config.ts` — confirmed clean, not part of this failure). The run failed entirely in `globalSetup`, before any test file executed: `Error: Failed to reset the likes table after 30 attempts (api migrations may not have run): Error: Command failed: docker compose exec -T postgres psql -U thanks_claude -d thanks_claude -c TRUNCATE TABLE likes; ERROR:  cannot truncate a table referenced in a foreign key constraint / DETAIL:  Table "like_awards" references "likes". / HINT:  Truncate table "like_awards" at the same time, or use TRUNCATE ... CASCADE.` at `../global-setup.ts:40`. Root cause: `apps/e2e/global-setup.ts`'s `truncateLikesTable()` function (lines 13-31) runs `TRUNCATE TABLE likes;` with no `CASCADE`. This predates the awards feature and never needed `CASCADE` before, but the new `like_awards` table (added in this plan, migration `apps/api/drizzle/0003_nice_sir_ram.sql`) has an FK referencing `likes.id`, so Postgres now refuses the plain truncate. This is the exact same class of fix already applied elsewhere in this plan — `CONTEXT.md`'s Gotchas section notes this was already fixed in `likes.spec.ts`'s `GET /likes/stats` block — but `apps/e2e/global-setup.ts` was missed. Since this file runs before every single e2e test, it blocks the entire e2e suite (0 tests could run — not partial failure, total blockage). |

## Decision

FAIL solely on the e2e gate check above (spec-match and all other gate checks passed). Round 2 of 2 auto-fix rounds — no user checkpoint needed. One fix ticket written: `review/round-2/tickets/01-e2e-global-setup-truncate-cascade.md`.
