# Review round 3 — findings

Diff reviewed: `git diff HEAD -- apps/` (run from repo root; this plan's base branch equals the current branch, so a branch-vs-branch diff would be empty).

## Spec match

No findings. Round-2's two findings re-verified as genuinely fixed:
1. The home-load flash: `useReportHeroVisibility` now calls `setHeroVisible(isHeroOnScreen(element))` synchronously inside `useLayoutEffect`, before the `IntersectionObserver` is even created — runs pre-paint, correctly mirroring the observer's `rootMargin: "-40px 0px 0px 0px"` threshold.
2. No `page.on("console", ...)` debug forwarding remains in any test file.

All spec Implementation/Testing Decisions items confirmed present and correct: `SiteHeader` replaces both old headers, unconditionally fixed on every route, `pt-16` layout padding, correct content order, `HeroVisibilityContext`/`Provider` default and wiring, `sticky-header.tsx` deleted, hero card's own `HeaderAuthControl` untouched, all e2e specs (including `story-feed-avatars.spec.ts` and the `sticky-header.spec.ts` → `home-header-scroll.spec.ts` rename) updated and covering the required behavior. No scope creep, nothing implemented-but-wrong. No `package.json` changes (no new dependencies).

## Security

No findings. Diff confined to UI/test code — no backend/API/auth-logic touched, no secrets/PII, no XSS/injection surface, no new data flow (the round-2 `useLayoutEffect` addition only reads DOM geometry via `getBoundingClientRect()`). Consistent with rounds 1 and 2.

## Check gate

| Check | Result |
|---|---|
| Lint | N/A — no lint tooling configured in this repo |
| Typecheck (`apps/web && npx tsc --noEmit`) | Pass |
| Build (`apps/web && npx next build`) | Pass — 8/8 static pages, no warnings |
| Unit/integration tests | N/A — no component/unit test framework exists in `apps/web` |
| E2E (`apps/e2e && npm test`) | Pass — 59/59, reused from the round-2 fix session's rerun (no code changed since); not rerun fresh in this gate |

## Verdict

**PASS** — no spec-match findings, no security findings, all applicable checks pass.
