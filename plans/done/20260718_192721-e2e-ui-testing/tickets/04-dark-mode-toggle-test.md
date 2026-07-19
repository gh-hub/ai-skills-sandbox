# 04 — Dark mode toggle test

**What to build:** An e2e test verifying the dark mode toggle switches the theme and that the choice persists across a reload.

**Blocked by:** 01 — e2e workspace foundation

**Status:** ready

- [ ] Test clicks the theme toggle button (located via its accessible name, e.g. "Toggle theme") and asserts the app's appearance/theme state changes (e.g. the resolved theme attribute/class flips between light and dark).
- [ ] Test reloads the page and asserts the previously chosen theme is still in effect (persistence).
