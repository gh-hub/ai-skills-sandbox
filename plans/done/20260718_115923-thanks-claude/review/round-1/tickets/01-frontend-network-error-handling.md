# 01 — Surface network errors on the like page

**What to build:** `apps/web/app/page.tsx` currently swallows or ignores failures from all three network calls (initial count fetch, like submit, story+hoursSaved submit). Give the visitor a visible signal when a request fails instead of the UI silently looking like it succeeded (or hanging on "loading…" forever).

**Blocked by:** 03 — Like button + story/hours UI (this is a fix to that ticket's code)

**Status:** ready

- [x] `fetchCount`'s `.catch(() => {})` is replaced with something that surfaces the failure to the visitor (e.g. an inline error message) instead of silently leaving the count on "loading…" forever
- [x] `submitLike` calls from `handleLikeClick` and `handleStorySubmit` are awaited/handled — a failed submit shows a visible error instead of the UI proceeding as if it succeeded (form clearing, box collapsing, etc.)
- [x] No error is swallowed with an empty catch block anywhere in this file
- [x] Manually re-verified in a browser: simulate a failed request (e.g. stop the API container) and confirm the visitor sees an error rather than a silent false-success
