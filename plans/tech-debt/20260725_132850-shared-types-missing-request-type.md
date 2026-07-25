# shared-types-missing-request-type

## Finding
Spec says `packages/shared-types` gains "the corresponding request/response types" for the new endpoints, but only response types (`LikesPage`, `LikesStats`) were added — no request type mirrors `GetLikesQueryDto` for `GET /likes?page=&limit=`, unlike the existing `CreateLikeRequest` precedent.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-1
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25
