# Decisions: Sticky header on scroll

## Decision: Scope — home page only
Decided: The new sticky header only mounts on the home page (`app/page.tsx`).
Why: The trigger (the hero card leaving view) only exists on that page; scoping it there keeps the change simple and avoids inventing behavior for pages that don't have this card.
Alternatives rejected: Site-wide, via the root layout (`app/layout.tsx`).

## Decision: Relationship to the existing top bar — separate, additive element
Decided: The new sticky header is a wholly separate fixed element from the existing always-visible top bar in `layout.tsx` (which has the Awards link and theme toggle). That existing bar is untouched.
Why: The existing top bar is shared across every route (including `/awards`); coupling page-specific scroll logic into it would complicate a shared layout component for no benefit.
Alternatives rejected: Merging into / changing the appearance of the existing top bar once the hero card scrolls out of view.

## Decision: User info content — reuse `HeaderAuthControl` as-is
Decided: The sticky header renders the existing `HeaderAuthControl` component (avatar, Admin link, role badges, Log out button) unmodified for its user-info section.
Why: Avoids duplicating auth logic/state, and keeps the sticky header's user info visually and behaviorally consistent with what's already in the hero card.
Alternatives rejected: A simplified version showing just avatar + name.

## Decision: Trigger point — fully scrolled out
Decided: The sticky header appears only once the hero card has fully scrolled above the viewport (the card's bottom edge has passed the top of the screen), not as soon as the card's top edge starts leaving.
Why: Gives a clean handoff feel with no overlap between the hero card's own header row and the new sticky header.
Alternatives rejected: Triggering as soon as the top edge of the card leaves the viewport (while most of the card is still visible).

## Decision: Implementation approach — native `IntersectionObserver`, no new dependency
Decided: Use a native `IntersectionObserver` (via a small custom hook) watching a ref placed on the hero card element to detect when it leaves/re-enters the viewport. Animate the sticky header's appearance with a CSS transition (Tailwind classes — slide + fade), not a JS animation library.
Why: An environment lookup (`package.json`) confirmed no animation library (e.g. framer-motion) or intersection-observer package (e.g. react-intersection-observer) is currently installed in `apps/web`; adding one was explicitly ruled out as unnecessary for this scope.
Alternatives rejected: Adding framer-motion or react-intersection-observer as a new dependency. A scroll-position/pixel-threshold listener instead of IntersectionObserver (less robust, more perf-sensitive).
