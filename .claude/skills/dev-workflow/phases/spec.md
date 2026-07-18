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

Read:
- `plans/{folder}/CONTEXT.md`
- `plans/{folder}/grill/requirements.md`
- `plans/{folder}/grill/decisions.md`
- `plans/{folder}/grill/glossary.md`
- Any ADRs in `plans/{folder}/grill/`

Do not ask the user questions. If something is genuinely ambiguous and cannot be resolved from the grill output, note it in the spec under "Further Notes" as an open question.

### 2. Explore the codebase (if one exists)

Understand the current state of the code in the area being changed. Use the domain glossary vocabulary throughout the spec.

### 3. Identify test seams

Sketch the seams at which the feature will be tested. Prefer existing seams. Use the highest seam possible. Propose new seams only if no existing one fits, and at the highest point available.

### 4. Write the spec

Save to `plans/{folder}/spec.md` using this template:

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

### 5. Update plan files

Update `PROGRESS.md` first:
- Mark `spec` as complete with timestamp
- Set current phase to `tickets`
- Write last session end-state

Then update `CONTEXT.md`:
- Add link to spec.md
- Set current phase to `tickets`

Update `INDEX.md`:
- Add link to spec.md
- Update status to `tickets`

### 6. Hand off

Tell the user: "Spec written. Start a new session and run `/dev-workflow` to continue with the tickets phase."
