# 03 — Users API (UsersModule controller)

**What to build:** a new UsersController with a paginated, searchable user list endpoint and grant/revoke sub-routes for role assignment, all gated to ADMIN only. The ADMIN role can never be granted or revoked through these endpoints, enforced server-side.

**Blocked by:** 01 — Roles schema migration

**Status:** ready

- [ ] UsersController created in UsersModule with GET /users, POST /users/:userId/roles, and DELETE /users/:userId/roles/:roleId endpoints
- [ ] GET /users returns 200 with response shape {items, total, page, limit, totalPages} matching the existing GET /likes pagination pattern
- [ ] GET /users default page is 1, default limit is 10, maximum limit is 100
- [ ] GET /users accepts optional search query parameter, filters items by case-insensitive partial match on user name or email
- [ ] GET /users each item includes user id, name, email, and their currently held roles (each role as {id, name})
- [ ] GET /users endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] POST /users/:userId/roles accepts JSON body with roleId and returns 204 on successful grant
- [ ] POST /users/:userId/roles returns 400 if roleId resolves to the ADMIN role (ADMIN lock, enforced server-side)
- [ ] POST /users/:userId/roles returns 409 if user already holds the target role
- [ ] POST /users/:userId/roles returns 404 if user id doesn't exist
- [ ] POST /users/:userId/roles returns 404 if role id doesn't exist
- [ ] POST /users/:userId/roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] DELETE /users/:userId/roles/:roleId returns 204 on successful revoke
- [ ] DELETE /users/:userId/roles/:roleId returns 400 if roleId resolves to the ADMIN role, even when called by an admin on their own row (ADMIN lock, enforced server-side)
- [ ] DELETE /users/:userId/roles/:roleId returns 404 if user id doesn't exist
- [ ] DELETE /users/:userId/roles/:roleId returns 404 if role id doesn't exist
- [ ] DELETE /users/:userId/roles/:roleId returns 404 if user doesn't hold the specified role (mirrors existing DELETE convention for missing resources)
- [ ] DELETE /users/:userId/roles/:roleId endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [ ] All three endpoints are gated with RolesGuard + @Roles('ADMIN') — no ungated routes in UsersController
- [ ] New users.spec.ts integration test covers 401/403/200 matrix on all endpoints
- [ ] users.spec.ts covers GET /users pagination (page, limit, totalPages calculation)
- [ ] users.spec.ts covers GET /users search filtering by name and email (case-insensitive, partial match)
- [ ] users.spec.ts covers ADMIN lock rejecting grant attempt on ADMIN role (400)
- [ ] users.spec.ts covers ADMIN lock rejecting revoke attempt on ADMIN role (400), including admin's own row
- [ ] users.spec.ts covers grant/revoke conflict and not-found responses (409 if already held, 404 if user/role missing)
