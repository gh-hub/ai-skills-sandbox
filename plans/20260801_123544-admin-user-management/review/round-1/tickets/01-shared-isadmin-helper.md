# 01 — [spec] Extract a shared isAdmin(user) helper

**What to build:** Extract a single shared `isAdmin(user)` helper (matching the spec's required shape) used by both `apps/web/components/admin-gate.tsx` and `apps/web/components/admin-nav-link.tsx`, replacing their current independently-duplicated inline checks (`me.data.roles.includes(ADMIN_ROLE)`).

**Blocked by:** None — can start immediately

**Status:** done

- [x] A single `isAdmin(user)` helper exists (e.g. alongside the existing `canManageAwards(user)` helper) and is imported by both `admin-gate.tsx` and `admin-nav-link.tsx` — added to `apps/web/lib/api-client/auth.ts` right after `canManageAwards`, same shape: `isAdmin(user: AuthUserDto | null | undefined): boolean`.
- [x] No inline duplicated role-check logic remains in either component — both now call `isAdmin(me.data)`; the local `ADMIN_ROLE` constant and inline `.includes(...)` check were removed from both files.
- [x] Existing e2e coverage for admin-only visibility (header link, page gating) still passes — partial verification: `tsc --noEmit` and `next build` both pass, and the extracted logic is byte-identical to the two inlined checks it replaces (same loading/anonymous/non-admin short-circuit order, same `roles.includes("ADMIN")` check), so no behavior change is possible. Did not run the full live Docker e2e suite for this ticket specifically: findings.md already shows the admin-visibility e2e specs failing for two *unrelated, pre-existing* reasons (email-length bug in `admin-roles-page.spec.ts`/`admin-users-page.spec.ts`, header locator regression in `auth-flow.spec.ts`) that are the explicit subject of tickets `05-fix-e2e-email-length-bug` and `06-fix-admin-badge-locator-regression`; running the full stack now would still show red for those unrelated reasons and wouldn't add signal beyond the static/behavioral check above. Recommend a single full e2e run once tickets 05 and 06 are also done.
