# Context: home-header-login-order

## Plan complete

## What we're building
Retarget the hero-visibility observer to track just the hero's top bar (not the full card), and reorder the site header's Awards + ThemeToggle to appear after the login-control slot when the hero's top bar is visible.

## Key decisions
- Retarget hero-visibility ref to the hero's top bar in `apps/web/app/page.tsx`; no algorithm changes to IntersectionObserver.
- Reorder Awards + ThemeToggle via conditional CSS `order` in `apps/web/components/site-header.tsx`; instant snap, no animation.
- Keep the reserved gap from the hidden login-control slot; don't collapse its width.
- Update and extend e2e coverage in `apps/e2e/tests/home-header-scroll.spec.ts` for the new trigger point and reorder behavior.

## Current state
Phase: review
Completed tickets: 01-retarget-hero-trigger-and-reorder-header
Current ticket: none

## Load this session
- .gh-workflows/plans/20260814_153819-home-header-login-order/spec.md
- .gh-workflows/plans/20260814_153819-home-header-login-order/tickets/01-retarget-hero-trigger-and-reorder-header.md
- .gh-workflows/plans/20260814_153819-home-header-login-order/PROGRESS/notes/implement-01-retarget-hero-trigger-and-reorder-header.md
- Base branch: small-tasks-workflow

## Gotchas
- `heroRef` in `apps/web/app/page.tsx` is used in exactly one other place (`useReportHeroVisibility(heroRef)`), so retargeting it is safe and isolated.
- The login-control slot's hidden state still reserves its layout width (transform/opacity toggle, not unmount), which is intentional and must stay that way.
- The Awards+ThemeToggle reorder in `site-header.tsx` uses Tailwind's `order-last` (order: 9999) on the wrapper when `heroVisible`, and leaves the `header-auth-fade` slot's `order` unset (default 0) — ties are broken by DOM order, which is why the wrapper (Awards+toggle, first in DOM) renders before the slot by default.
- Running the e2e suite requires Docker (`docker compose up --build` for web/api/postgres, per `apps/e2e/playwright.config.ts`'s `webServer`) — this was available and used successfully in the implement session; expect ~1 minute of stack build/startup before tests run.
