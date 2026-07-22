# 02 — Web like-count cleanup

**What to build:** `apps/web/app/page.tsx`'s like-count rendering is flattened out of a nested ternary so its three states (error / loading / loaded) are easy to scan independently, the retry control after a failed count-fetch matches every other button on the page (shadcn `Button` instead of a bare `<button>`), and `apps/web/lib/api-client/likes.ts`'s two duplicated `console.error` + throw blocks share one helper that attaches the original error as `{ cause }`.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/web/app/page.tsx`'s error/loading/data rendering for the like count uses early returns (or an equivalent small render helper) instead of a nested ternary — same three branches, same markup, no behavior change
- [ ] The "Retry" control is `<Button onClick={() => likeCount.refetch()} ...>Retry</Button>` using the already-imported shadcn `Button` component (pick whichever variant reads correctly inline next to the error text), calling the same `refetch()` in the same position
- [ ] `apps/web/lib/api-client/likes.ts` has a shared helper (e.g. `throwApiError(error: unknown, message: string): never`) that does `console.error(error); throw new Error(message, { cause: error });`
- [ ] Both `useLikeCount`'s and `useSubmitLike`'s `queryFn`/`mutationFn` call the shared helper instead of duplicating the two-line block
- [ ] Existing e2e coverage (`like-flow.spec.ts`, `smoke.spec.ts`) still passes, confirming the like count still renders correctly across all three states and submitting a like still works
