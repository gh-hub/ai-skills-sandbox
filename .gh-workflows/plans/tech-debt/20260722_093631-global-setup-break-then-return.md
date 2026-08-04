# global-setup-break-then-return

## Finding
`apps/e2e/global-setup.ts`'s retry loop does `break` on success and falls through to the new `return async () => {...}` rather than an early `return` — functionally correct, slightly less obvious control flow.

## Source
- Plan: .gh-workflows/plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Spec
- Logged: 2026-07-22
- Moved: 2026-07-22
