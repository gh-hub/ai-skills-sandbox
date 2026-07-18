---
name: dev-workflow/review
description: Phase 5 of dev-workflow. Two-axis code review (Standards + Spec) with severity tagging. Writes report and tickets for blockers. User decides what happens next.
---

# Review Phase

## Purpose

Review all implemented work against two axes — does it follow the coding standards, and does it match the spec. Output actionable findings tagged by severity. User decides whether to fix or ship.

## Process

### 1. Load context

Read `plans/{folder}/PROGRESS.md` first — source of truth. Confirm the current phase is `review`. If it is not, stop and tell the user — do not proceed.

Determine the round number: count existing `plans/{folder}/review/round-N/` folders + 1. If PROGRESS.md records a specific round, that takes precedence.

Then read:
- `plans/{folder}/CONTEXT.md`
- `plans/{folder}/spec.md` — the spec to check against
- `plans/coding-rules/INDEX.md` — load relevant rule files

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

Use `subagent_type: general-purpose` for both. Each sub-agent has Bash tool access and must run `git diff` itself — do not paste the diff into the prompt, that doubles context cost for no benefit.

**Standards sub-agent prompt** — include:
- The exact diff command to run: `git diff {base-branch}...HEAD`
- The standards file contents and smell baseline pasted in full (sub-agent has no filesystem access to the plan folder)
- Brief: "Run the diff command with Bash, then report per file/hunk: (a) every place the diff violates a documented standard — cite the standard; (b) any smell you spot — name it and quote the hunk. Tag each finding BLOCK (must fix before ship) or DEBT (real problem, not a blocker). Distinguish hard violations from judgement calls. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:
- The exact diff command to run: `git diff {base-branch}...HEAD`
- The full spec contents pasted in (sub-agent has no filesystem access to the plan folder)
- Brief: "Run the diff command with Bash, then report: (a) requirements missing or partial; (b) behavior in the diff not asked for (scope creep); (c) requirements that look implemented but are wrong. Tag each finding BLOCK or DEBT. Quote the spec line for each finding. Under 400 words."

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

### 8. User checkpoint

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

Do not offer the "fix" option at round 2+. Do not continue autonomously under any circumstance.

### 9. Update plan files

Write to `PROGRESS.md` first, then update `CONTEXT.md` to match. PROGRESS.md is the source of truth — if interrupted between the two writes, PROGRESS.md wins.

Update `PROGRESS.md`:
- Mark `review/round-{N}` as complete with timestamp
- Record the user's exact decision: `done` / `fix` / `accept` / `escalate` / `stop`
- If `fix` or `escalate`: set current phase to `implement`, set `Current ticket path` to `plans/{folder}/review/round-{N}/tickets/01-{slug}.md`
- If `done` or `accept`: mark plan complete with timestamp
- If `stop`: record `review paused at round {N} — left in-progress by user`

Update `CONTEXT.md`:
- If fixing or escalating: set current ticket to `plans/{folder}/review/round-{N}/tickets/01-{slug}.md`
- If done or accepted: add `Plan complete`
- If stopped: add `Review paused at round {N} — run /dev-workflow to resume`

Update `INDEX.md`:
- Add link to `review/round-{N}/report.md`
- Update status: `fixing` / `complete` / `review-paused`

### 10. Archive if complete

Archive only when the user's decision was `done` or `accept`.

Do NOT archive for: `fix`, `escalate`, or `stop`.

Create `plans/done/` if it doesn't exist, then move the plan folder:
```
plans/done/YYYYMMDD_HHMMSS-{name}/
```

### 11. Hand off

**If fixing or escalating**: "Start a new session and run `/dev-workflow` to implement the review fixes."

**If done or accepted**: "Plan complete. Moved to `plans/done/{folder}`. Review `tech-debt.md` for logged debt items."

**If stopped**: "Review paused at round {N}. Plan remains at `plans/{folder}`. Run `/dev-workflow` to resume when ready."
