# Grill phase — Session end-state

Grill phase completed on 2026-08-14.

## What was gathered

- **requirements.md** — problem statement (two separate header pieces, inconsistent across routes), solution (one unified component), actors (logged-in users on any route), done criteria (always-fixed, unified, with route-specific visibility rules), and environment notes confirming existing code structure
- **decisions.md** — 7 confirmed decisions made during the interview:
  1. One unified header component, not two separate pieces (replaces both layout.tsx bar and sticky-header.tsx)
  2. Always fixed on every route, not conditionally fixed (all routes get page padding)
  3. Content visibility rules differ by route and scroll state (Awards/theme always visible; login info hidden on home until scroll, shown elsewhere)
  4. No duplication of HeaderAuthControl on home page (hero's copy + header's copy never simultaneously visible)
  5. React Context (`HeroVisibilityContext`) for cross-tree scroll-state plumbing (home page writes, header reads)
  6. Delete sticky-header.tsx entirely, fold its IntersectionObserver logic into unified header
  7. Page padding for fixed header on all routes
- **glossary.md** — definitions of "Unified header (SiteHeader)", "HeroVisibilityContext", and "HeaderAuthControl"
- **ADR-001.md** — architectural decision record for decision 5 (React Context pattern for cross-tree state, establishing the first app-level Context usage in this codebase)

## What's next

Spec+tickets phase will:
- Define the unified header component structure (SiteHeader component, HeroVisibilityContext provider, context-aware visibility logic)
- Specify the exact Tailwind styling and CSS transitions (slide + fade) for HeaderAuthControl visibility changes
- Confirm class merging utility location (e.g., cn() helper from lib/utils)
- Define page-padding strategy across all five routes (apply at layout level or per-route)
- Identify which e2e test specs need updates due to header markup changes and route-specific login visibility (likely: sticky-header.spec.ts, dark-mode-toggle.spec.ts, awards-page.spec.ts, admin-navigation.spec.ts, admin-roles-page.spec.ts, admin-users-page.spec.ts, auth-flow.spec.ts)
- Create implementation tickets (likely 3+ based on Context plumbing + global page-padding changes + wide e2e blast radius; may trigger escalation checkpoint to gh-dev-workflow if scope exceeds 1-2 tickets)
