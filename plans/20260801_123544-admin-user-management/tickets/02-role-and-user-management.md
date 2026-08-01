# 02 — Role & user management (API + /admin/roles + /admin/users)

**What to build:** An ADMIN can now fully manage roles and see and adjust who holds which role, both through the API and through two new pages. On the roles side, an ADMIN can list every role (built-in and custom), create a new custom role by name, and delete a custom role — with a role currently in use blocking deletion by default and showing exactly who's affected, and a force option that deletes the role and clears it from everyone who held it in one step. Built-in roles can never be deleted, and a duplicate role name (including trying to recreate a built-in role) is always rejected. On the user side, an ADMIN can browse a paginated, searchable (by name or email) list of every user, see each user's currently held roles inline, and toggle any role except the highest-privilege one on or off for that user directly from the list — with a newly created role immediately available as a toggle for every user without needing to reload. Attempting to grant a role someone already has, or revoke one they don't have, fails clearly rather than silently corrupting anything. Across every one of these capabilities, granting or revoking the highest-privilege role is refused outright, for any user, including an admin acting on their own account — enforced on the server, not just hidden in the interface. Every new endpoint and both new pages are reachable only by a logged-in ADMIN: anonymous visitors and logged-in non-admins are turned away, and neither new page shows anything at all to them.

**Blocked by:** 01 — Roles schema migration & role-lookup prefactor

**Status:** ready

- [ ] Every new endpoint rejects an anonymous caller and rejects a logged-in non-admin caller, and allows a logged-in admin caller
- [ ] Listing roles returns every role, built-in and custom, with their built-in status visible
- [ ] Creating a role by name succeeds for a genuinely new name and is rejected as a conflict for a name already taken, including an attempt to recreate either built-in role
- [ ] Deleting a built-in role is always rejected, regardless of any force option
- [ ] Deleting a custom role currently held by one or more users is rejected by default, with the response identifying exactly which users (by name and email) are affected, and nothing is deleted
- [ ] Deleting a custom role with the force option removes the role and clears it from every user who held it, in one step
- [ ] Deleting a role id that doesn't exist is rejected as not found
- [ ] Listing users returns a paginated result with sensible defaults and an upper limit on page size, and each user in the result includes their currently held roles
- [ ] Searching the user list by a partial, case-insensitive match on name or email returns only matching users
- [ ] Granting a role a user already holds is rejected as a conflict; revoking a role a user doesn't hold is rejected appropriately; granting or revoking against a user or role that doesn't exist is rejected as not found
- [ ] Granting or revoking the highest-privilege role is rejected for every kind of target — a plain user, a user with the other built-in role, a user who already holds the highest-privilege role, and the calling admin's own account
- [ ] The roles page lists all roles, supports creating a new role, and supports deleting a custom role through a confirm-then-force-if-in-use flow that shows the affected users when a delete is blocked
- [ ] The roles page shows no delete control at all for either built-in role
- [ ] The users page supports debounced search and paging, shows each user's roles, offers a toggle per assignable role excluding the highest-privilege one, shows that highest-privilege role as a plain non-interactive indicator when held, and reflects a toggle's effect after the action completes
- [ ] A role created moments earlier immediately appears as a toggle option on the users page without a reload
- [ ] Both new pages render nothing at all for an anonymous visitor, a logged-in non-admin, and while the session is still loading
