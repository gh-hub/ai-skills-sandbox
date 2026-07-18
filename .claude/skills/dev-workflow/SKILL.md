---
name: dev-workflow
description: End-to-end development workflow. Entry point for all feature work. Reads PROGRESS.md to resume from any phase. Phases in order: grill → spec → tickets → implement (per ticket) → review (per round).
---

# dev-workflow

Always start here. Every feature, every session.

## First invocation (no plan exists yet)

If invoked without a plan argument, ask the user: "What are we building? Give it a short name (e.g. auth-refactor)."

If `plans/coding-rules/` does not exist in the current project, create it with:
- `plans/coding-rules/INDEX.md` — see the template in `plan-structure.md`
- `plans/coding-rules/general.md` — see the template in `plan-structure.md`

Create the plan folder:
```
plans/YYYYMMDD_HHMMSS-{name}/
  INDEX.md
  CONTEXT.md
  PROGRESS.md
```

All paths are relative to the current working directory (the project being worked on). Use the templates in `plan-structure.md` for each file. Then begin the **grill phase** by reading `phases/grill.md` and following it.

## Resuming a plan

If a plan name or path is given as an argument, read that plan's `PROGRESS.md` and continue from the current phase.

If no argument is given and multiple plans exist, list them and ask which to resume.

Once the plan is identified, read `PROGRESS.md`, determine the current phase, read the matching phase file from `phases/`, and execute it.

## Phase sequence

```
grill     → phases/grill.md
spec      → phases/spec.md
tickets   → phases/tickets.md
implement → phases/implement.md   (one session per ticket)
review    → phases/review.md      (one session per round)
```

## User checkpoints

The user is active at exactly three points:

1. **Grill**: fully interactive — you answer every question
2. **Tickets**: see the ticket list and approve (or adjust) before implementation starts
3. **Review end**: see the report and decide: fix (new round), accept as debt, or done

Everything else runs autonomously.

## Source of truth

**PROGRESS.md is always the source of truth for phase and ticket state.** CONTEXT.md and INDEX.md are derived views — they exist to help a session orient quickly, not to own state. If any file disagrees with PROGRESS.md, PROGRESS.md wins and the other file must be corrected before proceeding.

## Session discipline

- Each implement ticket = one fresh session
- Code review = one fresh session
- Every session starts by reading `CONTEXT.md` then cross-checking current ticket/phase against `PROGRESS.md`
- Every session ends by writing to `PROGRESS.md` first, then updating `CONTEXT.md` to match

## Coding rules

Before implement or review: read `plans/coding-rules/INDEX.md` and load only the rule files relevant to the current ticket's tech stack. Do not load rules that don't apply.

## Reference

See `plan-structure.md` for the canonical definition of every file and folder in a plan.
