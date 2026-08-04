# Decisions: Admin User Management

## Decision: ADMIN-only access to all new surfaces

**Decided:** Only users with the `ADMIN` role may access user listing, role assignment, and role management (list/create/delete), via UI or API. `OPERATOR` and other logged-in users get 401 (not logged in) / 403 (logged in, insufficient role) exactly like any other role-gated route. `POST /auth/signup` requires no guard and needs no code change — verified as already fully open to anonymous users.

**Why:** This is inherently an administrative capability; it follows the same access-control shape already established for `AwardsController` via `RolesGuard` + `@Roles(...)`.

**Alternatives rejected:** none discussed.

## Decision: Enum-to-table migration for roles

**Decided:** `role` moves from a hardcoded Postgres enum to a real `roles` table (`id` uuid PK, `name` text unique, `is_built_in` boolean not null). `user_roles.role` (enum column) is replaced by `user_roles.role_id` (uuid FK → `roles.id`, not null). The existing unique constraint moves from `(user_id, role)` to `(user_id, role_id)`. A migration seeds `ADMIN` and `OPERATOR` rows with `is_built_in = true`, and existing `user_roles` rows are backfilled to point at the new rows' ids. See ADR-001 for full detail.

**Why:** Custom, admin-creatable roles cannot be represented by a fixed Postgres enum — the set of roles must be data, not a type.

**Alternatives rejected:** none discussed (the shift away from the enum is a direct consequence of supporting custom roles, not something weighed against alternatives in this interview).

## Decision: JWT/AuthUser/RolesGuard contract is unaffected

**Decided:** `request.user.roles` in the JWT `SessionTokenPayload`, the shared `AuthUser` type, and `MeResponse` all stay `roles: string[]` of role **names**, not ids. The existing `RolesGuard` + `@Roles('ADMIN','OPERATOR')` pattern on `AwardsController` needs zero changes, since it matches by name string, not by the underlying column type. Only the storage/relational shape of `user_roles` changes.

**Why:** Isolates the schema migration's blast radius — nothing that already depends on `roles: string[]` needs to change.

**Alternatives rejected:** none discussed.

## Decision: Custom roles are pure labels, no enforcement

**Decided:** A newly created role (anything other than `ADMIN`/`OPERATOR`) is a persisted, assignable name only. No permission/route mapping is attached to it.

**Why:** Keeps this feature scoped to role bookkeeping rather than building a general permission engine.

**Alternatives rejected:** Full dynamic permission system where custom roles carry their own configurable route/action permissions, replacing the hardcoded `@Roles()` decorator model — rejected as too large in scope.

## Decision: ADMIN role is completely ungrantable/unrevokable via this feature

**Decided:** Nobody can grant or revoke the `ADMIN` role through this UI/API, for anyone, including promoting a plain user to ADMIN or touching an already-ADMIN user's `ADMIN` role (revoke or re-grant) — including an admin's own row. Backend must reject this server-side even if attempted directly against the API, not just hide it in the UI. Promoting someone to ADMIN remains a direct-database operation only, exactly as today.

**Why:** Avoids any self-service path to privilege escalation or accidental de-escalation of the highest-privilege role; keeps the blast radius of this feature to "everything except who holds ADMIN."

**Alternatives rejected:** Allowing ADMIN to be granted to non-admin users via this UI, with only already-admin users' ADMIN role being locked — rejected in favor of ADMIN being completely ungrantable/unrevokable via this feature for everyone, full stop.

## Decision: Full grant + revoke for non-ADMIN roles

**Decided:** OPERATOR and any custom role can be freely granted and revoked via `/admin/users` by any ADMIN, via toggle/checkbox.

**Why:** Matches the expected self-service use case (fixing/adjusting non-privileged role assignments) without needing a separate approval flow.

**Alternatives rejected:** Grant-only role management with no revoke — rejected in favor of full grant + revoke via toggle.

## Decision: Built-in roles (`ADMIN`, `OPERATOR`) can never be deleted

**Decided:** Both `ADMIN` and `OPERATOR` are permanent built-ins (`is_built_in = true`) and can never be deleted via `/admin/roles` or its API. Only custom (`is_built_in = false`) roles are deletable.

**Why:** These two roles are load-bearing for the existing `RolesGuard`/`@Roles()` system; deleting them would break route protection elsewhere in the app.

**Alternatives rejected:** Roles being permanent once created (no deletion at all) — rejected in favor of allowing deletion of custom (non-built-in) roles.

## Decision: Role deletion is blocked-by-default with a force flag

**Decided:** `DELETE /roles/:id` (no force flag) fails if the role is assigned to one or more users, returning the list of affected users (name + email) without deleting the role. `DELETE /roles/:id?force=true` cascades: deletes the role and removes it from every user who had it, in one step. The frontend opens a confirmation modal on delete; if the non-force attempt reveals the role is in use, the modal shows affected users' names/emails and asks the admin to confirm before retrying with `force=true`.

**Why:** Prevents silent, surprising loss of role assignments across potentially many users while still allowing a deliberate one-step cascade.

**Alternatives rejected:** Cascading role deletion silently without confirmation — rejected in favor of the block-by-default / force-flag-with-confirmation-modal design.

## Decision: `GET /users` is paginated and searchable from the start

**Decided:** `GET /users` supports pagination and search (search matches name and email, case-insensitive partial match) from the start, unlike the rest of this codebase's list endpoints (e.g. `GET /awards`), which return a simple full list. Exact response shape (e.g. items + total count + page/limit) and default page size are left to spec/tickets. See ADR-002 for full detail.

**Why:** User lists are expected to grow unbounded in a way award lists are not; building this in now avoids a later breaking change to the endpoint's shape.

**Alternatives rejected:** Simple non-paginated `GET /users` matching the rest of the codebase's list endpoints — rejected in favor of building in pagination + search from the start.

## Decision: `/admin` hub mediates all back-navigation and header linking

**Decided:** `/admin/users` and `/admin/roles` both link back to `/admin` (not directly to home); `/admin` links back to home. The header's admin nav link points at `/admin`, not directly at `/admin/users`.

**Why:** Establishes a single, consistent entry point for admin functionality rather than scattering direct deep links.

**Alternatives rejected:** Back buttons skipping the `/admin` hub and going straight to home from every admin page — rejected. Header admin link pointing directly at `/admin/users`, bypassing the hub — rejected.
