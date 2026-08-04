# Grill session end-state (2026-08-01)

## What was gathered

A full grilling interview was completed and written up under `grill/`:

- **requirements.md** — Problem: admins have no UI/API to see all users or manage roles today (direct-DB only). Solution: ADMIN-only `/admin` hub with `/admin/users` (paginated/searchable user list, role grant/revoke via toggles) and `/admin/roles` (list/create/delete roles), plus backing REST endpoints, all gated by the existing `RolesGuard` + `@Roles('ADMIN')` pattern. `POST /auth/signup` verified unaffected.
- **decisions.md** — 10 load-bearing decisions, including: ADMIN-only access everywhere; the enum-to-table roles migration; JWT/`AuthUser`/`RolesGuard` contracts staying untouched; custom roles as pure labels with no enforcement; the ADMIN role being completely ungrantable/unrevokable via this feature (including for an admin's own row); full grant+revoke for OPERATOR/custom roles; built-in roles (`ADMIN`/`OPERATOR`) never deletable; block-by-default + force-flag role deletion with a confirmation modal; `GET /users` being paginated/searchable from day one (a deviation from the rest of the codebase); and the `/admin` hub mediating all back-navigation and header linking.
- **glossary.md** — defines `roles table`, `is_built_in`, custom role, built-in role, ADMIN lock, `/admin` hub, force-delete, `user_roles`, `RolesGuard`/`@Roles()`, `AuthUser`/`MeResponse`/`SessionTokenPayload`, and the paginated/searchable `GET /users` endpoint.
- **ADR-001.md** — the enum-to-roles-table schema migration: new `roles` table (id, name, is_built_in), `user_roles.role` → `user_roles.role_id` FK swap, required backfill of existing ADMIN/OPERATOR rows, why this is more involved than prior purely-additive migrations, and confirmation that JWT/`RolesGuard`/`@Roles()` contracts are unaffected.
- **ADR-002.md** — the first-paginated-endpoint decision for `GET /users`: why pagination/search is built in now rather than deferred, the deviation from the codebase's simple-list convention (e.g. `GET /awards`), and that exact response shape/default page size are left open for spec/tickets.

Scope was explicitly bounded: no full dynamic permission system, no path to grant ADMIN via this feature, no changes to `POST /auth/signup`, and route shapes / pagination response shape / default page size are deferred to spec/tickets rather than decided here.

## Next

Spec phase is next: turn `grill/requirements.md`, `grill/decisions.md`, and the two ADRs into a concrete spec (API contracts, exact route shapes for role assignment/revocation, pagination response shape, default page size, migration plan detail).
