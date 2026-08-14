# 03 — [spec] Reconcile sticky-header.spec.ts → home-header-scroll.spec.ts rename with spec wording

**What to build:** The spec's Testing Decisions say ticket 2 "rewrites `apps/e2e/tests/sticky-header.spec.ts` against the new unified header," which reads as an in-place edit. The actual implementation deleted `sticky-header.spec.ts` and created a new file, `home-header-scroll.spec.ts`, with equivalent (expanded) coverage — a reasonable choice given the underlying component it was named after (`sticky-header.tsx`) was itself deleted and replaced by `SiteHeader`. Confirm this rename is an accepted deviation (no functional gap — coverage is equivalent or better) rather than reverting it; if accepted, update `spec.md`'s Testing Decisions to reflect the new filename so the plan's record matches what was built.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] Confirmed `home-header-scroll.spec.ts` provides equivalent-or-better coverage than a literal in-place rewrite of `sticky-header.spec.ts` would have (no functional test gap from the rename). Compared against `git show HEAD:apps/e2e/tests/sticky-header.spec.ts`: the old file only asserted pre/post-scroll opacity of the sticky header. `home-header-scroll.spec.ts` retains that exact opacity-based fade assertion (now on `header-auth-fade` within the global `SiteHeader`) and additionally asserts brand/Awards/theme-toggle visibility pre-scroll (the round-1 fix-01 addition) — a strict superset of the old coverage.
- [x] `spec.md`'s Testing Decisions updated to reference `home-header-scroll.spec.ts` instead of `sticky-header.spec.ts`, if the rename is confirmed as an accepted deviation
