# Session end-state: tickets

## What happened
Wrote the ticket breakdown for `user-roles-permissions` to `tickets/`, six tickets in dependency order:

1. `01-roles-data-model.md` — Roles data model: `role` enum, `user_roles` join table, migration, roles-lookup method on `UsersRepository`. Blocked by: none.
2. `02-jwt-shared-types.md` — JWT & shared-type roles claim: `roles: string[]` threaded through `SessionTokenPayload`/`AuthUser`/`MeResponse`/`AuthUserDto`, `buildSession()`/`verifySessionToken()` updated. Blocked by: 01.
3. `03-roles-guard.md` — RolesGuard + award-route guarding: `@Roles(...)` + `RolesGuard`, applied to `POST/PATCH/DELETE /awards`, full 401/403/200 integration-test matrix. Blocked by: 02.
4. `04-frontend-gating.md` — Frontend gating foundation: shared "can manage awards" helper, three-way create-section branch, gated row icons, header role badges, back-to-home link, fix for the e2e test that assumed a fresh signup can create awards. Blocked by: 03.
5. `05-award-edit-flow.md` — Award edit flow: `useUpdateAward()`, gated edit icon, pre-filled modal, double-confirm before `PATCH`, e2e coverage. Blocked by: 04.
6. `06-award-delete-flow.md` — Award delete flow: `useDeleteAward()`, gated delete icon, confirm modal, e2e coverage. Blocked by: 04.

Acceptance criteria in each ticket were pulled from `spec.md`'s Implementation Decisions and Testing Decisions sections (exact enum values, unique constraint, cascade delete, no-seed-data migration; exact 401/403/200 guard matrix and routes; exact double-confirm edit step; etc.), not generic restatements of the titles.

## What's next
Implement ticket 01 (`tickets/01-roles-data-model.md`) — the roles data model. No code has been written yet.
