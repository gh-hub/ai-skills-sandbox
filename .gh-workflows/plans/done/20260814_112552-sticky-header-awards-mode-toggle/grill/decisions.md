# Decisions: Unified header component

## Decision: One unified header component, not two separate pieces

Decided: Replace both `layout.tsx`'s static top bar and `sticky-header.tsx` with a single unified header component mounted globally in `layout.tsx`. This component is the sole source of truth for all header content and behavior across every route.

Why: The user explicitly wants one true header component, not markup-sharing between two still-separate elements. This provides consistent styling, behavior, and maintenance surface across the entire app, even if it adds implementation complexity (Context plumbing for cross-tree state).

Alternatives rejected: Keep two components (`layout.tsx`'s bar + sticky-header.tsx) with a shared `HeaderControls` sub-component for just the Awards link + theme toggle. This would avoid Context plumbing but wouldn't satisfy the user's request for "one component" — it would still be two separate elements with shared markup inside.

## Decision: Always fixed, on every route, not conditionally fixed

Decided: The unified header is `position: fixed` at the top of the viewport on every route, unconditionally. Every route's content gets top padding added (sized to the header's height) so page content isn't hidden underneath.

Why: The user chose this explicitly, accepting that it touches every route's layout, over the alternative of keeping the header in normal document flow on non-home routes (which would avoid page-padding changes). The user valued full consistency — a truly "always present, always the same" header — over minimizing changes to page layouts.

Alternatives rejected: Conditionally fixed (normal flow on non-home routes, fixed only on home after scroll). This would minimize layout changes but wouldn't provide the consistent, always-present header the user asked for.

## Decision: Content visibility rules — different by route and scroll state

Decided: 
- "Thanks, Claude" + Awards link + theme toggle: always visible immediately on every route, including home. Never hidden.
- `HeaderAuthControl`: on the home page, stays hidden until the hero card has fully scrolled out of the viewport (using the existing `IntersectionObserver` trigger logic), then fades in. On every other route (`/admin`, `/awards`, `/admin/roles`, `/admin/users`), shown immediately from the start, unconditionally.

Why: "Thanks, Claude" + Awards + theme toggle are useful navigation and utility on every page from the start. But login info (avatar, roles, logout) is a secondary affordance that, on the home page, defers to the hero card's own title bar until the hero is off-screen. On other pages, there's no hero card, so showing login info immediately provides context. This split behavior acknowledges the different structure of each route.

Alternatives rejected: Same visibility on all routes (e.g., always show login info everywhere, or always hide it on home). The former would duplicate interactive controls on the home page (hero's login info + header's login info visible simultaneously before scroll). The latter would hide login info on non-home pages where there's no other place to show it.

## Decision: No duplication of HeaderAuthControl on the home page

Decided: The hero card's own `HeaderAuthControl` in its title bar (in `apps/web/app/page.tsx`) stays exactly as-is, unmodified. When the global header's copy fades in (after hero scroll), the hero card is already off-screen, so the two copies are never simultaneously visible.

Why: Both interactive controls exist, but at different visibility windows — the hero's copy when the hero is on-screen, the header's copy when the hero is off-screen. No deduplication work is needed because they're never on-screen together.

Alternatives rejected: Removing the hero's `HeaderAuthControl` to avoid duplication. This would change the hero card (which is fine as an idea), but it was explicitly out of scope and not what the user asked for.

## Decision: React Context for cross-tree state plumbing

Decided: Introduce a new React Context (e.g. `HeroVisibilityContext` / `HeroVisibilityProvider`) that wraps the header and all route children in `layout.tsx`. The home page's scroll-detection hook reports hero visibility into this context via a setter. Every other route ignores it (context defaults to "hero not visible" / "show login").

Why: The header is mounted in `layout.tsx` (ancestor of every route), but the scroll-trigger element (the hero card) only exists inside `apps/web/app/page.tsx` (a descendant route). A descendant needs to communicate upward to an ancestor sibling (the header) about scroll state. React Context is the standard mechanism for this without prop-drilling through every route's tree. Every other route automatically gets "show login" for free by never touching the context.

Alternatives rejected: Keep two components with a shared `HeaderControls` sub-component (avoids Context but doesn't produce "one component"). Global state (e.g., Redux/Zustand) — overkill for a single boolean flag and adds a new dependency. Prop-drilling — would require every route component to accept and pass through hero-visibility props.

## Decision: Delete sticky-header.tsx, fold its logic into the unified header

Decided: Remove `apps/web/components/sticky-header.tsx` entirely. Its `useIsScrolledPast` hook and `IntersectionObserver` logic is evolved and folded into the new unified header component (or a new co-located hook that writes to `HeroVisibilityContext` instead of controlling a local `visible` prop).

Why: `sticky-header.tsx` is a separate component that's being fully replaced by the unified header. Keeping it around creates duplication and maintenance burden. Folding its logic maintains the scroll-trigger behavior (exact same IntersectionObserver pattern) while wiring it to the new architecture.

Alternatives rejected: Keep `sticky-header.tsx` and have `layout.tsx`'s unified header component conditionally render the sticky header on the home page. This would still be "two components" and wouldn't match the user's intent for a single unified component.

## Decision: Page padding for fixed header on all routes

Decided: Every route's content wrapper gets top padding equal to the header's height. This padding is applied at the layout level (likely in `layout.tsx` or as a class on the root content area) and applies to all routes.

Why: With a fixed header covering the top of the viewport, page content (especially headings) would be hidden underneath without padding. Adding padding ensures content is always readable and not covered by the header. This is a standard pattern for fixed headers.

Alternatives rejected: Using `scroll-margin-top` on headings or key elements — less reliable across routes and requires careful application everywhere. Absolute positioning of content below a fixed header without padding — causes content to be hidden.

## Decision: No new npm dependencies

Decided: No new packages are added. React Context is built into React (already in use). `useIsScrolledPast` hook and scroll detection use native `IntersectionObserver` API (same pattern as the prior sticky-header plan).

Why: Keeps bundle size minimal and avoids introducing new external dependencies when native browser APIs and React's built-in features are sufficient.

Alternatives rejected: Adding a state management library (Redux, Zustand, etc.) for cross-tree communication — unnecessary overhead for a single boolean flag.
