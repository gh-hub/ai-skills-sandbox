# e2e-story-form-multi-assert

## Finding
`apps/e2e/tests/story-form-flow.spec.ts` both tests assert multiple things per test (form state + like count / error message + visibility + like count) — same "one assertion per test" judgment call as the dark-mode toggle test. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19
