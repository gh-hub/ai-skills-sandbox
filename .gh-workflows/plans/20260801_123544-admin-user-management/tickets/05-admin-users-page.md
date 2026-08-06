# 05 — Admin users page (`/admin/users`)

**What to build:** a UI page at `/admin/users` (accessible only to logged-in ADMINs) that shows a paginated, searchable list of all users, with their current roles displayed inline and toggles to grant/revoke non-ADMIN roles.

**Blocked by:** 02 — Roles API, 03 — Users API

**Status:** ready

- [x] /admin/users route created in frontend app
- [x] /admin/users renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [x] /admin/users renders nothing at all for logged-in non-admin users
- [x] /admin/users page fetches paginated user list from GET /users with default parameters
- [x] Users list displays user name, email, and currently held roles
- [x] For each user, displays non-interactive ADMIN role badge (reusing existing role-badge visual) if user holds ADMIN role
- [x] ADMIN role badge never appears as a clickable checkbox, even for the logged-in admin's own row
- [x] For each assignable role (every role except ADMIN), displays a checkbox per role per user
- [x] Checkbox reflects current assignment state (checked if user holds role, unchecked otherwise)
- [x] Clicking checkbox to grant a role calls POST /users/:userId/roles with that roleId
- [x] Clicking checkbox to revoke a role calls DELETE /users/:userId/roles/:roleId
- [x] Successful grant/revoke invalidates user list query and refetches immediately (no manual list patching)
- [x] Page refetch picks up newly-created custom roles from /admin/roles without requiring reload or navigation away
- [x] Checkboxes for newly-created custom roles appear in the user list on next page load or query invalidation
- [x] Search input (debounced) allows filtering user list by name or email
- [x] Search updates GET /users request with search query parameter
- [x] Pagination controls use existing Pagination component (same as story feed)
- [x] Pagination allows browsing through pages, respecting page and limit parameters
- [x] /admin/users page has a back link to /admin (not to home)

## Implementation notes (verified by code review, 2026-08-04)

All 19 acceptance criteria above were verified by reading the actual implementation (not by running anything live):
- `apps/web/app/admin/users/page.tsx` — same render-nothing gating as ticket 04's `/admin/roles` (`me.isLoading`/`me.data === undefined` → null, `!isAdmin(me.data)` → null), reusing `isAdmin` from `apps/web/lib/api-client/auth.ts`. Back link → `/admin` (expected 404 until ticket 06 builds the hub — not a bug in this ticket).
- `apps/web/components/users-list.tsx` — 300ms debounced search (`setTimeout`/`clearTimeout` in a `useEffect`), resets to page 1 on search change, renders via the existing `Pagination` component (`apps/web/components/pagination.tsx`), and derives `assignableRoles` by filtering `ADMIN` out of `useRoles()`'s result entirely — so ADMIN can structurally never render as a checkbox for any row, including the admin's own.
- `apps/web/components/user-role-toggle.tsx` — one checkbox per non-ADMIN role; `onChange` calls `useGrantUserRole`/`useRevokeUserRole` (`apps/web/lib/api-client/users.ts`), both of which `invalidateQueries({ queryKey: usersListQueryKeyPrefix })` on success — matches ticket 04's `useDeleteRole` invalidation target exactly (same prefix array, `["users","list"]`).
- **Shared roles cache confirmed**: `users-list.tsx` calls the same `useRoles()` / `rolesQueryKey = ["roles","list"]` (`apps/web/lib/api-client/roles.ts`) as ticket 04's `roles-list.tsx`. A role created via `/admin/roles` invalidates that exact key, so this page's `useRoles()` refetches it too — no extra plumbing needed, confirmed by reading both call sites rather than assumed.
- **Live-update-without-reload mechanism confirmed**: `apps/web/app/providers.tsx` constructs `new QueryClient()` with no overrides, so React Query's default `refetchOnWindowFocus: true` applies — this is what makes the "role created in another tab, checkbox appears on refocus" behavior (and the corresponding e2e test) work, not any bespoke polling/subscription code.
- Types cross-checked against `apps/web/lib/api-client/schema.d.ts`: `UserListItemDto.roles: UserRoleDto[]`, `GrantRoleDto: { roleId }`, `UsersController_getPage` query params (`page?`, `limit?`, `search?`) all match `useUsers`'s call shape.
- `apps/e2e/tests/admin-users-page.spec.ts` (218 lines, 8 tests) was read in full and its assertions line up with the above; it was **not executed**.

## Live e2e verification — DEFERRED

Two prior implementation attempts on this ticket stalled/were killed specifically while trying to bring up the dockerized e2e stack to run this spec live — Docker has been flaky/slow in this sandbox across both attempts (a known issue already noted elsewhere in this plan's history, e.g. ticket 01/02's Docker build-cache gotchas). This session deliberately did **not** touch Docker or attempt any live Playwright run, per explicit instruction, to avoid a third stall.

`apps/web` `tsc --noEmit`, `apps/e2e` `tsc --noEmit`, and `apps/web` `next build` were all run (no Docker involved) and are clean — see below.

**Live e2e for `/admin/users` (`admin-users-page.spec.ts`) is deferred and should be run together with tickets 04 and 06's e2e specs in one combined live pass once ticket 06 (admin navigation — `/admin` hub + header link) is implemented**, rather than attempting a partial run now. Rationale: ticket 06 changes the back-link target's destination page (currently a 404) and adds the header entry point; running the full `/admin` + `/admin/roles` + `/admin/users` suite together after ticket 06 gives one clean signal instead of three partial ones across two more Docker attempts.

## Test/build status

- `apps/web`: `tsc --noEmit` clean; `next build` (static export) clean — confirms `/admin/users` (3.48 kB route) compiles and type-checks correctly.
- `apps/e2e`: `tsc --noEmit` clean (spec file compiles; not executed).
- `apps/api`: untouched by this ticket (frontend-only); not re-run this session.
- No code changes were needed this session — the implementation from the prior (stalled) attempts was already correct on inspection.
