# 05 — Admin users page (`/admin/users`)

**What to build:** a UI page at `/admin/users` (accessible only to logged-in ADMINs) that shows a paginated, searchable list of all users, with their current roles displayed inline and toggles to grant/revoke non-ADMIN roles.

**Blocked by:** 02 — Roles API, 03 — Users API

**Status:** ready

- [ ] /admin/users route created in frontend app
- [ ] /admin/users renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [ ] /admin/users renders nothing at all for logged-in non-admin users
- [ ] /admin/users page fetches paginated user list from GET /users with default parameters
- [ ] Users list displays user name, email, and currently held roles
- [ ] For each user, displays non-interactive ADMIN role badge (reusing existing role-badge visual) if user holds ADMIN role
- [ ] ADMIN role badge never appears as a clickable checkbox, even for the logged-in admin's own row
- [ ] For each assignable role (every role except ADMIN), displays a checkbox per role per user
- [ ] Checkbox reflects current assignment state (checked if user holds role, unchecked otherwise)
- [ ] Clicking checkbox to grant a role calls POST /users/:userId/roles with that roleId
- [ ] Clicking checkbox to revoke a role calls DELETE /users/:userId/roles/:roleId
- [ ] Successful grant/revoke invalidates user list query and refetches immediately (no manual list patching)
- [ ] Page refetch picks up newly-created custom roles from /admin/roles without requiring reload or navigation away
- [ ] Checkboxes for newly-created custom roles appear in the user list on next page load or query invalidation
- [ ] Search input (debounced) allows filtering user list by name or email
- [ ] Search updates GET /users request with search query parameter
- [ ] Pagination controls use existing Pagination component (same as story feed)
- [ ] Pagination allows browsing through pages, respecting page and limit parameters
- [ ] /admin/users page has a back link to /admin (not to home)
