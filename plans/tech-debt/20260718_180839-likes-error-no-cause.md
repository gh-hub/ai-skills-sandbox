# likes-error-no-cause

## Finding
`console.error(error)` in `lib/api-client/likes.ts` logs the real error but doesn't attach it to the thrown `Error` (no `{ cause }`), so the detail is only visible in console, not to callers further up the stack. (Standards)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
