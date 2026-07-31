# 03 — Attach awards to a thanks story (backend)

**What to build:** `POST /likes` gains an optional `awardIds: string[]` field. `CreateLikeDto` validates it as an optional array of UUID strings. `LikesService.create` wraps the like insert and the join-row inserts (`like_awards`) in a single DB transaction — if any `awardId` doesn't correspond to an existing award, the whole submission fails with 400 and no `likes` row is created. `LikeDto` (used by both the create response and every feed item) gains an `awards` field: array of `{ id, title, icon }` for every award attached to that story. `LikesRepository`'s feed query (`getStoryPage`) fetches the page as today, then runs one additional query joining `like_awards` -> `awards` for just the like IDs on that page, grouping results in application code (no SQL-level JSON aggregation). Shared types in `packages/shared-types/src/index.ts`: new `Award` type `{ id, createdAt, title, description, icon: string | null, givenCount: number }`, new `CreateAwardRequest` type `{ title: string; description: string; icon?: string }`, new `AwardSummary` type `{ id, title, icon: string | null }`, `CreateLikeRequest` gains `awardIds?: string[]`, `Like` (and `LikeFeedItem`) gains `awards: AwardSummary[]`.

**Blocked by:** 01 — Schema & seed data, 02 — Awards backend CRUD module

**Status:** done

- [x] `POST /likes` accepts an optional `awardIds: string[]` and attaches those awards to the created like
- [x] Submitting an unknown `awardId` fails the whole request with 400 and creates no `likes` row
- [x] Omitting `awardIds` (or sending `[]`) behaves exactly as before this ticket
- [x] The create response and every feed item include an `awards: [{ id, title, icon }]` array reflecting attached awards
- [x] `packages/shared-types/src/index.ts` updated with `Award`, `CreateAwardRequest`, `AwardSummary`, and the `CreateLikeRequest`/`Like` additions described above
- [x] Integration test additions to `likes.spec.ts` (or a sibling describe block) covering: attaching one award, attaching multiple awards, an unknown awardId failing the whole request, and omitted/empty awardIds behaving as before

## Implementation notes

- `Award` and `CreateAwardRequest` were already added to `packages/shared-types/src/index.ts` in
  ticket 02; this ticket added `AwardSummary` and the `CreateLikeRequest.awardIds` /
  `Like.awards` fields on top of that, then rebuilt the package
  (`pnpm --filter @thanks-claude/shared-types build`).
- `LikesRepository.insertLike` was replaced with `insertLikeWithAwards(values, awardIds)`,
  which runs entirely inside one `this.db.transaction(...)`: with no `awardIds` it's a plain
  insert; with `awardIds`, it first looks up matching `awards` rows by id *inside the same
  transaction*, and if any id doesn't match it returns `{ success: false, missingAwardIds }`
  and returns early — no `likes` or `like_awards` row is ever inserted for that path. On
  success it inserts the `likes` row, then one `like_awards` row per award, and returns
  `{ success: true, like, awards }` (the `awards` being the already-fetched
  `{id, title, icon}` rows, reused directly for the response instead of an extra query).
  `LikesService.create` throws `BadRequestException` when `success` is false — the only
  place in this flow that touches a NestJS HTTP exception, keeping the repository free of
  framework-level error types, consistent with `AwardsService`'s existing pattern of
  throwing in the service layer, not the repository.
- Feed reads stayed as specified: `LikesRepository.getStoryPage` is unchanged (still just
  reads `likes` + attributed user name), and a new `getAwardsForLikeIds(likeIds)` runs one
  extra `like_awards` `innerJoin` `awards` query for exactly the like ids on that page.
  `LikesService.getPage` groups those rows into a `Map<likeId, AwardSummary[]>` via a new
  pure `groupAwardsByLikeId` helper in `apps/likes/likes-awards.util.ts` (in application
  code, no SQL `json_agg`/`array_agg`), then attaches `awards: awardsByLikeId.get(row.id) ?? []`
  to each feed item.
- Added `AwardSummaryDto` in `apps/awards/dto/award-summary.dto.ts` (implements the new
  `AwardSummary` shared type) rather than duplicating an `{id, title, icon}` DTO inside the
  `likes` module — `LikeDto` (`apps/likes/dto/like.dto.ts`) imports it directly. This is a
  type-only/DTO-class import across module folders (no `AwardsModule`/`AwardsRepository`
  DI import into `LikesModule`); `likes.repository.ts` also imports the `awards` and
  `likeAwards` Drizzle schema tables directly for its own queries, mirroring how
  `awards.repository.ts` already imports `likeAwards` — cross-module schema-table imports
  are the established pattern here, not cross-module service injection.
- `CreateLikeDto.awardIds` is validated as `@IsOptional() @IsArray() @IsUUID("4", { each: true })`.
- Known, accepted race condition: the "does this awardId exist" check and the `likes`/
  `like_awards` inserts happen in the same transaction, so a concurrent delete of an award
  between the lookup and the insert (impossible today — there is no way to delete an award
  through the UI, and `DELETE /awards/:id` isn't wired to any client) would only be caught
  by the join table's `onDelete: cascade` FK, not by a 400. Not worth guarding against given
  there's no concurrent-admin-deletes-awards scenario in this app; noted here rather than
  adding speculative locking.
- Full backend suite: 10 suites / 101 tests pass (`pnpm --filter @thanks-claude/api test`,
  Testcontainers Postgres via Docker); `nest build` and `tsc --noEmit` both clean.
