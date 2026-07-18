# app-controller-db-bypasses-di

## Finding
`apps/api/src/app.controller.ts` also imports the `db` singleton directly (same DI-bypass smell logged for `likes.controller.ts` in round 1) — a second location that would need touching if this is ever remediated. (Standards)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
