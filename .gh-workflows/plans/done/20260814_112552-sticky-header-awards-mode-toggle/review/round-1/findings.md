# Review round 1 — findings

Diff reviewed: `git diff HEAD -- apps/` (this plan's base branch equals the current branch, so a branch-vs-branch diff would be empty — the working-tree diff against HEAD is what was under review).

## Spec match

**(a) Missing/partial**

- The rewritten scroll test (`apps/e2e/tests/home-header-scroll.spec.ts`) only asserts the brand text and Awards link are visible pre-scroll, never asserting the theme toggle. Spec's Testing Decisions: "assert login is hidden and brand/Awards/theme are visible before scrolling past the hero card, scroll past it, assert login fades in, scroll back up, assert it hides again." The "theme" assertion is absent from the implementation.

**(b) Scope creep**

- `apps/e2e/tests/story-feed-avatars.spec.ts` is edited (added a `siteHeader()` helper, scroll-past-hero calls) but is not among the files the spec names for ticket 1. Spec's Testing Decisions enumerates: `dark-mode-toggle.spec.ts`, `awards-page.spec.ts`, `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts` — no mention of `story-feed-avatars.spec.ts`. Likely a necessary fix given the real header change (this spec exercises a login flow that the header consolidation affects), but it's outside the spec's enumerated scope and the spec should be updated to reflect it if accepted.
- `sticky-header.spec.ts` was deleted and a differently-named file `home-header-scroll.spec.ts` created, rather than the file being edited in place. Spec's Testing Decisions: "Ticket 2 rewrites `apps/e2e/tests/sticky-header.spec.ts` against the new unified header" — implies editing that file, not a rename.

**(c) Wrong**

- None found. Core mechanics verified against spec's intent: `SiteHeader` is unconditionally `fixed`/mounted once in `layout.tsx` wrapping every route via `HeroVisibilityProvider`; content order is brand → Awards → theme toggle → `HeaderAuthControl` exactly as specified; the context's default (`heroVisible: false`) correctly makes every non-home route show login immediately with zero extra wiring; and the approved `rootMargin: "-40px 0px 0px 0px"` + `isIntersecting` substitution (a documented, user-approved deviation from the spec's literal `bottom < 0` formula, made to fix a real environment-dependent scroll-range bug) correctly reproduces "hidden while hero visible, shown once scrolled past, hidden again on scroll-up."

## Security

No findings. Reviewed `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/components/site-header.tsx` (new), `apps/web/components/sticky-header.tsx` (deleted), `apps/web/lib/hero-visibility-context.tsx` (new), and all seven touched Playwright spec files against the standard vulnerability baseline (injection, auth/session, access control, data exposure, misconfiguration, XSS, deserialization, dependencies, input validation, SSRF, path traversal, crypto, CSRF). This diff is purely frontend UI (header consolidation + scroll-visibility context) plus matching test updates — no backend/API/auth-logic files touched, no exploitable issues introduced.

## Check gate

| Check | Result |
|---|---|
| Lint | N/A — no lint tooling configured in this repo (confirmed by prior implement-session investigation) |
| Typecheck (`apps/web && npx tsc --noEmit`) | Pass |
| Build (`apps/web && npx next build`) | Pass — 8/8 static pages, no warnings |
| Unit/integration tests | N/A — no component/unit test framework exists in `apps/web` (per spec's Testing Decisions) |
| E2E (`apps/e2e && npm test`) | Pass — 59/59, reused from the implement session's rerun at 2026-08-14 15:04 (run twice there for determinism, no flakes); not rerun fresh in this gate since no code changed since that verification |

## Verdict

**FAIL** — 3 spec-match findings (1 missing test assertion, 2 scope-boundary notes). No security findings, all applicable checks pass.
