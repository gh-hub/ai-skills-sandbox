# Spec: Admin User Management

## Problem Statement

Admins have no way to see who's in the system or adjust their roles without going straight to the database. Every role grant, revoke, or new role today is a manual SQL statement — there's no UI, no API, and no way for an ADMIN to self-serve routine role bookkeeping (fixing a mis-assigned `OPERATOR`, spinning up a new custom role for an emerging use case, or just answering "who has what role?"). This also means the role set itself is frozen to whatever the `role` Postgres enum was defined with at migration time, so nothing but a schema migration can ever introduce a new role.

## Solution

An ADMIN-only `/admin` hub links to two sub-pages: `/admin/users` (a paginated, searchable list of every user and their current roles, with grant/revoke toggles) and `/admin/roles` (list, create, and delete roles). Both are backed by new REST endpoints gated with the existing `RolesGuard` + `@Roles('ADMIN')` pattern already proven on `AwardsController`. A header nav link to `/admin` appears only for logged-in ADMINs.

Under the hood, `role` moves from a fixed Postgres enum to a real `roles` table (id, name, `is_built_in`), because a Postgres enum can't represent admin-created data. `user_roles` swaps its enum column for a `role_id` foreign key. None of this is visible above the guard layer: `SessionTokenPayload.roles`, `AuthUser.roles`, and `MeResponse.roles` keep returning `roles: string[]` of names, and `RolesGuard`/`@Roles(...)` keep working unchanged, including on `AwardsController`.

The `ADMIN` role itself sits outside all of this: it can never be granted or revoked through this feature, for anyone, under any circumstance — that stays a direct-database operation, exactly as today. Custom roles created here are pure labels with no permission wiring of their own.

## User Stories

**Data model / migration**

1. As a system, I want a new `roles` table (`id` uuid PK, `name` text unique, `is_built_in` boolean not null), so that the set of roles is data an ADMIN can extend, not a fixed type.
2. As a system, I want a migration that seeds `ADMIN` and `OPERATOR` into the new `roles` table with `is_built_in = true`, so that the two roles the rest of the app already depends on continue to exist as recognizable rows.
3. As a system, I want `user_roles.role` (the enum column) replaced by `user_roles.role_id` (uuid, FK → `roles.id`, not null), with the existing unique constraint moved from `(user_id, role)` to `(user_id, role_id)`, so that a user's role assignments point at real role rows instead of enum values.
4. As a system, I want every existing `user_roles` row backfilled to point its new `role_id` at the correct seeded `ADMIN`/`OPERATOR` row (matching its old enum value) in the same migration that seeds those rows, so that no existing user's role assignment is silently lost.
5. As a developer, I want the migration ordered seed → backfill → drop old column/enum, so that the backfill has somewhere to point before the column it's replacing disappears.
6. As a system, I want the old `role` Postgres enum type dropped once nothing references it, so that it doesn't linger as a confusing, unused artifact.
7. As a developer, I want `SessionTokenPayload.roles`, `AuthUser.roles`, and `MeResponse.roles` to remain `roles: string[]` of role names, and `RolesGuard`/`@Roles(...)` (and its use on `AwardsController`) to need zero code changes, so that this migration's blast radius stays contained to `roles`/`user_roles` and the repository code that reads/writes them.

**Access control**

8. As an ADMIN, I want to reach every new surface and endpoint in this feature, so that I can view and manage users and roles.
9. As a logged-in user without `ADMIN` (including `OPERATOR`), I want every new page hidden and every new endpoint to reject me with `403 Forbidden`, so that this feature doesn't leak admin capability to non-admins.
10. As an anonymous visitor, I want every new page hidden and every new endpoint to reject me with `401 Unauthorized`, so that admin capability requires being logged in at all, before even checking role.
11. As anyone, I want `POST /auth/signup` to keep working exactly as today, with no guard added, so that this feature doesn't regress the one endpoint that must stay open.

**User list (`/admin/users` + `GET /users`)**

12. As an ADMIN, I want to see a paginated list of all users, so that browsing doesn't require loading the entire user table at once.
13. As an ADMIN, I want to search the user list by name or email (case-insensitive, partial match), so that I can find a specific person without paging through everyone.
14. As an ADMIN, I want to see each user's currently held roles inline in the list, so that I don't have to open a separate view to know who has what.
15. As an ADMIN, I want a checkbox/toggle per assignable role (every role except `ADMIN`) next to each user, so that I can grant or revoke a role in one action.
16. As an ADMIN, I want a newly created custom role to immediately appear as a togglable option for every user, so that I don't need to reload or navigate away after creating it.
17. As an ADMIN, I want the `ADMIN` role to never appear as a togglable checkbox for any user, so that there's no UI affordance suggesting I could grant or revoke it here.
18. As an ADMIN, I want to still see that a user holds `ADMIN` (as a plain, non-interactive indicator) even though I can't toggle it, so that the user list isn't misleading about who's actually an admin.
19. As an ADMIN, I want granting a role to a user who already holds it, or revoking a role from a user who doesn't hold it, to fail loudly enough to be debuggable but not to corrupt state, so that double-clicks or races don't leave the system in a confusing spot.

**Role management (`/admin/roles` + roles API)**

20. As an ADMIN, I want to see a list of all roles (built-in and custom), including which are built-in, so that I understand what's permanent versus what I created.
21. As an ADMIN, I want to create a new custom role by name, so that I can introduce a label the app doesn't ship with by default.
22. As an ADMIN, I want role creation to reject a name that's already taken (including an attempt to recreate `ADMIN` or `OPERATOR`), so that the roles table's uniqueness guarantee is actually enforced, not just assumed.
23. As an ADMIN, I want to delete a custom role, so that I can clean up a role that's no longer needed.
24. As an ADMIN, I want deleting a role that's currently assigned to one or more users to fail by default and show me exactly who's affected (name + email), so that I'm not surprised by a silent mass-unassignment.
25. As an ADMIN, I want to force-delete a role that's in use, after confirming, so that I can still remove it in one step once I've seen who it affects.
26. As an ADMIN, I want `ADMIN` and `OPERATOR` to never be deletable, with no delete control shown for them at all, so that I can't accidentally break the guard system those roles support elsewhere in the app.
27. As an ADMIN, I want a role I just created to be immediately deletable (subject to the same in-use rules as any other custom role), so that creating and deleting aren't asymmetric.

**ADMIN lock (server-enforced)**

28. As the system, I want any attempt to grant `ADMIN` to a user via this feature's API rejected, regardless of who's calling or which user is targeted, so that there's no self-service path to privilege escalation.
29. As the system, I want any attempt to revoke `ADMIN` from a user via this feature's API rejected, including an admin acting on their own row, so that there's no self-service path to accidental de-escalation.
30. As a developer, I want this lock enforced in the service layer (not just hidden in the UI), so that a direct API call bypassing the frontend is rejected exactly the same way.

**Navigation**

31. As an ADMIN, I want a header nav link ("Admin") visible only when I'm logged in as ADMIN, pointing at `/admin`, so that I have a discoverable entry point without cluttering the header for everyone else.
32. As an ADMIN, I want `/admin` to link to `/admin/users` and `/admin/roles` and back to home, so that it acts as a single hub rather than one of several scattered entry points.
33. As an ADMIN, I want `/admin/users` and `/admin/roles` to link back to `/admin` (not directly to home), so that back-navigation is consistent and always passes through the hub.
34. As a non-ADMIN (logged in or not), I want the header's "Admin" link absent entirely, so that the UI never advertises a capability I don't have.

## Implementation Decisions

**Schema / migration**
- New `roles` table: `id` (uuid PK, default random), `name` (text, unique), `is_built_in` (boolean, not null). New migration (the next sequential one after the existing four) seeds `ADMIN` and `OPERATOR` with `is_built_in = true`.
- `user_roles.role` (enum column) is replaced by `user_roles.role_id` (uuid, FK → `roles.id`, not null, matching the existing FK-behavior convention already used for `user_roles.user_id`/`like_awards`'s FKs). Unique constraint moves from `(user_id, role)` to `(user_id, role_id)`.
- Same migration performs the backfill: every existing `user_roles` row's new `role_id` is set to the seeded row matching its old enum value, executed after seeding and before the old column/enum are dropped.
- No other existing table changes.
- **Existing code that reads/writes the old shape must move with the migration**, beyond what ADR-001 called out as the guard/JWT layer being unaffected: the existing role-lookup method on `UsersRepository` (`findRolesByUserId`, currently a bare `select` of the enum column) must be rewritten to join `user_roles` → `roles` and return role *names*, preserving its current return contract (`string[]`) even though the query shape underneath changes completely.

**New backend modules**
- **`RolesModule`** (new): the `roles` table is now a first-class, admin-manipulable entity (unlike the prior plan's decision to fold `user_roles` reads into `UsersRepository` because roles were then just an enum) — it gets its own controller/service/repository.
  - `GET /roles` — lists all roles (built-in and custom), unpaginated, matching this codebase's simple-list convention (ADR-002 only calls out `GET /users` as the deviation). ADMIN-gated.
  - `POST /roles` — creates a custom role from a name (`is_built_in` always `false` for anything created this way). Rejects a duplicate name (including `ADMIN`/`OPERATOR`) the same way signup rejects a duplicate email — a conflict response, not a generic validation error. ADMIN-gated.
  - `DELETE /roles/:id` (optional `force` query flag) — a built-in role (`is_built_in = true`) is always rejected as a bad request regardless of `force`. A custom role currently assigned to one or more users, without `force`, is rejected with the list of affected users (name + email) and nothing is deleted. With `force=true`, the role and every `user_roles` row referencing it are removed in one transaction. A role id that doesn't exist at all is a not-found response. ADMIN-gated.
- **`UsersModule`** gains a controller (it currently has only a repository):
  - `GET /users` — the paginated, searchable endpoint from ADR-002. Query params: `page` (default 1), `limit` (default 10, capped at 100 — mirroring `GET /likes`'s existing `GetLikesQueryDto` exactly, since that's this codebase's only prior pagination precedent) and an optional `search` string matched case-insensitively as a partial match against name or email. Response shape reuses the same envelope already established by the likes feed endpoint: `{ items, total, page, limit, totalPages }` — this directly resolves ADR-002's open question by pointing at existing prior art rather than inventing a new shape. Each item includes the user's currently held roles (id + name), so the frontend can render checkboxes without a second request per user. ADMIN-gated.
  - `POST /users/:userId/roles` (grant) — body carries the target `roleId`. Rejected as a bad request if `roleId` resolves to `ADMIN`, regardless of the target user's current roles (this is the ADMIN lock, enforced here, not just in the UI). Rejected as a conflict if the user already holds that role. Not-found if the user or role id doesn't exist. ADMIN-gated.
  - `DELETE /users/:userId/roles/:roleId` (revoke) — same ADMIN-lock rejection as grant, applied identically whether the target is another user or the calling admin's own row. Not-found if the user, role, or the specific assignment doesn't exist (mirrors this codebase's existing convention of 404-ing a delete against a resource that isn't there, e.g. `DELETE /awards/:id`). ADMIN-gated.
- Both new controllers apply `RolesGuard` + `@Roles('ADMIN')` on every route — no route in either controller is left ungated, unlike `AwardsController` where `GET` routes are intentionally open.

**Frontend**
- New routes: `/admin` (hub — links to `/admin/users`, `/admin/roles`, and back to home), `/admin/users`, `/admin/roles` (each linking back to `/admin`).
- Gating: a shared `isAdmin(user)` helper (same shape as the existing `canManageAwards(user)` helper) drives both the header's conditional "Admin" link and each admin page's own render-nothing-when-unauthorized check. Because ADMIN isn't something a visitor can pursue by simply logging in (unlike award management, where an anonymous visitor sees a login prompt), all three admin pages render nothing at all — no login prompt, no placeholder — for both anonymous visitors and logged-in non-ADMINs, while a loading session state also renders nothing. This is a deliberate, narrower variant of the existing `create-award-section.tsx` gating pattern (anon → prompt, non-privileged → null): admin surfaces skip the prompt branch entirely.
- `/admin/users`: a search input (debounced) plus the existing `Pagination` component (already used by the story feed) drive a paginated user table. Each row shows the user's name, email, a non-interactive `ADMIN` badge if held (reusing the header's existing role-badge visual), and a checkbox per non-`ADMIN` role (built-in `OPERATOR` plus every custom role from `GET /roles`) reflecting and toggling that user's membership. Toggling calls the grant or revoke endpoint and invalidates the user-list query on success — no manual list patching, matching this codebase's existing invalidate-and-refetch convention for awards.
- `/admin/roles`: a simple (unpaginated) list from `GET /roles`, a name-only create form, and a delete control per row — present only for custom (non-built-in) roles, fully absent (not disabled) for `ADMIN`/`OPERATOR`, matching the "hidden not disabled" convention already used for gating the create-award form. Delete opens a confirmation modal (reusing the existing `Dialog` primitive already used by the award edit/delete modals); the first attempt calls delete without `force`. If the API responds with the in-use conflict, the same modal switches to show the affected users' names/emails and a second confirm control that retries with `force=true`. A successful delete (with or without force) invalidates both the roles list and the user list (since users' role sets may have just changed).
- Header: the existing auth control gains a conditional "Admin" link (visible only when `isAdmin(me.data)` is true) pointing at `/admin`, alongside the existing role badges and logout control.

**API contracts summary**

| Route | Guard | Notable responses |
|---|---|---|
| `GET /roles` | `RolesGuard` + `@Roles('ADMIN')` | 200 — full list |
| `POST /roles` | `RolesGuard` + `@Roles('ADMIN')` | 201; 409 on duplicate name |
| `DELETE /roles/:id` | `RolesGuard` + `@Roles('ADMIN')` | 204; 400 if built-in; 409 (+ affected users) if in use without `force`; 404 if id doesn't exist |
| `GET /users` | `RolesGuard` + `@Roles('ADMIN')` | 200 — `{items, total, page, limit, totalPages}` |
| `POST /users/:userId/roles` | `RolesGuard` + `@Roles('ADMIN')` | 204; 400 if `roleId` is `ADMIN`; 409 if already held; 404 if user/role missing |
| `DELETE /users/:userId/roles/:roleId` | `RolesGuard` + `@Roles('ADMIN')` | 204; 400 if `roleId` is `ADMIN`; 404 if user/role/assignment missing |

## Testing Decisions

- This codebase's established seam for this kind of behavior is the full HTTP integration test per module — a real `INestApplication`, a real ephemeral Postgres via `testcontainers`, real migrations, `supertest` driving actual requests (see the existing `awards.spec.ts`/`auth.spec.ts`). This is the highest available seam and the right place to prove role-gating, the ADMIN lock, and role-deletion semantics end-to-end (real guard, real JWT, real DB) rather than mocking any of it. New `roles.spec.ts` and `users.spec.ts` files at this same level should cover: the full 401/403/200 matrix on every new route; role creation and its duplicate-name conflict (including re-creating `ADMIN`/`OPERATOR`); role deletion's built-in rejection, blocked-with-affected-users response, and force-delete cascade; user list pagination and search (name and email, case-insensitive, partial); and the ADMIN lock rejecting both grant and revoke attempts against every kind of target user (plain, `OPERATOR`, already-`ADMIN`, and the calling admin's own row).
- The existing `RolesRepository`-adjacent role-lookup method on `UsersRepository` (`findRolesByUserId`) has an existing mocked-chain unit test (`users.repository.spec.ts`) asserting its query shape and return value; it needs updating for the new join-based query, and the same lightweight mocked-`db`-chain style already used there is the right level for that specific change (pure query-shape assertion, no need for a live database).
- **Direct consequence of the enum-to-table migration that existing tests must account for**: `awards.spec.ts`'s own `grantRole` test helper currently does a direct `db.insert(userRoles).values({ userId, role })` using the soon-to-be-removed enum column, and the e2e suite's `helpers.ts#grantRole` does the equivalent via a raw `psql` `INSERT INTO user_roles (user_id, role) ...` statement. Both write directly against the column being replaced by `role_id`, so both must be updated (to resolve a role name to its `roles.id` first) as part of this migration's implementation, not treated as pre-existing test infrastructure that's untouched by a "contained blast radius." This is a real gap ADR-001 doesn't call out, since it frames blast radius purely in terms of application repository code, not test helpers that poke the schema directly.
- Frontend has no unit/component test setup in this codebase; UI behavior is verified via Playwright e2e (`apps/e2e/tests`), run against a real dockerized stack with direct-`psql` state setup (`global-setup.ts`, `helpers.ts`). New e2e specs for `/admin`, `/admin/users`, and `/admin/roles` should follow that same pattern: an updated `grantRole` helper (post-migration) to set up ADMIN/OPERATOR/custom-role fixtures, and new coverage for — the header link's visibility; each admin page rendering nothing for anonymous and non-admin logged-in users; searching and paging the user list; toggling a non-`ADMIN` role on/off and seeing it reflected without a reload; the `ADMIN` role never appearing as a checkbox even for an admin's own row; creating a custom role and seeing it appear as an assignable option; and the role-deletion confirm → blocked-with-affected-users → force-delete flow end to end.

## Out of Scope

- A full dynamic permission system where custom roles carry configurable route/action permissions — custom roles remain pure labels.
- Any UI or API path to grant `ADMIN` to a non-admin user, or to revoke it from an existing admin — remains direct-database-only.
- Any change to `POST /auth/signup` or its guard status.
- Live/real-time re-check of roles mid-session — a role granted or revoked here takes effect for the affected user only on their next login or natural session expiry, exactly as established by the prior roles/permissions plan's ADR-001.
- Pagination or search on `GET /roles` — it stays a simple full list, matching this codebase's default convention.
- Any bulk operations (bulk role assignment across multiple users, bulk role deletion).
- Renaming or editing an existing role's name after creation — creation and deletion are the only mutations offered.
- Any change to `AwardsController`'s existing role-gating or to award data itself.

## Further Notes

- **Open question — case sensitivity / format of custom role names**: the grill output doesn't specify whether role names are normalized (trimmed, case-folded, restricted charset) beyond "name only." This spec assumes a plain trimmed, case-sensitive unique text value (matching the plain `.unique()` convention already used elsewhere in this schema, e.g. `users.email`), with duplicate-name rejection covering exact-string collisions only (so `admin` and `ADMIN` would coexist as distinct rows) unless tickets/implementation decide otherwise.
- **Open question — response body on successful grant/revoke**: this spec settles on `204 No Content` for both, on the theory that the frontend always re-fetches the user list afterward (matching the existing invalidate-and-refetch convention) rather than needing the mutation response itself. If a ticket-level reviewer prefers returning the user's updated role set inline to save a round trip, that's a compatible, non-breaking enhancement.
- **Risk — migration correctness under concurrent grants during backfill**: ADR-001 already flags this migration as touching live data for the first time in this codebase's history. This spec doesn't add new risk here beyond what ADR-001 already calls out, but re-emphasizes it should be tested with particular care at tickets/implement time (seed → backfill → drop ordering, and confirming no `user_roles` row is ever left pointing at a dropped column or a null `role_id`).
- **Test-helper ripple noted above** (`awards.spec.ts`'s and `helpers.ts`'s direct `role`-column writes) should be scoped into whichever ticket implements the schema migration, not left for a later ticket to discover as a broken build.
