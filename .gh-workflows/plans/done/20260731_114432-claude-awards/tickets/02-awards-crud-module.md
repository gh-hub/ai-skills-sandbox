# 02 — Awards backend CRUD module

**What to build:** Full REST CRUD for awards at `apps/api/src/apps/awards/`, mirroring the `apps/api/src/apps/likes/` module structure (module/controller/service/repository/dto split). Endpoints: `GET /awards` (list all, unpaginated, each item includes `givenCount` = count of referencing `like_awards` rows), `GET /awards/:id` (same shape), `POST /awards` (creates an award; title/description required non-empty strings, icon optional; requires a logged-in user — see guard below; returns created award with `givenCount: 0`), `PATCH /awards/:id` (partial update of title/description/icon; open, no auth), `DELETE /awards/:id` (deletes the award, cascade handles join cleanup; open, no auth; returns 204). This also introduces a new mandatory-auth guard (e.g. `apps/api/src/apps/auth/require-auth.guard.ts`) that reads `request.user` (already populated by the existing global, non-blocking `CurrentUserGuard`) and throws `UnauthorizedException` (401) if null, otherwise allows the request — applied only via `@UseGuards(...)` at the method level on `POST /awards`, not globally and not on any other route.

**Blocked by:** 01 — Schema & seed data

**Status:** done

- [x] `apps/api/src/apps/awards/awards.module.ts` registered in `AppModule`
- [x] `GET /awards` returns all awards with `givenCount` per award
- [x] `GET /awards/:id` returns a single award with `givenCount` (404 via `ParseUUIDPipe`/`NotFoundException` for a missing/malformed id — not explicitly required by the ticket but matches the general error-handling rule for user-input boundaries)
- [x] `POST /awards` returns 401 when no logged-in user, 201 with the created award (givenCount 0) when logged in
- [x] `PATCH /awards/:id` updates fields without requiring login (also 404s for an unknown id, same reasoning as above)
- [x] `DELETE /awards/:id` deletes without requiring login and returns 204 (also 404s for an unknown id)
- [x] New `require-auth.guard.ts` is applied only to `POST /awards`, no other endpoint's auth behavior changes
- [x] Unit tests `awards.service.spec.ts` and `awards.repository.spec.ts` mirroring the mocked style of `likes.service.spec.ts`/`likes.repository.spec.ts`
- [x] Integration test `awards.spec.ts` mirroring the Testcontainers + Supertest pattern of `likes.spec.ts`, covering full CRUD round-trip, `givenCount` correctness, and the 401/201 auth split on POST

**Implementation notes:**
- Added `Award`/`CreateAwardRequest`/`UpdateAwardRequest` types to `packages/shared-types/src/index.ts` (rebuilt via `pnpm --filter @thanks-claude/shared-types build`) to mirror how `likes` DTOs implement shared types.
- `givenCount` is computed with a `leftJoin` + `count(likeAwards.id)` + `groupBy(awards.id)` in `awards.repository.ts`, reused for both the list and single-item queries via a private `awardWithCountColumns()` helper.
- `PATCH`/`DELETE` reuse the same `NotFoundException` pattern as `getById`; `update()` calls `getById()` internally after a successful `updateAward()` to return a fresh row with a current `givenCount` rather than duplicating the join query.
- `RequireAuthGuard` (`apps/api/src/apps/auth/require-auth.guard.ts`) has no constructor dependencies — it only reads `request.user`, already populated by the existing global `CurrentUserGuard`. Applied via `@UseGuards(RequireAuthGuard)` at the method level only on `AwardsController.create`.
- `apps/api/src/apps/awards/awards.util.ts` holds the pure `toAwardDto()` row-to-`Award`-shape mapping (per `nestjs-service-style`: pure transformations belong in a `{base}.util.ts`, not inline in the service).
