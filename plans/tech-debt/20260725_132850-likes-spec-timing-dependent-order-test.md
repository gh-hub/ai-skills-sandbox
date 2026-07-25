# likes-spec-timing-dependent-order-test

## Finding
`apps/api/src/likes/likes.spec.ts`'s "orders likes by createdAt descending" test uses a real 10ms wall-clock `setTimeout` sleep between inserts to force ordering, instead of a deterministic mechanism (e.g. explicit `createdAt` values) — fragile, timing-dependent test.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-2
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25
