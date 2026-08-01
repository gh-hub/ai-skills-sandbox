# Implement notes: review/round-1 fix 01 — shared isAdmin(user) helper

## What was built

Extracted the duplicated "is this viewer an admin?" check out of `apps/web/components/admin-gate.tsx` and `apps/web/components/admin-nav-link.tsx` into a single shared helper, matching the existing `canManageAwards(user)` pattern:

- `apps/web/lib/api-client/auth.ts`: added `isAdmin(user: AuthUserDto | null | undefined): boolean`, placed directly after `canManageAwards` (same file, same shape: `if (!user) return false; return user.roles.includes(...)`). Local `const ADMIN_ROLE = "ADMIN"` lives next to this new function.
- `apps/web/components/admin-gate.tsx`: removed its own local `ADMIN_ROLE` constant and inline `me.data.roles.includes(ADMIN_ROLE)` check; now imports `isAdmin` from `@/lib/api-client/auth` and calls `isAdmin(me.data)`.
- `apps/web/components/admin-nav-link.tsx`: same change — removed local constant/inline check, now calls `isAdmin(me.data)`.

The loading/anonymous/non-admin short-circuit order in both components is untouched; only the final role check was swapped out for the shared helper call. Behavior is byte-identical to before.

## Verification done

- `npx tsc --noEmit -p tsconfig.json` in `apps/web` — clean, no errors.
- `npx next build` in `apps/web` — compiles, lints, type-checks, and statically generates all routes (including `/admin`, `/admin/roles`, `/admin/users`) successfully.
- No unit/component test suite exists for `apps/web` (no `*.spec.ts`/`*.test.ts` files there) — nothing to run at that level.
- Did **not** run the full live Docker e2e suite for this ticket. Rationale (also recorded in the ticket file itself): review round 1's `findings.md` already shows the admin-visibility e2e specs (`admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts`) failing for reasons that are unrelated to this ticket's change and are the explicit subject of two other round-1 fix tickets: `05-fix-e2e-email-length-bug` (email local-part length bug in two admin specs) and `06-fix-admin-badge-locator-regression` (header locator regression in `auth-flow.spec.ts`). Running the full `docker compose up --build` e2e stack now would still show red for those two unrelated reasons, so it wouldn't add verification signal for *this* ticket's change beyond what tsc/build already confirm (the extracted logic is a verbatim move, not a rewrite).

## What the next session (ticket 02 — role-delete-status-code) needs to know

- This ticket's change is purely in `apps/web` (frontend). It does not touch anything ticket 02 will touch (`apps/api` role-delete status codes), so there's no overlap/conflict risk.
- **Recommend a single full live e2e run once tickets 05 and 06 are also done** — at that point all three known e2e blockers (email-length bug, locator regression, plus this ticket's refactor which needed no e2e fix) will be resolved together, giving one clean signal instead of three partial ones. Don't burn a Docker Desktop cycle running the full stack before then; see CONTEXT.md gotchas about Docker Desktop instability observed during ticket 06's live verification.
- Docker was responsive and healthy as of this session (`docker info` succeeded) — the earlier instability noted in ticket 06's notes appears to have resolved itself (or Docker Desktop was restarted since), but a restart may still be needed if it recurs before the recommended full e2e run above.
- No new coding-rules gotchas were discovered — this ticket was a small, mechanical extraction with no surprises.
