# 04 — Frontend gating foundation

**What to build:** The awards page and header render differently depending on whether the current visitor is logged out, logged in without a role, or logged in as `ADMIN`/`OPERATOR` — and the existing e2e suite, which currently assumes a fresh signup can create awards, is brought back in line with that reality.

**Blocked by:** 03 — RolesGuard + award-route guarding

**Status:** done

- [x] A single shared "can manage awards" condition is defined — true only when the current user is logged in and their roles include `ADMIN` or `OPERATOR` — and used consistently everywhere gating is needed, so the create form and the row-level icons can't drift out of sync. Implemented as `canManageAwards(user)` in `apps/web/lib/api-client/auth.ts`.
- [x] The create-award section renders as a three-way branch: while the current-user lookup is loading, nothing renders; when logged out, the existing login prompt renders unchanged; when logged in without a qualifying role, nothing renders (not the login prompt — an already-logged-in user should never be told to log in); when logged in with a qualifying role, the create form renders exactly as before.
- [x] The awards list becomes aware of the current user and, on every row, conditionally renders an edit icon/button and a delete icon/button only when the shared gating condition is true; otherwise each row renders exactly as it does today (icon, title, description, given-count — nothing else). Judgment call: the icon buttons render (correct aria-labels, correctly gated) but are intentionally non-functional (no click handlers) — actually wiring them to edit/delete flows is tickets 05/06's stated scope.
- [x] The header shows one small badge per role held by the logged-in user, positioned next to the user's avatar/name, styled as a pill consistent with the existing award-badge convention (rounded, bordered, small text) but without an icon — just the role name.
- [x] A user with no roles sees the header exactly as it looks today — no empty or placeholder badge.
- [x] A logged-out visitor sees the existing login control in the header, unaffected by this feature.
- [x] The awards page gains a "← Back" link above the "Awards" heading that navigates to the home page.
- [x] The existing e2e test that signs up a brand-new user and expects the create form to be visible immediately is fixed — re-scoped into a no-role test (form/icons hidden) and a separate role-granted test (role inserted directly into `user_roles` via psql, then a fresh `/auth/login` call to bake it into a new session cookie, per the "roles only load at login" behavior from ticket 03).
- [x] New/updated e2e coverage confirms: a plain logged-in user with no role sees neither the create form nor any edit/delete icons; a privileged user sees the create form and edit/delete icons on every row; the back link navigates to the home page; role badges appear in the header for a privileged user and do not appear for a plain user. Judgment call: the role-badge coverage lives in `auth-flow.spec.ts` (home page) rather than `awards-page.spec.ts` — discovered during this ticket that `HeaderAuthControl` (and therefore the new role badges) is only rendered on the home page (`app/page.tsx`), not on `/awards`, which has no header auth control at all.
