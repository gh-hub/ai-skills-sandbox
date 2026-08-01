# gh-dev-workflow: gaps found in a full-workflow review

Reviewed all five phase files (`grill.md`, `spec.md`, `tickets.md`,
`implement.md`, `review.md`) plus `SKILL.md` and `plan-structure.md`. These
are gaps and rough edges found beyond the spec/tickets merge already written
up in `gh-dev-workflow-merge-spec-and-ticket-drafting.md`.

## 1. Base-branch tracking is never written — only read

`review.md` step 2 says: "If the base branch is unclear, read
`PROGRESS/INDEX.md` — it should record the branch state at ticket start."

Nothing writes that. `grill.md`, `spec.md`, `tickets.md`, and `implement.md`
never add a branch field to `PROGRESS/INDEX.md`, and the template in
`plan-structure.md` has no such field. In practice, review's step 2 will hit
"unclear" on the very first round of every plan and fall back to asking the
user — the fallback path is actually the only path.

**Fix**: add a `Base branch` field to the `PROGRESS/INDEX.md` template in
`plan-structure.md`, and have `tickets.md` step 5 (or `implement.md`'s first
ticket) record it once, e.g. via `git rev-parse --abbrev-ref HEAD` at that
point, or by asking once and caching the answer the same way review already
does for ambiguous lint/build/test commands.

## 2. Auto-mode concurrent tickets race on shared state files

`SKILL.md`'s auto-mode section: "Tickets with no blocking edges between them
may be delegated as concurrent sub-agents instead of one at a time." But
every implement sub-agent's last step (`implement.md` step 2.8) writes to
the *same* `PROGRESS/INDEX.md` and `CONTEXT.md`. Two sub-agents finishing
close together race on those writes — whichever writes last wins, silently
dropping the other ticket's completion record (phase table row, current
ticket pointer, notes link).

**Fix**: either (a) don't allow this until there's a merge/lock strategy —
e.g. the conductor collects each concurrent sub-agent's *intended* state
update and applies them itself, serially, after all finish — or (b) walk
back the auto-mode note to sequential-only for now. Given the concurrency
claim is one sentence with no supporting mechanism anywhere else in the
skill, (b) is the safer immediate fix; (a) is the real one if concurrent
implementation is wanted later.

## 3. Grill-time codebase exploration is redone from scratch in spec

The grilling primitive (`grilling.md`) tells the live interview to look up
*facts* by exploring the environment rather than asking the user — so the
live grill session may already explore parts of the codebase while
interviewing. The spec sub-agent (`spec.md` step 2, a fresh sub-agent with
no memory of that) explores the codebase again from zero. Smaller version of
the spec/tickets duplication already written up — lower priority, since
grill's exploration is opportunistic/partial rather than the systematic pass
spec needs, so the overlap is real but small.

**Fix (optional, low priority)**: have grill's step 4 write-up include any
codebase facts discovered during the interview in `grill/requirements.md` or
a short "Environment notes" section, so spec's sub-agent can skip re-checking
what's already confirmed.

## 4. Flaky tests aren't distinguished from real regressions in review

`review.md` step 4 runs lint/build/unit-integration/e2e and step 5 treats
any failure as FAIL, no exceptions. A flaky test failing once triggers the
same fix-ticket-writing machinery (`findings.md`, a numbered fix ticket, a
full `implement` round) as a genuine regression, burning a review round on
nothing.

**Fix**: on an e2e/test failure, rerun just that failing check once before
recording it as FAIL. If it passes on rerun, note it as flaky in
`findings.md` but don't fail the round for it alone.

## 5. "Mark each acceptance criterion complete" doesn't say where

`implement.md` step 7: "Go through each acceptance criterion in the ticket
and mark each one complete (or note if something is partial and why)."
This is presumably editing the `- [ ]` → `- [x]` checkboxes in the ticket
file itself (the template in `tickets.md` uses that checkbox format), but
the step never says to edit the ticket file at the path from step 2 —  it
could be misread as just a verbal confirmation in the notes file.

**Fix**: reword step 7 to say explicitly: "Edit the ticket file at the path
from step 2, checking off each acceptance criterion (`- [x]`)."

## Priority

1 and 2 are real correctness/consistency gaps worth fixing before relying on
auto mode with concurrent tickets or trusting review's first round to find
the right diff. 3-5 are smaller — worth doing opportunistically, not urgent.
