---
name: dev-workflow/implement
description: Phase 4 of dev-workflow. Implements one ticket per session. No commits. Loads CONTEXT.md and relevant coding rules at start.
---

# Implement Phase

## Purpose

Implement one ticket. One ticket = one session. Do not implement more than one ticket per session unless both are trivially small and you are confident you will stay well under 120k tokens total.

## Process

### 1. Load context

Read in this order:
1. `plans/{folder}/CONTEXT.md` — orientation and current ticket path
2. `plans/{folder}/PROGRESS.md` — confirm which ticket is current
3. The ticket file at the exact path listed in CONTEXT.md under "Current ticket" — do not construct this path yourself; it may be under `tickets/` for original work or `review/round-N/tickets/` for review fixes
4. `plans/coding-rules/INDEX.md` — then load only the rule files that apply to this ticket's tech stack

Do not read the full spec or grill output unless CONTEXT.md links to something specific you need.

### 2. Explore relevant code

Read only the files relevant to this ticket. Use the acceptance criteria to guide what to look at. Do not explore the whole codebase.

### 3. Implement using TDD

Work test-first where possible:
- Write a failing test at the agreed seam (from the spec's testing decisions)
- Make it pass
- Run typechecking after each meaningful change
- Run the single test file regularly
- Run the full test suite once at the end

Use the coding rules loaded in step 1. If a rule conflicts with good judgment, note the conflict in PROGRESS.md — do not silently break the rule.

### 4. Do NOT commit

Do not run `git commit` or `git add` for a commit. The user commits.

### 5. Verify acceptance criteria

Go through each acceptance criterion in the ticket. Mark each one complete (or note if something is partial and why).

### 6. Update plan files

Update `CONTEXT.md`:
- Move completed ticket to "Completed tickets"
- Set current ticket to the next one (or "none" if all done)
- Update "Load this session" for the next session
- Add any gotchas discovered during implementation

Update `PROGRESS.md`:
- Mark this ticket as complete with timestamp
- Set current phase to the next ticket or `review` if all tickets done
- Write last session end-state: what was built, what the next session needs to know

### 7. Hand off

If more tickets remain: "Ticket {N} done. Start a new session and run `/dev-workflow` to implement ticket {N+1}."

If all tickets are done: "All tickets implemented. Start a new session and run `/dev-workflow` to begin code review."
