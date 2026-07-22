# 03 — E2E like-count helper

**What to build:** A single `getLikeCount(page)` helper exists in `apps/e2e/tests/helpers.ts` so the "parse the like count out of the DOM" regex exists in exactly one place instead of being copy-pasted across three call sites.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/e2e/tests/helpers.ts` is created, exporting `async function getLikeCount(page: Page): Promise<number>` that locates the like-count text (`page.getByText(/\d+ likes/)`) and parses the number out of it
- [ ] `apps/e2e/tests/like-flow.spec.ts` imports and uses `getLikeCount` in place of its inline regex parse
- [ ] `apps/e2e/tests/story-form-flow.spec.ts` imports and uses `getLikeCount` in place of both of its inline regex parses (2 call sites)
- [ ] The `likeCount` locator remains available at each call site for the `toContainText` assertions that follow the parse
- [ ] Full e2e suite passes after the refactor
