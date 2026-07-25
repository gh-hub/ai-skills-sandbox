---
name: dev-workflow/review-tickets
description: Phase 5a of dev-workflow. Two-axis code review (Standards + Spec) with severity tagging. Writes the report, logs DEBT, and writes tickets for BLOCK findings. No user input needed — delegatable whole under auto mode, and its write-up delegates to a sub-agent even when run live.
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

### 5. Delegate the write-up

Both review sub-agents have reported back their findings, and nothing from here on needs the user. Per the Delegation discipline in `SKILL.md`: if you're running this phase live (in conversation with the user), hand the rest of this phase to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`), passing it both sub-agents' verbatim output. If you were yourself already spawned as a sub-agent to run this whole phase (e.g. under auto mode), just do the following steps directly instead of spawning yet another sub-agent.

Whoever does the work (you or the sub-agent) should:

1. Write the report to `plans/{folder}/review/round-{N}/report.md`:
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
2. Append all DEBT findings to `plans/{folder}/review/tech-debt.md` (create it if it doesn't exist):
   ```markdown
   ## Round {N} — {date}
   - [DEBT] {finding} (Standards/Spec)
   ```
   DEBT findings are never turned into tickets and never implemented as part of this plan — they are logged only, for the separate `/debt-workflow` skill to triage later.
3. If any BLOCKs exist, write tickets to `plans/{folder}/review/round-{N}/tickets/` — one file per finding, numbered from `01`, using the same ticket format as `phases/tickets.md`.
4. Write to `PROGRESS.md` first, then update `CONTEXT.md` to match (PROGRESS.md is the source of truth — if interrupted between the two writes, PROGRESS.md wins):
   - `PROGRESS.md`: mark `review/round-{N}/tickets` complete with timestamp, set current phase to `review/round-{N}/decide`, write last session end-state (BLOCK count, DEBT count, link to `report.md`).
   - `CONTEXT.md`: note round `{N}` findings summary (counts only — link to `report.md` for detail), set current phase to `review/round-{N}/decide`.
   - `INDEX.md`: add link to `review/round-{N}/report.md`, update status to `review-pending-decision`.

If delegating, give the sub-agent the plan folder path, both review sub-agents' verbatim output, and these instructions, plus: never run `git commit`/`git push`, never talk to the user (no findings should be summarized in chat — that's `review-decide.md`'s job next), and report back one line: BLOCK count, DEBT count, and that the phase is now `review/round-{N}/decide`. Wait for it to finish before proceeding.

### 6. Hand off

This phase never talks to the user directly — no findings should be summarized in chat here.

- **If you are the live session** (you ran steps 1-4 yourself and delegated step 5's write-up): once the write-up sub-agent returns, continue immediately to `phases/review-decide.md` yourself, in this same conversation — it needs live user input right away, so there is no reason to start a fresh session between the two.
- **If you are a sub-agent spawned to run this whole phase** (e.g. under auto mode, per `SKILL.md`): do not continue to `review-decide.md` — you have no user to check in with. Report back one line — BLOCK count, DEBT count, and that the phase is now `review/round-{N}/decide` — and stop. The conductor runs `review-decide.md` live, per the delegation contract in `SKILL.md`. Do not present the checkpoint yourself; that is `review-decide.md`'s job.
