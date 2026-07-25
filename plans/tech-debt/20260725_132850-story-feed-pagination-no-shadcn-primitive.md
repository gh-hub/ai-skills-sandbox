# story-feed-pagination-no-shadcn-primitive

## Finding
Spec says pagination controls should "use the shadcn/ui pattern already established in this repo," but no shadcn `Pagination` primitive exists anywhere in `apps/web/components/ui/` — `story-feed.tsx`'s `Pagination` is a hand-rolled loop of raw `Button`s, i.e. the one-off implementation the spec says to avoid. Spec's premise may be stale, or a shadcn pagination component should have been added first.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-1
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25
