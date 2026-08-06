# Spec: tech-debt-cleanup-2

## Problem Statement

Two prior cleanup rounds (`tech-debt-cleanup`, `e2e-ui-testing`) left behind 16 tech-debt findings in `.gh-workflows/plans/tech-debt/`. `/debt-workflow` re-verified them against the current codebase: 16 are still present, and the user chose to fix 14 now (2 low-value e2e "spec-only" items are accepted as debt and stay in the backlog untouched).

From the maintainer's perspective — anyone working in `apps/api`, `apps/web`, or `apps/e2e` — these 14 items are small but real frictions:

- In the API, the DI wiring around `DATABASE_CONNECTION` is inconsistent: a test bypasses it, two controllers hand-roll the same import boilerplate instead of sharing a type, and one module relies on invisible `@Global()` magic instead of declaring its dependency.
- In the web app, a like-count error is swallowed into a generic message with no way to inspect the original cause, the retry control after a failed count-fetch is a bare `<button>` next to shadcn `Button`s everywhere else, and a ternary rendering that count is nested two levels deep.
- In the e2e suite, the same "parse the like count out of the DOM" regex is copy-pasted three times, the stack-detection logic used to decide whether Docker Compose should be torn down after the run is fragile (partial-match false positive, no error handling, state passed via a fragile env-var side channel), and the config has a redundant setting plus a duplicated `!process.env.CI` check.

None of this blocks a feature, but every item makes the next change in that file slightly riskier or slower to make correctly.

## Solution

Fix all 14 items in place, area by area, without changing any user-facing behavior except item 6 (the retry button gets the shadcn `Button` styling instead of a bare `<button>`). Each fix is verified against its original finding text and, where a test already exercises the affected code path, the existing test suite must still pass.

Two explicit calls made during this spec (per `grill/requirements.md`'s open questions):

1. **Items 8/9 (e2e multi-assert tests)** — keep them as single tests. See Implementation Decisions below for rationale; this is adopted as intentional project style, not a defect to fix.
2. **Item 10 (env-var global state)** — Playwright's `globalSetup` hook may return a teardown function, which runs in the same process/closure as the setup call. Restructure the stack-liveness check into `global-setup.ts` and have it return its own teardown callback, closing over the boolean directly instead of round-tripping it through `process.env`. `global-teardown.ts` and the `globalTeardown` config option are removed. See item 10 below.

## User Stories

### API/web area
1. As a maintainer running `likes.spec.ts`, I want the test's own database handle to come from the same `DATABASE_CONNECTION`-backed `db` instance the app resolves via DI, so that the token is genuinely exercised rather than bypassed by a raw import.
2. As a maintainer adding a third controller that needs the DB, I want a single exported `DbClient` type to `@Inject(DATABASE_CONNECTION)`, so I don't repeat the `import type { db as Database } from ...` line and can't get the two controllers' types out of sync.
3. As a maintainer reading `LikesModule`, I want its dependency on `DbModule` to be visible in the module's own `imports` array, so I don't have to know that `DbModule` happens to be `@Global()` to understand where `DATABASE_CONNECTION` comes from.
4. As a maintainer reading `apps/web/app/page.tsx`, I want the like-count rendering logic flattened out of a nested ternary, so the three states (error / loading / loaded) are easy to scan independently.
5. As a maintainer debugging a failed like-count fetch or like submission, I want the original fetch error attached as `{ cause }` on the thrown `Error`, so I can inspect the real failure instead of only ever seeing "Failed to load like count" / "Failed to submit like".
6. As a user who hits a failed like-count fetch, I want the "Retry" control to look like every other button on the page (shadcn `Button`), so the UI doesn't visibly regress to a bare HTML button on error.

### E2E suite area
7. As a maintainer writing a new e2e test that needs the displayed like count, I want a single `getLikeCount(page)` helper, so the count-parsing regex exists in exactly one place.
8. As a maintainer reading `dark-mode-toggle.spec.ts`, I want the test to keep asserting the full toggle → reload journey in one test (not split per state), so the suite continues to describe one user journey per test rather than one assertion per test.
9. As a maintainer reading `story-form-flow.spec.ts`, I want each test to keep asserting all the outcomes of its one user action (submit → form collapses + count increments; invalid input → validation message + form stays open + count unchanged), for the same reason as item 8.
10. As a maintainer running the e2e suite locally against a stack I started myself, I want teardown to still leave that stack running afterward, with the "was it already running" signal passed as an explicit value rather than an env var read by a separate process invocation.
11. As a maintainer reading `playwright.config.ts`, I want `!process.env.CI` checked in exactly one named place, so the two usages (stack-probe gate, `reuseExistingServer`) can't silently drift apart.
12. As a maintainer whose Docker daemon isn't running when the e2e suite starts, I want `isStackAlreadyRunning()` to fail with the same clear, retried error handling as `global-setup.ts` already has for the identical failure mode, instead of an uncaught exception.
13. As a maintainer with unrelated containers running locally (e.g. from another project), I want the stack-liveness probe to check specifically for the `web`, `api`, and `postgres` services, so it doesn't wrongly conclude "the stack is already up" and skip starting it.
14. As a maintainer reading `playwright.config.ts`, I want only the settings that actually affect behavior, so `fullyParallel: true` (a no-op alongside `workers: 1`) doesn't imply a parallelism story that isn't real.

## Implementation Decisions

### API/web area

**1. `db-connection-token-unexercised`** (`apps/api/src/likes/likes.spec.ts`)
Drizzle's `NodePgDatabase` exposes the underlying driver via `db.$client` (confirmed in the installed `drizzle-orm@0.44.7` types). Replace the direct `import { pool } from "../db/client"` with resolving the DI-provided instance from the compiled test module (`moduleRef.get(DATABASE_CONNECTION)`) and reading `.$client` off it to get the `Pool` needed for `appPool.end()` in `afterAll`. This makes the test's cleanup path go through the same token the app resolves at request time, rather than importing the module directly — closing the "token never exercised by tests" gap without changing what's actually tested.

**2. `duplicated-db-inject-boilerplate`** (`apps/api/src/app.controller.ts`, `apps/api/src/likes/likes.controller.ts`)
Add `export type DbClient = typeof db;` to `apps/api/src/db/db.module.ts` (which already imports `db` from `./client` and exports `DATABASE_CONNECTION`). Both controllers already import `DATABASE_CONNECTION` from that same file — change their constructor parameter type to `DbClient` from that one import, and drop the separate `import type { db as Database } from ".../db/client"` line entirely. One export, one import statement per controller, no duplicated type name.

**3. `dbmodule-global-hidden-dependency`** (`apps/api/src/likes/likes.module.ts`)
Add `imports: [DbModule]` to `LikesModule`'s `@Module(...)` decorator (importing `DbModule` from `../db/db.module`). `@Global()` modules don't require importers to list them for the DI resolution to work, but importing it anyway is free (Nest dedupes) and makes the dependency discoverable by reading the module file alone. This is preferred over documenting-and-leaving-as-is, since the fix costs one line.

**4. `like-count-nested-ternary`** (`apps/web/app/page.tsx`)
Replace the nested ternary (error ? ... : loading ? ... : data) with a small local render helper (e.g. a `renderLikeCount()` function or IIFE-free helper computed before the `return`) that uses early returns for each of the three states. No change to markup or behavior — same three branches, same retry button (now the shadcn `Button`, see item 6).

**5. `likes-error-console-duplicated`** (`apps/web/lib/api-client/likes.ts`)
Extract a shared helper, e.g. `throwApiError(error: unknown, message: string): never`, that does `console.error(error); throw new Error(message, { cause: error });`. Call it from both `useLikeCount`'s and `useSubmitLike`'s `queryFn`/`mutationFn` in place of the current duplicated two-line block. This is the fix for both `likes-error-console-duplicated` and the superseded `likes-error-no-cause` (see `grill/decisions.md`).

**6. `retry-button-not-shadcn`** (`apps/web/app/page.tsx`)
Replace `<button onClick={() => likeCount.refetch()}>Retry</button>` with `<Button onClick={() => likeCount.refetch()} variant="link" size="sm">Retry</Button>` (or `variant="outline"`/`"secondary"` — pick whichever reads correctly inline next to the error text; `Button` is already imported in this file). No functional change — same `refetch()` call, same position in the error message.

### E2E suite area

**7. `e2e-like-count-parsing-duplicated`**
Add a new file `apps/e2e/tests/helpers.ts` (no existing shared-test-utility file to extend) exporting:
```ts
export async function getLikeCount(page: Page): Promise<number> {
  const text = await page.getByText(/\d+ likes/).textContent();
  return Number(text?.match(/(\d+) likes/)?.[1]);
}
```
Update `like-flow.spec.ts` and `story-form-flow.spec.ts` (2 call sites) to import and use it in place of the inline regex parse. The `likeCount` locator itself (`page.getByText(/\d+ likes/)`) still needs to stay available at each call site for the `toContainText` assertions afterward — `getLikeCount` re-derives the locator internally, which is cheap (a fresh `getByText` lookup, no wait) and keeps the helper self-contained.

**8/9. `e2e-dark-mode-toggle-multi-assert`, `e2e-story-form-multi-assert`** — accepted as intentional style, not split
Decision: keep both files as single tests per user journey. Rationale:
- Each test already represents one user action and its full set of directly-caused, observable consequences (toggle dark mode → theme class changes → persists across reload; submit story → form collapses + count increments; invalid input → validation message shown + form stays open + count unchanged). These aren't unrelated assertions bolted onto one test — they're the definition of "did this one user action work."
- Splitting them would mean repeating the expensive shared setup (page load, docker-composed stack, `Share a story` click) 2-3x per journey for no gain in fault isolation — a failure on any of the chained assertions already points at the specific `expect` line that failed.
- This becomes the documented default going forward: e2e tests assert one user journey's full set of directly-observable outcomes, not one outcome per test. No code change to these two files.

**10. `e2e-teardown-env-var-global-state`**
Restructure `apps/e2e/global-setup.ts` and delete `apps/e2e/global-teardown.ts`:
- Move `isStackAlreadyRunning()` (and its Docker probe, see item 12/13) from `playwright.config.ts` into `global-setup.ts`.
- `global-setup.ts`'s default export computes `const wasAlreadyRunning = isStackAlreadyRunning()` once, does its existing `truncateLikesTable()` retry loop, and then **returns a teardown function** that closes over `wasAlreadyRunning`: `return async () => { if (!wasAlreadyRunning) execFileSync("docker", ["compose", "down"], ...); }`. This is Playwright's supported mechanism for global setup/teardown that share state — the returned function is invoked by the runner as the teardown, in the same module/closure as the setup, with no serialization boundary.
- `playwright.config.ts` drops the `globalTeardown` line and the `process.env.E2E_STACK_WAS_ALREADY_RUNNING` assignment entirely; `globalSetup` still points at `./global-setup`.
- Delete `apps/e2e/global-teardown.ts`.
- Risk/fallback: if the installed Playwright version's runner does not invoke a globalSetup-returned function as teardown in this project's actual configuration (this should be confirmed once `@playwright/test` is installed and the suite is run — see Further Notes), fall back to explicitly documenting the env var as the only channel, per the original finding's alternative.

**11. `e2e-ci-check-duplicated`**
In `playwright.config.ts`, extract `const isCI = Boolean(process.env.CI);` (or reuse the moved-out `!process.env.CI` sense as `const isLocal = !process.env.CI`) once at module scope, and use it for both the stack-probe gate (now living in `global-setup.ts` — pass a computed boolean/flag in, or keep the CI check itself in `global-setup.ts` since that's where the probe now lives) and `webServer.reuseExistingServer`. Since item 10 moves the probe into `global-setup.ts`, this constant should live wherever `!process.env.CI` is actually still checked twice after that move — likely still `playwright.config.ts` for `reuseExistingServer`, and `global-setup.ts` gets its own single `process.env.CI` check for whether to even probe. Land on whichever single file ends up with the duplicate after item 10 is implemented; the point is one named constant, not necessarily one physical location once the code has moved.

**12. `e2e-docker-probe-no-try-catch`**
Wrap the `execFileSync("docker", ["compose", "ps", ...])` call in `isStackAlreadyRunning()` (now in `global-setup.ts`) with the same try/catch-and-treat-as-"not running" (or retry, matching `global-setup.ts`'s existing `truncateLikesTable` pattern) handling that the file already uses for the Docker-not-running failure mode. Since this probe runs once at the very start (not in a loop like `truncateLikesTable`), the simplest consistent fix is: catch the error, log/comment that Docker isn't reachable, and treat the stack as "not already running" (safe default — proceeds to start it / tear it down normally) rather than crashing global setup outright.

**13. `e2e-stack-probe-partial-match-false-positive`**
Change `isStackAlreadyRunning()` to parse the JSON lines from `docker compose ps --status running --format json` and check that all three expected services (`web`, `api`, `postgres` — confirmed as the service names in `docker-compose.yml`) are present, instead of `output.trim().length > 0`. E.g. parse each line as JSON, collect `.Service` names into a `Set`, and return `["web", "api", "postgres"].every(svc => runningServices.has(svc))`.

**14. `e2e-fullyparallel-workers-redundant`**
Drop `fullyParallel: true` from `playwright.config.ts`; `workers: 1` alone already forces serial execution, so the setting is a no-op that implies parallelism intent that isn't real.

## Testing Decisions

- **Item 1**: `likes.spec.ts` is already an end-to-end test against a real Testcontainers Postgres instance through the full Nest app (supertest). No new test is needed — the change is to how the test itself acquires its cleanup handle. After the change, the existing 5 `it(...)` blocks must still pass unmodified.
- **Items 2, 3**: No new tests — these are structural DI changes with no behavior change. The existing `likes.spec.ts` (hits `/likes` and `/likes/count` through the real app) already covers that `LikesController` and `AppController` still resolve their DB dependency correctly after the refactor; a green run of that suite is the verification.
- **Item 4**: Covered by existing e2e coverage (`like-flow.spec.ts`, `smoke.spec.ts`) that the like count still renders in all three states through real user interaction — no new unit test needed for a pure render-logic reshuffle. Prior art: this repo has no component-level unit tests for `apps/web`; e2e is the established seam for this app's UI behavior.
- **Item 5**: No new automated test — `{ cause }` is an internal debugging aid with no externally observable behavior change (same thrown message, same `console.error`). Manually verify by triggering a fetch failure and inspecting `error.cause` in a debugger/log, if desired.
- **Item 6**: Existing e2e coverage doesn't currently exercise the error/retry state (no test simulates a failed `/likes/count` fetch). Out of scope to add one now — this item is a pure visual restyle of an existing, currently-untested control. Verify visually (matches sibling `Button` styling) rather than adding new e2e coverage as part of this cleanup.
- **Item 7**: No new test — `getLikeCount` is a refactor of existing, already-passing assertions in `like-flow.spec.ts` and `story-form-flow.spec.ts`. Those tests passing after the refactor is the verification.
- **Items 8/9**: No test changes (decision is to keep as-is).
- **Items 10–14**: These are test-infrastructure changes to the suite's own scaffolding (config, global setup/teardown), not testable by the Playwright tests themselves. Verification is running the full e2e suite twice locally: once starting from a cold stack (stack should be torn down after), once with the stack already running before the suite starts (stack should be left running after) — confirming item 10's teardown decision and item 13's full-stack match both behave correctly in both cases. This is manual/operational verification, consistent with how this kind of config-only change was verified in the prior `e2e-ui-testing` plan.

## Out of Scope

- `e2e-smoke-spec-out-of-scope` and `e2e-workflow-dispatch-not-in-spec` — left as accepted debt in `.gh-workflows/plans/tech-debt/`, not touched by this plan (see `grill/decisions.md`).
- Any new tech debt discovered while implementing these 14 fixes — logged via the normal review-phase DEBT flow in a future round, not folded into this plan's scope.
- No new automated coverage is being added for the like-count error/retry state (item 6) or for verifying items 10–14's runtime behavior — both are called out explicitly above rather than silently skipped.
- No dependency or stack upgrades (NestJS, Drizzle, Next.js, shadcn/ui, Playwright versions are all unchanged).

## Further Notes

- **Item 10's Playwright API assumption**: this spec's design (globalSetup returning a teardown closure) is Playwright's documented supported mechanism, but it hasn't been confirmed against the actual installed `@playwright/test` in a running suite in this repo (dependency wasn't installed/runnable during spec research). The implement phase for this ticket should run the full suite (cold-stack and warm-stack cases) before considering it done; if the returned-function form doesn't behave as expected, fall back to the original finding's alternative (keep the env var, add a comment documenting why it's the only channel available).
- **Item 11's exact landing spot**: because item 10 moves the Docker-probe logic (and thus one of the two `!process.env.CI` checks) out of `playwright.config.ts` into `global-setup.ts`, the two checks may no longer live in the same file by the time item 11 is implemented. The ticket for item 11 should be sequenced after item 10 (or implemented as part of the same ticket) so the "duplicated" check being fixed is evaluated against the post-item-10 layout, not the pre-move one described in the original finding.
- **Ticket sequencing for the e2e config area (items 10–14)**: items 10, 11, 12, 13 all touch `playwright.config.ts` and/or `global-setup.ts`/`global-teardown.ts` in overlapping ways. The tickets phase should consider grouping these into one ticket (or a tightly sequenced chain) rather than four independent tickets that would conflict on the same files.
- **Item 2's naming**: `DbClient` is chosen as the shared type name (per the finding's own suggestion). If the tickets/implement phase finds a naming collision or a stronger existing convention elsewhere in `apps/api`, that's a fine, low-risk substitution — the finding's intent (one shared exported type, not two duplicated `import type` lines) is what matters.
