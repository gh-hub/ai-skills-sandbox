# likes-error-console-duplicated

## Finding
`console.error(error)` before `throw new Error(...)` in `lib/api-client/likes.ts` is duplicated across both `useLikeCount` and `useSubmitLike` (no `{ cause }` attached in either) — the round-1 finding's fix cost has grown from one call site to two. (Standards)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
