# Plan Structure

Canonical definition of every file and folder inside a plan.

## Folder name

`plans/YYYYMMDD_HHMMSS-{name}/`

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
- plans/coding-rules/{relevant}.md

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

## Phases
- [ ] grill
- [ ] spec
- [ ] tickets
- [ ] implement/01-{slug}
- [ ] implement/02-{slug}
- [ ] review/round-1

## Review rounds
(none yet)

## Last session end-state
What was done, what comes next — written at end of each session.
```

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

One subfolder per review round. 

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

---

## plans/coding-rules/

Lives at the project root level (not inside a plan folder). Shared across all plans in the project.

### INDEX.md template

```markdown
# Coding Rules Index

Load this file at the start of every implement and review session. Then load only the rule files that apply to the current ticket's tech stack.

## Rule files

| File | Load when |
|---|---|
| [general.md](general.md) | Always |
| [python.md](python.md) | Ticket touches Python code |
| [nextjs.md](nextjs.md) | Ticket touches Next.js / React |
| [nestjs.md](nestjs.md) | Ticket touches NestJS |
| [electron.md](electron.md) | Ticket touches Electron |

## Repo-specific overrides

| File | Load when |
|---|---|
| [repos/](repos/) | Check for a file matching the current repo name |

Repo-specific rules override general rules where they conflict.
```

### general.md template

```markdown
# General Coding Rules

Applies to all projects and tech stacks.

## Naming
- Names must say what the thing IS or DOES, not how it's implemented
- Avoid generic names: handler, manager, utils, helpers, data, info
- Boolean names start with is, has, or can

## Functions
- A function does one thing. If you need "and" to describe it, split it
- No side effects that callers can't see from the signature
- Max 3 parameters — beyond that, group into a typed object

## Comments
- No comments that describe WHAT the code does
- Comments only for WHY: a non-obvious constraint, a workaround, a hidden invariant
- No commented-out code — delete it, git has history

## Error handling
- Only handle errors at system boundaries (user input, external APIs, filesystem, network)
- Do not add fallbacks for scenarios that cannot happen
- Do not swallow errors silently

## Tests
- Test external behavior, not implementation details
- One assertion per test where possible
- Test names describe the scenario, not the function name
- Do not mock internals — mock at system boundaries only

## No over-engineering
- No abstractions beyond what the current ticket requires
- Three similar lines is better than a premature abstraction
- No feature flags or backwards-compat shims unless the spec asks for it
```
