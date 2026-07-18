---
name: dev-workflow/grill
description: Phase 1 of dev-workflow. Grills the user to extract all requirements and decisions, then saves structured output to the plan folder.
---

# Grill Phase

## Purpose

Extract a complete, unambiguous picture of what we're building. This is the only phase where the user is fully interactive. Everything downstream (spec, tickets, code) builds on this output — get it right here.

## Process

### 1. Load context

Read the plan's `CONTEXT.md`. If this is the first session, it will be sparse — that's expected.

If the repo has a domain glossary or ADRs, read them now so you use consistent vocabulary.

### 2. Run the interview

Follow the grilling discipline from `phases/grilling.md`:

- Interview relentlessly, one question at a time
- Walk every branch of the decision tree
- For each question, give your recommended answer first
- Look up facts from the environment rather than asking about them
- Do not proceed until the user confirms shared understanding

Focus areas:
- **What problem are we solving?** From the user's perspective.
- **Who are the actors?** Who uses this, who is affected.
- **What does done look like?** Concrete, observable outcomes.
- **What are the boundaries?** What is explicitly out of scope.
- **What constraints exist?** Tech stack, performance, compliance, backwards compat.
- **What decisions are already made?** Don't re-litigate them — record them.
- **What is unknown or risky?** Surface it now, not during implement.

### 3. Confirm shared understanding

Before saving anything, summarize what you've heard and ask the user to confirm. Fix anything that's off.

### 4. Save output

Write to `plans/{folder}/grill/`:

**requirements.md** — what we're building, written from the user's perspective. Not a spec, not a design. Just: what problem, what solution, what done looks like, what's out of scope.

**decisions.md** — every load-bearing decision made during the interview. Format:
```
## Decision: {title}
Decided: {what was decided}
Why: {reason given}
Alternatives rejected: {if any}
```

**glossary.md** — domain terms defined or clarified during the session. One term per entry.

**ADR-NNN.md** — one file per architectural decision that has lasting consequences (tech choice, schema shape, API contract, integration approach). Only write ADRs for decisions the team will need to remember in 6 months.

### 5. Update plan files

Update `CONTEXT.md`:
- Fill in "What we're building" (one sentence)
- Add key decisions (one line each, link to ADR if one exists)
- Set current phase to `spec`
- Clear "Load this session" — that's for implement/review sessions

Update `PROGRESS.md`:
- Mark `grill` as complete with timestamp
- Set current phase to `spec`
- Write last session end-state

Update `INDEX.md`:
- Fill in "What we're building"
- Update status to `spec`

### 6. Hand off

Tell the user: "Grill complete. Start a new session and run `/dev-workflow` to continue with the spec phase."
