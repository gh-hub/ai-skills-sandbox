# Spec & Tickets: Sticky header on scroll

## Spec summary

See [../../spec.md](../../spec.md) for the full specification.

A sticky header that fades and slides into view once the "Thanks, Claude (code)" hero card has fully scrolled above the viewport on the home page, showing the project name ("Thanks, Claude") and reusing the existing `HeaderAuthControl` component as-is for user info. The header fades/slides back out if the user scrolls back up to where the hero card is visible.

**Key implementation points:**
- New component: `apps/web/components/sticky-header.tsx` with a co-located `useIsScrolledPast` hook using native `IntersectionObserver`
- Wired into `apps/web/app/page.tsx` with a ref on the hero card and conditional visibility prop
- No changes to `apps/web/app/layout.tsx`'s existing top bar (Awards link + ThemeToggle)
- No new npm dependencies
- Per ADR-001, establishes the native-IntersectionObserver pattern for future scroll-triggered UI

## Ticket breakdown

**1 ticket, ready to start:**

[01 — Add sticky header with scroll-triggered visibility](../../tickets/01-scroll-triggered-sticky-header.md)
- Full vertical slice: hook, component, wiring, and e2e test
- Checklist of 6 acceptance criteria covering the hook, component, page wiring, unchanged top bar, no dependencies, and e2e test coverage

## What's next

Implement ticket 01. The e2e test should follow the existing pattern in `apps/e2e/tests/dark-mode-toggle.spec.ts`.
