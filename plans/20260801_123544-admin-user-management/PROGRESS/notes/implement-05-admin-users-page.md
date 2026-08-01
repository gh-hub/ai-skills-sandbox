# Implement: 05 — /admin/users page

## What was built

- `apps/web/lib/api-client/users.ts` — hand-written `useUsersPage(page, search)`/`useGrantUserRole()`/`useRevokeUserRole()` (React Query + `fetch`) against `/api/users`, same convention as `roles.ts` (generated types don't cover `/users` yet). Page size fixed at 10 (`USERS_PAGE_LIMIT`), grant/revoke invalidate the `["users", "list"]` query key on success.
- `apps/web/components/admin-users-table.tsx` — `AdminUsersTable`: 300ms-debounced search input, results via `useUsersPage`, each user row showing name/email, an `ADMIN` badge (plain, non-interactive) when held, and a toggle `Button` per non-`ADMIN` role sourced from `useRoles()` (the same shared query `admin-roles-list.tsx` uses) — so a role created on `/admin/roles` appears as a toggle here immediately via React Query cache invalidation, no reload needed. Only the specific `userId:roleId` pair being toggled disables during its mutation; pagination via the existing `Pagination` component.
- `apps/web/app/admin/users/page.tsx` — the `/admin/users` route, wrapped in the existing `AdminGate` (reused as-is, not reimplemented).
- `apps/e2e/tests/admin-users-page.spec.ts` — new Playwright e2e coverage.

## Verification

- `npx tsc --noEmit` clean in both `apps/web` and `apps/e2e`.
- `npm run build` in `apps/web` succeeds; `/admin/users` (3.47 kB) prerenders as static alongside `/admin/roles`.
- e2e suite not run live in this session (needs the full docker-compose stack) — ticket 04's notes document a pre-existing e2e-harness boot race affecting any spec that signs up a new user early in a run; worth a live run of both admin e2e specs together once ticket 06 also lands.
- All 3 acceptance criteria in `tickets/05-admin-users-page.md` marked `[x]`.

## Note on this session

Same pattern as tickets 03/04: the implementing sub-agent finished the actual code but stopped short of the plan write-up, ending on a message about waiting for a monitor/e2e notification that doesn't apply here. The conductor session verified the work directly (typecheck + build + reading `admin-users-table.tsx`, `users.ts`, and `page.tsx`) and completed this write-up manually; no code was changed.

## Gotchas for the next ticket (06 — Admin navigation)

- The header is rendered in `apps/web/app/layout.tsx` (`<header className="flex items-center justify-end gap-4 px-6 py-4">`) and currently renders `apps/web/components/header-auth-control.tsx`, which already reads `useMe()` and knows `me.data.roles`. Add the "Admin" link inside (or alongside) that component so it shares the same loading/anonymous null-render behavior already established there, gated on `me.data.roles.includes("ADMIN")`.
- `apps/web/components/admin-gate.tsx` has the canonical ADMIN-check logic (`me.data.roles.includes("ADMIN")`) — reuse the same check/constant for the header link rather than re-deriving it.
- Both `apps/web/app/admin/roles/page.tsx` and `apps/web/app/admin/users/page.tsx` currently have no back-navigation at all — ticket 06 needs to add a link back to the new `/admin` hub on both, plus create `apps/web/app/admin/page.tsx` (the hub itself, linking to both sub-pages and to home `/`).
