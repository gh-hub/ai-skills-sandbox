# Context: user-roles-permissions

## What we're building
User roles (ADMIN/OPERATOR) connected to users via a join table, carried in the JWT, and enforced with a backend guard + frontend UI gating on award create/edit/delete.

## Key decisions
- Roles are `ADMIN`/`OPERATOR` via a Postgres `pgEnum`, joined to users through a `user_roles` table with a unique `(user_id, role)` constraint — see [grill/decisions.md](grill/decisions.md#decision-roles-table-design) and [grill/ADR-001.md](grill/ADR-001.md).
- Roles travel in the session JWT (`SessionTokenPayload.roles: string[]`, `AuthUser.roles: string[]`), refreshed only at login — see [grill/decisions.md](grill/decisions.md#decision-jwt-payload-carries-roles) and [grill/ADR-001.md](grill/ADR-001.md).
- Stale JWTs (no `roles` claim) are treated as `roles: []`; no forced logout on deploy — see [grill/decisions.md](grill/decisions.md#decision-stale-session-handling).
- New `@Roles(...)` + `RolesGuard`, route-level like `RequireAuthGuard` (401 if logged out, 403 if missing role), applied to `POST /awards`, `PATCH /awards/:id`, `DELETE /awards/:id` — see [grill/decisions.md](grill/decisions.md#decision-backend-guard-shape) and [grill/ADR-001.md](grill/ADR-001.md).
- Role assignment (grant/revoke) is out of scope — database-only, no UI/endpoint — see [grill/decisions.md](grill/decisions.md#decision-role-assignment-is-out-of-scope).
- Award edit/delete UI stays on the existing `/awards` page as icons + modals; delete has one confirm step, edit has an extra confirm step beyond the normal submit — see [grill/decisions.md](grill/decisions.md#decision-award-editdelete-ui-stays-on-the-existing-awards-page) and [grill/decisions.md](grill/decisions.md#decision-delete-confirmation-and-double-confirm-edit).
- Create/edit/delete UI is fully hidden (not disabled) unless logged in with `ADMIN`/`OPERATOR` — see [grill/decisions.md](grill/decisions.md#decision-frontend-gating-condition).
- Awards page gets a "← Back" link to `/` above the heading — see [grill/decisions.md](grill/decisions.md#decision-back-button-on-the-awards-page).
- Header shows the logged-in user's roles as small badges next to their name — see [grill/decisions.md](grill/decisions.md#decision-displaying-a-users-roles-in-the-header).

## Tickets
1. `01-roles-data-model` — Roles data model (role enum, `user_roles` table, migration, roles-lookup method)
2. `02-jwt-shared-types` — JWT & shared-type roles claim (`roles: string[]` on session/auth types)
3. `03-roles-guard` — RolesGuard + award-route guarding (`@Roles`/`RolesGuard` on award mutation routes)
4. `04-frontend-gating` — Frontend gating foundation (shared gating helper, create-section branch, header badges, back link)
5. `05-award-edit-flow` — Award edit flow (edit icon, pre-filled double-confirm modal)
6. `06-award-delete-flow` — Award delete flow (delete icon, confirm modal)

## Current state
Plan complete
Phase: review
Completed tickets: 01-roles-data-model, 02-jwt-shared-types, 03-roles-guard, 04-frontend-gating, 05-award-edit-flow, 06-award-delete-flow
Current ticket: none

## Load this session
(none — review phase will load what it needs)

## Spec
[spec.md](spec.md) — full technical spec covering the `user_roles` table + `role` pgEnum migration, JWT `roles` claim, `RolesGuard`/`@Roles(...)` on award mutation routes, frontend gating (create form + edit/delete icons), the edit (double-confirm) and delete confirm modals, the awards-page back link, and header role badges.

## Gotchas
- `drizzle.config.ts` throws if `DATABASE_URL` is unset, even for `drizzle-kit generate` (which doesn't touch a live DB) — export a dummy `DATABASE_URL` for that command if running it outside the usual dev env.
- Migration `0004_hot_mister_fear.sql` adds the `role` enum + `user_roles` table (FK cascade + unique `(user_id, role)`); no seed data, so every user starts with zero roles.
- `UsersRepository.findRolesByUserId(userId: string): Promise<UserRole[]>` (in `apps/api/src/apps/users/users.repository.ts`) is the lookup ticket 02 called for the JWT roles claim; `UserRole` is exported from the same file.
- `packages/shared-types` ships compiled `dist/` (`package.json` `main`/`types` point at `dist/index.js`/`dist/index.d.ts`, not `src/`) — after editing `packages/shared-types/src/index.ts`, run `tsc -p tsconfig.json` inside that package (or the workspace build) before typechecking consumers, or they'll see the stale pre-edit shape.
- `apps/web/lib/api-client/schema.d.ts` (OpenAPI-generated) and `apps/api/openapi.json` were stale relative to the backend (`AuthUserDto` missing `roles`) through ticket 03 — **regenerated in ticket 04** (`AuthUserDto.roles: string[]` now present in both). Regenerate again the same way if the API surface changes further: rebuild `apps/api` (delete `dist/`/`tsconfig.build.tsbuildinfo` first if `nest build` throws a spurious `MODULE_NOT_FOUND` — stale incremental cache), run `node dist/generate-openapi.js` with dummy `DATABASE_URL`/`JWT_SECRET` env vars, then `pnpm --filter web generate:api-types`.
- Roles only get baked into a session JWT at the moment it's issued (signup/login) — granting a role via `db.insert(userRoles)` after a cookie already exists does nothing to that cookie. Any test or flow that needs a role-bearing session must grant the role before the signup/login call that mints its cookie, or re-login afterward. Bit both `awards.spec.ts` and `likes.spec.ts`'s fixture helpers during ticket 03, and the new e2e coverage in ticket 04 (`apps/e2e/tests/helpers.ts`'s `grantRole` + `loginToRefreshSession`).
- `apps/api/src/apps/auth/require-auth.guard.ts` (`RequireAuthGuard`) is now unused dead code — `RolesGuard` replaced its only usage on `AwardsController.create`. Left in place (not asked to delete it in ticket 03); a future cleanup could remove it.
- `HeaderAuthControl` (`apps/web/components/header-auth-control.tsx`) — and therefore the ticket 04 role badges — only renders on the home page (`apps/web/app/page.tsx`). The `/awards` page and the root layout have no header auth control at all; on `/awards`, login/signup is only reachable via `LoginPrompt` → `AuthModal` when logged out. Any future header-related e2e coverage belongs in `auth-flow.spec.ts` (home page), not `awards-page.spec.ts`.
- `apps/web/components/awards-list.tsx` now renders gated (but non-functional, no `onClick`) edit/delete icon buttons per row — `aria-label={"Edit " + award.title}` / `"Delete " + award.title}"`, `variant="ghost" size="icon-sm"`, `lucide-react`'s `Pencil`/`Trash2`. Ticket 05/06 should wire these existing buttons rather than adding new ones.
- (ticket 05) A modal component isn't valid as a direct `<ul>` child even when it's a Radix `Dialog` that portals its actual DOM output to `document.body` — `awards-list.tsx`'s return now wraps the `<ul>` and `<EditAwardModal>` in a fragment (`<>...</>`) rather than nesting the modal inside the `<ul>`. Ticket 06 should add its delete modal as another fragment sibling, same reasoning.
- (ticket 05) `tsc --noEmit -p apps/e2e` fails with `error TS5058: The specified path does not exist: 'apps/e2e'` when run as a relative path from the repo root even though the project exists — use `pnpm --filter @thanks-claude/e2e exec tsc --noEmit` instead (no `-p` needed, the package's own `tsconfig.json` is picked up automatically).
- (ticket 05) For e2e coverage of a mutation that must be gated behind a confirmation step, attach a `page.on("request", ...)` listener filtering by HTTP method + URL substring and assert the captured array's length before/after each step — proves the network call is actually blocked, not just that a UI element is hidden. See the three new tests in `apps/e2e/tests/awards-page.spec.ts` for the pattern; ticket 06 can reuse it for its `DELETE /awards/:id` confirm step.
- (ticket 06) Delete flow shipped: `useDeleteAward()` in `apps/web/lib/api-client/awards.ts`, new `apps/web/components/delete-award-modal.tsx` (single confirm/cancel step, `variant="destructive"` confirm button), and `awards-list.tsx`'s Delete icon now wired with `onClick={() => setDeletingAward(award)}` as a clean sibling addition alongside ticket 05's `editingAward` state — no conflicts, no restructuring of what 05 built. All 6 original implementation tickets are now complete.
- (ticket 06) The awards Postgres volume is **never reset** between e2e runs — only the `likes` table is truncated in `global-setup.ts`; `awards` is seeded once via migration `0003_nice_sir_ram.sql` (7 rows) and never re-seeded or truncated. A test that deletes one of those seeded awards would permanently shrink the fixture set by one on every suite run. Ticket 06's delete e2e test avoids this by creating its own disposable award via the UI create form first, then deleting that — the cancel-delete test is safe to use a seeded award directly since nothing is actually removed. Any future destructive-award test should follow the same "create your own fixture, don't consume the seeded ones" approach.
- (ticket 06) Full e2e suite ran successfully in this environment (Docker available) — 31/31 passing (29 pre-existing + 2 new delete-flow tests). `pnpm --filter web exec tsc --noEmit`, `pnpm --filter @thanks-claude/e2e exec tsc --noEmit`, and `pnpm --filter web build` all clean.
- `apps/api/src/apps/auth/require-auth.guard.ts` (`RequireAuthGuard`) is still unused dead code (superseded by `RolesGuard` in ticket 03) — never removed across tickets 03–06; a candidate for review/round-1 or a future cleanup.
