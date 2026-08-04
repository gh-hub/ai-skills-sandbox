# 02 — Roles API (RolesModule)

**What to build:** a new RolesModule with REST endpoints to list, create, and delete roles, all gated to ADMIN only. Role deletion blocks by default if the role is in use, offering a force flag to cascade the deletion.

**Blocked by:** 01 — Roles schema migration

**Status:** ready

- [ ] RolesModule created with RolesController, RolesService, and RolesRepository
- [ ] GET /roles returns 200 with unpaginated list of all roles (built-in and custom)
- [ ] GET /roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] POST /roles accepts JSON body with name field and returns 201 on success
- [ ] POST /roles returns 409 on duplicate name (including attempts to recreate ADMIN or OPERATOR)
- [ ] POST /roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] DELETE /roles/:id returns 204 on successful deletion of a custom role not currently assigned to any user
- [ ] DELETE /roles/:id returns 400 if the role id resolves to a built-in role (ADMIN or OPERATOR)
- [ ] DELETE /roles/:id without force flag returns 409 with response body listing affected users (name + email) if role is currently assigned to one or more users
- [ ] DELETE /roles/:id with force=true flag deletes the role and all associated user_roles rows in a transaction, returns 204
- [ ] DELETE /roles/:id returns 404 if the role id doesn't exist
- [ ] DELETE /roles/:id endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] All three endpoints are gated with RolesGuard + @Roles('ADMIN') — no ungated routes in RolesModule
- [ ] New roles.spec.ts integration test covers 401/403/200 matrix on all three routes
- [ ] roles.spec.ts covers duplicate-name conflict including ADMIN/OPERATOR name rejection
- [ ] roles.spec.ts covers role-deletion built-in rejection (400)
- [ ] roles.spec.ts covers role-deletion blocked-with-affected-users response (409) and force-delete cascade
