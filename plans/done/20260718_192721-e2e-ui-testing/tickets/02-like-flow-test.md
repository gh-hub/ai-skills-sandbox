# 02 — Like flow test

**What to build:** An e2e test verifying the like flow: clicking the "Like" button increases the displayed like count by exactly 1.

**Blocked by:** 01 — e2e workspace foundation

**Status:** ready

- [ ] Test reads the currently displayed like count before acting.
- [ ] Test clicks the "Like" button (located via its accessible role/name, not a test-id).
- [ ] Test asserts the displayed count updates to `before + 1` (a delta assertion — no assumption about the absolute starting value).
- [ ] Test passes reliably when run after other tests that also affect the shared count (i.e. does not assume it runs first or in isolation).
