# api-db-bypasses-di-likes-controller

## Finding
`apps/api/src/likes/likes.controller.ts` imports the `db` singleton directly from `../db/client` instead of via DI — Shotgun Surgery risk once a second module needs the DB. (Standards)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
