# 03 — RolesGuard + award-route guarding

**What to build:** The award mutation routes (`POST /awards`, `PATCH /awards/:id`, `DELETE /awards/:id`) are enforced end-to-end so that only an authenticated `ADMIN` or `OPERATOR` can call them, provable purely through API tests, with no dependency on frontend gating.

**Blocked by:** 02 — JWT & shared-type roles claim

**Status:** ready

- [ ] A new `@Roles(...role: string[])` method decorator attaches the list of acceptable roles to a route handler's metadata (standard Nest `SetMetadata`-based pattern), living alongside `require-auth.guard.ts`.
- [ ] A new `RolesGuard` (a `CanActivate` using `Reflector` to read the `@Roles(...)` metadata) behaves as follows: no `@Roles(...)` metadata on the route → allow; `request.user` absent → throw `UnauthorizedException` (401); `request.user` present but its `roles` don't intersect the route's required roles → throw `ForbiddenException` (403); otherwise → allow.
- [ ] `RolesGuard` fully subsumes `RequireAuthGuard`'s job — a route using `RolesGuard` does not also need `RequireAuthGuard` applied.
- [ ] `AwardsController`'s `create` handler is guarded with `@UseGuards(RolesGuard)` + `@Roles('ADMIN', 'OPERATOR')`, replacing its current bare `@UseGuards(RequireAuthGuard)`.
- [ ] `AwardsController`'s `update` and `remove` handlers are newly guarded the same way (`@UseGuards(RolesGuard)` + `@Roles('ADMIN', 'OPERATOR')`) — previously they had no guard at all.
- [ ] `getAll` and `getById` remain completely unguarded — no behavior change for reads.
- [ ] `awards.spec.ts`'s `POST` describe block is extended (or confirmed) to cover: logged-out → 401; logged-in with no role → 403; logged-in with `ADMIN` or `OPERATOR` → success.
- [ ] `awards.spec.ts`'s `PATCH` describe block is extended to cover the same three cases: logged-out → 401; logged-in with no role → 403; logged-in with `ADMIN` or `OPERATOR` → success — replacing today's cases that describe updates succeeding without requiring a logged-in user.
- [ ] `awards.spec.ts`'s `DELETE` describe block is extended to cover the same three cases: logged-out → 401; logged-in with no role → 403; logged-in with `ADMIN` or `OPERATOR` → success — replacing today's cases that describe deletes succeeding without requiring a logged-in user.
- [ ] Tests grant a role to a test-signed-up user by inserting directly into `user_roles` using the test's existing live `db` client — no new test infrastructure is introduced.
