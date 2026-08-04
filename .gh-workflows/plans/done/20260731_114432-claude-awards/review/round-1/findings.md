# Review round 1 — findings

## Verdict: FAIL

## Spec-match findings

**(a) Missing or partial requirements:**

Spec (`spec.md`, Testing Decisions, backend integration bullet): "...and deleting an award removing its `like_awards` rows while leaving the referencing `likes` rows' content intact." This scenario was supposed to live in `apps/api/src/apps/awards/awards.spec.ts` (Supertest/HTTP-level, per that bullet's location — the bullet describes `awards.spec.ts`'s required coverage). Instead, `awards.spec.ts`'s `DELETE /awards/:id` `describe` block (lines 198-216) only checks a 204 response and a follow-up 404 on re-fetch — it never creates a `likes` row, attaches the award to it via `like_awards`, deletes the award through the real `DELETE /awards/:id` HTTP route, and then asserts the `like_awards` join row is gone while the `likes` row's `story`/`hoursSaved`/`userId` content is untouched. The actual cascade-cleanup assertion instead lives in the new `apps/api/src/db/schema.spec.ts` (`"cascades like_awards cleanup when the referenced award is deleted, without touching likes"`, and a sibling test for deleting the `like`), which calls `db.delete(awards)`/`db.delete(likes)` directly against Drizzle — bypassing the `AwardsController`/`AwardsService`/`AwardsRepository` layers entirely. `schema.spec.ts`'s test is a valid, additional check of the raw FK behavior, but it does not fulfill the spec's requirement of covering this specifically through the real `DELETE /awards/:id` API route, which is the gap.

**(b) Scope creep:** none. (`spec.md`'s own "Further Notes" pre-approves two items that would otherwise look like scope creep — the mandatory-auth guard pattern and the `/awards` header nav link — so neither counts as a finding.)

**(c) Wrong implementations:** none.

## Step 4 gate checklist

| Check | Result | Notes |
|---|---|---|
| Lint | N/A | No dedicated lint script in any `package.json` (root, `apps/api`, `apps/web`) and no ESLint config file anywhere in the repo. `apps/web`'s `next build` runs Next.js's built-in lint-and-typecheck step as part of build — that's the only lint-adjacent check that exists in this project. |
| Build | PASS | `pnpm --filter api build` (nest build) — clean, no errors. `pnpm --filter web build` (next build, includes typecheck + Next's lint step) — clean, no errors; all 3 routes (`/`, `/_not-found`, `/awards`) built successfully. |
| Unit/integration tests | PASS | `pnpm --filter api test` (jest, Testcontainers-backed) — 10 suites / 101 tests, all passed. |
| E2E tests | PASS | `cd apps/e2e && pnpm exec playwright test` — 22/22 tests passed, including both new specs `tests/awards-page.spec.ts` (3 tests) and `tests/story-award-picker.spec.ts` (2 tests). Note: on this machine port 8080 is held by an unrelated process (`ao-fireblocks-callback-handler`); the review session temporarily repointed `docker-compose.yml`'s `web` port mapping and `apps/e2e/playwright.config.ts`'s `baseURL`/`webServer.url` from 8080 to 8081, ran the suite, then reverted both files via `git checkout` immediately after (confirmed clean via `git status`). Purely a local execution note, not an open issue. |

## Decision

FAIL on the spec-match finding above (all four gate checks that apply passed). Round 1 of 2 auto-fix rounds — no user checkpoint needed. One fix ticket written: `review/round-1/tickets/01-award-delete-cascade-http-test.md`.
