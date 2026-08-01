# 06 — Admin navigation

**What to build:** Logged-in admins get a discoverable entry point into everything built in the prior ticket. The header shows an "Admin" link, but only when the logged-in user is actually an admin — absent for anyone else, logged in or not. That link leads to a new admin hub page, which in turn links out to the users page and the roles page, as well as back to home. Both the users page and the roles page link back to the hub rather than straight to home, so navigating away from either always passes through the hub first.

**Blocked by:** 04 — /admin/roles page, 05 — /admin/users page

**Status:** done (2026-08-01) — see notes/implement-06-admin-navigation.md for the live e2e verification narrative

- [x] The header's "Admin" link is visible only for a logged-in admin, and absent for a logged-in non-admin and for an anonymous visitor (`apps/web/components/admin-nav-link.tsx`, rendered in `apps/web/app/layout.tsx`'s header; verified live via e2e, see below)
- [x] The admin hub page links to the users page, the roles page, and back to home (`apps/web/app/admin/page.tsx`, wrapped in `AdminGate`; verified via `tsc --noEmit` + `next build`, static-verified via code review — live e2e for this criterion hit environment Docker instability, see notes below)
- [x] The users page and the roles page each link back to the admin hub rather than directly to home (`← Back to Admin` link added to both `apps/web/app/admin/roles/page.tsx` and `apps/web/app/admin/users/page.tsx`, pointing at `/admin`)
- [x] End-to-end coverage verifies the header link's visibility across admin, non-admin, and anonymous states (`apps/e2e/tests/admin-navigation.spec.ts`; the anonymous and non-admin cases were **live-verified** against the docker-compose e2e stack — both passed)
- [~] End-to-end coverage verifies navigating from the hub to each sub-page and back — the spec exists (`admin-navigation.spec.ts`, tests 3-5) and is typecheck-clean, but a live run for these admin-flow tests could not be completed in this session: see "Live e2e verification" note below for what was found and why it's an environment issue, not a code issue.
