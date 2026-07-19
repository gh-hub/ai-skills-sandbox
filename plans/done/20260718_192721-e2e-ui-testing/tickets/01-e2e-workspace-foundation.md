# 01 — e2e workspace foundation

**What to build:** A new `apps/e2e` pnpm workspace package with a working `pnpm test` command. Running it brings up the real stack (web + api + postgres) via the existing `docker-compose.yml`, resets the `likes` table to empty once at the start of the suite run, waits for the web app to be reachable, runs the tests, and tears the stack down afterward. A single smoke test proves the wiring works end-to-end (the app's page loads and its title/heading is visible).

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/e2e` is registered in the pnpm workspace and has its own `package.json` (Playwright as a dependency, a `test` script) and `playwright.config.ts`.
- [ ] `playwright.config.ts`'s `webServer` option runs `docker compose up --build`, points `url`/base URL at the web app (port 8080), and uses `reuseExistingServer: !process.env.CI`.
- [ ] A one-time setup step (run once per suite invocation, not per test) truncates the `likes` table so every suite run starts from a known baseline. No changes are made to the API to support this (no new endpoint) — the mechanism is external (e.g. a direct `docker compose exec` DB command or script).
- [ ] Chromium is the only configured browser project.
- [ ] A smoke test loads the web app's root page and asserts the page's heading/title is visible, proving Playwright can reach the app through the compose stack.
- [ ] `pnpm test` (or equivalent, run from `apps/e2e`) succeeds locally end-to-end: stack up → reset → smoke test passes → stack down.
