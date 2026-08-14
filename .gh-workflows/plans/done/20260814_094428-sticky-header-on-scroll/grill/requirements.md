# Requirements: Sticky header on scroll

## Problem

On the home page of the "Thanks, Claude" appreciation app, the hero card at the top ("Thanks, Claude (code)") holds the logged-in user's information (avatar, Admin link, role badges, Log out button) inside its title bar via the `HeaderAuthControl` component. Once you scroll past this card, that user info disappears entirely — there's no persistent way to see who's logged in or what page/app this is once scrolled down the page.

## Solution

Add a new sticky header that appears once the hero card has fully scrolled out of view. This header will show the project name and reuse the user's info from the hero card, then disappear again if you scroll back up to where the hero card is visible.

## Actors

- Any visitor to the home page (logged in or logged out)
- The `HeaderAuthControl` component already handles both cases: rendering user info when logged in, or an AuthModal trigger when logged out

## Done looks like

- A fixed-position header bar, hidden by default
- Smoothly appears (slide + fade transition, not an abrupt pop) once the hero card ("Thanks, Claude (code)") has fully scrolled above the top of the viewport
  - Specifically: the card's bottom edge has passed the top of the screen — not just its top edge starting to leave
- Smoothly disappears again if you scroll back up such that the hero card becomes visible
- Shows the project name ("Thanks, Claude") and reuses the existing `HeaderAuthControl` component as-is for user info
  - Same auth logic, no duplication
- Avatar, Admin link, role badges, and Log out button all work the same as in the hero card

## Boundaries

- **Only the home page** (`apps/web/app/page.tsx`) gets this new sticky header — no other routes change
- **The existing global top bar** in `apps/web/app/layout.tsx` (Awards link + ThemeToggle, always visible, non-sticky) is NOT touched, merged with, or modified in any way — it stays exactly as it is today
  - The new sticky header is a completely separate, additive element
- **No new npm dependencies** are to be added
- **No changes to `HeaderAuthControl`'s internal logic** — it is reused/rendered as-is inside the new sticky header

## Environment notes

- Hero card markup lives in `apps/web/app/page.tsx` (the `Home` component), roughly lines 126-189 — an `overflow-hidden rounded-lg border border-border bg-card font-mono text-sm` container with a title-bar div (`flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3`) holding three fake "traffic light" dots, an `<h1>` with text "Thanks, Claude (code)", and `<HeaderAuthControl />` at `.ml-auto`.
- `HeaderAuthControl` component: `apps/web/components/header-auth-control.tsx`. Uses `useMe()` and `useLogout()` from `@/lib/api-client/auth`. Returns `null` while loading; renders `<AuthModal />` if logged out (`me.data === null`); otherwise renders a flex row with `UserAvatar`, a conditional Admin link (`isAdmin(me.data)`), a conditional roles list, and a Log out button.
- `apps/web/app/layout.tsx` root layout renders `<Providers>` wrapping a `<header className="flex items-center justify-end gap-4 px-6 py-4">` containing an "Awards" `Link` and `<ThemeToggle />`, followed by `{children}`. This header is NOT sticky/fixed today — it scrolls normally with the page.
- `apps/web/package.json`: no framer-motion, no react-intersection-observer, no similar library. Tailwind CSS v4 (`tailwindcss": "^4.3.3"`) and `tailwind-merge` are used for styling; the codebase's existing convention for merging/conditionally applying classes should be checked at spec time (likely a `cn()` helper — look for `lib/utils` or similar).
