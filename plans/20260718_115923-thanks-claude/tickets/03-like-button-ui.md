# 03 — Like button + story/hours UI

**What to build:** The visitor-facing page: a like button with the current running total displayed next to it, and an optional expandable box where a visitor can write a short story and enter hours saved before submitting. This is the end-to-end demoable feature — a visitor loads the page, sees the count, clicks like, and optionally shares more.

**Blocked by:** 02 — Like creation & count API

**Status:** ready

- [ ] On page load, the current total like count is fetched from `GET /api/likes/count` and displayed
- [ ] A like button is visible; clicking it calls `POST /api/likes` (with no story/hoursSaved if the optional box wasn't used) and the displayed count updates to reflect the new total immediately after
- [ ] An expandable box, collapsed by default, lets the visitor enter free-text story and a numeric hours-saved value before liking
- [ ] Submitting the expanded box sends the same `POST /api/likes` call carrying `story` and/or `hoursSaved` — not a separate endpoint — and updates the displayed count the same way
- [ ] Both story and hours-saved are optional — liking works with neither field filled in
- [ ] The frontend uses the shared Like type from `packages/shared-types` for its request/response typing rather than redefining the shape
- [ ] All API calls are made relative to the page's own origin (via the nginx `/api/*` proxy) — no hardcoded backend host
- [ ] Clicking like multiple times (e.g. across repeated clicks) is allowed and each click is reflected in the count — no client-side dedup or disabling after first click
- [ ] Manually verified end-to-end in a browser against the full Docker Compose stack (no automated frontend tests required per spec)
