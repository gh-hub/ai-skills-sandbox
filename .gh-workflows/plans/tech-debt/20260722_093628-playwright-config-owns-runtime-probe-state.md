# playwright-config-owns-runtime-probe-state

## Finding
`apps/e2e/playwright.config.ts` exports `wasAlreadyRunning`, consumed by `global-setup.ts` — a config module now holds runtime probe state used elsewhere (Middle-Man/layering smell), justified by Playwright's webServer-before-globalSetup ordering constraint but worth a real shared module if this dependency direction grows.

## Source
- Plan: .gh-workflows/plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Standards
- Logged: 2026-07-22
- Moved: 2026-07-22
