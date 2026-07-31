---
name: codereview-workflow/decide
description: Final phase of codereview-workflow. Presents the summary and collects the user's fix/accept/stop decision live. On "fix", seeds a brand-new dev-workflow plan — grill/spec/tickets skipped, one ticket per BLOCK finding — and hands off; dev-workflow does the actual editing. This checkpoint itself must run live — never delegate that part.
---

# Decide Phase

## Purpose

Present the review's findings and collect the user's decision: fix, accept as debt, or stop. This is this skill's only user checkpoint — a sub-agent cannot collect a human decision, so it always runs in the conductor's own live turn. The fix hand-off and mechanical write-up that follow are delegated to sub-agents.

## Process

### 1. Load context

Read `.codereview/{folder}/STATE.md` first — source of truth. Confirm the current phase is `decide`. If it is not, stop and tell the user — do not proceed.

Read `.codereview/{folder}/summary.md` for the BLOCK/DEBT counts and the "What needs to be done" list.

### 2. User checkpoint

If **no BLOCKs** remain:
```
Code review complete. No blockers.
DEBT findings: {count} — logged to plans/tech-debt/

Reply "done" to close out this review.
```

If **BLOCKs remain**:
```
Code review complete.
BLOCK findings: {count} — [link to summary.md]
DEBT findings: {count} — logged to plans/tech-debt/

  "fix"    — hand these off to a new dev-workflow plan (one ticket per BLOCK finding), then run /dev-workflow to fix them
  "accept" — log the BLOCKs as debt too and close out this review
  "stop"   — leave this review in-progress, no close-out

Reply with one of those three words.
```

Do not continue autonomously under any circumstance — this checkpoint always waits for the user.

### 3. Delegate the follow-up

The user's decision is collected — nothing from here on needs them further.

**If `fix`**: spawn a fresh `general-purpose` sub-agent (`Agent` tool, not `fork`) to seed a new `dev-workflow` plan, pre-populated as if `dev-workflow`'s own `grill` → `spec` → `tickets` phases had already run and been approved — because they effectively have: the review's findings *are* the approved work list. Give it every BLOCK finding (file, citation, quoted hunk) from `summary.md`/`reports/`, the branch name, and these instructions:

Create `plans/{timestamp}-codereview-{branch-slug}/` (timestamp from `date +%Y%m%d_%H%M%S`, run at creation time) containing:

1. `spec.md` — frame the findings as the requirements dev-workflow's own `review` phase will check the diff against:
   ```markdown
   # Spec: Code review fixes — {branch name}

   This plan was seeded by codereview-workflow, not written by hand — there is no feature behavior to build, only the findings below to resolve. Fixing a finding must never change business logic or behavior; if a "fix" would require a behavior change, that's a sign the finding needs human judgment — stop and flag it in the ticket instead of guessing.

   ## Requirements
   1. {file path} — {finding, verbatim, with citation}
   2. ...

   Nothing outside this list is in scope. No unrequested refactors, no unrelated cleanup.
   ```
2. `tickets/` — one file per BLOCK finding, numbered from `01` (independent findings can be in any order; if two findings touch overlapping lines in the same file, order them and note the dependency):
   ```markdown
   # {NN} — Fix: {short title}

   **What to build:** Fix exactly this finding, with no behavior change: {finding, verbatim, with file/hunk reference and the standard/smell cited}.

   **Blocked by:** {ticket numbers} or "None — can start immediately"

   **Status:** ready

   - [ ] Finding resolved
   - [ ] No business logic or behavior changed
   ```
3. `INDEX.md`:
   ```markdown
   # Code review fixes — {branch name}

   ## What we're building
   Fixing {N} BLOCK finding(s) from a codereview-workflow pass — no new behavior.

   ## Status
   Current phase: implement/01-{slug}

   ## Links
   - [PROGRESS/](PROGRESS/INDEX.md)
   - [CONTEXT.md](CONTEXT.md)
   - [Spec](spec.md) (seeded from code review, not hand-written)
   - [Tickets](tickets/)
   - Source review: `.codereview/{folder}/summary.md`
   ```
4. `CONTEXT.md`:
   ```markdown
   # Context: Code review fixes — {branch name}

   ## What we're building
   Fixing {N} BLOCK finding(s) from a codereview-workflow pass. No new behavior — see spec.md.

   ## Key decisions
   - Plan seeded directly from a codereview-workflow report; grill/spec/tickets phases were skipped since the findings are already the approved work list.

   ## Current state
   Phase: implement
   Completed tickets: none
   Current ticket: plans/{folder}/tickets/01-{slug}.md

   ## Load this session
   - plans/{folder}/tickets/01-{slug}.md
   - coding-rules/{relevant}.md (skill defaults) + plans/coding-rules/{relevant}.md (project, if present)

   ## Gotchas
   - This plan has no grill/ or a hand-written spec.md — spec.md exists but only lists the findings as requirements, for dev-workflow's review-phase spec-match check.
   - Every ticket must not change business logic — that's an acceptance criterion on all of them, not just a suggestion.
   ```
5. `PROGRESS/INDEX.md` (plus `PROGRESS/notes/seed.md`, per dev-workflow's `plan-structure.md`):
   ```markdown
   # Progress: Code review fixes — {branch name}

   ## Current phase
   implement/01-{slug}

   ## Current ticket path
   plans/{folder}/tickets/01-{slug}.md

   ## Phases
   | Phase | Status | Date | Notes |
   |---|---|---|---|
   | grill | skipped — seeded by codereview-workflow | | |
   | spec | skipped — seeded by codereview-workflow | | |
   | tickets | skipped — seeded by codereview-workflow | | |
   | implement/01-{slug} | pending | | |
   | implement/02-{slug} | pending | | |
   ... | | | |
   | review/round-1 | pending | | |

   ## Last session end-state
   See [notes/seed.md](notes/seed.md).
   ```
   `PROGRESS/notes/seed.md`: "Seeded from a codereview-workflow pass at `.codereview/{folder}`. Ready to implement ticket 01."

Then update the codereview folder's own `STATE.md`: set current phase to `handed-off`, record the created plan's path, update "Last session end-state".

Tell it never to run `git commit`/`git push`, never to talk to the user, and to report back one line: the plan folder path created and its ticket count. Wait for it to finish.

Tell the user: "BLOCK findings handed off to a new dev-workflow plan at `plans/{folder}`. Start a new session and run `/dev-workflow` to begin implementing ticket 01 — it'll fix each finding and its own review phase will confirm nothing else changed."

**If `accept` or `done`**: spawn a fresh `general-purpose` sub-agent to:
- If `accept` and BLOCKs remain: log each remaining BLOCK finding to `plans/tech-debt/` too (same format as the DEBT entries in `synthesize.md`, `Category: Standards`), so nothing is lost.
- Update `.codereview/{folder}/STATE.md`: mark this review complete with timestamp, record the decision.

Tell it never to run `git commit`/`git push`, never to talk to the user, and to report back one line confirming what was written. Wait for it to finish.

Tell the user: "Code review closed out. {N} open DEBT item(s) are in `plans/tech-debt/` for `/debt-workflow` to triage later."

**If `stop`**: spawn a fresh sub-agent to update `.codereview/{folder}/STATE.md`: record `review paused at decide — left in-progress by user`. Tell the user: "Review paused. Run `/codereview-workflow` to resume when ready."

### 4. Hand off

Covered above per decision — this is the last phase. `fix` continues in a separate `dev-workflow` session against the plan just created; it is not part of this skill anymore.
