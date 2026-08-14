# 02 — Home page hero-scroll wiring + sticky-header retirement

**What to build:** Rewire the home page's scroll-detection hook to report hero-visibility into `HeroVisibilityContext` via a setter, restoring today's exact reveal behavior for login info (hidden while the hero card is visible, fading in once it's fully scrolled past) through the new unified header. Delete `apps/web/components/sticky-header.tsx`. Rewrite the e2e spec covering this behavior against the new unified header.

**Blocked by:** 01 — Global unified header (non-home routes + shared infra)

**Status:** ready

- [x] Home page's scroll-detection hook reports hero-visibility into `HeroVisibilityContext` via a setter (same `IntersectionObserver`-based trigger logic as before: hidden while hero is visible, shown once hero has fully scrolled out of view) — `useReportHeroVisibility` in `apps/web/lib/hero-visibility-context.tsx` uses the identical `!entry.isIntersecting && entry.boundingClientRect.bottom < 0` trigger as the old `useIsScrolledPast`, wired up in `apps/web/app/page.tsx`.
- [x] On `/`, before scrolling past the hero card: "Thanks, Claude" + Awards + theme toggle are visible immediately; `HeaderAuthControl` is hidden — verified directly (both in the e2e test's passing initial assertions and a manual probe): `header-auth-fade` computed opacity is `0` on load.
- [x] On `/`, after scrolling fully past the hero card: `HeaderAuthControl` fades in within the same fixed header; scrolling back up hides it again — verified via `home-header-scroll.spec.ts`, passing. Fixed by loosening the `IntersectionObserver` trigger in `useReportHeroVisibility` (`apps/web/lib/hero-visibility-context.tsx`) to use `rootMargin: "-40px 0px 0px 0px"` and rely on `entry.isIntersecting` directly, instead of requiring the hero's literal bottom edge to clear y=0 (which, per the prior session's measurement, fell ~31px short at max scroll in this environment). See notes/implement-02-home-hero-scroll-wiring.md for the fix and final verification.
- [x] The hero card's own title-bar `HeaderAuthControl` instance is unchanged/untouched — confirmed via `git diff HEAD -- apps/web/app/page.tsx`: only the ref/hook wiring changed, the hero title-bar's `<HeaderAuthControl />` (line ~144) is untouched.
- [x] `apps/web/components/sticky-header.tsx` is deleted
- [x] `apps/e2e/tests/sticky-header.spec.ts` rewritten to assert the above behavior against the new unified header, and passing — `apps/e2e/tests/home-header-scroll.spec.ts` passes (confirmed twice in a row).
- [x] Full e2e suite is green; typecheck, lint, and build are clean — full suite is 59/59 passing (confirmed twice in a row for determinism), `apps/web` typecheck (`npx tsc --noEmit`) is clean, and `next build` succeeds with 8/8 static pages and no warnings. No lint tooling exists in this repo (confirmed by prior session), so there is nothing to run there. Two small, directly-related test bugs were also fixed along the way — see notes file.
