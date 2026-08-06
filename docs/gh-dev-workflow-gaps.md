# gh-dev-workflow: known gaps and fixes

A TODO list of issues found while reviewing the `gh-dev-workflow` skill (and
its two siblings, `gh-codereview-workflow-test` and `gh-debt-workflow`)
against how they're actually specified and used in this repo. Each item
states the problem and how to fix it. Referenced from
`gh-dev-workflow-model-effort-map.md`'s "gap #2."

## Status

Item 1 is **fixed** (2026-08-02) — see below. The rest are open.

---

## 1. Plan-folder path convention drift — `plans/` vs `.gh-workflows/plans/` [FIXED]

**Problem:** `SKILL.md`, `plan-structure.md`, and both sibling skills all
hardcode `.gh-workflows/plans/` as the plan root ("always lives at the
project's repository root ... never create a nested `.gh-workflows/plans/`
under a subdirectory"). But this repo's actual plans — including the
in-progress `admin-user-management` plan, created *after* the
`gh-dev-workflow` skill already specified `.gh-workflows/plans/` — lived at
`plans/` (bare, repo root), a leftover from an earlier "dev-workflow" skill
that predates this one. `.gitignore` also already listed `.gh-workflows/` as
ignored, while the tracked `plans/` directory was fully committed — a second
sign the two conventions had drifted apart. Any session following the skill
literally would look in `.gh-workflows/plans/`, find nothing, and either fail
to resume the in-progress plan or start a second, parallel plans tree.

**Fix applied:** `git mv plans .gh-workflows/plans` (a pure rename, all 235
files tracked as `R`/`RM`). Removed the `.gh-workflows/` line from
`.gitignore` so the moved content stays tracked (chosen over untracking, to
keep plan history — grill sessions, specs, tickets, review findings —
versioned and shared via git same as before). Updated the ~74 files that
contained literal `plans/...` path references (e.g. `Plan:
plans/done/{...}`, tech-debt cross-links, `Current ticket path` fields) to
`.gh-workflows/plans/...` so historical cross-references stay accurate.

---

## 2. No safe concurrency for implement tickets

**Problem:** `SKILL.md`'s auto mode explicitly serializes every ticket
("Tickets are always delegated one at a time, never concurrently — every
sub-agent's last step writes to the same `PROGRESS/INDEX.md`/`CONTEXT.md`,
and concurrent writers would race on that state"). This is the right call
given the current architecture (plain `Agent` tool calls, one sub-agent at a
time), but it means independent, non-blocking tickets still run one after
another instead of in parallel — real wall-clock cost on plans with several
unblocked tickets.

**Fix:** Port the delegation layer from the `Agent` tool onto the `Workflow`
tool's `pipeline()`/`parallel()` primitives. Concurrent tickets would each
need their own scratch state (e.g. write to
`PROGRESS/notes/implement-{NN}-{slug}.md` directly without touching the
shared `PROGRESS/INDEX.md` mid-flight) with a single synchronization point
that merges all finished tickets' status into `PROGRESS/INDEX.md` once, after
the parallel batch completes — instead of every sub-agent updating shared
state as its last step. This is a bigger architectural change (fits poorly
with the skill's current one-sub-agent-at-a-time, session-by-session design,
and `Workflow` requires explicit user opt-in per its own rules), so it's
tracked as a deliberate future gap rather than done opportunistically.

---

## 3. No reminder to commit before review reads the diff

**Problem:** `review.md` pins the diff with `git diff
{base-branch}...HEAD` (step 2), which only sees *committed* history. But
`implement.md`'s hand-off message (step 3) tells the user to start review
next and never mentions committing first. If a user runs review with
uncommitted ticket work still in the working tree, the diff pin comes up
empty or stale, with no explanation of why review found "nothing" to check.
In practice this repo's history shows the user batching all tickets into one
commit before running review, which happens to work — but nothing in the
skill actually instructs that.

**Fix:** Add one line to `implement.md`'s final hand-off (step 3, both the
"more tickets remain" and "all tickets done" branches): remind the user to
commit their changes before starting review. Optionally, also add a cheap
guard to `review.md` step 2 — if `git diff {base-branch}...HEAD` is empty
but `git status` shows uncommitted changes touching files under the ticket
paths, say so explicitly instead of just failing the "non-empty diff" check
silently.

---

## 4. No fast path for trivial tasks

**Problem:** `grilling.md` mandates a relentless, one-question-at-a-time
interview for every invocation, with no escape hatch based on task size. A
one-line bug fix or a trivial copy tweak goes through the same grill → spec
→ tickets → implement → review ceremony as a multi-week feature, which is a
lot of process overhead (and a lot of user time answering questions) for
small work.

**Fix:** Add a short triage step at the start of `grill.md`, before the
interview begins: ask the user (or infer from their initial description)
whether this is small enough to skip straight to a single ticket — no grill
interview, no separate spec phase, just a one-paragraph spec inline and one
ticket, still going through implement/review as normal. Keep the full
pipeline as the default for anything bigger; this is only a skip for
genuinely trivial asks.

---

## 5. Base branch is pinned once and never revisited

**Problem:** `plan-structure.md` states the `Base branch` field is "set
exactly once, by `implement.md` during ticket `01` ... and never touched
again — it's what every review round diffs against." For a plan spanning
many tickets over days, `main` (or whatever the base branch is) will have
moved on. Nothing in `review.md` checks for or warns about staleness or
merge conflicts against the *current* tip of the base branch — only the
branch name captured at ticket 01 is used, unconditionally, for every
review round's diff.

**Fix:** Add a staleness check to `review.md` step 2, right after pinning the
diff: compare the base branch's current tip against what it was when
implement ticket 01 ran (or simply check whether the branch has moved at
all via `git merge-base --is-ancestor`), and if so, surface a note to the
user ("base branch has moved N commits since this plan started — consider
rebasing before this review round") rather than silently reviewing against
a diff that may conflict with what's actually mergeable.

---

## 6. Review re-runs the full gate every round

**Problem:** `review.md` step 4 runs lint, build, the full unit/integration
suite, and the full e2e suite every round, even when round 2 exists purely
to re-check a small, targeted set of fixes from round 1's findings. For
slow test suites (especially e2e), this makes every round expensive
regardless of how small the fix was.

**Fix:** This is a deliberate tradeoff favoring correctness (a fix ticket
could regress something unrelated) over speed, so it shouldn't be removed
outright — but it's worth making the cost visible and, optionally,
adjustable: note in `review.md` that a project with a very slow e2e suite
may choose to run a scoped subset of e2e specs (those touching the
fix-ticket's area) on rounds 2+ and reserve the full suite for the round
that's expected to pass, calling that out as an explicit, opt-in deviation
recorded in the project's `.gh-workflows/plans/coding-rules/` — not a
silent default change to the gate.

---

## 7. `gh-codereview-workflow-test` naming

**Problem:** The skill name carries a `-test` suffix that reads like a
leftover from when it was being tried out, not a permanent, load-bearing
part of the system it now is (it's referenced by name from
`gh-dev-workflow`'s `plan-structure.md` and is the thing `gh-debt-workflow`'s
backlog is populated by).

**Fix:** Rename the skill folder and all cross-references (`SKILL.md`
frontmatter `name:`, and every mention of `gh-codereview-workflow-test` in
`gh-dev-workflow`'s `plan-structure.md` and `gh-debt-workflow`'s `SKILL.md`)
to `gh-codereview-workflow`. Low risk, purely mechanical, but worth doing
deliberately (one commit, grep-verified) rather than leaving a
production skill with a name that undersells what it does.
