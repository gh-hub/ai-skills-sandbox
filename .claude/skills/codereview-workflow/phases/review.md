---
name: codereview-workflow/review
description: Second phase of codereview-workflow. Spawns one read-only sub-agent per changed file to check it against coding standards and the smell baseline. A file gets a report only if the sub-agent found something. No user input needed.
---

# Review Phase

## Purpose

Check every changed file against the coding standards and the smell baseline — nothing else, and no edits. Each file is reviewed by its own sub-agent so findings are grounded in that file's diff alone, not diluted across a batch. A clean file produces no report — only files with something to say get a doc.

## Process

### 1. Load context

Read `.codereview/{folder}/STATE.md` first — source of truth. Confirm the current phase is `review`. If it is not, stop and tell the user — do not proceed.

Read `.codereview/{folder}/files.md` for the numbered file list.

Then read:
- `../dev-workflow/coding-rules/INDEX.md` (shipped defaults, shared with dev-workflow) and `plans/coding-rules/INDEX.md` if it exists in this project (project-specific overrides). Load relevant rule files from both. A `file` row is read directly. A `skill` row (e.g. `nestjs-service-style`) — read its relevant reference file(s) directly rather than invoking the skill, since its content needs to be pasted into each sub-agent's prompt in step 3.
- Any `CODING_STANDARDS.md` or `CONTRIBUTING.md` in the repo.

### 2. Determine remaining work

Check `STATE.md`'s "Files reviewed" section against the numbered list in `files.md`. Skip any file already listed there — this makes the phase resumable after an interruption without re-reviewing files that already finished.

### 3. Spawn one read-only sub-agent per remaining file

Use `subagent_type: general-purpose`. Spawn in batches of up to 8 concurrent sub-agents (all in one message per batch — independent calls run in parallel — then wait for that batch before starting the next), rather than all at once, to keep concurrency reasonable on large diffs.

Give each sub-agent:
- The exact diff command scoped to just its file: `git diff {base-branch}...HEAD -- {file path}`
- The standards file contents pasted in full (sub-agent has no filesystem access to this skill's folder)
- The smell baseline pasted in full:
  - **Mysterious Name** — rename it; if no honest name comes, the design is murky
  - **Duplicated Code** — extract the shared shape
  - **Feature Envy** — move the method onto the data it envies
  - **Data Clumps** — bundle repeated field groups into one type
  - **Primitive Obsession** — give the concept its own small type
  - **Repeated Switches** — replace with polymorphism or a shared map
  - **Shotgun Surgery** — gather what changes together into one module
  - **Divergent Change** — split so each module changes for one reason
  - **Speculative Generality** — delete abstraction nothing needs
  - **Message Chains** — hide the walk behind one method
  - **Middle Man** — cut it, call the real target direct
  - **Refused Bequest** — drop the inheritance, use composition
- Brief: "Run the diff command with Bash. This is a **read-only** review — you may use `Write` only to create your own report file at the exact path given below; never `Edit` or `Write` any other file, and never touch the file under review. Check this one file's diff for: (a) every place it violates a documented standard — cite the standard; (b) any smell you spot — name it and quote the hunk. Tag each finding BLOCK (must fix before ship) or DEBT (real problem, not a blocker). Distinguish hard violations from judgement calls. Skip anything tooling enforces. If you find nothing, write no file at all and just report 'clean'. If you find something, write it to `.codereview/{folder}/reports/{NN}-{file-slug}.md`:
  ```markdown
  # Review: {file path}

  ## Findings
  {findings, each tagged BLOCK or DEBT, with rule/smell citation and the quoted hunk}
  ```
  Report back one line: `{NN} {file path} — BLOCK: {count}, DEBT: {count}` or `{NN} {file path} — clean`."

`{NN}` is that file's number from `files.md`, `{file-slug}` is the path with `/` replaced by `-`.

### 4. Delegate the write-up

Once all sub-agents across all batches have returned, hand the mechanical tail to a fresh sub-agent (`Agent` tool, `general-purpose` type, not `fork`) if running live; do it directly if you were yourself spawned for this whole phase.

Whoever does the work should update `STATE.md`:
- Append every file just processed to "Files reviewed" (one line each: `{NN} {file path} — BLOCK: {count}, DEBT: {count}` or `— clean`)
- Set current phase to `synthesize`
- Update "Last session end-state"

Tell it never to run `git commit`/`git push`, never to talk to the user, and to report back one line: total files reviewed, how many produced a report, and that the phase is now `synthesize`. Wait for it to finish.

### 5. Hand off

This phase never talks to the user directly. Continue immediately to `phases/synthesize.md` yourself if you are the live session. If you were spawned as a sub-agent to run this whole phase, report back one line and stop.
