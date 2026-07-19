## Problem Statement

`apps/web` (the "Thanks, Claude" single-page app) has no automated test coverage. Its three interactive flows — liking, submitting a story, and toggling dark mode — can regress without anyone noticing until a user reports it.

## Solution

A Playwright end-to-end test suite, in a new `apps/e2e` pnpm workspace, that drives the real web app (as built and served by the `docker-compose.yml` stack) against the real NestJS API and a real Postgres database. The suite runs locally with one command and automatically in a new CI workflow on every pull request and push to `main`.

## User Stories

1. As a developer, I want a single command that builds and starts the full stack and runs the e2e suite against it, so that I don't need to manually manage docker-compose before testing.
2. As a developer, I want clicking "Like" to be verified to increase the displayed like count by 1, so that regressions in the like flow are caught automatically.
3. As a developer, I want the story submission flow (expand → fill → submit → success) to be verified end-to-end, so that regressions in form submission, the API contract, and the DB write are caught.
4. As a developer, I want the story form's validation error path (invalid `hoursSaved`) to be verified, so that client-side validation regressions are caught before submission ever reaches the API.
5. As a developer, I want the dark mode toggle to be verified to switch themes and persist the choice across a reload, so that regressions in theme persistence are caught.
6. As a developer, I want these tests to pass reliably regardless of what data already exists in the database, so that the suite isn't flaky across repeated local runs or CI runs.
7. As a reviewer, I want the e2e suite to run automatically on every PR and on pushes to `main`, so that regressions are caught before or at merge time, not after.

## Implementation Decisions

- **New workspace**: `apps/e2e/` added to the pnpm workspace (matches the existing `apps/*` pattern in `pnpm-workspace.yaml`). Contains its own `package.json` (Playwright + its own `test` script) and `playwright.config.ts`.
- **Target under test**: the `docker-compose.yml` stack as-is — `web` (nginx serving the Next.js static export, port 8080 on host), `api` (NestJS, migrations run automatically via `apps/api/entrypoint.sh` on container start), and `postgres`. No changes to `docker-compose.yml`, `Dockerfile`s, or `nginx.conf` are needed — the suite treats this stack as a black box, per ADR-001.
- **Stack orchestration**: `playwright.config.ts`'s `webServer` option runs `docker compose up --build`, with `url` pointed at the web app's root and `reuseExistingServer: !process.env.CI` so local iteration can reuse an already-running stack while CI always starts clean. Playwright tears the stack down after the run.
- **Baseline reset**: before the suite's tests run, a one-time setup step resets the `likes` table to empty (e.g. `docker compose exec postgres psql ... -c "TRUNCATE likes"`, or an equivalent script) so the suite starts from a known baseline. This runs once per suite invocation, not per test.
- **API contract being exercised** (no changes to the API itself):
  - `POST /likes` with an empty body — the "Like" button flow. Response: `LikeDto` (`id`, `createdAt`, `story: null`, `hoursSaved: null`).
  - `POST /likes` with `{ story?, hoursSaved? }` — the story-form flow. Both a bare like and a story submission insert a row into the same `likes` table, so **both actions increment the same count** — tests must account for this (see Testing Decisions).
  - `GET /likes/count` — returns `{ count }`, the total row count in `likes`. This is what the UI displays and what tests assert deltas against.
- **Selectors**: use Playwright's accessible-role/label locators (`getByRole("button", { name: "Like" })`, `getByLabel("Hours saved (optional)")`, `getByRole("alert")`, etc.) against the existing DOM — no `data-testid` attributes need to be added, since `apps/web`'s components already expose accessible names (button text, `FormLabel`, `role="alert"`) sufficient for reliable selection.
- **Browser projects**: Chromium only (`playwright.config.ts` defines a single project). Extending to Firefox/WebKit later is additive, not a rework.
- **CI**: new `.github/workflows/e2e.yml`, triggered on `pull_request` and `push` to `main`. Job installs pnpm deps, installs Playwright's browser binaries, and runs the e2e suite's test script (which itself brings up docker-compose via `webServer`, per the decision above — no separate compose step needed in the workflow beyond what Playwright already does, though the workflow does need Docker available, which GitHub-hosted Ubuntu runners provide by default).

## Testing Decisions

- Test external behavior only: what's visible in the browser DOM and observable through the UI. No inspection of DB rows or API responses directly from tests — verify via the rendered page.
- **Delta assertions, not absolute values**: every test reads the displayed like count before its action and asserts the count after the action equals `before + 1`. This holds regardless of test execution order or what earlier tests (like or story submissions) have already done to the shared count.
- Test files (one seam per file, matching the 3 core flows):
  1. Like flow: click "Like" → count increases by 1.
  2. Story form flow: expand → fill valid `story`/`hoursSaved` → submit → form resets/collapses (success), AND separately, invalid `hoursSaved` (e.g. a negative number) → validation message shown, submission blocked, no count change.
  3. Dark mode flow: toggle theme → DOM/attribute reflects the new theme → reload → theme persists.
- No prior art for e2e tests exists in this codebase (`apps/api` has Jest unit tests only, per `apps/api/package.json`'s `test` script — not e2e, and not a pattern to imitate here).

## Out of Scope

- Network-failure / retry UI states (like-count load error + retry button, submit-failure alert paths).
- Cross-browser testing (Firefox, WebKit).
- Visual regression testing.
- Load/performance testing.
- Per-test database isolation/reset (one reset per suite run is sufficient, per decision above).
- Any changes to `apps/web` or `apps/api` application code — this plan is test-suite-only, unless implementation surfaces a genuine bug (in which case that's a new, separate concern, not silently folded into this plan).

## Further Notes

- The exact DB-reset mechanism (raw `psql` truncate via `docker compose exec`, vs. a small script hitting a dedicated reset endpoint) is left as an implementation choice for the tickets/implement phase — no API changes are in scope, so it must not require adding a reset endpoint to the API.
- GitHub Actions runners provide Docker by default; if `docker compose` (v2 CLI) isn't preinstalled on the runner image used, the workflow may need a setup step for it — to be confirmed during implementation.
