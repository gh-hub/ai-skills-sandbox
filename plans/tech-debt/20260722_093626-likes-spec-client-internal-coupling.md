# likes-spec-client-internal-coupling

## Finding
`apps/api/src/likes/likes.spec.ts` resolves its cleanup `Pool` via drizzle's internal `.$client` property, coupling the test to an implementation detail of the DB client wrapper (no cleaner accessor exists today).

## Source
- Plan: plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Standards
- Logged: 2026-07-22
- Moved: 2026-07-22
