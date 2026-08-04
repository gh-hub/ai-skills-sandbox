# 01 — Paginated story feed API

**What to build:** A `GET /likes` endpoint that returns a paginated, newest-first list of likes that have a non-empty story, so the web app has data to render a story feed.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `GET /likes?page={n}&limit={n}` exists on `LikesController` (default `page=1`, `limit=10`), alongside the existing `POST /likes` and `GET /likes/count` (unchanged).
- [ ] Only returns likes where `story` is non-null and non-empty; ordered by `createdAt` descending.
- [ ] Response shape: `{ items, total, page, limit, totalPages }`, where each item matches the existing `Like` shape (`id`, `createdAt`, `story`, `hoursSaved`).
- [ ] Requesting a page beyond `totalPages` returns an empty `items` array with correct `total`/`totalPages` (not an error).
- [ ] New DTO(s) added in `apps/api/src/likes/dto/`, following the existing `LikeDto`/`LikeCountDto` pattern.
- [ ] `packages/shared-types` gains the corresponding paginated-feed response type, shared between API and web.
- [ ] Integration tests added to `apps/api/src/likes/likes.spec.ts` (real Postgres via testcontainers + supertest) covering: story-only filtering, newest-first order, page/limit respected, correct total/totalPages, out-of-range page behavior.
