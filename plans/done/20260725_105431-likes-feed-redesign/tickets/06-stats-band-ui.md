# 06 — Stats band UI

**What to build:** A stats band section on the landing page, wired to the real `GET /likes/stats` endpoint, showing total likes, reported hours saved, estimated total hours saved (shown with equal visual weight to the reported figure, not primary/secondary), and the percentage of likers who didn't report an hours-saved number.

**Blocked by:** 02 (aggregate stats API), 05 (landing-page hero & footer restructure)

**Status:** ready

- [ ] New client hook (e.g. `useLikesStats`) added in `lib/api-client/likes.ts`, following the existing `useLikeCount` pattern (`openapi-fetch` + TanStack Query, typed via generated `schema.d.ts`, errors thrown via `throwApiError`).
- [ ] Stats band renders: total likes, reported hours saved, estimated total hours saved, and % without hours reported.
- [ ] Reported and estimated hours-saved figures are visually equal-weighted (same size/prominence), not styled as primary/secondary.
- [ ] Loading state (placeholder), error state (message + retry, matching existing `renderLikeCount` pattern), and zero-data state (e.g. no likes yet) are all handled without a broken layout.
- [ ] Submitting a like or a story invalidates the stats query so the band updates immediately, without a manual page refresh.
- [ ] Playwright e2e test added verifying the stats band renders the expected figures against seeded/known data.
