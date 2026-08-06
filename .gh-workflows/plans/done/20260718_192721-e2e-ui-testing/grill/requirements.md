# Requirements: e2e-ui-testing

## Problem

The web app (`apps/web`, the "Thanks, Claude" single page) has no automated test coverage. Regressions in its interactive flows currently ship silently. We need an end-to-end test suite that exercises the real UI against the real backend.

## Solution

A Playwright-based e2e suite that drives the deployed web app (built, served via nginx, as it runs in `docker-compose.yml`) against the real NestJS API and a real Postgres database.

## What done looks like

A developer can run one command and get a pass/fail signal covering:

1. **Like flow** — clicking "Like" increases the displayed like count by 1.
2. **Story form flow** — expanding "Share a story", filling the optional `story` and `hoursSaved` fields, and submitting succeeds (form resets, collapses). Also covers the validation-error path: an invalid `hoursSaved` value (e.g. negative) shows the form validation message and blocks submission.
3. **Dark mode flow** — toggling the theme button switches between light/dark and the choice persists (e.g. across a reload).

Additionally, a GitHub Actions workflow runs this suite automatically on every pull request and every push to `main` — the first CI workflow in this repository.

## Out of scope (v1)

- Network-failure / retry UI states (like-count load error + retry, submit-failure alerts)
- Cross-browser matrix (Firefox, WebKit) — Chromium only for now
- Visual regression testing
- Load/performance testing
- Per-test database reset/isolation (deltas + one reset per suite run is sufficient)
