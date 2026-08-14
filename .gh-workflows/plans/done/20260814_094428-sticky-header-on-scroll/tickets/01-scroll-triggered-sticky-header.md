# 01 — Add sticky header with scroll-triggered visibility

**What to build:** A sticky header that fades and slides into view once the "Thanks, Claude (code)" hero card has fully scrolled above the viewport on the home page, showing the project name and the existing user-info control, and fades/slides back out when scrolled back up to the hero card. Full vertical slice: hook, component, wiring into the page, and an e2e test — see `../spec.md` for the complete implementation and testing decisions.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `useIsScrolledPast` hook correctly reports `false` before the hero card has been scrolled to, `false` while it's still (partially or fully) in view, and `true` once it has fully scrolled above the viewport
- [x] `StickyHeader` component renders the project name and `HeaderAuthControl`, hidden by default, and animates in/out via CSS transition (slide + fade) based on the `visible` prop — no abrupt pop-in/out
- [x] Home page (`app/page.tsx`) wires the hero card ref into the hook and renders `StickyHeader` with the resulting visibility state
- [x] The existing global top bar in `app/layout.tsx` (Awards link + ThemeToggle) is untouched
- [x] No new npm dependencies added
- [ ] New Playwright e2e test (`apps/e2e/tests/sticky-header.spec.ts`) covers: header hidden on load, becomes visible after scrolling past the hero card, hides again when scrolled back up — **test was written and ran in the Docker e2e environment, but FAILED.** The first assertion (`expect(stickyHeader).not.toBeVisible()` on load) fails: Playwright's `toBeVisible()` only treats `display:none`/`visibility:hidden`/zero-size elements as hidden, and the `StickyHeader` component hides itself purely via `opacity-0` + `-translate-y-full` + `pointer-events-none` (Tailwind/CSS transform+opacity), none of which Playwright counts as "not visible" — the element still has a non-empty bounding rect. Visually the header does appear to hide/show/animate correctly; this is a mismatch between the hiding technique and the e2e assertion, not necessarily a visual bug. Needs a follow-up in the next implement round: either add a `visibility`/`invisible` toggle (e.g. Tailwind `invisible` class, with a transition-delay so it flips to visible immediately on show and to hidden only after the exit transition completes) so Playwright's visibility check aligns with the CSS animation, or change the e2e assertions to check computed opacity/transform instead of `toBeVisible()`. See `PROGRESS/notes/implement-01-scroll-triggered-sticky-header.md` for full details.
