# 01 — Global unified header (non-home routes + shared infra)

**What to build:** Build the `SiteHeader` component and `HeroVisibilityContext`/Provider, mount both in `apps/web/app/layout.tsx` replacing the current static `<header>` markup. On every non-home route (`/admin`, `/awards`, `/admin/roles`, `/admin/users`), the fixed header shows "Thanks, Claude", the Awards link, the theme toggle, and `HeaderAuthControl` immediately, with page content padded to clear the now-fixed header. Update the e2e specs that touch these routes' header expectations.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `SiteHeader` component exists, mounted once in `apps/web/app/layout.tsx`, replacing the old static `<header>` markup
- [ ] Header is `position: fixed`, pinned to the top of the viewport, present on `/`, `/admin`, `/awards`, `/admin/roles`, `/admin/users`
- [ ] Header shows, left to right: "Thanks, Claude" — Awards link — theme toggle — `HeaderAuthControl`, on every route
- [ ] `HeroVisibilityContext`/Provider exists, wraps the header and `{children}` in `layout.tsx`, with a default state of "show login" (true)
- [ ] Page content on every route has top padding added so nothing renders hidden beneath the fixed header
- [ ] On `/admin`, `/awards`, `/admin/roles`, `/admin/users`: `HeaderAuthControl` is visible immediately with no scroll interaction required (new behavior vs. today)
- [ ] `apps/e2e/tests/dark-mode-toggle.spec.ts`, `awards-page.spec.ts`, `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts` updated to match the new header markup and login-always-visible behavior on these routes, and passing
- [ ] Typecheck, lint, and build are clean
