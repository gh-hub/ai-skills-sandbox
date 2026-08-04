# Requirements: tech-debt-cleanup-2

## Problem
17 backlog items had accumulated in `.gh-workflows/plans/tech-debt/`, exported there by two prior plans (`tech-debt-cleanup`, `e2e-ui-testing`) when they archived. `/debt-workflow` re-verified every item against the current codebase: all were still present and unfixed (the backlog is only a few days old). One item, `likes-error-no-cause`, was dropped as a duplicate — a later finding (`likes-error-console-duplicated`) explicitly supersedes it, covering the same missing-`{ cause }` issue at both call sites instead of one. That left 16 items; the user chose to fix 14 now and leave 2 as accepted debt.

## Solution
One combined plan, tickets split internally by area:
- **API/web area (6 items)** — DI/DbModule hygiene in the NestJS API, plus a readability fix and a UI-consistency fix in the Next.js app.
- **E2E suite area (8 items)** — duplication and robustness fixes in the Playwright test suite and its config/setup/teardown scripts.

## What done looks like
Each item below is fixed and verified against its original finding text.

### API/web items
1. **db-connection-token-unexercised** — `apps/api/src/likes.spec.ts` imports `pool` directly from `../db/client` instead of going through the `DATABASE_CONNECTION` DI token, so the token is never exercised by tests. Either make the test override the token, or remove the indirection if it serves no purpose.
2. **duplicated-db-inject-boilerplate** — `AppController` (`apps/api/src/app.controller.ts`) and `LikesController` (`apps/api/src/likes/likes.controller.ts`) both repeat `import type { db as Database } from ".../db/client"` + `@Inject(DATABASE_CONNECTION) private readonly db: typeof Database`. Extract a shared exported type (e.g. `export type DbClient = typeof db`) so both controllers import one name.
3. **dbmodule-global-hidden-dependency** — `LikesModule` (`apps/api/src/likes/likes.module.ts`) never imports `DbModule`, relying entirely on its `@Global()` registration. Make the dependency explicit, or document why relying on `@Global()` is intentional here.
4. **like-count-nested-ternary** — the loading/error/data ternary rendering the like count in `apps/web/app/page.tsx` is nested two levels deep. Flatten it (early returns, a small render helper, or similar).
5. **likes-error-console-duplicated** — `apps/web/lib/api-client/likes.ts`'s `useLikeCount` and `useSubmitLike` both do `console.error(error); throw new Error(...)` with no `{ cause }` attached, so the real error detail never reaches callers. Extract a shared helper that throws with `{ cause: error }`.
6. **retry-button-not-shadcn** — the like-count retry control in `apps/web/app/page.tsx` (`<button onClick={() => likeCount.refetch()}>Retry</button>`) is a raw HTML button while every sibling button on the page uses the shadcn `Button` component. Convert it.

### E2E suite items
7. **e2e-like-count-parsing-duplicated** — `Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1])` appears 3 times across `apps/e2e/tests/like-flow.spec.ts` and `apps/e2e/tests/story-form-flow.spec.ts`. Extract a `getLikeCount(page)` helper.
8. **e2e-dark-mode-toggle-multi-assert** — `apps/e2e/tests/dark-mode-toggle.spec.ts` asserts 3 states (initial, post-toggle, post-reload) in one test. Judgment call, not a rule violation — spec phase decides whether to split or explicitly accept as a single user-journey test.
9. **e2e-story-form-multi-assert** — both tests in `apps/e2e/tests/story-form-flow.spec.ts` assert multiple things each (form state + like count; error message + visibility + like count). Same judgment call as #8.
10. **e2e-teardown-env-var-global-state** — `apps/e2e/playwright.config.ts` sets `process.env.E2E_STACK_WAS_ALREADY_RUNNING` as a module-load side effect; `apps/e2e/global-teardown.ts` reads it in a separate process invocation. Implicit, order-dependent global state. Replace with an explicit passed value if Playwright's config/teardown API allows it; otherwise document why env var is the only channel.
11. **e2e-ci-check-duplicated** — `!process.env.CI` is checked twice in `apps/e2e/playwright.config.ts` (once gating the stack probe, once for `reuseExistingServer`). Extract to one named constant.
12. **e2e-docker-probe-no-try-catch** — `isStackAlreadyRunning()` in `apps/e2e/playwright.config.ts` runs `execFileSync("docker", ...)` with no try/catch, unlike `global-setup.ts`'s retry-with-context pattern for the same class of failure (Docker not running). Add equivalent handling.
13. **e2e-stack-probe-partial-match-false-positive** — `isStackAlreadyRunning()` returns true if *any* container is running (`output.trim().length > 0`), not that the full `web`/`api`/`postgres` stack is up. Check for the full expected stack specifically.
14. **e2e-fullyparallel-workers-redundant** — `apps/e2e/playwright.config.ts` sets both `fullyParallel: true` and `workers: 1`; `workers: 1` alone already forces serial execution. Drop the redundant setting.

## Out of scope
- **e2e-smoke-spec-out-of-scope** and **e2e-workflow-dispatch-not-in-spec** — both flagged "harmless"/low-cost in their original findings. User chose to leave these as accepted debt rather than spend a ticket on them now. Left untouched in `.gh-workflows/plans/tech-debt/`.
- Any new tech debt discovered while fixing these 14 items belongs in a future round via the normal review-phase DEBT flow — not scope creep into this plan.

## Actors
Whoever maintains `apps/api`, `apps/web`, and `apps/e2e` going forward. These are internal code-quality fixes — no end-user-facing behavior change is expected, other than item 6's visual restyle of the retry button to match its siblings.

## Constraints
- Stack unchanged from the originating plans: NestJS + Drizzle (api), Next.js + shadcn/ui (web), Playwright (e2e).
- No behavior change to the public API or UI functionality other than item 6's visual restyle.

## Unknowns / risks
- Items 8 and 9 were explicitly logged as judgment calls in the original findings, not rule violations — spec phase should make an explicit call on whether to split them or adopt the single-journey-test pattern as project style.
- Item 10's fix may be constrained by what Playwright's config/global-teardown API actually supports for passing state between processes — worth confirming during spec before committing to an approach.
