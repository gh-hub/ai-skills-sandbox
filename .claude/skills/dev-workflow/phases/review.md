---
name: dev-workflow/review
description: Phase 5 of dev-workflow. Two-axis code review (Standards + Spec) with severity tagging. Writes report and tickets for blockers. User decides what happens next.
---

# Review Phase

## Purpose

Review all implemented work against two axes — does it follow the coding standards, and does it match the spec. Output actionable findings tagged by severity. User decides whether to fix or ship.

## Process

### 1. Load context

Read:
- `plans/{folder}/CONTEXT.md`
- `plans/{folder}/PROGRESS.md` — to determine round number
- `plans/{folder}/spec.md` — the spec to check against
- `plans/coding-rules/INDEX.md` — load relevant rule files

Determine the round number: count existing `plans/{folder}/review/round-N/` folders + 1.

Create `plans/{folder}/review/round-{N}/`.

### 2. Pin the diff

The diff is everything implemented since the tickets were started. Use:
```
git diff {base-branch}...HEAD
```

If the base branch is unclear, read PROGRESS.md — it should record the branch state at ticket start. If still unclear, ask the user once.

Confirm the diff is non-empty before spawning sub-agents.

### 3. Identify sources

**Spec source**: `plans/{folder}/spec.md`

**Standards sources**: 
- `plans/coding-rules/INDEX.md` + relevant rule files
- Any `CODING_STANDARDS.md` or `CONTRIBUTING.md` in the repo

**Smell baseline** (applies even when no repo standards exist):
- **Mysterious Name** — rename it; if no honest name comes, the design is murky
- **Duplicated Code** — extract the shared shape
- **Feature Envy** — move the method onto the data it envies
- **Data Clumps** — bundle repeated field groups into one type
- **Primitive Obsession** — give the concept its own small type
- **Repeated Switches** — replace with polymorphism or a shared map
- **Shotgun Surgery** — gather what changes together into one module
- **Divergent Change** — split so each module changes for one reason
- **Speculative Generality** — delete abstraction the spec doesn't need
- **Message Chains** — hide the walk behind one method
- **Middle Man** — cut it, call the real target direct
- **Refused Bequest** — drop the inheritance, use composition

### 4. Spawn both sub-agents in parallel

**Standards sub-agent prompt** — include:
- The full diff command
- The standards files and smell baseline (paste in full — sub-agent has no other access)
- Brief: "Report per file/hunk: (a) every place the diff violates a documented standard — cite the standard; (b) any smell you spot — name it and quote the hunk. Tag each finding BLOCK (must fix before ship) or DEBT (real problem, not a blocker). Distinguish hard violations from judgement calls. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:
- The diff command
- The full spec contents
- Brief: "Report: (a) requirements missing or partial; (b) behavior in the diff not asked for (scope creep); (c) requirements that look implemented but are wrong. Tag each finding BLOCK or DEBT. Quote the spec line for each finding. Under 400 words."

### 5. Write the report

Save to `plans/{folder}/review/round-{N}/report.md`:

```markdown
# Review Round {N}

## Standards
{verbatim sub-agent output}

## Spec
{verbatim sub-agent output}

## Summary
BLOCK findings: {count}
DEBT findings: {count}
Worst BLOCK: {one line}
```

### 6. Handle DEBT findings

Append all DEBT findings to `plans/{folder}/review/tech-debt.md`. Create the file if it doesn't exist.

Format:
```markdown
## Round {N} — {date}
- [DEBT] {finding} (Standards/Spec)
```

### 7. Handle BLOCK findings

If any BLOCKs exist, write tickets to `plans/{folder}/review/round-{N}/tickets/` — one file per finding, numbered from `01`.

Use the same ticket format as `phases/tickets.md`.

### 8. Round limit check

If this is round 2 or higher and BLOCKs still remain, flag this explicitly:
> "This is round {N}. BLOCKs remain. Continuing to fix these automatically is stopped here."

### 9. User checkpoint

Present to the user:

```
Review round {N} complete.

BLOCK findings: {N} — [link to report]
DEBT findings: {N} — [link to tech-debt.md]

Options:
1. Fix BLOCKs — new tickets written to review/round-{N}/tickets/, start a new session
2. Accept remaining issues as debt — plan marked complete
3. Done — no BLOCKs, ship it
```

Wait for the user's decision. Do not continue autonomously.

### 10. Update plan files

Update `PROGRESS.md`:
- Mark `review/round-{N}` as complete
- Record user decision
- If fixing: set current phase to implement (round-N tickets)
- If done/accepted: mark plan complete with timestamp

Update `CONTEXT.md`:
- Add review round outcome
- If fixing: set current ticket to round-N ticket 01

Update `INDEX.md`:
- Add link to review/round-{N}/report.md
- Update status to `done` or `fixing`

### 11. Archive if complete

If the user chose option 2 or 3 (plan is done):

Create `plans/done/` if it doesn't exist, then move the plan folder there:
```
plans/done/YYYYMMDD_HHMMSS-{name}/
```

This keeps `plans/` showing only in-progress work.

### 12. Hand off

**If fixing BLOCKs**: "Start a new session and run `/dev-workflow` to implement the review fixes."

**If done**: "Plan complete. Moved to plans/done/{folder}. Review tech-debt.md for logged debt items."
