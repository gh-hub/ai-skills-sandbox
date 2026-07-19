---
name: dev-workflow/tickets
description: Phase 3 of dev-workflow. Breaks the spec into tracer-bullet tickets saved to the plan folder. Includes a user approval checkpoint before implementation starts.
---

# Tickets Phase

## Purpose

Break the spec into tracer-bullet tickets — vertical slices, each independently demoable, each sized to fit in one implement session.

## Process

### 1. Load context

Read `PROGRESS.md` first. Confirm the current phase is `tickets`. If PROGRESS.md says a different phase, stop and tell the user — do not proceed.

Read:
- `plans/{folder}/CONTEXT.md`
- `plans/{folder}/spec.md`

Explore the codebase if you haven't already. Ticket titles and descriptions must use the domain glossary vocabulary from `plans/{folder}/grill/glossary.md`.

### 2. Look for prefactor opportunities

Before slicing the feature, look for code changes that would make the implementation easier. "Make the change easy, then make the easy change." Prefactor tickets go first.

### 3. Draft vertical slices

Each ticket must be:
- A narrow but complete path through every layer (schema, API, UI, tests)
- Independently demoable or verifiable when done
- Sized to fit in one fresh context window (one implement session)

Give each ticket its **blocking edges** — the tickets that must complete before it can start.

**Wide refactors are the exception.** A mechanical change with blast radius across the whole codebase (rename a column, retype a shared symbol) uses expand–contract: add new form, migrate in batches, delete old form. Each batch is its own ticket.

### 4. User approval checkpoint

Present the breakdown as a numbered list. For each ticket:
- **Title**: short descriptive name
- **Blocked by**: which tickets must complete first (or "none")
- **What it delivers**: the end-to-end behavior this ticket makes work

Ask:
- Does the granularity feel right?
- Are blocking edges correct?
- Should any tickets be merged or split?

Iterate until the user approves. This is the last user checkpoint before code is written.

### 5. Save tickets

Write to `plans/{folder}/tickets/` — one file per ticket, numbered from `01` in dependency order (blockers first).

```markdown
# {NN} — {Ticket title}

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective.

**Blocked by:** {ticket numbers/titles} or "None — can start immediately"

**Status:** ready

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
```

No file paths or code snippets unless a prototype produced a snippet that encodes a decision better than prose can.

### 6. Update plan files

Update `PROGRESS.md` first:
- Mark `tickets` as complete with timestamp
- Add one `implement/{NN}-{slug}` line per ticket (all unchecked)
- Set current phase to `implement/01-{slug}`
- Set `Current ticket path` to `plans/{folder}/tickets/01-{slug}.md`
- Write last session end-state

Then update `CONTEXT.md`:
- Add list of tickets with their numbers and slugs
- Set current phase to `implement`
- Set current ticket to `plans/{folder}/tickets/01-{slug}.md` (full path)

Update `INDEX.md`:
- Add link to tickets/
- Update status to `implement`

### 7. Hand off

Tell the user tickets are written and give them both ways to continue:
- Manually, one ticket per session: "Start a new session and run `/dev-workflow` to begin implementing ticket 01."
- Autonomously, across all remaining tickets and the review round: run `auto.sh` from the repo root, with the actual plan path filled in, e.g. `.claude/skills/dev-workflow/auto.sh plans/{folder}`. Note that it still stops at the review-round decision checkpoint, and that it never runs `git commit`/`git push` on its own.

(This step doesn't apply under `--auto` — see "Auto mode" in `SKILL.md`, which replaces this whole hand-off with a one-line status instead.)
