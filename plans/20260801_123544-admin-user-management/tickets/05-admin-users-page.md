# 05 — /admin/users page

**What to build:** An ADMIN gets a working users page: a debounced-search, paginated list of every user, showing each user's currently held roles, with a toggle per assignable role (excluding the highest-privilege one, which shows as a plain non-interactive indicator when held) that reflects its effect once the action completes. A role created moments earlier on the roles page immediately appears as a toggle option here without needing a reload. The page renders nothing at all for an anonymous visitor, a logged-in non-admin, or while the session is still loading.

**Blocked by:** 02 — Roles API, 03 — Users API

**Status:** done (2026-08-01)

- [x] The users page supports debounced search and paging, shows each user's roles, offers a toggle per assignable role excluding the highest-privilege one, shows that highest-privilege role as a plain non-interactive indicator when held, and reflects a toggle's effect after the action completes
- [x] A role created moments earlier immediately appears as a toggle option on the users page without a reload
- [x] The users page renders nothing at all for an anonymous visitor, a logged-in non-admin, and while the session is still loading
