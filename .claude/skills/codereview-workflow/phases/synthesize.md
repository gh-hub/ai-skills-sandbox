---
name: codereview-workflow/synthesize
description: Third phase of codereview-workflow. Merges every per-file report into one summary, logs DEBT findings straight to plans/tech-debt/. No user input needed — the decide phase is next.
---

# Synthesize Phase

## Purpose

Turn the per-file reports written by `review.md` into one summary the user can actually act on, and get every DEBT finding into the shared backlog. No new judgment happens here — this phase merges and counts, it doesn't re-review.

## Process

### 1. Load context

Read `.codereview/{folder}/STATE.md` first — source of truth. Confirm the current phase is `synthesize`. If it is not, stop and tell the user — do not proceed.

Read every file in `.codereview/{folder}/reports/` (there may be none, if every file came back clean).

### 2. Delegate the merge

Hand this off to a fresh `general-purpose` sub-agent (`Agent` tool, not `fork`) if running live; do it directly if you were yourself spawned for this whole phase.

Whoever does the work should:

1. For every DEBT finding across all reports, write it to `plans/tech-debt/` (create the folder if it doesn't exist) as its own file, `plans/tech-debt/YYYYMMDD_HHMMSS-{slug}.md` (timestamp = now, to-the-second, via `date +%Y%m%d_%H%M%S`):
   ```markdown
   # {slug}

   ## Finding
   {the DEBT finding, verbatim, with file reference}

   ## Source
   - Branch: {branch name}
   - Category: Standards
   - Logged: {today's date}
   ```
   Same as `dev-workflow`, this skill has no archive step of its own — DEBT goes straight into the shared backlog the moment it's found.

2. Write `.codereview/{folder}/summary.md`:
   ```markdown
   # Code Review Summary — {branch name}

   ## Files
   {N} reviewed, {M} skipped as generated/vendored, {K} came back clean

   ## Findings
   BLOCK: {count}
   DEBT: {count} — logged to plans/tech-debt/

   ### BLOCK findings (must fix)
   {NN}. {file path} — {one-line finding} ([report](reports/{NN}-{file-slug}.md))
   ...

   ### DEBT findings (logged)
   {NN}. {file path} — {one-line finding} ([report](reports/{NN}-{file-slug}.md))
   ...

   ## What needs to be done
   {one line per BLOCK finding, phrased as an actionable task — this list becomes the dev-workflow tickets if the user picks "fix"}
   ```

3. Update `STATE.md`:
   - Add: `Findings: {BLOCK count} BLOCK, {DEBT count} DEBT — summary.md`
   - Set current phase to `decide`
   - Update "Last session end-state"

Tell it never to run `git commit`/`git push`, never to talk to the user (no findings should be summarized in chat — that's `decide.md`'s job next), and to report back one line: BLOCK count, DEBT count, and that the phase is now `decide`. Wait for it to finish before proceeding.

### 3. Hand off

This phase never talks to the user directly. Continue immediately to `phases/decide.md` yourself if you are the live session. If you were spawned as a sub-agent to run this whole phase, report back one line (BLOCK count, DEBT count, phase now `decide`) and stop.
