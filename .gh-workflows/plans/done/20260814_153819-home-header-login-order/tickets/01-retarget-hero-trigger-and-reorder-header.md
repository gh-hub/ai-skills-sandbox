# 01 — Retarget hero-visibility trigger to the hero's top bar and reorder Awards/mode toggle accordingly

**What to build:** On the home page, the site header's login control should fade in as soon as the hero's own top bar (the strip with the traffic-light dots, "Thanks, Claude (code)" title, and its own login control) scrolls out of view — not after the entire hero card (including its body content) scrolls past. Additionally, when the site header's login control is hidden (hero top bar still visible), the Awards link and mode toggle should appear at the end of the header's right-side group, after the login control's slot; when the login control is shown, they should be back in their current default position (before the login control's slot), exactly as today. The reorder is an instant snap, not animated.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `apps/web/app/page.tsx`: `ref={heroRef}` is moved from the outer hero card div to the hero's inner top-bar div (the one containing the dots, the h1 title, and its own `HeaderAuthControl`). `useReportHeroVisibility`'s own logic in `apps/web/lib/hero-visibility-context.tsx` is unchanged.
- [x] `apps/web/components/site-header.tsx`: Awards link and `ThemeToggle` are grouped and given a conditional CSS `order` based on `heroVisible` — ordered after the login-control slot (`header-auth-fade` wrapper) when `heroVisible` is `true`, and before it (today's default position) when `heroVisible` is `false`. No animation applied to the reorder. The login-control slot's existing fade/translate/width-reservation behavior is untouched.
- [x] Scrolling the home page just past the hero's top bar (without needing to scroll past the hero's full body content) causes the site header's login control to fade in; scrolling back up makes it fade out again.
- [x] While the site header's login control is hidden, the Awards link and mode-toggle button render after the login-control slot in the header's visual/horizontal order; once the login control is shown, they render before it again.
- [x] `apps/e2e/tests/home-header-scroll.spec.ts` is updated: the scroll trigger no longer scrolls to `document.body.scrollHeight` — it scrolls to a target computed from the hero's top-bar element's own position/height instead, matching the new trigger point.
- [x] `apps/e2e/tests/home-header-scroll.spec.ts` (or a new spec file) has new assertions verifying the Awards link and mode-toggle button's horizontal position relative to the login-control slot flips correctly between the hidden and shown states (e.g. via each element's bounding-box `x`).
- [x] No changes made to `apps/web/components/header-auth-control.tsx`, the hero's own in-card login control, or the IntersectionObserver's `-40px` threshold math.

**Verification:** `apps/web` typecheck (`tsc --noEmit`) passed clean. `apps/e2e` typecheck passed clean. Full e2e run (`docker compose up --build` via Playwright's webServer, then `npx playwright test tests/home-header-scroll.spec.ts`) passed: 2 passed (51.0s).
