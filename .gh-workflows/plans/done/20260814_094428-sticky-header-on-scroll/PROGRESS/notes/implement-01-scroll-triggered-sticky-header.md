# Implement notes: 01 — Scroll-triggered sticky header

## What was built

- **`apps/web/components/sticky-header.tsx`** (new)
  - `useIsScrolledPast(ref)` hook: uses a native `IntersectionObserver` on the passed element. Reports `true` only once the observed element is not intersecting *and* its `boundingClientRect.bottom < 0` (i.e. it has fully scrolled above the viewport, not just out of view below or to the side). No new npm dependencies.
  - `StickyHeader({ visible })` component: a `fixed top-0 inset-x-0` bar rendering the "Thanks, Claude" label and the existing `HeaderAuthControl`. Hidden/shown via Tailwind classes toggling `-translate-y-full`/`opacity-0`/`pointer-events-none` vs `translate-y-0`/`opacity-100`, animated with `transition-transform transition-opacity duration-300 ease-in-out`.
- **`apps/web/app/page.tsx`** (edited)
  - Added `heroRef` (`useRef<HTMLDivElement>`) attached to the existing hero card wrapper div.
  - Added `useIsScrolledPast(heroRef)` call.
  - Rendered `<StickyHeader visible={isScrolledPast} />` at the top of the page, above `<main>`.
- **`apps/e2e/tests/sticky-header.spec.ts`** (new)
  - Navigates to `/`, asserts the sticky header text is not visible on load, scrolls `#stats-and-feed` into view (which is past the hero card), asserts the header becomes visible, scrolls back to top, asserts it hides again.
- **`apps/web/app/layout.tsx`**: untouched, confirmed via `git diff` (empty) — the existing top bar (Awards link + ThemeToggle) is unaffected.
- No new dependencies added — confirmed via `git diff` on `package.json`/`pnpm-lock.yaml` (empty).

## Typecheck result

`npx tsc --noEmit -p apps/web/tsconfig.json` → **exit code 0, no errors.**

## E2E result: FAILED (verified, not stuck/timed out)

The Docker Playwright e2e run (`docker:e2e:up` + `apps/e2e` Playwright suite) completed on its own — containers spun up, ran the 1 test, and shut down cleanly (`docker ps -a` confirms all three containers Exited). This was not an environment/infra problem; the test genuinely ran and failed.

Result: **1 failed** — `tests/sticky-header.spec.ts:3:5 › sticky header appears once the hero card scrolls past and hides again on scroll back up`

Failure point: the very first assertion,
```
const stickyHeader = page.getByText("Thanks, Claude", { exact: true });
await expect(stickyHeader).not.toBeVisible();   // <- fails here
```
Playwright reported the element as visible when it was expected to be hidden on initial load.

### Root cause

`StickyHeader` hides itself purely with `opacity-0`, `-translate-y-full` (a CSS transform), and `pointer-events-none`. Playwright's `toBeVisible()` / `not.toBeVisible()` only treats an element as "not visible" when it has `display: none`, `visibility: hidden`, zero opacity is **not** checked by Playwright's actionability visibility algorithm, or an empty bounding box. A `fixed` element translated off-screen via `transform` still has a non-empty (off-viewport) bounding rect and non-zero computed opacity is irrelevant to Playwright's check — so Playwright considers it visible even though a human/browser would see it fully faded out and slid off-screen.

In other words: **the component's visual behavior is very likely correct** (fades/slides as intended), but the hiding technique (opacity + transform only) is invisible to Playwright's `toBeVisible()` assertion, which is what the e2e test (and ticket acceptance criterion) needed to pass.

### Suggested fix for next round (not applied this session — doc-only pass)

Two options, either is reasonable:
1. Add a `visibility` toggle alongside opacity/transform (e.g. Tailwind's `invisible` class), with a `transition-delay` so it becomes `visible` immediately when showing but only becomes `invisible` after the 300ms exit transition finishes when hiding. This keeps the animation and makes Playwright's check agree with the visual state.
2. Keep the component as-is and change the e2e assertions to check the actual CSS state (e.g. `expect(stickyHeader).toHaveCSS("opacity", "0")` or inspect the `translate-y`/class list) instead of `toBeVisible()`.

Recommend option 1, since it's a small, low-risk change and keeps the e2e test's semantics (`toBeVisible`) simple and intuitive for future readers.

## Acceptance criteria status (see ticket file for full detail)

- [x] `useIsScrolledPast` hook logic — correct per code review (full scroll-past detection via `boundingClientRect.bottom < 0`)
- [x] `StickyHeader` renders project name + `HeaderAuthControl`, animates via CSS transition — correct per code review
- [x] Home page wiring (ref + hook + render) — correct per code review
- [x] `layout.tsx` untouched — confirmed via empty `git diff`
- [x] No new npm dependencies — confirmed via empty `git diff` on lockfile/package.json
- [ ] E2E test — written and executed, but **failed** for the reason above. Left unchecked.

## Ambiguities / judgment calls made this session

- The background Docker/Playwright run from the prior session had already completed (containers exited ~18 minutes before this session resumed) — no process was still running or stuck. Retrieved the result from the persisted log (`e2e-run.log` in this session's scratchpad) plus `docker ps -a` rather than re-running the suite, since the log showed a clean, complete run (full docker-compose startup log, the test result, and a graceful shutdown of all containers).
- Did not attempt to fix the identified bug in this session — the resume instructions scoped this session to retrieving the e2e result and finishing documentation, not to further implementation. The bug and a concrete suggested fix are recorded above and in the ticket file so the review phase (or a follow-up implement round) can act on it.
- Typecheck was not part of the original background run; ran it fresh this session (`npx tsc --noEmit -p apps/web/tsconfig.json` from `apps/web`) — passed clean.

## What review/round-1 needs to know

- This ticket is functionally complete except for one known, well-understood e2e failure with a root cause and two concrete fix options already identified above — review should expect this to trigger a loop back to implement for a small CSS/test fix, not a broader redesign.
- All other acceptance criteria (hook logic, component structure, page wiring, layout.tsx untouched, no new deps) check out via direct code inspection.
- Typecheck is clean.
- Docker e2e environment works fine in this environment (`docker:e2e:up` via docker-compose ran to completion) — future e2e verification runs should work the same way; no environment limitation was encountered here.
