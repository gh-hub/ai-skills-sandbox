---
name: dev-workflow/review-decide
description: Phase 5b of dev-workflow. Presents the review round's findings, collects the user's fix/accept/escalate/stop decision, and updates plan state accordingly. Must run live — never delegate to a sub-agent.
---

# Review-Decide Phase

## Purpose

Present this round's findings and collect the user's decision: fix, accept as debt, escalate, or stop. This is one of the workflow's three live user checkpoints — a sub-agent cannot collect a human decision, so this phase always runs in the conductor's own live turn, even under auto mode.

## Process

### 1. Load context

Read `plans/{folder}/PROGRESS.md` first — source of truth. Confirm the current phase is `review/round-{N}/decide`. If it is not, stop and tell the user — do not proceed.

Read `plans/{folder}/review/round-{N}/report.md` for the BLOCK/DEBT counts and worst-BLOCK summary. Do not re-read `spec.md` or the coding-rules files — the report already distilled everything needed for the checkpoint.

### 2. User checkpoint

If **no BLOCKs** remain:
```
Review round {N} complete. No blockers.
DEBT findings: {count} — logged to tech-debt.md

Plan is ready to ship. Reply "done" to archive it.
```

If **BLOCKs remain and this is round 1**:
```
Review round 1 complete.
BLOCK findings: {count} — [link to report]
DEBT findings: {count} — logged to tech-debt.md

  "fix"    — implement the tickets written to review/round-1/tickets/
  "accept" — log BLOCKs as debt and mark plan complete

Reply with one of those two words.
```

If **BLOCKs remain and this is round 2 or higher** — hard gate, different prompt:
```
Review round {N} complete. BLOCKs still remain after {N} rounds.

This is beyond the standard 2-round limit. You must make an explicit choice:
  "escalate" — continue to round {N+1} (you take ownership of the extra cost)
  "accept"   — log remaining BLOCKs as debt and archive the plan
  "stop"     — leave the plan in-progress, no archive

Reply with one of those three words.
```

Do not offer the "fix" option at round 2+. Do not continue autonomously under any circumstance — under auto mode, this is exactly the point where the loop pauses and waits for the live user, same as it always has.

### 3. Update plan files

Write to `PROGRESS.md` first, then update `CONTEXT.md` to match. PROGRESS.md is the source of truth — if interrupted between the two writes, PROGRESS.md wins.

Update `PROGRESS.md`:
- Mark `review/round-{N}/decide` complete with timestamp
- Record the user's exact decision: `done` / `fix` / `accept` / `escalate` / `stop`
- If `fix` or `escalate`: set current phase to `implement`, set `Current ticket path` to `plans/{folder}/review/round-{N}/tickets/01-{slug}.md`
- If `done` or `accept`: mark plan complete with timestamp
- If `stop`: record `review paused at round {N} — left in-progress by user`

Update `CONTEXT.md`:
- If fixing or escalating: set current ticket to `plans/{folder}/review/round-{N}/tickets/01-{slug}.md`
- If done or accepted: add `Plan complete`
- If stopped: add `Review paused at round {N} — run /dev-workflow to resume`

Update `INDEX.md`:
- Update status: `fixing` / `complete` / `review-paused`

### 4. Export open DEBT to the backlog

Archive only when the user's decision was `done` or `accept`. Do this step only in that case.

Read `plans/{folder}/review/tech-debt.md`. For every line tagged `[DEBT]` (not `[FIXED, ...]`):
- Create `plans/tech-debt/` if it doesn't exist.
- Write `plans/tech-debt/YYYYMMDD_HHMMSS-{slug}.md` (timestamp = now, to-the-second). `{slug}` is a short label for the finding (e.g. `api-db-bypasses-di`). Content:
  ```markdown
  # {slug}

  ## Finding
  {the DEBT finding, verbatim}

  ## Source
  - Plan: plans/done/{plan-folder}/
  - Round: round-{N}
  - Category: Standards / Spec
  - Logged: {original date found}
  - Moved: {today's date}
  ```
- Edit that line in the plan's local `tech-debt.md` to append ` — moved to plans/tech-debt/{filename}`, so the archived plan's own log still shows where each item went.

Lines already marked `[FIXED, ...]` are untouched — they're history, not exported.

This step is purely mechanical: write out findings already on record from this plan's own review rounds. Nothing here evaluates whether an item is still relevant, still worth fixing, or should be discarded — that judgment happens later, elsewhere, against the backlog as a whole, not against one plan's slice of it.

### 5. Archive if complete

Archive only when the user's decision was `done` or `accept`.

Do NOT archive for: `fix`, `escalate`, or `stop`.

Create `plans/done/` if it doesn't exist, then move the plan folder:
```
plans/done/YYYYMMDD_HHMMSS-{name}/
```

### 6. Hand off

**If fixing or escalating**: "Start a new session and run `/dev-workflow` to implement the review fixes." Mention they can also ask to run the rest autonomously — see "Auto mode" in `SKILL.md`.

**If done or accepted**: "Plan complete. Moved to `plans/done/{folder}`. {N} open DEBT item(s) exported to `plans/tech-debt/`."

**If stopped**: "Review paused at round {N}. Plan remains at `plans/{folder}`. Run `/dev-workflow` to resume when ready."
