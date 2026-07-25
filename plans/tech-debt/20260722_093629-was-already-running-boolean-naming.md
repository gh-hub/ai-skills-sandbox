# was-already-running-boolean-naming

## Finding
`apps/e2e/playwright.config.ts`'s `wasAlreadyRunning` constant doesn't follow the boolean naming rule (should start with `is`/`has`/`can`, e.g. `isStackReused`) — contrast with the compliant `isStackAlreadyRunning`. Cheap fix, cosmetic only.

## Source
- Plan: plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Standards
- Logged: 2026-07-22
- Moved: 2026-07-22
