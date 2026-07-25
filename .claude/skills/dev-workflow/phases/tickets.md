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

### 5. Delegate the write-up

The approval checkpoint is over — nothing from here on needs the user, so per the Delegation discipline in `SKILL.md`, hand the write-up to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`) instead of writing the files yourself. Give it the approved ticket breakdown (title, blocked-by, what it delivers — for every ticket) and these instructions:

Write to `plans/{folder}/tickets/` — one file per ticket, numbered from `01` in dependency order (blockers first):

```markdown
# {NN} — {Ticket title}

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective.

**Blocked by:** {ticket numbers/titles} or "None — can start immediately"

**Status:** ready

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
```

No file paths or code snippets unless a prototype produced a snippet that encodes a decision better than prose can.

Then update the plan files:

- `PROGRESS.md`: mark `tickets` complete with timestamp, add one `implement/{NN}-{slug}` line per ticket (all unchecked), set current phase to `implement/01-{slug}`, set `Current ticket path` to `plans/{folder}/tickets/01-{slug}.md`, write last session end-state.
- `CONTEXT.md`: add list of tickets with their numbers and slugs, set current phase to `implement`, set current ticket to `plans/{folder}/tickets/01-{slug}.md` (full path).
- `INDEX.md`: add link to tickets/, update status to `implement`.

Tell it never to run `git commit`/`git push`, and to report back one line confirming what was written. Wait for it to finish before proceeding.

### 6. Hand off

Tell the user tickets are written and give them both ways to continue:
- Manually, one ticket per session: "Start a new session and run `/dev-workflow` to begin implementing ticket 01."
- Autonomously, across all remaining tickets and the review round: ask to run it that way — see "Auto mode" in `SKILL.md`. It still stops at the review-round decision checkpoint, and it never runs `git commit`/`git push` on its own.

(This step doesn't apply under `--auto` — see "Auto mode" in `SKILL.md`, which replaces this whole hand-off with a one-line status instead.)
