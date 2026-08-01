# 03 — Users API

**What to build:** An ADMIN can browse and adjust who holds which role through the API: a paginated, searchable (by name or email) list of every user, with each user's currently held roles included, plus endpoints to grant or revoke any role except the highest-privilege one for a given user. Attempting to grant a role someone already has, or revoke one they don't have, fails clearly, as does acting against a user or role that doesn't exist. Granting or revoking the highest-privilege role is refused outright for any user, including an admin acting on their own account — enforced on the server. Every one of these endpoints is reachable only by a logged-in ADMIN — anonymous callers and logged-in non-admins are turned away.

**Blocked by:** 01 — Roles schema migration & role-lookup prefactor

**Status:** done (2026-08-01)

- [x] Every new users/role-assignment endpoint rejects an anonymous caller and rejects a logged-in non-admin caller, and allows a logged-in admin caller
- [x] Listing users returns a paginated result with sensible defaults and an upper limit on page size, and each user in the result includes their currently held roles
- [x] Searching the user list by a partial, case-insensitive match on name or email returns only matching users
- [x] Granting a role a user already holds is rejected as a conflict; revoking a role a user doesn't hold is rejected appropriately; granting or revoking against a user or role that doesn't exist is rejected as not found
- [x] Granting or revoking the highest-privilege role is rejected for every kind of target — a plain user, a user with the other built-in role, a user who already holds the highest-privilege role, and the calling admin's own account
