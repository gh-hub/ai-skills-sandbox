# 05 — CI workflow

**What to build:** A GitHub Actions workflow that runs the full e2e suite automatically — the first CI workflow in this repository.

**Blocked by:** 01, 02, 03, 04 — the local suite must exist and pass before automating it

**Status:** ready

- [ ] `.github/workflows/e2e.yml` triggers on `pull_request` and on `push` to `main`.
- [ ] The job installs dependencies (pnpm) and Playwright's browser binaries, then runs the e2e suite's test script — which itself brings up the docker-compose stack via Playwright's `webServer`, per ticket 01. No separate manual compose step is added to the workflow.
- [ ] If the runner image doesn't have `docker compose` (v2) available out of the box, a setup step is added to provide it.
- [ ] A run of the workflow (e.g. via a test PR or `workflow_dispatch`) completes successfully, confirming the suite passes in CI, not just locally.
