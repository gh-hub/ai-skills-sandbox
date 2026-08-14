# Requirements: home-header-login-order

## Problem

On the home page, the global site header (fixed at the top of every route) shows a login control that fades in/out based on hero card visibility. Currently, the visibility trigger waits for the ENTIRE hero card (including its long body content: welcome text, tips, stats) to scroll out of view. The user wants this trigger to activate much earlier — as soon as just the hero's top bar (dots, title, and its own login control) scrolls out of view.

Additionally, the site header currently always displays its right-side items in a fixed order: [Awards link] → [ThemeToggle] → [login-control slot]. The user wants: when the hero's top bar is visible (so the header's login control is hidden), the Awards link + ThemeToggle should reorder to appear AFTER the invisible login-control slot. When the login control becomes visible (hero top bar scrolled past), they should revert to their current/default position (before the login-control slot).

## Solution

Two coordinated changes:

1. **Retarget the hero-visibility observer**: Move `ref={heroRef}` in `apps/web/app/page.tsx` from the outer hero card div to the inner top-bar div (the one containing the dots, "Thanks, Claude (code)" title, and its own login control). This makes the IntersectionObserver track only the top bar's visibility, not the entire card's body.

2. **Reorder Awards + ThemeToggle based on login visibility**: In `apps/web/components/site-header.tsx`, conditionally apply CSS flexbox `order` properties to push the Awards link and ThemeToggle after the login-control slot when `heroVisible` is true, and back to their default position when `heroVisible` is false. The reorder is an instant snap, not animated.

## What done looks like

- The site header's login control fades in immediately as soon as the hero's top bar scrolls past the viewport's top edge, not after the hero card's full body scrolls out.
- While the hero's top bar is on screen (login control hidden), Awards + ThemeToggle visually appear at the end of the header's right-side group (after the reserved space for the login control).
- Once the login control becomes visible, Awards + ThemeToggle snap back to their original position (before the login control).
- All existing fade/opacity/transform transitions remain unchanged — only the trigger point and the reordering change.
- Updated e2e tests verify the new trigger point and the reorder behavior.

## Out of scope

- No changes to `HeaderAuthControl`'s own rendering logic (loading/logged-out/logged-in states).
- No changes to the hero card's own in-card login control.
- No changes to the IntersectionObserver threshold math (`-40px`) itself.
- No animated/transitioning reorder for Awards + ThemeToggle — instant snap only.
- No collapsing of the hidden login-control slot's reserved width while hidden.

## Environment notes

### File structure and references

- **Home page**: `apps/web/app/page.tsx`
  - Line ~94: `heroRef` created
  - Line ~100: `useReportHeroVisibility(heroRef)` call — the hook that reports hero visibility to the context
  - Line ~130: outer hero card div (`<div ref={heroRef} className="overflow-hidden rounded-lg border ...">`)
  - Lines 134–146: inner hero top-bar div (`<div className="flex items-center gap-2 border-b ...">`) containing dots, `<h1>Thanks, Claude (code)</h1>`, and a `<HeaderAuthControl />`
  - Lines 148–193: hero body section (welcome text, SparkMark, tips, "what's new", stats)
  - **Current state**: `ref={heroRef}` is on the outer card div (line 130)
  - **Target state**: Move `ref={heroRef}` to the inner top-bar div (lines 134–146)

- **Hero visibility context**: `apps/web/lib/hero-visibility-context.tsx`
  - Exports: `HeroVisibilityProvider`, `useHeroVisibility()`, `useReportHeroVisibility(ref)`
  - Default context value (no ref reporting): `heroVisible: false` — makes every non-home route show `HeaderAuthControl` immediately
  - **Not changing**: The `useReportHeroVisibility` hook uses `useLayoutEffect` + `IntersectionObserver` with `rootMargin: "-40px 0px 0px 0px"` and a synchronous `isHeroOnScreen(element)` check (`rect.bottom > 40 && rect.top < window.innerHeight`). This algorithm remains unchanged; only which DOM element the ref points to changes.

- **Site header**: `apps/web/components/site-header.tsx`
  - Structure: flex row (`flex items-center justify-between`)
  - Left side: "Thanks, Claude" span
  - Right side: `<div className="flex items-center gap-4">` containing:
    1. Awards `<Link>`
    2. `<ThemeToggle />`
    3. `<div testid="header-auth-fade">` wrapping `<HeaderAuthControl />`
  - **Current behavior**: The login-control wrapper applies `-translate-y-full opacity-0 pointer-events-none` when `heroVisible` is true, and `translate-y-0 opacity-100` when `heroVisible` is false, with a 300ms transition
  - **Not changing**: The fade mechanics, transitions, or width reservation (hidden div still reserves layout space)
  - **Changing**: Add conditional CSS `order` properties to reorder Awards + ThemeToggle when `heroVisible` changes

- **Header auth control**: `apps/web/components/header-auth-control.tsx`
  - Not being changed. Renders null while loading, an `<AuthModal />` if logged out, or avatar/roles/logout if logged in.

- **E2E tests**: `apps/e2e/tests/home-header-scroll.spec.ts`
  - Currently does `window.scrollTo(0, document.body.scrollHeight)` to trigger the fade (assumes full-page scroll is needed)
  - **Must be updated**: Scroll target must change to a smaller amount that clears only the hero's top bar (not the full page)
  - **Needs new assertions**: Verify Awards + ThemeToggle are positioned after the login-control slot when login is hidden, and revert to default position when login is shown

### Actors and visibility

- **Actors**: Any visitor to the home page (authenticated or not)
- **Behavior is not authenticated-only**: The fade and reorder happen regardless of login state (HeaderAuthControl renders either an AuthModal trigger or logged-in UI, but this task doesn't touch that logic — only when/where the wrapper is visible)
