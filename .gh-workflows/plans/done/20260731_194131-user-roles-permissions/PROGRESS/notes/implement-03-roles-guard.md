# Implement notes: 03 — RolesGuard + award-route guarding

## What was built

- `apps/api/src/apps/auth/roles.decorator.ts`: new `Roles(...role: string[])` — a thin `SetMetadata(ROLES_METADATA_KEY, role)` wrapper, living alongside `require-auth.guard.ts` as instructed. `ROLES_METADATA_KEY` is exported for the guard to read.
- `apps/api/src/apps/auth/roles.guard.ts`: new `RolesGuard` (`CanActivate`, injects `Reflector`). Reads the `@Roles(...)` metadata off `context.getHandler()`:
  - no metadata (or empty array) → allow.
  - metadata present but `request.user` is falsy → `UnauthorizedException` (401).
  - `request.user` present but `request.user.roles` doesn't intersect the required list → `ForbiddenException` (403).
  - otherwise → allow.
  - Fully subsumes `RequireAuthGuard` — reads `request.user.roles` directly (already populated by the global `CurrentUserGuard` per ticket 02's `AuthUser` shape), no extra DB lookup.
- `apps/api/src/apps/awards/awards.controller.ts`: `create` now uses `@UseGuards(RolesGuard)` + `@Roles("ADMIN", "OPERATOR")` (replacing the old bare `@UseGuards(RequireAuthGuard)`); `update` and `remove` got the same guard+decorator pair newly added (previously totally unguarded). `getAll`/`getById` untouched.
- `apps/api/src/apps/auth/require-auth.guard.ts` was left in place but is now unused anywhere in the app (no other route referenced it). Not deleted — deletion wasn't asked for by the ticket and felt like scope creep; flagging here in case a later cleanup pass wants to remove it.

## API contract change (relevant to ticket 04 — frontend gating)

- `POST /awards`, `PATCH /awards/:id`, `DELETE /awards/:id` now return:
  - `401` if there is no logged-in user (no/invalid session cookie).
  - `403` if logged in but the user's `roles` (from the session JWT) don't include `ADMIN` or `OPERATOR`.
  - Success (`201`/`200`/`204`) otherwise, unchanged from before.
- `GET /awards` and `GET /awards/:id` are completely unchanged (no auth/role requirement).
- The frontend (ticket 04+) should gate showing create/edit/delete UI on `useMe()`'s `roles` including `ADMIN` or `OPERATOR` — the backend now enforces this regardless of what the UI shows, so the UI gating is purely UX, not a security boundary that needs duplicating carefully, but it should still match this exact role set (`ADMIN`/`OPERATOR`) to avoid a confusing "button visible but 403s" experience.

## Still true from ticket 02 — not yet resolved

- `apps/web/lib/api-client/schema.d.ts` (OpenAPI-generated) is still stale relative to the backend: it doesn't yet include `roles` on `AuthUserDto`. Nothing changed here in ticket 03 (no frontend work in this ticket's scope). **Ticket 04 needs to run `pnpm --filter web generate:api-types` before reading `.roles` off `useMe()`'s typed result** — this was flagged in ticket 02's notes and remains outstanding.

## Tests changed

`apps/api/src/apps/awards/awards.spec.ts`:
- Added `grantRole`, `signupUser`, `loginAs`, `signupWithRole` helpers (closures inside the `describe` block, using the suite's existing live `db` client and `app`). Roles ride in the session JWT and are only refreshed at login, so granting a role via `db.insert(userRoles).values(...)` always requires a subsequent `/auth/login` call to pick it up in a fresh cookie — signing up and granting a role to an already-issued cookie does nothing.
- `beforeAll`'s base user ("Ada Lovelace") is now granted `ADMIN` via direct `db.insert(userRoles)` and then logged back in so `sessionCookie` carries the role — this keeps every pre-existing fixture-creation call (`GET /awards` tests, the cascade-cleanup test, etc.) working unchanged since they all create awards via `sessionCookie`.
- `POST /awards`: added "returns 403 when logged in with no role" and "returns 201 ... when logged in as OPERATOR"; renamed the existing success case to "... when logged in as ADMIN" for clarity. 401 case unchanged.
- `PATCH /awards/:id`: replaced "updates fields without requiring a logged-in user" with four cases — 401 (logged out), 403 (no role), success as ADMIN, success as OPERATOR. The existing 404 test needed an authorized cookie added (it previously sent no cookie at all, which would now 401 before ever reaching the "does it exist" check).
- `DELETE /awards/:id`: same treatment — replaced "deletes without requiring a logged-in user" with 401/403/ADMIN-success/OPERATOR-success cases; the 404 test and the like_awards-cascade test both needed an authorized cookie added to their `DELETE` calls for the same reason as PATCH's 404 test.
- `apps/api/src/apps/likes/likes.spec.ts`: this suite's own `attaching awards` → `createAward` helper creates a fresh user and uses its session cookie to `POST /awards` as a fixture-setup step — this started failing (403) once the guard was applied. Fixed by capturing the module's `DbClient` (previously only `appPool` was kept) and having `createAward` grant `ADMIN` + re-login before creating the award, mirroring the `awards.spec.ts` pattern. This wasn't itself part of ticket 03's stated scope but was a direct, unavoidable consequence of guarding `POST /awards` — flagging it here rather than silently fixing it with no trace.

## Verification run

- `tsc --noEmit` on `apps/api`: clean.
- `tsc --noEmit` on `apps/web`: clean (no frontend files touched this ticket).
- `pnpm --filter @thanks-claude/api test` (via `pnpm exec jest` in `apps/api`, testcontainers/Docker): 10 suites, 117 tests, all passing.

## Acceptance criteria check (from tickets/03-roles-guard.md)

All criteria met, no partials:
- [x] `@Roles(...role: string[])` decorator, `SetMetadata`-based, alongside `require-auth.guard.ts`.
- [x] `RolesGuard` behavior exactly as specified (no metadata → allow; no user → 401; user without matching role → 403; otherwise allow).
- [x] `RolesGuard` fully subsumes `RequireAuthGuard` — no route uses both.
- [x] `AwardsController.create` guarded with `RolesGuard` + `@Roles("ADMIN", "OPERATOR")`, replacing the old `RequireAuthGuard`.
- [x] `AwardsController.update`/`remove` newly guarded the same way.
- [x] `getAll`/`getById` unchanged, no guard.
- [x] `awards.spec.ts` POST/PATCH/DELETE describe blocks cover the full 401/403/success(ADMIN or OPERATOR) matrix, replacing the old "no login required" PATCH/DELETE tests.
- [x] Role granted via direct `db.insert(userRoles).values(...)` on the suite's existing live `db` client — no new test infrastructure.

## Gotchas / judgment calls for future sessions

- Roles are only picked up by a session JWT at the moment it's issued (login/signup) — granting a role in the DB after a cookie already exists has zero effect on that cookie. Any test (or future manual/API flow) that needs a role-bearing session must grant the role *before* the login/signup call that mints the cookie it will use, or must re-login afterward.
- `RequireAuthGuard` (`apps/api/src/apps/auth/require-auth.guard.ts`) is now dead code — nothing references it. Left in place since deleting it wasn't asked for; a future cleanup ticket/PR could remove it along with any now-irrelevant history.
