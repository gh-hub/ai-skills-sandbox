# likes-controller-getpage-complexity

## Finding
`apps/api/src/likes/likes.controller.ts`'s `getPage` (filter + two DB round-trips + inline mapping) is the controller's most complex method — visibility flag for a future `LikesService` extraction if it grows further; consistent with existing no-service-layer convention, not a regression.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-2
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25
