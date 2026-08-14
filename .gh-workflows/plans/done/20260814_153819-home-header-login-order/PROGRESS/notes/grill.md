# Grill Phase: home-header-login-order

## What was gathered

**Decision 1: Retarget hero-visibility ref to the hero's top bar** — Move `ref={heroRef}` in `apps/web/app/page.tsx` from the outer hero card div to the inner top-bar div; no changes to the IntersectionObserver algorithm, only which element is observed.

**Decision 2: Reorder Awards + ThemeToggle via conditional CSS `order`, no animation** — In `apps/web/components/site-header.tsx`, conditionally apply flexbox `order` to push Awards/ThemeToggle after the login-control slot when `heroVisible` is true, snapping back to default position when false; instant snap, not animated.

**Decision 3: Keep the reserved gap from the hidden login-control slot** — Do not change the existing fade/width mechanics of the `header-auth-fade` wrapper; it continues to reserve layout width while hidden, leaving a blank gap while the hero's top bar is visible.

**Decision 4: Update and extend e2e coverage** — Update `apps/e2e/tests/home-header-scroll.spec.ts` to change the scroll target from full-page scroll to just clearing the hero's top bar; add new assertions verifying the Awards/ThemeToggle reorder behavior.

## What's next

**Spec phase**: Read `grill/requirements.md` and `grill/decisions.md` to detail the implementation requirements. Define test scenarios, identify all files that need changes, and sketch the exact DOM/CSS modifications needed for the retargeting and reordering. Produce `spec.md` (the spec document) ready for ticket breakdown.
