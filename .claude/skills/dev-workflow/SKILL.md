---
name: dev-workflow
description: End-to-end development workflow. Entry point for all feature work. Reads PROGRESS/INDEX.md to resume from any phase. Phases in order: grill → spec → tickets → implement (per ticket) → review (per round — a spec-match + lint/build/test/e2e gate; auto-loops back to implement on failure). For a full standards/smell code-quality review, use the separate codereview-workflow skill.
---

# dev-workflow

Always start here. Every feature, every session.

## First invocation (no plan exists yet)

If invoked without a plan argument, derive a short, slug-friendly name from what the user described (e.g. `auth-refactor`) and proceed — do not ask the user to name it. Mention the chosen name in passing so they can redirect if they'd prefer a different one.

Delegate creating the plan folder: spawn a fresh `general-purpose` sub-agent (via the `Agent` tool, not `fork`) telling it to create

```
plans/YYYYMMDD_HHMMSS-{name}/
  INDEX.md
  CONTEXT.md
  PROGRESS/
    INDEX.md
```

using the templates in `plan-structure.md`, with the timestamp taken from `date +%Y%m%d_%H%M%S` run at creation time. `plans/` always lives at the project's repository root — even in a monorepo where the feature work itself touches a subdirectory (e.g. `apps/web/`, `apps/api/`). Never create a nested `plans/` under a subdirectory; if `/dev-workflow` is invoked from inside a subdirectory, still resolve `plans/` against the repo root. Have it report back the exact folder path it created. Then begin the **grill phase** by reading `phases/grill.md` and following it.

## Resuming a plan

If a plan name or path is given as an argument, read that plan's `PROGRESS/INDEX.md` and continue from the current phase.

If no argument is given and multiple plans exist, list them and ask which to resume.

Once the plan is identified, read `PROGRESS/INDEX.md`, determine the current phase, read the matching phase file from `phases/`, and execute it. For a phase string with a suffix (`implement/{slug}`, `review/round-{N}`), the file is picked from the prefix before the slash — see Phase sequence below.

## Phase sequence

```
grill     → phases/grill.md
spec      → phases/spec.md
tickets   → phases/tickets.md
implement → phases/implement.md   (one session per ticket)
review    → phases/review.md      (one session per round; spec-match + lint/build/test/e2e gate, no severity tags)
```

A round is `review/round-{N}`. On failure, it writes fix tickets and — for rounds 1-2 — loops straight back to `implement` with no user checkpoint (it's an objective gate, not a judgment call); once those fix tickets are done, the phase becomes `review/round-{N+1}`. Round 3+ failures require a live "continue"/"stop" decision (see `phases/review.md`). On pass, the only remaining step is a live "done" checkpoint to archive the plan.

## Auto mode

No external script — you (the current session) act as the conductor, spawning a fresh `general-purpose` sub-agent (via the `Agent` tool, not `fork` — it must NOT share your context) for each unattended unit of work, waiting for it to finish, then re-reading `PROGRESS/INDEX.md` to decide what's next. This keeps each ticket/phase's exploration and tool noise out of your own context instead of piling up across an entire plan.

Triggered when the user asks to run the rest of a plan autonomously (or invokes `/dev-workflow --auto <plan>` directly). Requires grill to already be complete — grill is a live interview, and a sub-agent has no user to interview. If the current phase is `grill`, stop and say so.

The loop, from the conductor's own turn:

1. Read `PROGRESS/INDEX.md`, get the current phase.
2. **`spec`** and **`implement/{ticket}`** — no user input needed mid-phase, so delegate: spawn a fresh sub-agent with a self-contained prompt telling it to read and follow the matching file in `phases/` for this plan (and, for implement, which ticket), update `PROGRESS/INDEX.md` (and write `PROGRESS/notes/{phase-slug}.md`)/`CONTEXT.md`/`INDEX.md` exactly as that phase file says, never run `git commit`/`git push`, never ask the user anything (make the reasonable call and note ambiguities in the plan files instead of stopping), and report back one line: what completed and the new current phase.
3. **`tickets`** and **`review/round-{N}`** — these may need a real user checkpoint (ticket-list approval; the round-3+ continue/stop decision; the final pass "done" archive) that only you, in this live conversation, can collect. Do not delegate these to a sub-agent — run the phase file yourself, exactly as normal, and let any checkpoint surface as an ordinary reply from the user. On a `review/round-{N}` failure at round 1-2, the phase file itself resolves with no checkpoint (an objective gate, not a judgment call) — treat that the same as a delegated phase completing and move straight to step 4.
4. After a delegated sub-agent returns, or after you finish running `tickets`/`review` yourself, re-read `PROGRESS/INDEX.md` and repeat from step 1.
5. Stop the loop when `review` reaches a pass and the user replies `done` (plan archived) or a round 3+ failure gets `stop` (paused) — report the final outcome. Also stop if a sub-agent reports an error rather than a clean completion; surface it and let the user decide how to proceed instead of continuing to spawn more agents on top of a broken state.

Tickets with no blocking edges between them may be delegated as concurrent sub-agents instead of one at a time — only when their `Blocked by` fields don't create a dependency.

## Delegation discipline

Beyond the whole-phase delegation above, each phase file also delegates its own mechanical write-up (writing files, updating `PROGRESS/INDEX.md` and `PROGRESS/notes/{phase-slug}.md`, plus `CONTEXT.md`/`INDEX.md`) to a fresh `general-purpose` sub-agent once no further user input is needed — same pattern as `phases/grill.md` step 4. This keeps synthesis and tool-call noise out of whichever session is running the phase, not just under auto mode. Two cases:

- **Phases that can be delegated whole under auto mode** (`spec`, `implement/{ticket}`): if you're running the phase file directly in conversation with the user, delegate its non-interactive tail to a fresh sub-agent. If you were yourself already spawned as a sub-agent to run this whole phase, skip the extra hop and just write the files directly — you have no user-facing context to protect.
- **Phases that always run live** (`tickets`, `review/round-{N}`): the interactive checkpoint — when there is one — always stays in your own turn, but once any user input is collected (or, for `review`, once a round 1-2 failure is resolved with no input needed), delegate the remaining mechanical writes to a fresh sub-agent unconditionally.

## User checkpoints

The user is active at these points:

1. **Grill**: fully interactive — you answer every question
2. **Tickets**: see the ticket list and approve (or adjust) before implementation starts
3. **Review, on pass**: reply "done" to archive
4. **Review, round 3+ on failure**: reply "continue" or "stop" — the standard 2-round auto-fix limit has been exceeded

A `review` failure at round 1 or 2 needs no user input — it auto-loops back to `implement`. Everything else runs autonomously.

## Source of truth

**PROGRESS/INDEX.md is always the source of truth for phase and ticket state.** CONTEXT.md and INDEX.md (the plan's, not PROGRESS's) are derived views — they exist to help a session orient quickly, not to own state. If any file disagrees with PROGRESS/INDEX.md, PROGRESS/INDEX.md wins and the other file must be corrected before proceeding. The `PROGRESS/notes/` files are historical write-ups, not state — never a source of truth for current phase/ticket.

## Session discipline

- Each implement ticket = one fresh session
- Review = one fresh session (or, under auto mode, one delegated/live turn) per round: `review/round-{N}`
- Every session starts by reading `CONTEXT.md` then cross-checking current ticket/phase against `PROGRESS/INDEX.md`
- Every session ends by writing to `PROGRESS/INDEX.md` first (phase table + a new `PROGRESS/notes/{phase-slug}.md`), then updating `CONTEXT.md` to match

## Coding rules

Before implement or review: read `coding-rules/INDEX.md` (in this skill's folder — the shipped defaults), and also `plans/coding-rules/INDEX.md` if it exists in the current project (project-specific additions/overrides). From both, load only the rule files relevant to the current ticket's tech stack — a `file` row is read directly, a `skill` row is invoked with the `Skill` tool. Do not load rules that don't apply.

## Reference

See `plan-structure.md` for the canonical definition of every file and folder in a plan.
