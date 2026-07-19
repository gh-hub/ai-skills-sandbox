# e2e-ci-check-duplicated

## Finding
`!process.env.CI` is checked twice in `apps/e2e/playwright.config.ts` — once gating the `isStackAlreadyRunning()` probe, once in `reuseExistingServer: !process.env.CI` — same "are we local" knowledge duplicated in two places. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19
