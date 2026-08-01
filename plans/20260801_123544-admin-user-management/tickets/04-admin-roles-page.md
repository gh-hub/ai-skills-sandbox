# 04 — /admin/roles page

**What to build:** An ADMIN gets a working roles page: it lists all roles, supports creating a new role, and supports deleting a custom role through a confirm-then-force-if-in-use flow that shows the affected users when a delete is blocked. Built-in roles show no delete control at all. The page renders nothing at all for an anonymous visitor, a logged-in non-admin, or while the session is still loading.

**Blocked by:** 02 — Roles API

**Status:** done (2026-08-01)

- [x] The roles page lists all roles, supports creating a new role, and supports deleting a custom role through a confirm-then-force-if-in-use flow that shows the affected users when a delete is blocked
- [x] The roles page shows no delete control at all for either built-in role
- [x] The roles page renders nothing at all for an anonymous visitor, a logged-in non-admin, and while the session is still loading
