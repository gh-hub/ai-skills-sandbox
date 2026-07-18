# like-count-stuck-loading-on-fetch-failure

## Finding
`apps/web/app/page.tsx`: on a `fetchCount()` failure, `count` stays `null` forever, so the UI shows the new error banner *and* the like-count text stuck on "loading…" simultaneously, with no retry path. Cosmetic/UX rough edge, not a functional bug. (Spec)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-2
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-18
