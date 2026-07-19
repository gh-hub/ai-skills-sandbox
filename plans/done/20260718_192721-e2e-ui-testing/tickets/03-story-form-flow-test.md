# 03 — Story form flow test

**What to build:** e2e tests verifying the story form's happy path and its validation-error path.

**Blocked by:** 01 — e2e workspace foundation

**Status:** ready

- [ ] Happy path: expanding "Share a story" reveals the form; filling in a valid `story` and/or `hoursSaved` and submitting succeeds — the form resets and collapses (matching the app's existing success behavior), and the displayed like count increases by 1 (a story submission is also a like, per the shared `likes` table).
- [ ] Validation-error path: entering an invalid `hoursSaved` value (e.g. a negative number) shows the form's validation message, blocks submission, and the like count does not change.
- [ ] Both tests use accessible role/label locators (form labels, button text) — no test-ids added to the app.
- [ ] Both tests use delta assertions for the count, consistent with ticket 02.
