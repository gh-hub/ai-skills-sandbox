# Spec: home-header-login-order

## Problem Statement

On the home page, the global site header (fixed at the top of every route) reveals a login control once the hero scrolls out of view. Today that trigger waits for the entire hero card — including its long body content (welcome text, tips, stats) — to scroll past, so a visitor has to scroll much further than necessary before the header offers a way to log in.

Separately, the site header always lays out Awards and the mode (theme) toggle in the same fixed position relative to the login control, whether or not the login control is currently shown. When the login control is hidden (because the hero's top bar is still on screen), Awards and the mode toggle should sit at the end of the header instead of leaving a gap after them.

## Solution

Two coordinated changes to the home page's header behavior:

1. **Earlier trigger point**: The hero-visibility observer starts tracking only the hero's own top bar (the strip with the traffic-light dots, the "Thanks, Claude (code)" title, and its own login control) instead of the entire hero card. The site header's login control now fades in as soon as that top bar scrolls past the viewport's top edge, regardless of whether the hero's body content below it is still visible.

2. **Conditional reorder**: Awards and the mode toggle are grouped and given a conditional position in the header's right-side flex group. While the hero's top bar is on screen (login control hidden), they sit at the end of the header, after the login control's slot. Once the login control becomes visible (top bar scrolled past), they snap back to their current, default position — before the login control. The reorder is an instant snap; no transition is applied to it.

Everything else about the existing fade (300ms opacity/transform transition, the login slot's reserved width while hidden) stays exactly as it is today.

## Implementation Decisions

- **`apps/web/app/page.tsx`**: move the `ref` currently passed to `useReportHeroVisibility` from the outer hero card element to the hero's inner top-bar element (the one holding the dots, title, and in-card login control). No other change to this file.
- **`apps/web/lib/hero-visibility-context.tsx`**: no changes. The IntersectionObserver/threshold logic (`rootMargin: "-40px 0px 0px 0px"`, the `isHeroOnScreen` synchronous check) is reused as-is — only the element it's pointed at changes, in the consuming component.
- **`apps/web/components/site-header.tsx`**: group the Awards link and the mode toggle into a single flex item, and apply a conditional CSS `order` value driven by `heroVisible`:
  - `heroVisible === true` → this group's `order` places it after the login-control slot.
  - `heroVisible === false` (today's default, and the state on every non-home route) → this group's `order` places it before the login-control slot, matching current behavior exactly.
  - The login-control slot itself keeps its current `order` (unset/default) and its existing fade/translate/width-reservation behavior untouched.
- No changes to `apps/web/components/header-auth-control.tsx` or the hero's own in-card login control.

## Testing Decisions

- Test seam: `apps/e2e/tests/home-header-scroll.spec.ts`, scoped to `page.getByTestId("site-header")` — this is already the right seam (asserts on the fixed global header, not the hero's own copy) and needs two changes:
  - Its scroll trigger (`window.scrollTo(0, document.body.scrollHeight)`) changes to scroll just past the hero's top bar instead of the full page, matching the new, earlier trigger point. Compute the scroll target from the hero's own top-bar element's position/height rather than a hardcoded pixel guess, so the test doesn't silently drift if hero markup changes.
  - New assertions verify that, within the site header's right-side group, the Awards link and mode-toggle button appear after the login-control slot in DOM/visual order while it's hidden (hero top bar on screen), and before it once it's shown (scrolled past) — checked via each element's rendered horizontal position (e.g. bounding box `x`), since `order` changes visual position without changing DOM order.
- No new unit tests needed — this is a CSS/layout + observer-target change, best verified end-to-end exactly where the existing test already lives.

## Out of Scope

- Changes to `HeaderAuthControl`'s own rendering logic (loading/logged-out/logged-in states).
- Changes to the hero card's own in-card login control.
- Changes to the IntersectionObserver's threshold math (`-40px`).
- Animated/transitioning reorder for Awards + mode toggle — instant snap only.
- Collapsing the hidden login-control slot's reserved width.

## Further Notes

None — grill output resolved all open questions.
