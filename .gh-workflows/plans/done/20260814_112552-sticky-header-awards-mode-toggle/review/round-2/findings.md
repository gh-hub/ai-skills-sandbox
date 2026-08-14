# Review round 2 — findings

Diff reviewed: `git diff HEAD -- apps/` (run from repo root; this plan's base branch equals the current branch, so a branch-vs-branch diff would be empty).

## Spec match

**(c) Wrong: home-page initial load can briefly render the login control visible instead of hidden**

Spec: *"`HeaderAuthControl`: on the home page only, stays hidden until the hero card has fully scrolled out of the viewport, then fades in."*

`HeroVisibilityProvider` (`apps/web/lib/hero-visibility-context.tsx`) initializes `heroVisible` via `useState(false)`. That default is deliberate and correct for every *non*-home route (no hero exists there, so "hero not visible" → "show login" with zero extra wiring — an explicit spec requirement). But on the home route specifically, the hero genuinely *is* on screen at mount time, so the correct initial state there is "hero visible" (hide login) — not the generic default. `SiteHeader`'s `heroVisible ? hide : show` ternary reads the default before `useReportHeroVisibility`'s `IntersectionObserver` fires its first (asynchronous) callback, so there's a real, if brief, window — including in the server-rendered/pre-hydration HTML, since both components are client components — where the login control renders visible on `/` before flipping to hidden. The prior `sticky-header.tsx` didn't have this problem because its own local `visible` state defaulted to "hidden" for the whole bar. This is a regression introduced by the new context's default serving two routes' opposite needs with one shared boolean.

**(b) Scope creep: debug console-forwarding left in the new e2e test**

Spec's Testing Decisions describe `home-header-scroll.spec.ts`'s coverage as: "navigate to `/`, assert login is hidden ... scroll back up, assert it hides again" — nothing about capturing browser console output. The shipped file includes:
```js
page.on("console", (msg) => console.log("BROWSER:", msg.text()));
```
Unrequested debug instrumentation left over from investigation, not part of the described test coverage.

**(a) Missing/partial**

None. All Implementation/Testing Decisions items (SiteHeader creation/mount, sticky-header.tsx deletion, HeroVisibilityContext + provider wiring, per-route login-visibility behavior, and all e2e spec updates including `story-feed-avatars.spec.ts` and `home-header-scroll.spec.ts`) are present in the diff and match.

## Security

No findings. Reviewed the full round-2 diff — all changes since round 1 are the 3 fix-ticket edits (a test assertion addition, two `spec.md` documentation updates) plus what round 1 already covered. No backend/API/auth-logic files touched; consistent with round 1's clean result.

## Check gate

| Check | Result |
|---|---|
| Lint | N/A — no lint tooling configured in this repo |
| Typecheck (`apps/web && npx tsc --noEmit`) | Pass |
| Build (`apps/web && npx next build`) | Pass — 8/8 static pages, no warnings |
| Unit/integration tests | N/A — no component/unit test framework exists in `apps/web` |
| E2E (`apps/e2e && npm test`) | Pass — 59/59, reused from the round-1 fix session's rerun (no code changed since); not rerun fresh in this gate |

## Verdict

**FAIL** — 2 spec-match findings (1 real regression: brief flash-of-wrong-content on home-page load; 1 leftover debug instrumentation in a test file). No security findings, all applicable checks pass.
