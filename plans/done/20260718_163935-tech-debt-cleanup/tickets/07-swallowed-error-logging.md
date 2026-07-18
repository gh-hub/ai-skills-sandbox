# 07 — apps/web: Swallowed-error logging in api-client

**What to build:** `lib/api-client/likes.ts` logs the real `openapi-fetch` error object before throwing its generic error, so a developer debugging a failed API call isn't stuck with only the generic message.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] Before each `throw new Error(...)` in `lib/api-client/likes.ts`, `console.error(error)` logs the real underlying error object
- [ ] The thrown message and UI-facing text are unchanged
- [ ] Manually verified in a browser: triggering a failed API call (e.g. stopping the API) shows the real error object in the console alongside the existing generic UI message
