# e2e-like-count-parsing-duplicated

## Finding
Like-count parsing `Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1])` is duplicated 3x across `apps/e2e/tests/like-flow.spec.ts` and `apps/e2e/tests/story-form-flow.spec.ts` — extract a `getLikeCount(page)` helper if a 4th usage appears. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19
