# Spec + Tickets: Sticky header awards mode toggle

## Spec Summary

A single unified, always-fixed header component (`SiteHeader`) replaces both the current static top bar in `apps/web/app/layout.tsx` and the home-page-only sticky header (`apps/web/components/sticky-header.tsx`). The new header is mounted once in `layout.tsx`, pinned to the top of the viewport on every route, showing "Thanks, Claude", the Awards link, and the theme toggle immediately on all routes. Login info (`HeaderAuthControl`) is gated by route: on the home page only, it's hidden until the hero card fully scrolls out of view (exact today behavior), then fades in; on all other routes (`/admin`, `/awards`, `/admin/roles`, `/admin/users`), it shows immediately, unconditionally — new behavior. A new `HeroVisibilityContext` and Provider (first app-level React Context) coordinate scroll state from the home page to the global header, defaulting to "show login" so non-home routes need zero extra logic. The home page's hero card's own `HeaderAuthControl` in its title bar remains unchanged.

## Ticket Breakdown

**Ticket 01 — Global unified header (non-home routes + shared infra)**
- Builds `SiteHeader` component and `HeroVisibilityContext`/Provider
- Mounts both in `apps/web/app/layout.tsx`, replacing the old static header markup
- Delivers fixed header on `/`, `/admin`, `/awards`, `/admin/roles`, `/admin/users`, with "Thanks, Claude" + Awards + theme toggle + login always visible on non-home routes
- Updates 6 e2e specs (dark-mode-toggle, awards-page, admin-navigation, admin-roles-page, admin-users-page, auth-flow) to match new markup and always-visible login behavior

**Ticket 02 — Home page hero-scroll wiring + sticky-header retirement**
- Blocked by: Ticket 01
- Rewires home page's scroll-detection hook to report hero-visibility into `HeroVisibilityContext` via setter
- Restores today's exact reveal behavior through the new unified header
- Deletes `apps/web/components/sticky-header.tsx`
- Rewrites `apps/e2e/tests/sticky-header.spec.ts` against the new unified header

## Next Steps

Ticket 01 is starting now.
