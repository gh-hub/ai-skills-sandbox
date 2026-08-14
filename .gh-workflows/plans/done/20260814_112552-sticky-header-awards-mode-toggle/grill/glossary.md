# Glossary: Unified header component

## Unified header (SiteHeader)
The new single header component replacing both `layout.tsx`'s static top bar and `sticky-header.tsx`. Always `position: fixed` at the top of the viewport on every route, showing "Thanks, Claude" (left), Awards link, theme toggle, and conditionally `HeaderAuthControl` (right). The single source of truth for all header content and behavior across the app.

## HeroVisibilityContext
A new React Context that carries whether the home page's hero card has scrolled fully out of the viewport. Wraps the unified header and all route children in `layout.tsx`. The home page's scroll-detection hook writes to this context; the header reads from it. Every other route ignores it, so the context defaults to "hero not visible" / "show login".

## HeaderAuthControl
Existing component showing the logged-in user's avatar, role badges, and logout button. Reused as-is in the unified header (right side, with conditional visibility). Already exists in `apps/web/components/header-auth-control.tsx` and is used today in the hero card's title bar and the sticky header.
