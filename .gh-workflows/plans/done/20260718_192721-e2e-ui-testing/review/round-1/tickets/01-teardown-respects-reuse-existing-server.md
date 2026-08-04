# 01 — Teardown respects `reuseExistingServer`

**What to build:** `apps/e2e/global-teardown.ts` only runs `docker compose down` when Playwright's `webServer` actually started the stack itself — not when it reused an already-running one (`reuseExistingServer: !process.env.CI`, `apps/e2e/playwright.config.ts`). Currently teardown unconditionally tears the stack down every run, which defeats local fast-iteration: the first local `pnpm test` kills the stack it just reused/started, leaving nothing running to reuse on the next invocation.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] Local runs where a stack is already up before `pnpm test` starts (`docker compose up -d` run manually beforehand) leave that stack running after the suite finishes.
- [ ] CI runs (`process.env.CI` set) still tear the stack down after the suite finishes, matching the "CI always starts clean" decision.
- [ ] A local run where no stack was already running (Playwright's `webServer` starts it fresh) still tears it down afterward — teardown shouldn't leak containers in that case either.
- [ ] No change to `playwright.config.ts`'s `reuseExistingServer: !process.env.CI` setting itself — only teardown's behavior changes.
