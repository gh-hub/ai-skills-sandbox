# Decisions: home-header-login-order

## Decision: Retarget hero-visibility ref to the hero's top bar

Decided: Move `ref={heroRef}` in `apps/web/app/page.tsx` from the outer hero card div to the inner top-bar div (the one containing the dots, "Thanks, Claude (code)" h1, and its own HeaderAuthControl). No changes to the IntersectionObserver/threshold algorithm in `hero-visibility-context.tsx` — only which element it observes changes.

Why: "Head of the hero" means that top bar specifically, not the hero's full body content. The site header's login should appear as soon as that top bar scrolls past, not wait for the entire (much taller) hero card to clear the viewport.

Alternatives rejected: Changing the visibility algorithm itself (e.g. switching from checking the whole element's bounding box to a scroll-position/sentinel-based check) — rejected because retargeting the existing ref to a shorter element already produces the correct behavior with zero algorithm changes.

## Decision: Reorder Awards + ThemeToggle via conditional CSS `order`, no animation

Decided: In `apps/web/components/site-header.tsx`, group the Awards link and ThemeToggle together (e.g. in a shared wrapper) and apply a CSS flexbox `order` class conditioned on `heroVisible`: pushed after the login-control slot when `heroVisible` is true, back to today's default position (before the login-control slot) when `heroVisible` is false. The reorder is an instant snap, not animated.

Why: Flexbox `order` isn't smoothly animatable across browsers the way opacity/transform is (unlike the existing 300ms login fade), so an instant snap is the pragmatic choice for this small task. Because `heroVisible` defaults to `false` on every non-home route, this reorder behavior is automatically confined to the home page with no separate route check needed.

Alternatives rejected: An animated slide/reflow transition for the reorder — rejected as unnecessary complexity for this task; user confirmed an instant snap is fine.

## Decision: Keep the reserved gap from the hidden login-control slot

Decided: Do not change the existing fade/width mechanics of the `header-auth-fade` wrapper div. It keeps reserving its layout width in the flex row even while translated/faded out, so there will be a blank gap between the header's left content and the reordered Awards+ThemeToggle while the hero's top bar is visible (login hidden).

Why: Minimal-change philosophy — avoids touching the existing, working fade transition mechanics. User confirmed this visual gap is acceptable.

Alternatives rejected: Also collapsing the hidden login-control slot's width to zero so Awards+ThemeToggle sit flush at the true end of the header with no gap — rejected as extra risk to the existing fade-in-place animation, not worth it for this task.

## Decision: Update and extend e2e coverage

Decided: Update `apps/e2e/tests/home-header-scroll.spec.ts`'s scroll target — it currently does `window.scrollTo(0, document.body.scrollHeight)` to trigger the fade, which will need to become a scroll amount that clears just the hero's top bar (not the full page) to match the new, earlier trigger point. Also add new assertion(s) (in that file or a new one) verifying that Awards + ThemeToggle land at the end of the site header's right-side group while the login control is hidden, and revert to their default position once the login control is shown.

Why: The existing test encodes the OLD (full-page-scroll) trigger point as correct behavior; it must change or it will fail/mask the bug fix. No existing coverage exists for the reorder behavior, so it needs new coverage to be tested at all.

Alternatives rejected: Leaving the existing test as-is and only manually verifying — rejected because it directly asserts the behavior being changed and would either break or silently pass without truly testing the new trigger point.
