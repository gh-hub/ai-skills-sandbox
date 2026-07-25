---
name: dev-workflow/review-tickets
description: Phase 5a of dev-workflow. Two-axis code review (Standards + Spec) with severity tagging. Writes the report, logs DEBT, and writes tickets for BLOCK findings. No user input needed — delegatable to a sub-agent under auto mode.
---

# Review-Tickets Phase

## Purpose

Review all implemented work against two axes — does it follow the coding standards, and does it match the spec. Output actionable findings tagged by severity, log DEBT, and write tickets for BLOCK findings. Nothing in this phase needs a human — the decision (fix/accept/escalate/stop) happens next, in `review-decide.md`.

## Process

### 1. Load context

Read `plans/{folder}/PROGRESS.md` first — source of truth. Confirm the current phase is `review/round-{N}/tickets`. If it is not, stop and tell the user — do not proceed.

Determine the round number `N` from the phase string. If PROGRESS.md doesn't yet have a round-specific phase (first entry into review), treat this as round 1.

Then read:
- `plans/{folder}/CONTEXT.md`
- `plans/{folder}/spec.md` — the spec to check against
- `coding-rules/INDEX.md` (in the dev-workflow skill's own folder — shipped defaults) and `plans/coding-rules/INDEX.md` if it exists in this project (project-specific overrides) — load relevant rule files from both. A `file` row is read directly. A `skill` row (e.g. `nestjs-service-style`) — read its relevant reference file(s) directly (e.g. `references/review-checklist.md`) rather than invoking the skill, since its content needs to be pasted into the sub-agent prompt in step 4.

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
- `coding-rules/INDEX.md` (skill defaults) + `plans/coding-rules/INDEX.md` (project overrides, if present) + relevant rule files from both, per step 1
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

DEBT findings are never turned into tickets and never implemented as part of this plan — they are logged only, for the separate `/debt-workflow` skill to triage later.

### 7. Handle BLOCK findings

If any BLOCKs exist, write tickets to `plans/{folder}/review/round-{N}/tickets/` — one file per finding, numbered from `01`.

Use the same ticket format as `phases/tickets.md`.

### 8. Update plan files

Write to `PROGRESS.md` first, then update `CONTEXT.md` to match. PROGRESS.md is the source of truth — if interrupted between the two writes, PROGRESS.md wins.

Update `PROGRESS.md`:
- Mark `review/round-{N}/tickets` complete with timestamp
- Set current phase to `review/round-{N}/decide`
- Write last session end-state: BLOCK count, DEBT count, link to `report.md`

Update `CONTEXT.md`:
- Note round `{N}` findings summary (counts only — link to `report.md` for detail)
- Set current phase to `review/round-{N}/decide`

Update `INDEX.md`:
- Add link to `review/round-{N}/report.md`
- Update status: `review-pending-decision`

### 9. Hand off

This phase never talks to the user directly — no findings should be summarized in chat here. Continue immediately to `phases/review-decide.md` in this same session; it needs live user input right away, so there is no reason to start a fresh session between the two.

Under auto mode: report back one line — BLOCK count, DEBT count, and that the phase is now `review/round-{N}/decide` — per the delegation contract in `SKILL.md`. Do not present the checkpoint yourself; that is `review-decide.md`'s job, and it must run live, not inside this sub-agent.
