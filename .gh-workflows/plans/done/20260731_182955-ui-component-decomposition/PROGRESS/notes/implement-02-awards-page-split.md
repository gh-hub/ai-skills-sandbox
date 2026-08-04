# Implement 02 — awards-page-split — session end-state

Split `apps/web/app/awards/page.tsx` into `awards-list.tsx` (`AwardsListSkeleton`, `AwardsList`), `create-award-form.tsx` (`CreateAwardForm` + `createAwardSchema`/`CreateAwardValues`), `login-prompt.tsx` (`LoginPrompt`), `create-award-section.tsx` (`CreateAwardSection`), plus a trimmed `page.tsx` (198 → 20 lines) keeping only the `AwardsPage` default export.

Repo-wide grep confirmed `awards/page.tsx` was the only prior consumer of the moved symbols. 3/5 acceptance criteria checked in `tickets/02-awards-page-split.md` — `pnpm --filter @thanks-claude/web build` passed clean; the Playwright e2e suite and a manual visual check were not run this session (left open for the review phase).

Next: review/round-1.
