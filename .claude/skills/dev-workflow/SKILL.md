---
name: dev-workflow
description: End-to-end development workflow. Entry point for all feature work. Reads PROGRESS.md to resume from any phase. Phases in order: grill → spec → tickets → implement (per ticket) → review (per round).
---

# dev-workflow

Always start here. Every feature, every session.

## First invocation (no plan exists yet)

If invoked without a plan argument, derive a short, slug-friendly name from what the user described (e.g. `auth-refactor`) and proceed — do not ask the user to name it. Mention the chosen name in passing so they can redirect if they'd prefer a different one.

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

`plans/` always lives at the project's repository root — even in a monorepo where the feature work itself touches a subdirectory (e.g. `apps/web/`, `apps/api/`). Never create a nested `plans/` under a subdirectory; if `/dev-workflow` is invoked from inside a subdirectory, still resolve `plans/` against the repo root. Use the templates in `plan-structure.md` for each file. Then begin the **grill phase** by reading `phases/grill.md` and following it.

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

## Auto mode

`auto.sh` (in this skill's folder) drives dev-workflow unattended across fresh headless sessions, so you don't have to manually `/clear` and re-run between tickets. Run it from the project's repository root — `plans/` always lives there, even if the ticket work itself is under a subdirectory like `apps/web/`:

```
.claude/skills/dev-workflow/auto.sh <plan-name-or-path>
```

It requires grill to already be complete — grill is a live interview, and there's no one there to answer headless. It runs spec, each implement ticket, and review generation autonomously, one fresh session per phase/ticket, using `--permission-mode auto` (Claude Code's built-in risk classifier) plus a hard block on `git commit`/`git push`. It stops and prompts you in the terminal at the two checkpoints dev-workflow defines: ticket-list approval and the review-round decision.

`auto.sh` invokes this skill as `/dev-workflow --auto <plan>` — not meant to be typed by hand. When invoked with `--auto`:
- Strip `--auto` before treating the rest of the argument as the plan name/path.
- If the current phase is `grill`, stop and say grill needs to run interactively — do not attempt to interview no one.
- At the end of any phase, skip the "Start a new session and run `/dev-workflow`" hand-off sentence (a driver script owns session boundaries) — state what completed and the new current phase in one line instead. Every other step of the phase runs exactly as written, including both user checkpoints — `--auto` changes only that closing sentence, never a decision.

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
