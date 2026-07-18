# likes-spec-multiple-assertions

## Finding
`apps/api/src/likes/likes.spec.ts` "creates a like with no body fields" test combines a `toMatchObject` assertion with a separate `id` assertion rather than one assertion per test. (Standards)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
