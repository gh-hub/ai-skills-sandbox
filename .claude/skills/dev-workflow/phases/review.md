---
name: dev-workflow/review
description: Phase 5 of dev-workflow. Pass/fail gate — checks the implemented diff against spec.md, and confirms lint, build, unit/integration tests, and e2e tests all pass. No severity tags, no tech-debt log, no standards/smell pass (that's the separate codereview-workflow skill). On failure, writes fix tickets and loops back to implement automatically for up to 2 rounds; round 3+ needs a live user decision. On pass, one live checkpoint to archive. Always runs live — never delegated whole, since it may need to check in with the user partway through.
---

# Review Phase

## Purpose

Confirm two things about everything implemented so far: it does what `spec.md` says (no missing or wrong requirements, no unrequested scope), and it actually works — lint, build, unit/integration tests, and e2e tests all pass. This is a pass/fail gate, not a full code-quality review — no severity tags, no tech-debt log, no standards or smell pass. For that, run the standalone `/codereview-workflow` skill against this branch, any time, independent of this phase.

## Process

### 1. Load context

Read `plans/{folder}/PROGRESS/INDEX.md` first — source of truth. Confirm the current phase is `review/round-{N}` (N=1 the first time a plan enters review). If it is not, stop and tell the user — do not proceed.

Read `plans/{folder}/CONTEXT.md` and `plans/{folder}/spec.md`.

### 2. Pin the diff

The diff is everything implemented since the tickets were started:
```
git diff {base-branch}...HEAD
```
If the base branch is unclear, read `PROGRESS/INDEX.md` — it should record the branch state at ticket start. If still unclear, ask the user once and record the answer.

Confirm the diff is non-empty before spawning the sub-agent.

### 3. Check spec match

Spawn a sub-agent (`Agent` tool, `general-purpose` type, Bash access). It must run the diff command itself — do not paste the diff into the prompt. Give it the full contents of `spec.md` and this brief: "Run `git diff {base-branch}...HEAD`, then report: (a) requirements missing or partial; (b) behavior in the diff not asked for (scope creep); (c) requirements that look implemented but are wrong. Quote the spec line for each finding. No severity tags needed — every finding here is a gap that must close. Under 300 words."

### 4. Check it works

Run each of the following via Bash, in this order, stopping to record a failure but still running the rest (don't bail on the first red check — the report should show everything that's wrong at once):

1. **Lint** — the project's lint command
2. **Build** — the project's build/typecheck command
3. **Unit/integration tests** — the project's regular test suite
4. **E2E tests** — the project's end-to-end suite, if one exists

Discover each command from `package.json` scripts (e.g. `lint`, `build`, `test`, `test:e2e`/`e2e`/`cypress`/`playwright test`), a `Makefile`, or the README. If a project genuinely has no e2e suite, note that and skip it — that's not a failure. If any command is genuinely ambiguous, ask the user once and record the answer in `CONTEXT.md` so later rounds don't ask again. Record pass/fail and the failure output for each check that ran.

### 5. Decide pass/fail

**PASS** = the sub-agent in step 3 found no findings AND every check in step 4 that applies to this project (lint, build, unit/integration tests, e2e tests) passes.
**FAIL** = otherwise — record which specific check(s) failed.

### 6a. On FAIL

Delegate the write-up (per the Delegation discipline in `SKILL.md`, this phase always runs live, but the mechanical tail below can go to a fresh `general-purpose` sub-agent):

1. Write `plans/{folder}/review/round-{N}/findings.md` — the sub-agent's spec findings verbatim, plus a checklist of every step-4 check that ran (lint / build / unit-integration / e2e) with pass/fail and the failure output for any that failed.
2. Write one fix ticket per finding to `plans/{folder}/review/round-{N}/tickets/`, numbered from `01`, same format as `phases/tickets.md`.
3. Update `PROGRESS/INDEX.md` first, then `CONTEXT.md` to match:
   - `PROGRESS/INDEX.md`: mark `review/round-{N}`'s row `FAIL` with today's date in the Phases table, set current phase to `implement`, set `Current ticket path` to `plans/{folder}/review/round-{N}/tickets/01-{slug}.md`, point "Last session end-state" at `notes/review-round-{N}.md`.
   - `PROGRESS/notes/review-round-{N}.md`: the findings summary (one-line-per-check gate result plus the spec-match gaps), linking to `review/round-{N}/findings.md` for full detail.
   - `CONTEXT.md`: note round `{N}` failed (one line, link to `findings.md`), set current phase to `implement`, set current ticket to the same path.
   - `INDEX.md`: add link to `review/round-{N}/findings.md`, update status to `fixing`.

**If N ≤ 2**: no user input is needed — this is an objective gate, not a judgment call. Hand off exactly like `implement.md` does: "Review round {N}: {one-line summary of what's missing/broken}. Start a new session and run `/dev-workflow` to fix it." Under auto mode, the conductor loops straight back into `implement` without stopping.

**If N ≥ 3**: stop and ask the user live — this exceeds the standard 2-round auto-fix limit, regardless of auto mode:
```
Review round {N} still failing after {N} rounds: {one-line summary of what's wrong}.

  "continue" — keep fixing (round {N+1})
  "stop"     — leave the plan in-progress, no further auto-fixing

Reply with one of those two words.
```
Record the decision in `PROGRESS/INDEX.md`/`CONTEXT.md`. On "continue", proceed exactly as the N≤2 case above. On "stop", record `review paused at round {N} — left in-progress by user` in `PROGRESS/INDEX.md`'s "Last session end-state" (and in `notes/review-round-{N}.md`) and stop; tell the user: "Review paused at round {N}. Plan remains at `plans/{folder}`. Run `/dev-workflow` to resume when ready."

### 6b. On PASS

This is a live checkpoint — never delegate it:
```
Review round {N}: implementation matches spec.md. Lint, build, tests, and e2e all pass.

Reply "done" to archive this plan.
```

Once the user replies "done", delegate the write-up to a fresh `general-purpose` sub-agent:
1. `PROGRESS/INDEX.md`: mark `review/round-{N}`'s row `PASS` with today's date, set current phase to `(complete)`, point "Last session end-state" at `notes/review-round-{N}.md`.
2. `PROGRESS/notes/review-round-{N}.md`: confirm spec-match clean and the full gate green, with a one-line summary of what passed.
3. `CONTEXT.md`: add "Plan complete".
4. `INDEX.md`: update status to `complete`.
5. Create `plans/done/` if it doesn't exist, then move the plan folder to `plans/done/YYYYMMDD_HHMMSS-{name}/` (reuse the plan's original timestamp/name, not a new one).

Tell it never to run `git commit`/`git push`, never to talk to the user, and to report back one line confirming what was written and moved. Wait for it to finish before proceeding.

Tell the user: "Plan complete. Moved to `plans/done/{folder}`."
