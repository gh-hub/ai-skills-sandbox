# Implement review-round-2 fixes — notes

Both round-2 fix tickets implemented in one session.

## Ticket 01 — home-load flash fix

**File:** `apps/web/lib/hero-visibility-context.tsx`

Root cause (per findings.md): `HeroVisibilityProvider`'s `heroVisible` state
defaults to `false`, which is correct and load-bearing for every non-home
route (no hero exists there, so "not visible" → "show login" with zero extra
wiring). On the home route the hero genuinely *is* on screen at mount time,
so the correct initial state there is the opposite of the shared default —
and the gap before `useReportHeroVisibility`'s `IntersectionObserver` fired
its first (async) callback let the login control render visible for a brief
window before flipping to hidden.

**Fix:** changed `useReportHeroVisibility`'s effect from `useEffect` to
`useLayoutEffect`, and added a synchronous initial correction before setting
up the observer:

- A small helper, `isHeroOnScreen(element)`, computes the hero's real
  on-screen state via `element.getBoundingClientRect()`, mirroring the
  observer's own `rootMargin: "-40px 0px 0px 0px"` logic: the element counts
  as on-screen once its bottom edge is more than 40px below the viewport top
  (`rect.bottom > 40`) and its top edge hasn't scrolled past the viewport
  bottom (`rect.top < window.innerHeight`) — kept in sync with the observer's
  threshold reasoning by design.
- Inside the (now `useLayoutEffect`) effect, `setHeroVisible(isHeroOnScreen(element))`
  is called immediately, before the `IntersectionObserver` is constructed and
  observing begins.
- `useLayoutEffect` runs synchronously after React commits the DOM but
  *before* the browser paints, so the correct initial value is in state
  before anything is shown on screen — this is what actually prevents the
  visible flash (a plain `useEffect` would still leave a window between paint
  and the effect running).
- The `IntersectionObserver` itself, and its `rootMargin`, are unchanged —
  it continues to own all subsequent scroll-driven updates exactly as before.

**Why the non-home-route default is untouched:** `useReportHeroVisibility` is
only called from `apps/web/app/page.tsx` (the home route). Every other route
never calls it, so `HeroVisibilityProvider`'s `useState(false)` default is
never overridden there — non-home routes still show the login control
immediately with zero extra wiring, exactly as the spec requires.

**Residual SSR/hydration note:** both `SiteHeader` and the home page are
client components (`"use client"`), and the `useLayoutEffect` fix targets the
client-side flash specifically — it eliminates the window between commit and
paint. No `ssr: false`/disproportionate restructuring was needed; the
existing client-component architecture was sufficient for a `useLayoutEffect`
to close the gap.

## Ticket 02 — remove debug logging

**File:** `apps/e2e/tests/home-header-scroll.spec.ts`

Removed the leftover line:
```js
page.on("console", (msg) => console.log("BROWSER:", msg.text()));
```
No other changes to the file were needed.

## Verification

- `apps/web && npx tsc --noEmit` — clean, no errors.
- `apps/web && npx next build` — clean, 8/8 static pages, no warnings.
- `apps/e2e && npm test` — **59/59 passed**, including
  `home-header-scroll.spec.ts` (fade-in on scroll past hero, fade-out on
  scroll back up — confirms the `useLayoutEffect` change didn't regress the
  existing scroll-driven reveal/hide behavior).

Both ticket files' acceptance criteria are checked off in full — no partial
items, no deviations.
