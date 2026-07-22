# e2e-like-count-regex-still-duplicated

## Finding
`apps/e2e/tests/helpers.ts`'s `getLikeCount` fixes the duplicated parsing logic, but the locator regex `/\d+ likes/` itself is still duplicated across the two spec files and the helper (3 occurrences).

## Source
- Plan: plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Standards
- Logged: 2026-07-22
- Moved: 2026-07-22
