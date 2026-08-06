# Glossary: User Roles & Permissions

**ADMIN** — One of the two role values in the new `role` enum. Grants the ability to create, edit, and delete awards. No other distinction from `OPERATOR` in this feature (both are treated identically by `RolesGuard` checks on awards routes).

**OPERATOR** — The other role value in the new `role` enum. Grants the same award create/edit/delete privileges as `ADMIN` in this feature; the two roles exist as distinct values for future differentiation, not because they behave differently here.

**`user_roles`** — New Postgres join table linking `users` to roles: columns `user_id` (FK → `users.id`) and `role` (the new Postgres enum), with a unique constraint on `(user_id, role)` so a user can hold multiple distinct roles but not the same role twice.

**role enum** — A new Postgres enum type (defined via drizzle's `pgEnum`) with values `ADMIN` and `OPERATOR`, used as the type of `user_roles.role`.

**`SessionTokenPayload`** — The shape of the JWT payload built by `buildSession()` and read by `verifySessionToken()` in `apps/api/src/apps/auth/auth.service.ts`. Currently `{ sub, name, email }`; gains a `roles: string[]` claim.

**`AuthUser`** — Shared TypeScript type in `packages/shared-types/src/index.ts` representing the authenticated user shape returned to the frontend (via `GET /auth/me`, i.e. `MeResponse`). Currently `{ id, name, email }`; gains `roles: string[]`.

**`RolesGuard`** — New NestJS guard (no prior precedent in this codebase) that checks the roles required by an `@Roles(...)` decorator against `request.user.roles`. Applied route-by-route via `@UseGuards(RolesGuard)`, matching the existing style of `RequireAuthGuard`. Returns 401 if there's no authenticated user at all, 403 if the user is authenticated but lacks the required role.

**`@Roles(...)`** — New method/route decorator (paired with `RolesGuard`) declaring which role(s) are acceptable for a route, e.g. `@Roles('ADMIN', 'OPERATOR')`.

**`RequireAuthGuard`** — Existing route-level guard (`apps/api/src/apps/auth/require-auth.guard.ts`) that throws `UnauthorizedException` if `request.user` is absent. `RolesGuard` composes with the same auth check rather than replacing it.

**`CurrentUserGuard`** — Existing global guard (registered via `APP_GUARD`) that populates `request.user` (or leaves it null) on every request, non-blocking. Runs ahead of any route-level guard like `RequireAuthGuard` or the new `RolesGuard`.

**stale session** — A JWT cookie issued before this feature shipped, lacking the `roles` claim entirely. Treated as `roles: []` at verification time rather than as an error.

**gating** — Frontend term used here for conditionally rendering (fully hiding, not disabling) UI elements based on the current user's login state and roles, e.g. the create-award form and the new edit/delete icons.
