# 06 — Admin navigation

**What to build:** the `/admin` hub page and header navigation link, connecting the admin surfaces together with consistent back-navigation and ADMIN-only visibility.

**Blocked by:** 04 — Admin roles page, 05 — Admin users page

**Status:** ready

- [ ] /admin route created in frontend app
- [ ] /admin hub page renders only for logged-in ADMIN users
- [ ] /admin renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [ ] /admin renders nothing at all for logged-in non-admin users
- [ ] /admin hub page displays links to /admin/users and /admin/roles with descriptive labels
- [ ] /admin hub page displays link back to home (/)
- [ ] isAdmin(user) helper function created to check if user holds ADMIN role
- [ ] Header gains conditional "Admin" navigation link visible only when isAdmin(me.data) is true
- [ ] Header "Admin" link is completely absent for anonymous visitors (no hidden/disabled state)
- [ ] Header "Admin" link is completely absent for logged-in non-admin users
- [ ] Header "Admin" link points to /admin when visible
- [ ] /admin/users back link points to /admin (not directly to home)
- [ ] /admin/roles back link points to /admin (not directly to home)
- [ ] E2E test covers header "Admin" link visibility for logged-in ADMIN
- [ ] E2E test covers header "Admin" link absent for anonymous visitors
- [ ] E2E test covers header "Admin" link absent for logged-in non-admin users
- [ ] E2E test covers navigation: home → /admin (via header Admin link) → /admin/users → back to /admin
- [ ] E2E test covers navigation: home → /admin (via header Admin link) → /admin/roles → back to /admin
- [ ] E2E test covers /admin hub page rendering nothing for anonymous visitors
- [ ] E2E test covers /admin/users and /admin/roles pages rendering nothing for anonymous and non-admin logged-in users
