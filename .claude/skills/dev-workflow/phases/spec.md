---
name: dev-workflow/spec
description: Phase 2 of dev-workflow. Synthesizes grill output into a spec and saves it to the plan folder. No user interview — pure synthesis.
---

# Spec Phase

## Purpose

Turn the grill output into a structured spec. No interview — synthesize what the grill already captured.

## Process

### 1. Load context

Read `PROGRESS.md` first. Confirm the current phase is `spec`. If PROGRESS.md says a different phase, stop and tell the user — do not proceed.

### 2. Delegate synthesis and write-up

Nothing in this phase needs the user — it's pure synthesis of grill output. Per the Delegation discipline in `SKILL.md`: if you're running this phase live (in conversation with the user), hand the rest of this phase to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`). If you were yourself spawned as a sub-agent to run this whole phase (e.g. under auto mode), just do the following steps directly instead of spawning yet another sub-agent.

Whoever does the work (you or the sub-agent) should:

1. Read `plans/{folder}/CONTEXT.md`, `plans/{folder}/grill/requirements.md`, `plans/{folder}/grill/decisions.md`, `plans/{folder}/grill/glossary.md`, and any ADRs in `plans/{folder}/grill/`. Not ask the user questions — if something is genuinely ambiguous and cannot be resolved from the grill output, note it in the spec under "Further Notes" as an open question.
2. Explore the codebase (if one exists) to understand the current state of the area being changed. Use the domain glossary vocabulary throughout the spec.
3. Identify test seams: sketch the seams at which the feature will be tested. Prefer existing seams. Use the highest seam possible. Propose new seams only if no existing one fits, and at the highest point available.
4. Write the spec to `plans/{folder}/spec.md` using the template below.
5. Update `PROGRESS.md` first: mark `spec` complete with timestamp, set current phase to `tickets`, write last session end-state. Then update `CONTEXT.md`: add link to spec.md, set current phase to `tickets`. Then update `INDEX.md`: add link to spec.md, update status to `tickets`.

If delegating, give the sub-agent the plan folder path and these instructions verbatim, plus: never run `git commit`/`git push`, never ask the user anything, and report back one line confirming what was written. Wait for it to finish before proceeding.

Spec template:

---

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A numbered list of user stories. Each in the format:

1. As a {actor}, I want {feature}, so that {benefit}

Be extensive — cover all aspects of the feature.

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

### 3. Hand off

Tell the user: "Spec written. Start a new session and run `/dev-workflow` to continue with the tickets phase." Mention they can also ask to run the rest autonomously (tickets, each implement ticket, review) — see "Auto mode" in `SKILL.md`; it still stops at the ticket-list checkpoint and any review checkpoint (pass, or round 3+ failure).
