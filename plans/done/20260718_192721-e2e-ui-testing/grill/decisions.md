# Decisions: e2e-ui-testing

## Decision: Test scope — 3 core flows
Decided: Cover like button/count, story form (happy path + validation error), and dark mode toggle. Nothing else for v1.
Why: These are the app's only real interactive flows. Error/retry UI states are edge cases better suited to a later round.
Alternatives rejected: Covering every visible edge case (long text, boundary values) — too broad for a first suite.

## Decision: Test against the real stack, not mocks
Decided: Playwright drives the built web app talking to the real NestJS API and a real Postgres DB via the existing `docker-compose.yml`.
Why: Called "e2e" for a reason — mocking the network would just be component testing with extra steps. The API surface (likes, story submit) is small enough that standing up the real backend isn't a heavy lift.
Alternatives rejected: Mocked network calls (page.route) — faster/more deterministic but doesn't catch real integration bugs. A separate lighter test-DB setup — unnecessary extra infra when docker-compose already exists.

## Decision: New apps/e2e workspace package
Decided: Playwright config and tests live in a new `apps/e2e` pnpm workspace package (own package.json, own playwright.config.ts).
Why: The suite orchestrates web+api+db as an external consumer — it shouldn't be coupled to apps/web's own tooling/scripts.
Alternatives rejected: Nesting under apps/web/e2e — couples an external-consumer test suite to one app's package.

## Decision: State isolation via deltas + single reset per suite run
Decided: Tests assert relative changes (e.g. "count increased by 1"), never absolute values. DB is truncated/migrated fresh once when the suite run starts, not between individual tests.
Why: Avoids slow per-test reset infrastructure while keeping assertions deterministic against a shared, real backend.
Alternatives rejected: Reset between every test (too slow). No reset at all (would let manual/leftover local state make the very first run flaky).

## Decision: Playwright's webServer manages docker compose
Decided: `playwright.config.ts`'s `webServer.command` runs `docker compose up --build`, waits for the web app's health, and tears the stack down after the run. `pnpm test` from `apps/e2e` is the single entry point.
Why: No separate "remember to start docker-compose first" step for local runs or CI.
Alternatives rejected: Manual/external orchestration — pushes a stateful setup step onto every runner (human or CI).

## Decision: Chromium only for v1
Decided: Single browser project (Chromium) in the Playwright config.
Why: Small internal app, no stated cross-browser requirement. Faster, less flake surface. Easy to extend later.
Alternatives rejected: Full Chromium+Firefox+WebKit matrix from day one — unjustified cost right now.

## Decision: CI is in scope — new GitHub Actions workflow
Decided: Add `.github/workflows/e2e.yml`, the first CI workflow in this repo, running the e2e suite via docker compose in the runner.
Why: User explicitly requested CI be bundled into this plan rather than deferred.
Alternatives rejected: Leaving CI for a separate future initiative (original recommendation, overridden by user).

## Decision: CI trigger — PRs and pushes to main
Decided: Workflow triggers on `pull_request` and on `push` to `main`.
Why: Standard default for a first CI workflow — catches regressions before merge and on the merge itself.
Alternatives rejected: PR-only trigger.

## Decision: UI verification tooling — Playwright, not claude-in-chrome
Decided: All UI verification in this repo (including for future dev-workflow implement/review sessions) uses Playwright, not the claude-in-chrome browser-automation tool.
Why: User preference, predates this plan — already codified in `plans/coding-rules/general.md` under "UI verification".
Alternatives rejected: n/a — carried over as a constraint, not decided fresh in this session.
