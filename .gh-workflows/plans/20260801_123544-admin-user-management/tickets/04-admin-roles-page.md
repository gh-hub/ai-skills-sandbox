# 04 — Admin roles page (`/admin/roles`)

**What to build:** a UI page at `/admin/roles` (accessible only to logged-in ADMINs) that lists all roles, creates new custom roles, and deletes custom roles with a confirm-then-force-if-in-use confirmation flow.

**Blocked by:** 02 — Roles API

**Status:** ready

- [ ] /admin/roles route created in frontend app
- [ ] /admin/roles renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [ ] /admin/roles renders nothing at all for logged-in non-admin users
- [ ] /admin/roles page renders list of all roles fetched from GET /roles
- [ ] Roles list shows role name and built-in status indicator (visual distinction for built-in vs. custom)
- [ ] Create form allows entering a role name and submitting via POST /roles
- [ ] Create form handles 409 duplicate-name error, displays error message to user
- [ ] Create form successfully creates role and updates the roles list immediately
- [ ] Delete control (button or icon) appears only for custom (non-built-in) roles
- [ ] Delete control is completely absent (not disabled, not hidden) for ADMIN and OPERATOR roles
- [ ] Clicking delete on a custom role opens confirmation modal (reuses existing Dialog primitive)
- [ ] Modal shows role name and requests confirmation
- [ ] First confirm button calls DELETE /roles/:id without force flag
- [ ] If API responds with 409 (in-use conflict), modal switches to show affected users list (name + email for each)
- [ ] Modal then shows a force-delete button that retries DELETE /roles/:id with force=true flag
- [ ] Successful delete (with or without force) invalidates both the roles list and the user list queries
- [ ] Page refetches roles list after successful delete, removing the deleted role from view
- [ ] /admin/roles page has a back link to /admin (not to home)
