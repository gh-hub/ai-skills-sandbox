# e2e-fullyparallel-workers-redundant

## Finding
`apps/e2e/playwright.config.ts` sets both `fullyParallel: true` and `workers: 1` — `workers: 1` already forces serial execution (needed for the shared, non-isolated DB), making `fullyParallel: true` dead/confusing config. (Spec)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-2
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-19
