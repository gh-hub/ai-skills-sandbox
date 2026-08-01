# Review round 1 — FAIL

## Gate result
- Spec match: 5 findings (2 real spec deviations, 3 scope-creep items)
- Security: no findings
- Lint: N/A (no lint tooling in this repo; `apps/web`'s `next build` built-in type/lint check passed)
- Build: PASS (both `apps/api` and `apps/web`)
- Unit/integration tests: PASS (185/185, `apps/api`)
- E2E tests: FAIL (8/49 failed, reproduced on rerun — not flaky)

## Findings summary
1. Missing shared `isAdmin(user)` helper (spec deviation — duplicated inline checks instead)
2. Built-in role deletion returns 409 instead of the spec'd 400
3. Leftover debug e2e spec `repro.spec.ts` (scope creep)
4. Leftover debug `console.log` in `users.spec.ts` (scope creep)
5. Unrelated `.claude/skills/gh-dev-workflow/*` and `docs/gh-dev-workflow-*` changes bundled into this diff (scope creep)
6. E2E: `uniqueEmail()` local-part length bug breaks 6 tests across `admin-roles-page.spec.ts` and `admin-users-page.spec.ts`
7. E2E: new header "Admin" nav link causes an ambiguous-locator regression in the pre-existing `auth-flow.spec.ts` test

Full detail in `review/round-1/findings.md`. Six fix tickets written to `review/round-1/tickets/01` through `06`.

## Next
Phase set to `implement`, starting at `review/round-1/tickets/01-shared-isadmin-helper.md`. Once all 6 fix tickets are done, this becomes review round 2.
