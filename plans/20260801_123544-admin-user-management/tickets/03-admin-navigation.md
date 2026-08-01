# 03 — Admin navigation

**What to build:** Logged-in admins get a discoverable entry point into everything built in the prior ticket. The header shows an "Admin" link, but only when the logged-in user is actually an admin — absent for anyone else, logged in or not. That link leads to a new admin hub page, which in turn links out to the users page and the roles page, as well as back to home. Both the users page and the roles page link back to the hub rather than straight to home, so navigating away from either always passes through the hub first.

**Blocked by:** 02 — Role & user management (API + /admin/roles + /admin/users)

**Status:** ready

- [ ] The header's "Admin" link is visible only for a logged-in admin, and absent for a logged-in non-admin and for an anonymous visitor
- [ ] The admin hub page links to the users page, the roles page, and back to home
- [ ] The users page and the roles page each link back to the admin hub rather than directly to home
- [ ] End-to-end coverage verifies the header link's visibility across admin, non-admin, and anonymous states
- [ ] End-to-end coverage verifies navigating from the hub to each sub-page and back
