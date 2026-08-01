# gh-dev-workflow: merge ticket-drafting into the spec sub-agent

## Why

Today `spec` and `tickets` are two separate phases, each delegating to its own
fresh `general-purpose` sub-agent:

- `phases/spec.md` step 2 spawns a sub-agent that reads the grill output
  (`grill/requirements.md`, `decisions.md`, `glossary.md`, ADRs), explores the
  codebase, and writes `spec.md`.
- `phases/tickets.md` steps 1-3 have the *next* session (or sub-agent, under
  auto mode) re-read `CONTEXT.md`/`spec.md`, re-explore the codebase, look for
  prefactor opportunities, and draft the vertical-slice ticket breakdown —
  from scratch, with no memory of the exploration the spec sub-agent already
  did.

The real user checkpoint that validates the *content* is grill step 3
("Confirm shared understanding") — the user signs off before any of
requirements.md/decisions.md/glossary.md/ADRs are even written. The spec
phase doesn't make new decisions; it just structures already-approved
material into the spec template. So there's no meaningful oversight lost by
having the same sub-agent that writes the spec also draft the tickets
breakdown in the same pass — it just skips redoing codebase exploration and
context-loading. The ticket-list approval checkpoint (`tickets.md` step 4)
still exists and still catches bad slicing before code is written.

## What changes

The spec sub-agent will, in one delegated call, both write `spec.md` **and**
draft a ticket breakdown (prefactor tickets + vertical slices), persisting
the draft where the tickets phase can pick it up without re-deriving it. The
tickets phase then presents that draft for approval instead of drafting one
from scratch — falling back to drafting fresh only if no draft was carried
over (e.g. plans created before this change).

## File-by-file edits

### 1. `.claude/skills/gh-dev-workflow/phases/spec.md`

**Step 2 ("Delegate synthesis and write-up")** — extend the sub-agent's task
list. After its current steps 1-4 (read grill output, explore codebase,
identify test seams, write spec.md), add:

5. Using the spec just written, draft a ticket breakdown the same way
   `phases/tickets.md` steps 2-3 describe:
   - Look for prefactor opportunities first ("make the change easy, then make
     the easy change") — these tickets go first.
   - Slice the remaining feature into vertical slices: each a narrow but
     complete path through every layer (schema, API, UI, tests),
     independently demoable, sized to fit one implement session. Give each
     ticket its blocking edges.
   - Wide mechanical refactors (rename a column, retype a shared symbol) use
     expand-contract, one batch per ticket, per the "Wide refactors are the
     exception" note in `tickets.md`.
   - For each ticket, capture: title, blocked-by, and what it delivers
     end-to-end. This is a **draft only** — do not write anything under
     `.gh-workflows/plans/{folder}/tickets/`, and do not add ticket rows to
     `PROGRESS/INDEX.md`. That still happens in the tickets phase, after user
     approval.

Then change what step 5 (renumber to step 6, "update plan files") writes:

- `PROGRESS/notes/spec.md` must now include a `## Draft ticket breakdown`
  section listing the drafted tickets (title / blocked-by / what it
  delivers), so the breakdown survives the session boundary between spec and
  tickets phases (the hand-off tells the user to start a new session).
- Everything else in step 5 stays the same (mark `spec` done, set current
  phase to `tickets`, etc.) — the ticket rows in `PROGRESS/INDEX.md`'s Phases
  table still get added by `tickets.md` step 5, not here.

If delegating, add the draft-ticket-breakdown instructions and the
`PROGRESS/notes/spec.md` section requirement to the verbatim instructions
handed to the sub-agent.

**Step 3 ("Hand off")** — mention that a draft ticket breakdown was written
alongside the spec and will be presented for approval when the tickets phase
starts, so the user knows what to expect.

### 2. `.claude/skills/gh-dev-workflow/phases/tickets.md`

**Step 1 ("Load context")** — after reading `CONTEXT.md` and `spec.md`, also
read `PROGRESS/notes/spec.md`. If it contains a `## Draft ticket breakdown`
section, treat that as the starting point instead of exploring the codebase
and drafting from scratch. If it's absent (plan created before this change,
or spec phase produced no draft for some reason), fall back to the current
behavior — explore the codebase and run steps 2-3 as they exist today.

**Steps 2-3 ("Look for prefactor opportunities" / "Draft vertical slices")**
— reframe as conditional: only run these if no draft was carried over from
spec. Otherwise skip straight to step 4 with the carried-over draft.

**Step 4 ("User approval checkpoint")** — unchanged. Present the draft
(whether carried over or freshly drafted) as the numbered list; iterate on
it in the live conversation same as today (merge/split, fix blocking edges,
etc.) — no re-delegation needed since this is just editing a list, not
touching the filesystem yet.

**Step 5 ("Delegate the write-up")** — unchanged.

### 3. `.claude/skills/gh-dev-workflow/SKILL.md`

- **Auto mode, step 2**: note that the sub-agent delegated for the `spec`
  phase now also returns a draft ticket breakdown as part of its report; the
  conductor should carry that forward (it's already persisted in
  `PROGRESS/notes/spec.md` by the sub-agent, so no extra plumbing needed —
  just don't discard it).
- **Auto mode, step 3**: clarify that the `tickets` phase checkpoint now
  starts from the draft written during `spec` rather than drafting fresh,
  per the updated `tickets.md`.

## Backward compatibility

Plans already sitting in the `tickets` phase (created before this change)
won't have a `## Draft ticket breakdown` section in `PROGRESS/notes/spec.md`.
`tickets.md` step 1's fallback (explore + draft from scratch, as today)
handles that case with no migration needed.

## Out of scope

- No change to the grill phase or its checkpoint.
- No change to the tickets approval checkpoint itself (still live, still
  iterative).
- No change to how tickets are written to disk (`tickets.md` step 5) or to
  `PROGRESS/INDEX.md`'s per-ticket rows — those are still only created after
  user approval, not by the spec sub-agent.
