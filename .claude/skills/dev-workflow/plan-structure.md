# Plan Structure

Canonical definition of every file and folder inside a plan.

## Folder layout

```
plans/
  coding-rules/          ← optional, project-specific rules only; not auto-created
  tech-debt/              ← global backlog, one file per open DEBT item, written by the review-decide phase's archive step
    YYYYMMDD_HHMMSS-{slug}.md
  done/                  ← completed plans, moved here by the review-decide phase
    YYYYMMDD_HHMMSS-{name}/
  YYYYMMDD_HHMMSS-{name}/  ← in-progress plans (only these show here)
```

Plans in `plans/` root are in-progress. When review marks a plan complete it moves to `plans/done/`. `coding-rules/` (if it exists) and `tech-debt/` stay at the root always.

## Plan folder name

`YYYYMMDD_HHMMSS-{name}/`

Timestamp is to-the-second so plans sort chronologically. Name is short and slug-friendly (e.g. `auth-refactor`, `user-dashboard`).

## Files

### INDEX.md

What this plan is and links to everything inside it. Written at plan creation, updated as phases complete. A human or fresh agent should be able to understand the full plan from this file in 30 seconds.

```markdown
# {Plan name}

## What we're building
One sentence.

## Status
Current phase: grill

## Links
- [PROGRESS.md](PROGRESS.md)
- [CONTEXT.md](CONTEXT.md)
- [Grill output](grill/)
- [Spec](spec.md)
- [Tickets](tickets/)
- [Review](review/)
- [Tech debt](review/tech-debt.md)
```

---

### CONTEXT.md

The session passport. A fresh session reads ONLY this file to get oriented — never the full grill output, never the full spec. Must stay under 1k tokens (~700 words). If it grows beyond that, it contains too much.

What belongs here:
- One sentence on what we're building
- Key decisions (load-bearing ones only — link to the ADR for detail)
- Current phase and ticket
- Exact file paths to load this session (ticket, rules files, etc.)
- Critical gotchas — facts that would cause a mistake if unknown

What does NOT belong here:
- Full conversation transcripts
- Full spec content (link to spec.md)
- Full ticket text (link to tickets/)
- Code snippets

Updated at the end of every session.

```markdown
# Context: {plan name}

## What we're building
One sentence.

## Key decisions
- Decision 1 — see grill/ADR-001.md
- Decision 2 — ...

## Current state
Phase: {current phase}
Completed tickets: {list or "none"}
Current ticket: {path or "none"}

## Load this session
- plans/{folder}/tickets/{current}.md
- coding-rules/{relevant}.md (skill defaults) + plans/coding-rules/{relevant}.md (project, if present)

## Gotchas
- Fact that would cause a mistake if unknown
```

---

### PROGRESS.md

Machine-readable state tracker. The orchestrator reads this to know where to resume.

```markdown
# Progress: {plan name}

## Current phase
grill

## Current ticket path
(none — set to full file path when an implement phase starts)

## Phases
- [ ] grill
- [ ] spec
- [ ] tickets
- [ ] implement/01-{slug}
- [ ] implement/02-{slug}
- [ ] review/round-1/tickets
- [ ] review/round-1/decide

## Review rounds
(none yet)

## Last session end-state
What was done, what comes next — written at end of each session.
```

`Current ticket path` holds the exact file path of the ticket being implemented (e.g. `plans/{folder}/tickets/01-auth.md` or `plans/{folder}/review/round-1/tickets/01-fix.md`). It is the authoritative source for which file implement.md loads. Updated by tickets.md and review-decide.md whenever a new ticket becomes current; cleared when all tickets are done.

---

### grill/

Output from the grill phase. The spec reads from here.

```
grill/
  requirements.md    ← what we're building, from the user's perspective
  decisions.md       ← key decisions made during grilling
  glossary.md        ← domain terms agreed on
  ADR-001.md         ← one file per architectural decision record (if any)
```

---

### spec.md

Full spec in PRD format. Written by the spec phase from grill/ output. The tickets phase reads this.

---

### tickets/

One file per implementation ticket. Written by the tickets phase.

```
tickets/
  01-{slug}.md
  02-{slug}.md
  ...
```

Numbered from 01 in dependency order (blockers first).

---

### review/

One subfolder per review round. `report.md`, `tickets/`, and the `tech-debt.md` appends are written by `phases/review-tickets.md`; the round's fix/accept/escalate/stop decision is recorded by `phases/review-decide.md`.

```
review/
  tech-debt.md       ← DEBT findings accumulated across all rounds (appended, never deleted)
  round-1/
    report.md        ← full review output with severity tags
    tickets/         ← BLOCK findings as new tickets (if any)
      01-{slug}.md
  round-2/
    ...
```

Findings are tagged:
- `BLOCK` — must fix before shipping
- `DEBT` — real problem, logged to tech-debt.md, not a blocker

After round 2, any remaining BLOCKs are flagged to the user. The user decides: fix (round 3), accept as debt, or escalate. The loop does not continue silently.

A `DEBT` item that gets fixed out-of-band (not through the formal ticket flow) is marked in place as `[FIXED, {date}]` — it stays in `tech-debt.md` as history, it is not deleted.

When the plan archives (`done`/`accept`), every remaining `[DEBT]` line (not `[FIXED, ...]`) is exported to `plans/tech-debt/` as its own file, and the line here is annotated ` — moved to plans/tech-debt/{filename}`. See `plans/tech-debt/` below.

---

## plans/tech-debt/

Lives at the project root (not inside a plan folder), populated only by the review-decide phase's archive step (`phases/review-decide.md`, step 4) — one file per DEBT item still open when its plan archived.

```
tech-debt/
  YYYYMMDD_HHMMSS-{slug}.md
  YYYYMMDD_HHMMSS-{slug}.md
  ...
```

Timestamp is when the item was exported (archive time), not when it was originally found. File contents:

```markdown
# {slug}

## Finding
{the DEBT finding, verbatim}

## Source
- Plan: plans/done/{plan-folder}/
- Round: round-{N}
- Category: Standards / Spec
- Logged: {original date found}
- Moved: {archive date}
```

dev-workflow only ever writes here — it does not read this folder, evaluate any file in it, or decide what happens to it next. That judgment (is this still relevant, is it worth fixing, should it become a plan) is out of scope for dev-workflow entirely.

---

## plans/coding-rules/

The dev-workflow skill ships its own default rules in `coding-rules/` inside the skill's folder (`general.md`, stack-specific files, and rows pointing at standalone skills like `nestjs-service-style`) — those apply to every project the skill is installed in and are never generated per-project.

`plans/coding-rules/` at the project root is the optional layer on top of that: project-specific rules only, things that are true of this one repo and don't belong in the shared skill defaults. It is **not** created automatically. Create it only when a rule actually needs recording — same lazy pattern as `plans/tech-debt/`. A project with no rule of its own simply has no `plans/coding-rules/` folder, and that's the expected state, not a missing setup step.

When a project-specific rule does come up, create `plans/coding-rules/INDEX.md`:

```markdown
# Coding Rules Index (project overrides)

Read alongside the dev-workflow skill's own coding-rules/INDEX.md. Rules here add to or override the skill defaults where they conflict — only add a rule here if it's specific to this project.

## Rule files

| File | Load when |
|---|---|

<!-- Add a row here each time you create a rule file, e.g.:
| [payments-service.md](payments-service.md) | Ticket touches the payments service |
-->
```

Only list files that actually exist. Do not add rows for files that haven't been created yet — a missing file is worse than a missing row.
