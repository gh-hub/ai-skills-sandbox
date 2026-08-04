# Spec: User Roles & Permissions

## Problem Statement

Every logged-in user can currently create awards, and nobody can edit or delete them from the UI — even though the backend already exposes `PATCH /awards/:id` and `DELETE /awards/:id` with no guard at all. The app has no concept of privilege: a user is just a user, logged in or not. This leaves a real gap (unguarded mutation routes reachable by anyone who can construct the request) and blocks a legitimate need (some users should be able to manage awards; most should only view them).

## Solution

Introduce two roles, `ADMIN` and `OPERATOR`, modeled as a Postgres enum and attached to a user via a new `user_roles` join table (a user may hold zero, one, or both). Roles are baked into the session JWT at login/signup time so both backend guards and frontend rendering can check them without an extra database round trip per request.

- **Backend**: a new `RolesGuard` + `@Roles(...)` decorator, applied route-by-route (matching the existing `RequireAuthGuard` convention), guard `POST /awards`, `PATCH /awards/:id`, and `DELETE /awards/:id` — 401 if not logged in, 403 if logged in without `ADMIN` or `OPERATOR`. `GET /awards` and `GET /awards/:id` stay open.
- **Frontend**: the create-award form and new per-row edit/delete icons on `/awards` are fully hidden unless the current user is logged in and holds `ADMIN` or `OPERATOR`. Edit opens a pre-filled modal with an extra confirm step before saving; delete opens a confirm modal before deleting. The awards page gets a back-to-home link, and the header shows small role badges next to a logged-in user's name.
- Role assignment itself has no UI or endpoint — it's a direct-database operation, out of scope for this feature.

See `grill/ADR-001.md` for the full architectural rationale on the data model, JWT claim, and guard pattern.

## User Stories

**Data model**

1. As a system, I want a new Postgres enum type (`role`, values `ADMIN`/`OPERATOR`) defined via drizzle's `pgEnum`, so that `user_roles.role` is constrained to a fixed, typed set of values rather than free text.
2. As a system, I want a new `user_roles` table (`id`, `user_id` FK → `users.id`, `role` enum) with a unique constraint on `(user_id, role)`, so that a user can hold more than one role but never a duplicate row for the same role.
3. As a system, I want `user_roles.user_id` to cascade-delete when the referenced user is deleted, so that a deleted user doesn't leave orphaned role rows (matching the `onDelete: "cascade"` convention already used by `like_awards`' foreign keys).
4. As a developer, I want the new migration (`0004_*`) to only add the enum type and the table — no seed data — so that every user starts with zero roles by default, matching "new signups start with no roles."

**JWT / session**

5. As the auth system, I want `SessionTokenPayload` to gain a `roles: string[]` claim populated from the user's `user_roles` rows at signup/login time, so that a role check never needs a database lookup once a request is authenticated.
6. As the auth system, I want `verifySessionToken()` to pass the `roles` claim through unchanged (defaulting to `[]` when the claim is absent), so that JWTs issued before this feature ships keep working without a forced logout.
7. As the shared type layer, I want `AuthUser` (and therefore `MeResponse` / `GET /auth/me`'s response) to gain `roles: string[]`, so that the frontend can read a logged-in user's roles from the same `useMe()` call it already makes, with no new endpoint.
8. As a returning user with a pre-feature session cookie, I want my session to keep working and to be treated as having no roles, so that I'm not unexpectedly logged out when this ships, but also don't get privileges I was never granted.

**Backend authorization**

9. As an API consumer, I want a new `@Roles(...)` route decorator and a matching `RolesGuard` that composes with authentication (401 if `request.user` is absent, 403 if authenticated but missing every listed role), so that role-gating any future route is a two-line, consistent change.
10. As an ADMIN or OPERATOR, I want `POST /awards` to accept my request (replacing its current bare `RequireAuthGuard` with `RolesGuard` + `@Roles('ADMIN', 'OPERATOR')`), so that award creation keeps working for privileged users exactly as it does today.
11. As a logged-in user without `ADMIN` or `OPERATOR`, I want `POST /awards` to reject my request with `403 Forbidden`, so that only privileged users can create awards going forward.
12. As a logged-out visitor, I want `POST /awards` to reject my request with `401 Unauthorized` (unchanged from today), so that anonymous mutation attempts are still blocked at the authentication layer first.
13. As an ADMIN or OPERATOR, I want `PATCH /awards/:id` to require my role (newly guarded — previously wide open), so that only privileged users can edit an award's title/description/icon.
14. As an ADMIN or OPERATOR, I want `DELETE /awards/:id` to require my role (newly guarded — previously wide open), so that only privileged users can delete an award.
15. As any visitor (logged in or not), I want `GET /awards` and `GET /awards/:id` to remain completely unguarded, so that the read-only browsing experience is unaffected by this feature.

**Frontend gating**

16. As a logged-out visitor, I want the awards page to look exactly as it does today (read-only list, login prompt where the create form would be), so that this feature introduces no regression for anonymous users.
17. As a logged-in user without `ADMIN` or `OPERATOR`, I want the create-award section to render nothing (not the login prompt, not the form), so that I'm not shown UI for an action I can't perform, and I'm not confusingly told to "log in" when I already am.
18. As an ADMIN or OPERATOR, I want to keep seeing the create-award form exactly as before, so that this feature doesn't regress the existing privileged experience.
19. As an ADMIN or OPERATOR, I want to see an edit icon and a delete icon on every award row in the awards list, so that I can manage existing awards without leaving the page.
20. As a logged-out visitor or a logged-in user without a role, I want the edit and delete icons to not render at all on award rows, so that the UI never advertises actions I'm not allowed to take.

**Edit flow**

21. As an ADMIN or OPERATOR, I want clicking an award's edit icon to open a modal pre-filled with that award's current title, description, and icon, so that I can make a targeted change without retyping everything.
22. As an ADMIN or OPERATOR, I want the edit modal's fields and validation to match the create form's (title required, description required, icon optional), so that editing feels consistent with creating.
23. As an ADMIN or OPERATOR, I want submitting the edit form to show a second "are you sure you want to save these changes?" confirmation step before the update is actually persisted, so that I get a deliberate extra check beyond the normal submit before an existing award is changed.
24. As an ADMIN or OPERATOR, I want confirming the edit to call `PATCH /awards/:id` and, on success, close the modal and refresh the awards list without a page reload, so that my change is reflected immediately.
25. As an ADMIN or OPERATOR, I want to be able to back out of the edit modal (cancel, or dismiss the confirmation step) without saving, so that starting an edit doesn't commit me to finishing it.

**Delete flow**

26. As an ADMIN or OPERATOR, I want clicking an award's delete icon to open a confirmation modal ("are you sure you want to delete this award?") before anything happens, so that a misclick doesn't destroy data.
27. As an ADMIN or OPERATOR, I want confirming the delete to call `DELETE /awards/:id` and, on success, remove the award from the list without a page reload, so that the result is immediately visible.
28. As an ADMIN or OPERATOR, I want to be able to cancel out of the delete confirmation modal without deleting anything, so that opening it by mistake is harmless.

**Navigation**

29. As any visitor on `/awards`, I want a "← Back" link above the "Awards" heading that goes to the home page, so that I have a direct way back without relying on the header's forward-only "Awards" link.

**Role visibility**

30. As a logged-in user, I want my roles (if any) shown as small badges next to my name/avatar in the header, so that I can see at a glance what I'm able to do without having to test it by trying an action.
31. As a logged-in user with no roles, I want the header to show just my avatar/name as it does today (no empty or placeholder badge), so that the badge-less experience is unchanged for the common case (a plain user).
32. As a logged-out visitor, I want the header to show the existing login control, unaffected by this feature.

## Implementation Decisions

**Schema / migration**
- New `role` Postgres enum (drizzle `pgEnum`) with values `ADMIN` and `OPERATOR`, defined in `apps/api/src/db/schema.ts` alongside the existing table definitions.
- New `user_roles` table: `id` (uuid PK, default random), `user_id` (uuid, FK → `users.id`, `onDelete: "cascade"`, not null), `role` (the new enum, not null), unique constraint on `(user_id, role)`. No `created_at` is required by the requirements, but it's consistent with every other table in this schema to include one for auditability; include it as `timestamp with time zone` defaulting to `now()`, not null.
- New drizzle migration `0004_*` (auto-generated via the project's usual `drizzle-kit generate` flow) creates the enum type and the table and adds the FK + unique constraints — no data migration or seeding, since every existing and new user starts with zero rows (no roles) by default. This migration becomes the reference example for any future enum-typed column, the same way `0003_nice_sir_ram.sql` is the reference for a join table.
- No changes to the `users`, `awards`, `likes`, or `like_awards` tables.

**Roles lookup**
- Add a method to look up a user's roles (list of role-enum strings) by `user_id`, querying `user_roles`. Following the existing convention where a join table used only in service of another entity (`like_awards`, queried directly inside `AwardsRepository` with no repository of its own) is not given a dedicated repository, `user_roles` is queried directly from `UsersRepository` (it's fundamentally a property of a user, the same way `like_awards` is a property of an award's count) rather than introducing a new `RolesRepository`.

**JWT / session (`apps/api/src/apps/auth/auth.service.ts`)**
- `SessionTokenPayload` gains `roles: string[]`.
- `buildSession()` looks up the user's roles (via the new `UsersRepository` method) and includes them in both the signed JWT payload and the returned `AuthUser`. Since `buildSession()` is called from `signup()` and `login()` (already async), making the roles lookup async fits without changing the public shape of either method.
- `verifySessionToken()` reads `payload.roles` and defaults to `[]` when the claim is `undefined` (covers JWTs issued before this feature), rather than treating a missing claim as a verification failure.
- No change to `SESSION_MAX_AGE_MS`/expiry or to the cookie itself — roles simply ride inside the existing signed payload.

**Shared types (`packages/shared-types/src/index.ts`)**
- `AuthUser` gains `roles: string[]`. This flows automatically into `MeResponse` (`{ user: AuthUser | null }`), so `GET /auth/me` needs no separate contract change beyond the `AuthUserDto` (`apps/api/src/apps/auth/dto/auth-user.dto.ts`) also declaring `roles: string[]` to keep implementing `AuthUser` and to appear correctly in the generated OpenAPI schema the frontend's typed API client consumes.

**Backend guard (new, in `apps/api/src/apps/auth/`, alongside `require-auth.guard.ts`)**
- `@Roles(...role: string[])` — a method decorator (standard Nest `SetMetadata`-based pattern) attaching the list of acceptable roles to route handler metadata.
- `RolesGuard` — a `CanActivate` using `Reflector` to read the `@Roles(...)` metadata off the handler: no roles required → allow; `request.user` absent → throw `UnauthorizedException` (401); `request.user` present but its `roles` doesn't intersect the required list → throw `ForbiddenException` (403); otherwise allow. It fully subsumes `RequireAuthGuard`'s job (no need to also apply `RequireAuthGuard` on a route that uses `RolesGuard`).
- Applied via `@UseGuards(RolesGuard)` + `@Roles('ADMIN', 'OPERATOR')` on `AwardsController`'s `create` (replacing its current bare `@UseGuards(RequireAuthGuard)`), `update`, and `remove` handlers. `getAll`/`getById` are untouched.

**Frontend API client (`apps/web/lib/api-client/awards.ts`)**
- Add `useUpdateAward()`: a mutation calling `PATCH /awards/:id` with a partial body (title/description/icon), invalidating `awardsQueryKey` on success — mirrors `useCreateAward()`'s shape.
- Add `useDeleteAward()`: a mutation calling `DELETE /awards/:id` by id, invalidating `awardsQueryKey` on success.
- `useMe()` (`apps/web/lib/api-client/auth.ts`) needs no changes — it already returns whatever `AuthUserDto` contains, which now includes `roles`.

**Frontend gating condition**
- Define a single shared helper/condition for "can manage awards" = `me.data != null && (me.data.roles.includes('ADMIN') || me.data.roles.includes('OPERATOR'))`, used consistently in `create-award-section.tsx` and `awards-list.tsx` so the two surfaces can't drift out of sync.
- `create-award-section.tsx`: three-way branch — loading → `null`; logged out (`me.data === null`) → `LoginPrompt` (unchanged); logged in without a qualifying role → `null` (fully hidden, distinct from the logged-out `LoginPrompt` case since re-showing a login prompt to an already-logged-in user would be confusing); logged in with a qualifying role → `CreateAwardForm` (unchanged).
- `awards-list.tsx`: becomes aware of `useMe()`. Each award row conditionally renders an edit icon/button and a delete icon/button only when the gating condition is true; otherwise the row renders exactly as it does today (icon, title, description, given-count, nothing else).

**Edit flow**
- New edit modal component, opened per-row, reusing the create form's field set (title required, description required, icon optional) pre-filled from the award being edited.
- Submitting the (validated) form does not immediately call `useUpdateAward()` — it transitions the modal into a second "are you sure you want to save these changes?" confirmation step. Only confirming that step triggers the actual `PATCH` call. Canceling either the form or the confirmation step closes the modal with no request sent.
- On successful update, close the modal; the list re-renders from the invalidated `awardsQueryKey` query (no manual state patching needed, matching the existing create-flow pattern of invalidate-and-refetch).

**Delete flow**
- New delete confirmation modal component, opened per-row, showing the award's title and a single confirm/cancel choice. Confirming calls `useDeleteAward()`; on success the modal closes and the list re-renders from the invalidated query. Canceling closes the modal with no request sent.

**Awards page (`apps/web/app/awards/page.tsx`)**
- Add a "← Back" link (Next.js `Link` to `/`) above the `<h1>Awards</h1>` heading.

**Header (`apps/web/components/header-auth-control.tsx`)**
- When logged in, render a small badge per role in `me.data.roles`, positioned next to `UserAvatar`/name, using the same pill visual convention already established by `AwardBadge` (rounded-full, bordered, small text) but without an icon — just the role name (e.g. "ADMIN"). No roles → no badges, exactly today's layout.

**API contracts summary**
| Route | Guard before | Guard after |
|---|---|---|
| `GET /awards` | none | none (unchanged) |
| `GET /awards/:id` | none | none (unchanged) |
| `POST /awards` | `RequireAuthGuard` (401 only) | `RolesGuard` + `@Roles('ADMIN','OPERATOR')` (401 or 403) |
| `PATCH /awards/:id` | none | `RolesGuard` + `@Roles('ADMIN','OPERATOR')` (401 or 403) |
| `DELETE /awards/:id` | none | `RolesGuard` + `@Roles('ADMIN','OPERATOR')` (401 or 403) |
| `GET /auth/me` | none | none — response shape gains `user.roles: string[]` |

## Testing Decisions

- This codebase's established seam for award/auth behavior is a full HTTP integration test per module (`apps/api/src/apps/awards/awards.spec.ts`, `apps/api/src/apps/auth/auth.spec.ts`): a real `INestApplication` built from `AppModule`, a real ephemeral Postgres via `testcontainers`, migrations run for real, and `supertest` driving actual HTTP requests — not mocks. This is the highest-level seam already in use and is the right place to prove role gating end-to-end (real guard, real JWT, real DB), so it should be extended rather than replaced with a new pattern.
- Extend `awards.spec.ts`'s `POST`/`PATCH`/`DELETE` describe blocks to cover the new role matrix: logged-out → 401 (already covered for `POST`, newly added for `PATCH`/`DELETE`); logged-in with no role → 403 (new, for all three); logged-in with `ADMIN` or `OPERATOR` → success (already covered for `POST`; newly added for `PATCH`/`DELETE`, replacing today's "updates/deletes without requiring a logged-in user" cases, which describe exactly the gap this feature closes). Since the test already has a live `db` client in scope, granting a role to a test-signed-up user is a direct `db.insert(userRoles).values(...)` before exercising the guarded route — no new test infrastructure needed.
- `auth.service.spec.ts` (unit-level, mocked repository/JWT) is the right seam for the pure logic of "stale JWT (no `roles` claim) verifies as `roles: []`" and "`buildSession` includes looked-up roles in both the token and the returned `AuthUser`" — these are unit-testable without a database.
- `RolesGuard`'s 401-vs-403 branching is pure, isolated logic (given a mock `ExecutionContext`/`Reflector`) and has no existing guard-level unit test precedent in this codebase (`RequireAuthGuard`/`CurrentUserGuard` currently have none) — cover its branches at the integration level (already required above) rather than introducing a new isolated-unit-test convention for guards; the integration tests already exercise every branch (401, 403, 200/201/204) end to end.
- Frontend has no unit/component test setup (no `*.test.*`/`*.spec.*` files under `apps/web`); UI behavior in this codebase is verified via Playwright e2e under `apps/e2e/tests`, which run against a real dockerized stack (`apps/e2e/global-setup.ts` resets state via `docker compose exec postgres psql`). Extend `apps/e2e/tests/awards-page.spec.ts` (and/or a new `roles.spec.ts` in the same directory) using that same direct-psql pattern to grant a role to a freshly-signed-up test user (insert into `user_roles` for that user's id, mirroring how `global-setup.ts` already shells out to `psql` for table resets), then assert: edit/delete icons appear only for that user; a plain (no-role) logged-in user sees neither the create form nor edit/delete icons; the edit flow's second confirmation step is required before a `PATCH` fires; the delete confirmation modal is required before a `DELETE` fires; the back link navigates home; role badges appear in the header for a privileged user and don't for a plain one.
- **Important existing-test impact**: `apps/e2e/tests/awards-page.spec.ts`'s "a logged-in user can create an award and sees it appear" test currently signs up a brand-new user and expects the create form to be visible immediately — that will break under this feature, since a fresh signup now has zero roles by default. That test needs to grant itself a role via the direct-psql pattern (same as above) before it can keep asserting the create form is visible, or be re-scoped to explicitly test the no-role case (form hidden) with a separate role-granted test covering the create flow.

## Out of Scope

- No role-management UI or API endpoint to assign/revoke roles — `user_roles` rows are managed purely via direct database writes.
- No forced session invalidation/logout for existing users when this ships.
- No new roles beyond `ADMIN` and `OPERATOR`, and no behavioral distinction between them in this feature (both grant identical award-management privileges).
- No changes to which routes are readable — `GET /awards` and `GET /awards/:id` remain open to everyone.
- No new page/route for award editing — it happens in a modal on the existing `/awards` page.
- No changes to `likes`/`like_awards` behavior, the stats/feed pages, or dark-mode toggle.
- No live/real-time re-check of roles mid-session — a role granted or revoked in the database takes effect only the next time the affected user's session token is reissued (next login or natural 7-day expiry), per ADR-001.

## Further Notes

- The exact visual placement/styling of the edit and delete icons on each award row (e.g. icon choice, hover affordance, inline vs. trailing) is left to implementation/ticket-level judgment — the grill output specifies behavior (icons present, gated, wired to the two modals) but not a pixel-level design, and this doesn't block ticket-writing.
- Whether the role badges in the header wrap to a second line for a user with both roles at small viewport widths is a minor responsive-design detail not covered by the grill output; default to allowing natural wrapping (`flex-wrap`) rather than truncation, consistent with `AwardBadgeList`'s existing `flex-wrap` usage elsewhere in the app.
- The migration filename (`0004_*`) will get its actual auto-generated slug from `drizzle-kit generate` at implementation time; `0004_*` here is a placeholder for "the next migration after 0003."
