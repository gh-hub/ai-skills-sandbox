# 02 — Roles API (RolesModule)

**What to build:** a new RolesModule with REST endpoints to list, create, and delete roles, all gated to ADMIN only. Role deletion blocks by default if the role is in use, offering a force flag to cascade the deletion.

**Blocked by:** 01 — Roles schema migration

**Status:** done (2026-08-04)

- [x] RolesModule created with RolesController, RolesService, and RolesRepository
- [x] GET /roles returns 200 with unpaginated list of all roles (built-in and custom)
- [x] GET /roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] POST /roles accepts JSON body with name field and returns 201 on success
- [x] POST /roles returns 409 on duplicate name (including attempts to recreate ADMIN or OPERATOR)
- [x] POST /roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] DELETE /roles/:id returns 204 on successful deletion of a custom role not currently assigned to any user
- [x] DELETE /roles/:id returns 400 if the role id resolves to a built-in role (ADMIN or OPERATOR)
- [x] DELETE /roles/:id without force flag returns 409 with response body listing affected users (name + email) if role is currently assigned to one or more users
- [x] DELETE /roles/:id with force=true flag deletes the role and all associated user_roles rows in a transaction, returns 204
- [x] DELETE /roles/:id returns 404 if the role id doesn't exist
- [x] DELETE /roles/:id endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] All three endpoints are gated with RolesGuard + @Roles('ADMIN') — no ungated routes in RolesModule
- [x] New roles.spec.ts integration test covers 401/403/200 matrix on all three routes
- [x] roles.spec.ts covers duplicate-name conflict including ADMIN/OPERATOR name rejection
- [x] roles.spec.ts covers role-deletion built-in rejection (400)
- [x] roles.spec.ts covers role-deletion blocked-with-affected-users response (409) and force-delete cascade

**Notes / assumptions:**
- "In a transaction" for the force-delete cascade is satisfied by relying on `user_roles.role_id`'s `ON DELETE CASCADE` FK (confirmed by ticket 01): a single `DELETE FROM roles WHERE id = ...` is already one atomic statement and Postgres cascades the `user_roles` cleanup within it. No explicit `db.transaction()` wrapper was added — it would be redundant ceremony around a single statement (see `general.md`'s no-over-engineering rule). If a reviewer wants an explicit `db.transaction()` for defense-in-depth/readability, that's a compatible follow-up.
- Duplicate-name check is exact-string, case-sensitive (per spec's stated assumption): `admin` and `ADMIN` would coexist as distinct rows. Role names are trimmed (via a DTO-level `class-transformer` `@Transform`) before the uniqueness check and insert.
- Added `Role`, `CreateRoleRequest`, `RoleAffectedUser`, `RoleInUseResponse` to `packages/shared-types/src/index.ts` (and rebuilt its `dist/`) since these are the actual wire contract for `/roles`, matching how `Award`/`AuthUser`/etc. are already shared — future tickets (04, admin roles UI) can import these directly instead of re-declaring them.
- `RolesModule` exports `RolesRepository` (mirroring `UsersModule` exporting `UsersRepository`) since ticket 03's grant/revoke routes will need to resolve a `roleId` and check `isBuiltIn`/name against `ADMIN`.
