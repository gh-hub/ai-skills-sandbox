# duplicated-loading-error-ladder

## Finding
`StatsBand` and `StoryFeed` repeat an almost-identical `isError` → `isLoading` → `empty` → `data` conditional ladder; only two call sites so far, revisit extraction if a third async section appears.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25
