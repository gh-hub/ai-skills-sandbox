## Problem Statement

On the home page of this "Thanks, Claude" appreciation app, the hero card at the top ("Thanks, Claude (code)") holds the logged-in user's information (avatar, Admin link, role badges, Log out button) inside its title bar, via the `HeaderAuthControl` component. Once the user scrolls past this card, that user info disappears entirely — there's no persistent way to see who's logged in or what page/app this is once scrolled down the page.

## Solution

Add a new sticky header, mounted only on the home page, that fades and slides into view once the hero card has fully scrolled above the viewport, and fades/slides back out again if the user scrolls back up to where the hero card is visible. It shows the project name ("Thanks, Claude") and reuses the existing `HeaderAuthControl` component as-is.

## Implementation Decisions

- New component `apps/web/components/sticky-header.tsx`:
  - A `fixed top-0 inset-x-0 z-50` bar styled consistent with the existing terminal aesthetic used elsewhere in the app (`border-b border-border bg-card/95 backdrop-blur font-mono text-sm`, `flex items-center justify-between px-6 py-3` or similar).
  - Shows the project name text ("Thanks, Claude") on the left, and `<HeaderAuthControl />` on the right (`ml-auto` or `justify-between`).
  - Always mounted in the DOM (never conditionally unmounted) — visibility is controlled by a `visible: boolean` prop, toggling Tailwind transform/opacity classes: hidden state is `-translate-y-full opacity-0 pointer-events-none`, visible state is `translate-y-0 opacity-100`. Apply `transition-transform transition-opacity duration-300 ease-in-out` (or `cn()` from `@/lib/utils` to compose these conditionally) so the state change animates as a slide + fade rather than an abrupt pop.
- New hook, co-located in the same file `sticky-header.tsx` (no `hooks/` folder convention exists yet in this codebase, so don't invent one for a single hook) — `useIsScrolledPast(ref: RefObject<HTMLElement>): boolean`:
  - Uses the native `IntersectionObserver` API (via `useEffect`) to observe the referenced element.
  - The returned boolean (whether the sticky header should show) is computed as: `!entry.isIntersecting && entry.boundingClientRect.bottom < 0`.
  - This distinguishes "the element has scrolled completely past, above the viewport" (bottom edge above 0) from "the element hasn't been scrolled to yet, it's below the viewport" (also reports `isIntersecting: false`, but `boundingClientRect.bottom` would be greater than viewport height, not negative).
  - Clean up the observer on unmount.
- In `apps/web/app/page.tsx`:
  - Add a `useRef<HTMLDivElement>(null)` attached to the hero card's outer container div (the `overflow-hidden rounded-lg border border-border bg-card font-mono text-sm` div, currently at roughly line 127).
  - Call `useIsScrolledPast(heroRef)` to get the visibility boolean.
  - Render `<StickyHeader visible={isScrolledPast} />` near the top of the returned JSX tree (e.g. just inside the outermost `<div className="flex min-h-screen flex-col">`, before `<main>`).
- No changes to `HeaderAuthControl`'s internals, no changes to `apps/web/app/layout.tsx`'s existing top bar (Awards link + ThemeToggle stays exactly as-is), no changes to any other route.
- No new npm dependencies. `tw-animate-css` is already installed and used elsewhere (e.g. `apps/web/components/ui/dialog.tsx`'s `animate-in`/`animate-out`/`fade-in-0`/`fade-out-0` classes) but is not required here — plain Tailwind transition/transform/opacity utility classes are sufficient and simpler for a manually-toggled (not mount/unmount-based) persistent element.
- Per ADR-001 (already written in `grill/ADR-001.md`), this establishes the native-IntersectionObserver-over-new-dependency pattern for any future scroll-triggered UI in this codebase.

## Testing Decisions

- Add a Playwright e2e test: `apps/e2e/tests/sticky-header.spec.ts`, following the existing pattern in `apps/e2e/tests/dark-mode-toggle.spec.ts` (navigate, interact, assert on locator state).
  - Navigate to `/`.
  - Assert the sticky header is not visible initially (e.g. hero card is in view).
  - Scroll down past the hero card (e.g. `page.evaluate` a scroll, or scroll a marker element below the hero card into view).
  - Assert the sticky header becomes visible.
  - Scroll back up.
  - Assert the sticky header hides again.
- No component/unit test framework exists in `apps/web` today (confirmed during grill — no `.test.tsx`/`.spec.tsx` files, no test runner configured) — the Playwright e2e suite is the right, and only currently available, seam for this behavior.

## Out of Scope

- Any route other than the home page (`apps/web/app/page.tsx`).
- Any change to the existing global top bar in `apps/web/app/layout.tsx`.
- New npm dependencies.
- Changes to `HeaderAuthControl`'s internal logic.

## Further Notes

None.
