---
name: codereview-workflow/collect
description: First phase of codereview-workflow. Pins the branch diff, lists every changed file, and scaffolds the review folder. No user input needed.
---

# Collect Phase

## Purpose

Pin down exactly what this review covers before any file gets checked: the diff against the base branch, and the list of files it touches.

## Process

### 1. Load context

Read `.codereview/{folder}/STATE.md` first — source of truth. Confirm the current phase is `collect`. If it is not, stop and tell the user — do not proceed.

### 2. Pin the diff

The diff is everything on this branch not yet on the base branch recorded in `STATE.md`:
```
git diff {base-branch}...HEAD --stat
```

Confirm the diff is non-empty before continuing.

### 3. List changed files

From the diff, get the file list and per-file change size (`git diff {base-branch}...HEAD --stat` gives both). Exclude generated/vendored noise that no coding-standard review can meaningfully apply to: lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, ...), snapshot files (`*.snap`), and anything under a `dist/`, `build/`, `node_modules/`, or `.next/` path. Keep everything else, including small files — this skill reviews one file at a time regardless of size (see `phases/review.md`).

### 4. Delegate the write-up

Hand this off to a fresh `general-purpose` sub-agent (`Agent` tool, not `fork`) if you're running this phase live; if you were yourself spawned to run this whole phase, just do the following directly.

Whoever does the work should:

1. Create `.codereview/{folder}/reports/` (empty — populated by the review phase).
2. Write `.codereview/{folder}/files.md`:
   ```markdown
   # Changed files — {branch name}

   ## Reviewed
   01. {path} ({+N -M})
   02. {path} ({+N -M})
   ...

   ## Skipped (generated/vendored)
   - {path}
   - ...
   ```
   Number the "Reviewed" list from `01` — this numbering is what `review.md` uses for report filenames.
3. Update `STATE.md`:
   - Set current phase to `review`
   - Update "Last session end-state": `{N} files to review, {M} skipped as generated. Starting review.`

Tell it never to run `git commit`/`git push`, never to talk to the user, and to report back one line: file count reviewed vs. skipped, and that the phase is now `review`. Wait for it to finish before proceeding.

### 5. Hand off

This phase never talks to the user directly. Continue immediately to `phases/review.md` yourself if you are the live session. If you were spawned as a sub-agent to run this whole phase, report back one line and stop.
