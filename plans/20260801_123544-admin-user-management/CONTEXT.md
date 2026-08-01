# Context: Admin User Management

## What we're building
An admin-only user/role management UI and API: an `/admin` hub with `/admin/users` (paginated, searchable user list with role grant/revoke) and `/admin/roles` (list/create/delete roles), gated to ADMIN only.

## Key decisions
- ADMIN-only access to all new surfaces, following the existing `RolesGuard` + `@Roles(...)` pattern; `POST /auth/signup` verified unaffected. See `grill/decisions.md`.
- `role` enum replaced by a real `roles` table with FK-based `user_roles.role_id` and a backfill migration; JWT/`AuthUser`/`RolesGuard` contracts unchanged. See `grill/ADR-001.md`.
- The `ADMIN` role can never be granted or revoked through this feature, for anyone, including an admin's own row — enforced server-side. See `grill/decisions.md`.
- Custom roles are pure labels with no enforcement wiring; only custom (non-built-in) roles are deletable, with block-by-default + force-flag deletion semantics. See `grill/decisions.md`.
- `GET /users` is paginated and searchable from the start, a deliberate deviation from this codebase's simple-list convention; response shape and default page size deferred to spec/tickets. See `grill/ADR-002.md`.

## Spec
Full spec synthesized from the grill output: `spec.md`. Resolves the deferred route shapes (new `RolesModule` for list/create/delete roles; `UsersModule` gains a controller for `GET /users` and grant/revoke sub-routes), the `GET /users` pagination envelope (reuses the existing `GET /likes` `{items, total, page, limit, totalPages}` shape and page-size-10/max-100 convention), and the full status-code matrix for grant/revoke/create/delete including the ADMIN lock. See `PROGRESS/notes/spec.md` for the session write-up and flagged open questions.

## Tickets
1. `01-roles-schema-migration` — introduces the `roles` table, migrates `user_roles` off the enum onto a `role_id` FK with backfill, and rewrites the role-lookup repository method and its test helpers.
2. `02-role-and-user-management` — `RolesModule` + `UsersModule` controller (roles CRUD, paginated/searchable user list, grant/revoke with the ADMIN lock) plus the `/admin/roles` and `/admin/users` frontend pages, with integration and e2e tests.
3. `03-admin-navigation` — header "Admin" link, `/admin` hub page, and back-navigation from both sub-pages, with e2e coverage.

## Current state
Phase: implement
Completed tickets: 01-roles-schema-migration
Current ticket: plans/20260801_123544-admin-user-management/tickets/02-role-and-user-management.md

## Load this session
- `apps/api/src/db/schema.ts` — new `roles` table (`id`, `name`, `isBuiltIn`, no `createdAt`) and `userRoles.roleId` FK (replaces the old `role` enum column).
- `apps/api/src/apps/users/users.repository.ts` — `findRolesByUserId` now joins `userRoles` -> `roles` and returns `string[]` of role names (contract unchanged).
- `apps/api/drizzle/0005_wooden_black_cat.sql` — the migration that introduced the above; next new migration should be `0006_...`.
- `apps/api/src/apps/auth/roles.guard.ts`, `apps/api/src/apps/auth/roles.decorator.ts` — existing `RolesGuard` + `@Roles(...)` pattern to reuse for the new roles/users admin endpoints.
- `apps/api/src/apps/awards/awards.controller.ts` — reference example of the `@UseGuards(RolesGuard)` + `@Roles(...)` usage on a controller.
- `plans/20260801_123544-admin-user-management/PROGRESS/notes/implement-01-roles-schema-migration.md` — full write-up of what changed and gotchas below.

## Gotchas
- Prior plan plans/done/20260731_194131-user-roles-permissions/ already implemented the base roles/permissions system — read it for existing role model/decisions before re-deriving them in grill.
- The `roles` table has only `id`/`name`/`isBuiltIn` — no `createdAt`. If the `/admin/roles` list wants a creation date, that column doesn't exist yet and would need adding.
- Built-in roles (`ADMIN`, `OPERATOR`) are distinguished only by `isBuiltIn = true` — filter on that flag, not by name, when enforcing "built-in roles can't be deleted."
- `findRolesByUserId` returns plain `string[]` now (not a `"ADMIN" | "OPERATOR"` literal union like before) — the highest-privilege-role ("ADMIN") lock in ticket 02 should compare against the string `"ADMIN"` directly rather than relying on any type-level exhaustiveness.
- The e2e Playwright suite (`apps/e2e`) was not run live during ticket 01 (only typechecked) since it needs the full docker-compose stack — worth a live run once ticket 02's new pages exist.
