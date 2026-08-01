# 04 — [spec] Remove unrelated workflow-tooling changes from this diff

**What to build:** This diff (`git diff HEAD`) bundles edits unrelated to Admin User Management: `.claude/skills/gh-dev-workflow/SKILL.md`, `.claude/skills/gh-dev-workflow/phases/{grill,implement,review,spec,tickets}.md`, `.claude/skills/gh-dev-workflow/plan-structure.md`, deletion of `docs/gh-dev-workflow-gaps.md` and `docs/gh-dev-workflow-merge-spec-and-ticket-drafting.md`, and edits to `docs/gh-dev-workflow-model-effort-map.md`. None of this is in spec.md's scope. Revert these files to their `HEAD` state (or otherwise exclude them) so this plan's diff contains only Admin User Management changes.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `git diff HEAD` for this plan's work no longer touches any `.claude/skills/gh-dev-workflow/*` or `docs/gh-dev-workflow-*` file
- [ ] No functional admin-user-management behavior is lost by reverting these files
