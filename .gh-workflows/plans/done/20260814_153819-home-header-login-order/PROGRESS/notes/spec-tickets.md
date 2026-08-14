# Session end-state: spec + tickets

## Summary

The spec defines two coordinated changes to the home page's header behavior: (1) Retarget the hero-visibility IntersectionObserver to track only the hero's top bar (the dots/title/in-card login strip) instead of the entire hero card, so the site header's login control fades in as soon as that top bar scrolls out of view; and (2) Conditionally reorder the Awards link and mode toggle via CSS `order` — when the hero's top bar is visible (hero-visibility false), they appear after the login-control slot; when it's hidden (hero-visibility true), they snap back before it, matching today's default layout. No animation on the reorder, and the login-control slot's reserved width stays constant in both states.

Single ticket drafted and approved:

**Ticket 01 — Retarget hero-visibility trigger to the hero's top bar and reorder Awards/mode toggle accordingly**
- Blocked by: None
- What it delivers: Moves `heroRef` in `apps/web/app/page.tsx` from the outer hero card div to the hero's inner top-bar div; adds conditional CSS `order` styling to the Awards + ThemeToggle group in `apps/web/components/site-header.tsx` driven by `heroVisible`; updates the scroll trigger in `apps/e2e/tests/home-header-scroll.spec.ts` to target the hero's top-bar element's position/height; adds assertions verifying the Awards/toggle's horizontal order flip matches the hero-visibility state.

No escalation — approved as one ticket (under the 2-ticket cap for quick-workflow).

## Next phase

Implement ticket 01: move the `ref`, add conditional `order` styling, and update/extend e2e coverage.
