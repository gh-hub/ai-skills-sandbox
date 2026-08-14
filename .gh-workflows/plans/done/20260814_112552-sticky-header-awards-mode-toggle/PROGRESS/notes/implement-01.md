# Implement notes: 01 - Global unified header

## What was built
- `apps/web/components/site-header.tsx` — new SiteHeader component, mounted globally, fixed to top of every route. Single source of truth for header content (Awards/theme toggle always visible; login info visibility driven by context).
- `apps/web/lib/hero-visibility-context.tsx` — new `HeroVisibilityContext` + Provider for cross-tree scroll-state plumbing (default state: show login = true, so non-home routes need no extra logic).
- `apps/web/app/layout.tsx` — updated to mount `SiteHeader` and `HeroVisibilityProvider`, with `pt-16` padding applied to page content to account for the fixed header.

## e2e specs updated
- `apps/e2e/tests/admin-navigation.spec.ts`
- `apps/e2e/tests/admin-roles-page.spec.ts`
- `apps/e2e/tests/admin-users-page.spec.ts`
- `apps/e2e/tests/auth-flow.spec.ts`
- `apps/e2e/tests/awards-page.spec.ts`
- `apps/e2e/tests/dark-mode-toggle.spec.ts`
- `apps/e2e/tests/story-feed-avatars.spec.ts`

(Home page hero scroll-wiring and its e2e spec are deferred to ticket 02.)

## Verification results
- e2e: 48/48 tests passed (`cd apps/e2e && npm test` equivalent)
- Typecheck: `npx tsc --noEmit` in `apps/web` clean
- Build: `npx next build` in `apps/web` succeeded, including its internal lint/typecheck step

## Status
Ticket 01 verified complete on 2026-08-14. Proceeding to ticket 02 (home-page hero scroll wiring).
