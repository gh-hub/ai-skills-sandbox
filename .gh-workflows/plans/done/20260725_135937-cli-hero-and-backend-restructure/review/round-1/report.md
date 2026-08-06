# Review Round 1

Diff basis: `git diff main` against the uncommitted working tree (staged renames + unstaged edits + untracked new files), per explicit user direction — this plan's work is not yet committed. Scope limited to tickets 01/02/03 (`apps/web/app/page.tsx`; `apps/api/src/apps/likes/**` including untracked `likes.repository.ts`, `likes.repository.spec.ts`, `likes.service.ts`, `likes.service.spec.ts`; `apps/api/src/app.module.ts`; the e2e locator-anchoring edits in `helpers.ts`, `like-flow.spec.ts`, `story-feed.spec.ts` (uncommitted delta only), `story-form-flow.spec.ts`, `smoke.spec.ts`). Excluded as unrelated/pre-existing: `.claude/skills/dev-workflow/phases/grill.md`, `apps/api/tsconfig.json`, and all already-committed content from the prior `likes-feed-redesign` plan.

## Standards

No BLOCK-level issues found. All findings below are DEBT or explicit "fine" confirmations for the two flagged judgment calls.

1. **E2e regex anchoring (helpers.ts, like-flow.spec.ts, story-form-flow.spec.ts, story-feed.spec.ts) — FINE.** `/\d+ likes/` → `/^\d+ likes$/` applied identically in all four files. Correctly disambiguates the like-count text node from the new hero stats line, which would otherwise collide under Playwright strict mode. Consistent, minimal, no leftover unanchored instances.
2. **Hero "traffic-light" dots (`apps/web/app/page.tsx`) — FINE.** Dots wrapped in a single `aria-hidden="true"` container, no interactive roles, sized with Tailwind scale tokens (`h-2.5 w-2.5`, `bg-muted-foreground/30`), consistent with the rest of the box — no inline styles/magic pixel values, no a11y/semantic violation.
3. **[DEBT] Section labels mimic headings without being headings** (`apps/web/app/page.tsx`): `# Tips for saying thanks` and `# What's new` render as `<p className="font-medium ...">`, not `<h2>/<h3>`. They visually read as section headers (terminal/markdown aesthetic) but are invisible to screen-reader heading navigation. Only one real `<h1>` exists in the box, per spec. Judgment call — deliberate stylistic choice, but a real (minor) semantic-HTML gap.
4. **[DEBT] Multiple assertions per test / implementation-detail testing** (`apps/api/src/apps/likes/likes.repository.spec.ts`, `likes.service.spec.ts`, both untracked/new): several tests bundle 3–5 `expect()` calls in one test (e.g. the `insertLike` test checks `db.insert`, `db.values`, `db.returning`, and the result), against the "one assertion per test where possible" rule. The repository spec additionally asserts on Drizzle chain-method calls (`db.where`, `db.orderBy`, `db.limit`, …) rather than purely on observable output — borders on testing implementation details rather than external behavior. Reasonable for a thin persistence class, but not strictly compliant.
5. **Controller/service/repository split — FINE**, matches NestJS standards. `likes.controller.ts` has zero business/persistence logic (each handler is a one-line delegate to `LikesService`). `likes.service.ts` owns orchestration + DTO mapping. `likes.repository.ts` owns all Drizzle/DB access. Dependency direction is correct (controller → service → repository); `LikesService` is not a trivial wrapper.
6. **Relocation hygiene — FINE.** `apps/api/src/likes/` fully removed, no leftover/duplicate files. `app.module.ts` import updated to `./apps/likes/likes.module`. All relative imports inside moved files correctly bumped one level (`../db/...` → `../../db/...`). No new Duplicated Code/Feature Envy/Shotgun Surgery introduced; the pre-existing `reportedHoursSaved` nullable-coalescing duplication between repository and stats util was carried over unchanged from the original controller, not introduced by this diff.

## Spec

Everything checks out cleanly overall — no BLOCK issues. Both Part A (hero) and Part B (backend restructure) closely match the spec.

**(a) Missing/partial:** None found. Repository/service/controller split matches "each doing exactly one Drizzle query and returning raw rows" and "performing all the shaping" exactly. `app.module.ts` import path updated correctly. Old `apps/api/src/likes/` fully removed, confirmed no leftover references to the old module path outside the new location. Unit tests for both repository and service exist and follow mock-and-assert-shape conventions per the Testing Decisions section.

**(c) Implemented-but-wrong:** None found — all requirements verified as correct.

**(b) Scope creep — the two flagged judgment calls:**

1. **[DEBT] e2e regex anchoring in 4 files.** Spec only says: *"`apps/e2e/tests/smoke.spec.ts` is updated so its heading assertion looks for 'Thanks, Claude (code)' instead of 'Thanks, Claude'"* — no mention of touching `helpers.ts`, `like-flow.spec.ts`, `story-form-flow.spec.ts`, or `story-feed.spec.ts`. However this is necessitated by the hero spec itself: the stats line spec text ("{likes} likes · {hours}h saved so far", Solution > A) — given the existing unanchored `/\d+ likes/` locator in `helpers.ts` — would genuinely break Playwright strict-mode matching (two elements matching `/\d+ likes/`). The fix is minimal, mechanical, and required to keep existing e2e tests passing after the hero change — fallout from the change, not unrelated feature work. Flagged as DEBT only because it exceeds the letter of the Testing Decisions section (which names only `smoke.spec.ts`), but it's justified in spirit and necessary for correctness. Not a blocker.
2. **[DEBT] Traffic-light dots.** Not mentioned in the spec's Title bar description ("containing the text 'Thanks, Claude (code)'... no separate hidden or visible heading exists elsewhere"). They're `aria-hidden`, don't affect the `<h1>`/accessibility tree, use only existing tokens, add no dependencies, and are strongly implied by the "CLI's own splash screen" / terminal-window framing in the Problem Statement. Defensible visual-fidelity discretion under the spec's implementation-detail latitude (component structure "left to implementation"), not a clear violation of Out of Scope ("Any further product/design changes... beyond what's specified" is brushed but not crossed, since it reinforces rather than adds new specified copy/behavior). Flagged as DEBT/note only, not blocking.

## Summary
BLOCK findings: 0
DEBT findings: 4
Worst BLOCK: none — no BLOCK findings this round.
