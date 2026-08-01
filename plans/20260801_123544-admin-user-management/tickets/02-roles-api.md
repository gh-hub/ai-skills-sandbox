# 02 — Roles API

**What to build:** An ADMIN can manage the set of assignable roles through the API: list every role (built-in and custom) with built-in status visible, create a new custom role by name (rejected as a conflict if the name is already taken, including an attempt to recreate either built-in role), and delete a custom role — blocked by default when the role is currently held by one or more users (returning exactly who's affected, by name and email) unless a force option is passed, in which case the role is deleted and cleared from everyone who held it in one step. Built-in roles can never be deleted, regardless of any force option, and deleting a role id that doesn't exist is rejected as not found. Every one of these endpoints is reachable only by a logged-in ADMIN — anonymous callers and logged-in non-admins are turned away.

**Blocked by:** 01 — Roles schema migration & role-lookup prefactor

**Status:** done

- [x] Every new roles endpoint rejects an anonymous caller and rejects a logged-in non-admin caller, and allows a logged-in admin caller — covered for GET/POST/DELETE in `roles.spec.ts` (401 anonymous, 403 no-role and OPERATOR, success as ADMIN)
- [x] Listing roles returns every role, built-in and custom, with their built-in status visible
- [x] Creating a role by name succeeds for a genuinely new name and is rejected as a conflict (409) for a name already taken, including an attempt to recreate either built-in role
- [x] Deleting a built-in role is always rejected (409), regardless of any force option
- [x] Deleting a custom role currently held by one or more users is rejected by default (409), with the response body's `users` array identifying exactly which users (name + email) are affected, and nothing is deleted
- [x] Deleting a custom role with the force option (`?force=true`) removes the role and clears it from every user who held it, in one step
- [x] Deleting a role id that doesn't exist is rejected as not found (404)
