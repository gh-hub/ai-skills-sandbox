# Implement 03 — home-page-split — session end-state

Split `apps/web/app/page.tsx` into `header-auth-control.tsx` (`HeaderAuthControl`) and `award-checkbox-list.tsx` (`AwardCheckboxList` + `toggleAwardId`). `page.tsx` keeps `Home` (default export), `storyFormSchema`/`StoryFormValues`, and the three inline render helpers (`renderLikeCount`, `renderHeroStatsLine`, `formatHeroStatNumber`) untouched, per spec.

Repo-wide grep confirmed `page.tsx` was the only prior consumer of the moved symbols. 4/6 acceptance criteria checked in `tickets/03-home-page-split.md` — `pnpm --filter @thanks-claude/web build` passed clean; the Playwright e2e suite and a manual visual check were not run this session (left open for the review phase).

After all three tickets landed together in the same working tree, the conductor ran one final combined build (`pnpm --filter @thanks-claude/web build`) covering all 12 new files plus the 3 trimmed source files — passed clean: compiled, typechecked, linted, and statically exported all routes (`/`, `/awards`, `/_not-found`) with no errors or warnings.

Next: review/round-1.
