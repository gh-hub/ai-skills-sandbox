# Tickets session end-state (2026-08-04)

## Tickets breakdown

Six tickets derived from spec.md, in dependency order:

1. **01 — Roles schema migration** — new `roles` table (id/name/is_built_in), migration seeding ADMIN/OPERATOR, user_roles.role enum → role_id FK with backfill, findRolesByUserId rewritten, test helpers fixed (awards.spec.ts and e2e helpers.ts grantRole).

2. **02 — Roles API (RolesModule)** — GET/POST/DELETE endpoints for roles, ADMIN-gated, built-in protection, and in-use force-delete with affected-users listing.

3. **03 — Users API (UsersModule controller)** — paginated/searchable GET /users with inline roles, grant/revoke sub-routes, ADMIN lock preventing ADMIN grant/revoke on any user.

4. **04 — Admin roles page (/admin/roles)** — list/create/delete UI, confirm-then-force-if-in-use flow.

5. **05 — Admin users page (/admin/users)** — debounced search, paging, role toggles, live pickup of newly-created roles.

6. **06 — Admin navigation** — header "Admin" link, /admin hub page, back-navigation from both sub-pages to hub, e2e coverage.

## Blocking edges

```
01 (no blockers)
  ├── 02 (blocks 04, 06)
  ├── 03 (blocks 05, 06)
04 (blocks 06)
05 (blocks 06)
06 (no dependents)
```

## Next

Start implementing ticket 01 (roles schema migration) — it unlocks both backend and frontend work since everything downstream depends on the new table and backfill being complete.
