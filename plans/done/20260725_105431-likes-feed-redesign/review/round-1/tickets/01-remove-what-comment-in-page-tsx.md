# 01 — Remove WHAT-not-WHY comment in page.tsx

**What to build:** Remove or rewrite the comment above the `#stats-and-feed` insertion point in `apps/web/app/page.tsx` so it no longer describes what the code does (referencing ticket numbers and restating the stats-band/story-feed ordering already visible from the JSX itself). Per the general coding rules, comments are only for WHY (a non-obvious constraint, a workaround, a hidden invariant) — never for WHAT.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] The comment block reading `/* Stats band (ticket 06) followed by the paginated story feed (ticket 07), per spec.md's hero → stats band → feed → footer ordering. */` (or its current equivalent) is deleted from `apps/web/app/page.tsx`
- [ ] If a genuine WHY exists for this insertion point (e.g. a non-obvious ordering constraint that isn't self-evident from reading `<StatsBand />` followed by `<StoryFeed />` in the JSX), replace it with a single concise WHY-only comment instead of deleting outright — otherwise leave no comment at all
- [ ] No other content, structure, or behavior of `page.tsx` changes
- [ ] `npx tsc --noEmit -p tsconfig.json` in `apps/web` remains clean
- [ ] Full Playwright e2e suite in `apps/e2e/` still passes (no behavioral change expected, this is a comment-only fix)
