# 01 — [spec] Add theme-toggle assertion to home-header-scroll.spec.ts

**What to build:** `apps/e2e/tests/home-header-scroll.spec.ts` currently asserts the brand text ("Thanks, Claude") and the Awards link are visible before scrolling past the hero, but never asserts the theme toggle is visible too — the spec's Testing Decisions require all three ("brand/Awards/theme") to be asserted.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `home-header-scroll.spec.ts` asserts the theme toggle (within `page.getByTestId("site-header")`) is visible before scrolling past the hero card, alongside the existing brand/Awards assertions
- [x] Full e2e suite still green after the change (59/59 passed)
