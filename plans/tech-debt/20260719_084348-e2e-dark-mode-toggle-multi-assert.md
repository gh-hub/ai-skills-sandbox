# e2e-dark-mode-toggle-multi-assert

## Finding
`apps/e2e/tests/dark-mode-toggle.spec.ts` asserts 3 things (initial state, post-toggle, post-reload) in one test — acceptable as a single user journey, but flagged against the "one assertion per test" rule. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19
