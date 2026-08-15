---
name: gh-dev-quick-workflow/spec-tickets
description: Combined phase 2 of gh-dev-quick-workflow. Synthesizes grill output into a trimmed spec and drafts a 1-2 ticket breakdown together, presented as one approval checkpoint. If the breakdown needs 3+ tickets, offers to escalate to gh-dev-workflow (grill/spec carry over in place) or trim back down.
---

# Spec + Tickets Phase

## Purpose

Turn the grill output into a spec and a ticket breakdown in one pass, with one user approval checkpoint — instead of `gh-dev-workflow`'s two separate phases and two separate checkpoints. This phase covers both the `spec` and `tickets` rows in `PROGRESS/INDEX.md`'s phase table.

No interview here — this is synthesis of what the grill already captured, same as `gh-dev-workflow`'s spec phase. The only live moment is the approval checkpoint (and, if triggered, the escalate/trim decision).

## Process

### 1. Load context

Read `PROGRESS/INDEX.md` first. Confirm `Workflow` is `quick` and the current phase is `spec`. If `Workflow` is `full`, this plan already escalated — see the "Resuming a plan" note in `SKILL.md`; don't run this phase against it. If the phase says anything other than `spec`, stop and tell the user — do not proceed.

If the `spec` row's `Started` column is still empty, stamp it now with the current timestamp (`date +"%Y-%m-%d %H:%M:%S"`) and set its status to `in-progress` — a direct quick edit, not delegated. Leave it untouched if already set (a resumed session).

Read `grill/requirements.md` — this skill's grill phase writes that one by default; read `grill/decisions.md`, `grill/glossary.md`, or any `grill/ADR-*.md` too, but only if they exist (per this skill's trimmed grill output, most plans won't have them). Do not ask the user questions here — if something is genuinely ambiguous and can't be resolved from the grill output, note it under "Further Notes" as an open question.

If `requirements.md` has an "## Environment notes" section, treat those facts as already confirmed. Explore the codebase for whatever the area being changed still needs beyond that. Use the domain glossary vocabulary throughout.

### 2. Draft the spec

Identify test seams: sketch the seams at which the change will be tested. Prefer existing seams, at the highest point available. Propose a new seam only if none fits.

Draft the spec using this **trimmed** template — no User Stories section (for a 1-2 ticket task, the Problem Statement already says who's affected and why; a formal numbered story list is ceremony without new information):

---

## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## Implementation Decisions

- Modules to build or modify
- Interface changes
- Technical clarifications
- Architectural decisions (reference ADRs where applicable)
- Schema changes
- API contracts
- Specific interactions

No file paths or code snippets unless a prototype produced a snippet that encodes a decision better than prose can.

## Testing Decisions

- What makes a good test for this feature (test external behavior, not internals)
- Which modules will be tested
- Prior art in the codebase for similar tests

## Out of Scope

What is explicitly not being built.

## Further Notes

Open questions, risks, or things to revisit.

---

### 3. Draft the ticket breakdown

Same discipline as `gh-dev-workflow`'s tickets phase:

- **Look for prefactor opportunities first** ("make the change easy, then make the easy change") — these go first if any apply.
- **Slice into vertical slices**: each a narrow but complete path through every layer (schema, API, UI, tests), independently demoable, sized to fit in one implement session. Give each ticket its blocking edges.
- **Wide mechanical refactors are the exception** (rename a column, retype a shared symbol) — use expand-contract, one batch per ticket.

For each ticket, capture: title, blocked-by, and what it delivers end-to-end.

### 4. Check the ticket count

**If the breakdown is 1-2 tickets**: proceed to step 5.

**If the breakdown is 3+ tickets**: this exceeds this skill's scope. Stop and present it live — this decision is never skipped or silently resolved, regardless of the progress-narration setting:

```
This needs {N} tickets — more than gh-dev-quick-workflow's 1-2 ticket scope:
  1. {title}
  2. {title}
  3. {title}
  ...

  "escalate" — hand off to gh-dev-workflow; grill and this spec carry over, nothing is lost
  "trim"     — consolidate this back into 1-2 tickets, if that's still an honest shape

Reply with one of those two words.
```

- On **"escalate"**: go to step 6a. Do not draft further.
- On **"trim"**: revise the breakdown down to 1-2 tickets and return to the top of step 4. If a trim would weld two genuinely unrelated pieces of work into one ticket just to hit the count, say so plainly and ask again rather than fabricating an artificial merge — the user may prefer to escalate instead once they see that.

### 5. User approval checkpoint (1-2 tickets)

Present the spec summary and the ticket breakdown as a numbered list. For each ticket:
- **Title**: short descriptive name
- **Blocked by**: which ticket must complete first (or "none")
- **What it delivers**: the end-to-end behavior this ticket makes work

Ask whether the granularity feels right and whether blocking edges are correct. Iterate until the user approves. This is the last user checkpoint before code is written.

### 6a. Escalating

Nothing further needs the user — delegate the write-up to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`, `model: haiku` — everything below is already decided, this step only transcribes it into files). This is the one point where a quick-plan gains the files it never otherwise carries (`CONTEXT.md`, top-level `INDEX.md`, `PROGRESS/notes/`) — `gh-dev-workflow` expects them from here on, so they're created now, not updated. Give it the plan folder path, the drafted spec (trimmed template, as written in step 2), the drafted ticket breakdown (title/blocked-by/what-it-delivers for every ticket, from step 3), and these instructions:

1. Write `.gh-workflows/plans/{folder}/spec.md` using the drafted spec verbatim.
2. Update `PROGRESS/INDEX.md`: flip `Workflow` from `quick` to `full` — this plan is now owned by `gh-dev-workflow`. Mark `spec` `done` in the Phases table, stamping `Finished` with the current timestamp (`date +"%Y-%m-%d %H:%M:%S"`). Leave `tickets` absent from the table for now — `gh-dev-workflow`'s own tickets phase adds ticket rows after its own approval, not before. Set current phase to `tickets`. Point "Last session end-state" at `notes/spec.md`.
3. Create `PROGRESS/notes/spec.md`: the session end-state, plus a `## Draft ticket breakdown` section listing the drafted tickets (title / blocked-by / what it delivers) — this exact section is what `gh-dev-workflow`'s `phases/tickets.md` looks for as its starting point, so the breakdown survives the handoff instead of being redrafted from scratch.
4. Create `CONTEXT.md` (per `../gh-dev-workflow/plan-structure.md`'s template): fill in "What we're building" (one sentence), link to `spec.md`, current phase `tickets`, and one line noting this plan escalated from `gh-dev-quick-workflow` (so a fresh session orients correctly).
5. Create `INDEX.md` (per the same template): `Workflow: full`, link to `spec.md`, status `tickets`.

Tell it never to run `git commit`/`git push`, and to report back one line confirming what was written. Wait for it to finish.

Then tell the user: "Escalated — grill and spec carry over. Run `/gh-dev-workflow` to continue; it'll resume at the tickets phase with this breakdown already drafted and ready for approval there."

### 6b. Approved (1-2 tickets)

The approval checkpoint is over — delegate the write-up to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`, `model: haiku`). Give it the approved spec and the approved ticket breakdown, and these instructions:

1. Write `.gh-workflows/plans/{folder}/spec.md` using the drafted spec verbatim.
2. Write `.gh-workflows/plans/{folder}/tickets/` — one file per ticket, numbered from `01` in dependency order (blockers first):
   ```markdown
   # {NN} — {Ticket title}

   **What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective.

   **Blocked by:** {ticket numbers/titles} or "None — can start immediately"

   **Status:** ready

   - [ ] Acceptance criterion 1
   - [ ] Acceptance criterion 2
   ```
   No file paths or code snippets unless a prototype produced a snippet that encodes a decision better than prose can.
3. Update `PROGRESS/INDEX.md`: mark **both** `spec` and `tickets` rows `done` in the Phases table (they close together — this is the point of the merged checkpoint), stamping each row's `Finished` with the current timestamp (`date +"%Y-%m-%d %H:%M:%S"`); the `tickets` row has no prior `Started` of its own since this phase covers both at once, so stamp its `Started` to the same timestamp as its `Finished`. Add one `implement/{NN}-{slug}` row per ticket (status `pending`). Set current phase to `implement/01-{slug}`. Set `Current ticket path` to `.gh-workflows/plans/{folder}/tickets/01-{slug}.md`. Set `## Last session end-state` to one inline sentence — spec approved, {N} ticket(s) drafted, starting ticket 01 — no separate notes file (this skill doesn't keep a `PROGRESS/notes/` folder; see `SKILL.md`'s "No CONTEXT.md / INDEX.md / notes files").

Tell it never to run `git commit`/`git push`, and to report back one line confirming what was written. Wait for it to finish.

### 7. Continue

No "start a new session" hand-off — per `SKILL.md`'s session model, proceed directly into the `implement/01-{slug}` phase in this same turn (delegating its mechanical work as that phase file describes). In default narration mode, give a one-line status first ("Spec + tickets approved — {N} ticket(s). Starting ticket 01: {title}."); in quiet mode, just proceed.
