# feed-cache-invalidation-only-page-one

## Finding
`apps/web/lib/api-client/likes.ts`'s like/story `onSuccess` only invalidates `likesFeedQueryKey(1)`, on the incorrect premise that "other pages don't shift" — since the feed is offset-based and newest-first, inserting a row shifts every later page's window by one, so a visitor viewing page 2+ at submission time sees stale data.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-2
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25
