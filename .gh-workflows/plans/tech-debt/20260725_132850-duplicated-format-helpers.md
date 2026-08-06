# duplicated-format-helpers

## Finding
`formatNumber`/`formatHours` logic is duplicated verbatim across `apps/web/components/stats-band.tsx`, `apps/web/components/story-feed.tsx`, and `apps/e2e/tests/stats-band.spec.ts` — extract to one shared formatting util.

## Source
- Plan: .gh-workflows/plans/done/20260725_105431-likes-feed-redesign/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25
