# 07 — Story feed UI with pagination

**What to build:** A story feed section on the landing page, wired to the real `GET /likes` endpoint, displaying story cards (with hours saved shown only when reported) and numbered pagination controls (Prev/Next + page numbers).

**Blocked by:** 01 (paginated story feed API), 05 (landing-page hero & footer restructure)

**Status:** ready

- [ ] New client hook (e.g. `useLikesFeed`, parameterized by page number) added in `lib/api-client/likes.ts`, following the existing hook pattern.
- [ ] Feed renders story cards: story text always shown, `hoursSaved` shown only when present (no fake "0" or placeholder when absent).
- [ ] Numbered pagination controls (Prev/Next + page numbers) navigate between pages using `total`/`totalPages` from the API; current page is visually indicated.
- [ ] Empty state: a page with zero items (no stories yet, or navigating past the last page) shows a clear, non-broken empty state rather than a blank area.
- [ ] Submitting a new story invalidates the feed query (at least page 1, since the feed is newest-first) so it appears without a manual page refresh.
- [ ] Playwright e2e tests added: (a) submitting a story makes it appear in the feed and a like with no story does not appear; (b) navigating between pages via the pagination controls shows different sets of stories.
