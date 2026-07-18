# drizzle-config-non-null-assertion

## Finding
`apps/api/drizzle.config.ts` uses `process.env.DATABASE_URL!` (non-null assertion) instead of a boundary check for a missing env var. (Standards)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
