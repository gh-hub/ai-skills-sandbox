# Spec session end-state (2026-08-01)

## What was synthesized

`spec.md` was written by synthesizing `grill/requirements.md`, `grill/decisions.md`, `grill/glossary.md`, `grill/ADR-001.md`, and `grill/ADR-002.md`, cross-checked against the prior `plans/done/20260731_194131-user-roles-permissions/` plan (its spec, ADR-001, and the existing `RolesGuard`/`@Roles()`/`AuthUser`/JWT contracts it established) and against a fresh read of the current codebase: `apps/api/src/db/schema.ts`, `roles.guard.ts`/`roles.decorator.ts`, `auth.service.ts`, `users.repository.ts`, the full `AwardsController`/`AwardsService`/`AwardsRepository` stack, and — critically — the existing `LikesController`/`GetLikesQueryDto`/`LikesPageDto` pagination stack, which is this codebase's only prior paginated-list precedent and directly resolves ADR-002's open question (response shape and default page size for `GET /users` now reuse that exact `{items, total, page, limit, totalPages}` envelope and page-size-10/max-100 convention). Frontend conventions were read from `header-auth-control.tsx`, `create-award-section.tsx`, `awards-list.tsx`, `pagination.tsx`, `delete-award-modal.tsx`, and the e2e `helpers.ts`/`global-setup.ts` patterns.

New route shapes, module boundaries, and status-code conventions were decided (not left open) since the grill phase explicitly deferred them to spec:
- New `RolesModule` (list/create/delete roles) — a first-class module now that roles are data, not an enum, unlike the prior plan's choice to fold role reads into `UsersRepository`.
- `UsersModule` gains a controller: `GET /users` (paginated/searchable) plus grant/revoke sub-routes (`POST`/`DELETE /users/:userId/roles(/:roleId)`).
- Full status-code matrix decided for grant/revoke/create/delete, including the ADMIN-lock rejection (400), duplicate-role-name conflict (409), and blocked-by-default role deletion (409 with affected users).
- Frontend gating decided as "render nothing at all" for every admin surface for both anonymous and non-admin logged-in users (narrower than the awards precedent, which shows anonymous visitors a login prompt) — since ADMIN isn't a self-service upgrade.

## Open questions flagged in spec.md's "Further Notes"

1. Case sensitivity / normalization of custom role names (assumed: trimmed, case-sensitive, exact-match uniqueness) — not specified in grill output.
2. Whether grant/revoke should return a body (assumed: `204 No Content`, relying on invalidate-and-refetch) versus returning the updated role set inline.
3. Restated risk (already flagged in ADR-001, not new): migration correctness under the seed → backfill → drop ordering.
4. A genuine gap not called out by ADR-001: the enum-to-table migration breaks two existing test helpers that write directly against the `user_roles.role` column (`awards.spec.ts`'s `grantRole` and e2e `helpers.ts`'s `grantRole`) — flagged so it gets scoped into the migration ticket rather than discovered later as a broken build.

## Next

Tickets phase: break the spec into implementable tickets, starting with the schema migration (since everything else depends on it), then the two new backend modules, then frontend surfaces, then the two flagged existing-test updates.
