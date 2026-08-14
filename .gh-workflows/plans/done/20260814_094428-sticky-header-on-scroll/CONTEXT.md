# Context: Sticky header on scroll

## What we're building
A sticky header that appears once the user scrolls past the 'Thanks, Claude (code)' hero card on the main page, showing user info and the project name.

## Key decisions
1. Scope to home page only (app/page.tsx)
2. Separate, additive sticky element — existing top bar in layout.tsx untouched
3. Reuse `HeaderAuthControl` component as-is for user info
4. Trigger on full card scroll-out (card's bottom edge passes viewport top)
5. Native `IntersectionObserver` API for scroll detection, no new dependencies — see [ADR-001](grill/ADR-001.md)

## Current state
Plan complete.
Completed tickets:
- 01-scroll-triggered-sticky-header (implemented; e2e regression found in review round 1)
- review-round-1-fix-01-fix-duplicate-interactive-header-e2e (implemented; full e2e suite green, 59/59 passed)
Current ticket: none

## Load this session
- PROGRESS/notes/implement-review-round-1-fix-01-fix-duplicate-interactive-header-e2e.md (fix implementation + full verification results)
- review/round-1/tickets/01-fix-duplicate-interactive-header-e2e.md (all 4 acceptance criteria checked off)
- Files changed in this fix round:
  - `apps/web/components/sticky-header.tsx` (added `aria-hidden={!visible}` to root element — only line changed)

## Gotchas
- **Sticky header now correctly excludes itself from the accessibility tree when hidden** — `aria-hidden={!visible}` added to the root element, resolving the duplicate-interactive-control issue. It still stays mounted for the CSS transition; `aria-hidden` doesn't affect visual rendering/transitions.
- **Existing layout.tsx top bar must not be touched** — the new sticky header is a completely separate element (confirmed untouched via `git diff`)
- **No new npm dependencies** — must use native IntersectionObserver and CSS transitions only (confirmed, no lockfile/package.json changes)
- **Trigger point is precise** — card must be fully scrolled out (bottom edge past viewport top), not partially visible
- **No hooks/ folder convention exists yet** — co-locate `useIsScrolledPast` in sticky-header.tsx, not in a new hooks folder
- Typecheck (`npx tsc --noEmit -p apps/web/tsconfig.json`) is clean.
- `next build` passes (8/8 static pages).
- Docker e2e (full Playwright suite via `pnpm test` in `apps/e2e`) is now fully green: 59 passed, 0 failed — including all 33 tests that were broken in review round 1 across `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts`, `story-feed-avatars.spec.ts`, plus `sticky-header.spec.ts` itself. Docker containers confirmed cleanly torn down after the run.
- Review round 2 should re-verify spec match / security / checks are still clean given only a one-line change was made since round 1's otherwise-clean pass.
