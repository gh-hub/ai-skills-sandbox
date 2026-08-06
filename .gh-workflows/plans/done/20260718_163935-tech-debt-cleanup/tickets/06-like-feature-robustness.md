# 06 — apps/web: Like feature robustness (fetch-failure UX + mutation-state split)

**What to build:** Two related fixes to the like feature's error handling in `page.tsx`. First, a failed like-count fetch shows a distinct "couldn't load" message with a retry control, instead of getting stuck on "loading…" forever. Second, the plain Like button and the story-form submit get independent mutation state, so a failed plain Like click doesn't show a stale error inside the story form (and vice versa).

**Blocked by:** None — can start immediately

**Status:** done

- [x] When `likeCount.isError` is true, the "loading…" fallback is replaced with a distinct message (e.g. "Unable to load like count") instead of falling through the `isLoading || data === undefined` ternary
- [x] A retry control next to that message calls `likeCount.refetch()`
- [x] The existing `role="alert"` banner for `likeCount.isError` is consolidated with the inline message (not shown twice) — exact layout is implementer's call
- [x] `useSubmitLike()` is called twice in `page.tsx`, as two independently-named variables (e.g. `likeSubmit` and `storySubmit`)
- [x] The plain Like button's `onClick` uses only its own instance's `isPending`/`isError`
- [x] The story form's submit handler uses only its own instance's `isPending`/`isError`
- [x] Both instances still invalidate the same `likeCountQueryKey` on success (unchanged in `useSubmitLike`'s own `onSuccess`)
- [x] Manually verified in a browser: simulating a `/likes/count` failure (e.g. stopping the API) shows the distinct error text and a working retry button
- [x] Manually verified in a browser: a failed plain Like click no longer shows an error inside the expanded story form
