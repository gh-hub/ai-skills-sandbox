# 06 — Admin navigation

**What to build:** the `/admin` hub page and header navigation link, connecting the admin surfaces together with consistent back-navigation and ADMIN-only visibility.

**Blocked by:** 04 — Admin roles page, 05 — Admin users page

**Status:** done

- [x] /admin route created in frontend app
- [x] /admin hub page renders only for logged-in ADMIN users
- [x] /admin renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [x] /admin renders nothing at all for logged-in non-admin users
- [x] /admin hub page displays links to /admin/users and /admin/roles with descriptive labels
- [x] /admin hub page displays link back to home (/)
- [x] isAdmin(user) helper function created to check if user holds ADMIN role (already existed from ticket 04, reused here — see `apps/web/lib/api-client/auth.ts`)
- [x] Header gains conditional "Admin" navigation link visible only when isAdmin(me.data) is true
- [x] Header "Admin" link is completely absent for anonymous visitors (no hidden/disabled state)
- [x] Header "Admin" link is completely absent for logged-in non-admin users
- [x] Header "Admin" link points to /admin when visible
- [x] /admin/users back link points to /admin (not directly to home) — already implemented in ticket 05, only needed `/admin` itself to exist; verified, no code change required
- [x] /admin/roles back link points to /admin (not directly to home) — already implemented in ticket 04, only needed `/admin` itself to exist; verified, no code change required
- [x] E2E test covers header "Admin" link visibility for logged-in ADMIN
- [x] E2E test covers header "Admin" link absent for anonymous visitors
- [x] E2E test covers header "Admin" link absent for logged-in non-admin users
- [x] E2E test covers navigation: home → /admin (via header Admin link) → /admin/users → back to /admin
- [x] E2E test covers navigation: home → /admin (via header Admin link) → /admin/roles → back to /admin
- [x] E2E test covers /admin hub page rendering nothing for anonymous visitors
- [x] E2E test covers /admin/users and /admin/roles pages rendering nothing for anonymous and non-admin logged-in users (already covered by tickets 04/05's own specs — `admin-roles-page.spec.ts` and `admin-users-page.spec.ts` each have anonymous + no-role + OPERATOR "renders nothing" tests; this ticket's new spec added the equivalent coverage for `/admin` itself)

## Implementation notes

- New files: `apps/web/app/admin/page.tsx` (hub page), `apps/e2e/tests/admin-navigation.spec.ts` (9 tests).
- Modified: `apps/web/components/header-auth-control.tsx` (conditional "Admin" link), `apps/e2e/tests/admin-users-page.spec.ts` and `apps/e2e/tests/auth-flow.spec.ts` (bug fixes found during live e2e — see below).
- **Live e2e ran successfully** for the combined tickets 04+05+06 suite (27 admin-specific tests) and the full suite (58 tests, all spec files) — both 100% passing as the final state. This closes out the live-e2e verification that had been deferred twice across tickets 04/05.
- **Real bugs found and fixed during this session's live e2e run** (all in test code, not app code, except where noted):
  1. My own `admin-navigation.spec.ts` had an ambiguous locator: `getByRole("link", { name: "Roles" })` matched both hub cards, because the Users card's own description text ("...grant or revoke their roles.") contains "roles" as a case-insensitive substring, and Playwright's accessible-name computation concatenates all of a link's inner text. Fixed by adding explicit `aria-label="Users"`/`aria-label="Roles"`/`aria-label="Home"` to each hub link in `apps/web/app/admin/page.tsx`, pinning each link's accessible name instead of deriving it from concatenated child text — a small, real component improvement, not just a test workaround.
  2. `admin-users-page.spec.ts`'s `uniqueEmail()` combined a fixed 12-char prefix with a full 36-char UUID and this file's own long marker strings (e.g. `page-marker-<timestamp>-<index>`), pushing several test emails' local parts past RFC 5321's 64-char limit — a real (not simulated) 400 from the backend's `@IsEmail()` DTO. Shortened to an 8-char id, same fix pattern already documented in ticket 04's notes for `admin-roles-page.spec.ts`.
  3. `admin-users-page.spec.ts`'s `createUserViaApi` used `page.request.post("/api/auth/signup", ...)` — since signup responses set a session cookie, and `page.request` shares `page`'s cookie jar, every call silently logged the test's ADMIN out and logged in as the newly created plain user. This broke every assertion after the first `createUserViaApi` call in 4 tests (search, paging, toggle, live-role-focus), since the users-list query started 403'ing under the wrong session. Fixed by switching to the isolated `request` fixture (same precaution admin-roles-page.spec.ts's in-use-role test already documents), threading it through as a parameter instead of `page`.
  4. `admin-users-page.spec.ts`'s `loginAsAdmin` used a fixed literal display name ("Users Page Admin") for every test run. Since this e2e suite's Postgres volume persists across sessions (`global-setup.ts` only truncates `likes`), repeated live runs across sessions accumulated multiple identically-named admin users, and a `li.filter({ hasText: admin.name })` locator eventually became a strict-mode violation once enough historical runs had piled up. Fixed by giving the default name a random 8-char suffix, mirroring why `uniqueEmail()` already exists.
  5. `admin-users-page.spec.ts`'s cross-tab "role created elsewhere" test called `page.bringToFront()` expecting it to fire the `visibilitychange` event React Query's `refetchOnWindowFocus` listens for (confirmed by reading `@tanstack/query-core`'s `focusManager.ts` — it listens for `window.addEventListener("visibilitychange", ...)`). This didn't reliably fire across separate Playwright `Page` targets in headless Chromium (reproduced deterministically across two separate live runs). Fixed by explicitly dispatching `new Event("visibilitychange")` via `page.evaluate` after `bringToFront()`, which exercises the app's actual listener deterministically. Not an app bug — the mechanism itself (`providers.tsx`'s unconfigured, default `refetchOnWindowFocus: true` QueryClient) was already confirmed correct by reading the code in ticket 05.
  6. **Real regression in a pre-existing, unrelated spec**: `auth-flow.spec.ts`'s "a user granted ADMIN sees an ADMIN badge" test used an unscoped `page.getByText("ADMIN")`, which is a case-insensitive substring match. This ticket's new header "Admin" link text now also matches that query for any ADMIN user, causing a strict-mode violation (2 elements: the link and the role badge). Fixed by scoping the assertion to `page.getByRole("list", { name: "Roles" }).getByText("ADMIN")`, which is what the test actually intends to check.
- `apps/web`/`apps/e2e` `tsc --noEmit` clean; `apps/web next build` clean (all 5 routes, including `/admin`, prerender as static). `apps/api tsc --noEmit` clean (untouched, frontend-only ticket, confirmed no regressions).
