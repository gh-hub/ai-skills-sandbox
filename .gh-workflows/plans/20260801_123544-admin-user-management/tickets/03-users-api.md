# 03 — Users API (UsersModule controller)

**What to build:** a new UsersController with a paginated, searchable user list endpoint and grant/revoke sub-routes for role assignment, all gated to ADMIN only. The ADMIN role can never be granted or revoked through these endpoints, enforced server-side.

**Blocked by:** 01 — Roles schema migration

**Status:** done

- [x] UsersController created in UsersModule with GET /users, POST /users/:userId/roles, and DELETE /users/:userId/roles/:roleId endpoints
- [x] GET /users returns 200 with response shape {items, total, page, limit, totalPages} matching the existing GET /likes pagination pattern
- [x] GET /users default page is 1, default limit is 10, maximum limit is 100
- [x] GET /users accepts optional search query parameter, filters items by case-insensitive partial match on user name or email
- [x] GET /users each item includes user id, name, email, and their currently held roles (each role as {id, name})
- [x] GET /users endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] POST /users/:userId/roles accepts JSON body with roleId and returns 204 on successful grant
- [x] POST /users/:userId/roles returns 400 if roleId resolves to the ADMIN role (ADMIN lock, enforced server-side)
- [x] POST /users/:userId/roles returns 409 if user already holds the target role
- [x] POST /users/:userId/roles returns 404 if user id doesn't exist
- [x] POST /users/:userId/roles returns 404 if role id doesn't exist
- [x] POST /users/:userId/roles endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] DELETE /users/:userId/roles/:roleId returns 204 on successful revoke
- [x] DELETE /users/:userId/roles/:roleId returns 400 if roleId resolves to the ADMIN role, even when called by an admin on their own row (ADMIN lock, enforced server-side)
- [x] DELETE /users/:userId/roles/:roleId returns 404 if user id doesn't exist
- [x] DELETE /users/:userId/roles/:roleId returns 404 if role id doesn't exist
- [x] DELETE /users/:userId/roles/:roleId returns 404 if user doesn't hold the specified role (mirrors existing DELETE convention for missing resources)
- [x] DELETE /users/:userId/roles/:roleId endpoint requires RolesGuard + @Roles('ADMIN'), returns 401 for anonymous, 403 for non-admin
- [x] All three endpoints are gated with RolesGuard + @Roles('ADMIN') — no ungated routes in UsersController
- [x] New users.spec.ts integration test covers 401/403/200 matrix on all endpoints
- [x] users.spec.ts covers GET /users pagination (page, limit, totalPages calculation)
- [x] users.spec.ts covers GET /users search filtering by name and email (case-insensitive, partial match)
- [x] users.spec.ts covers ADMIN lock rejecting grant attempt on ADMIN role (400)
- [x] users.spec.ts covers ADMIN lock rejecting revoke attempt on ADMIN role (400), including admin's own row
- [x] users.spec.ts covers grant/revoke conflict and not-found responses (409 if already held, 404 if user/role missing)
