# e2e-teardown-env-var-global-state

## Finding
`apps/e2e/playwright.config.ts` sets `E2E_STACK_WAS_ALREADY_RUNNING` as a top-level module side effect, read later by `apps/e2e/global-teardown.ts` in a separate invocation — an implicit, order-dependent global-state channel rather than an explicit passed value. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19
