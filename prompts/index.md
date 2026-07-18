# Prompts Index

Reusable, self-contained prompts. Each is meant to be copy-pasted into a fresh Claude Code session (e.g. on another machine) and reproduce the same result, without depending on any other conversation's context.

**Convention:** new prompt files are named `YYYYMMDD-HHMMSS-short-description.md` (timestamp to the second) so they stay ordered by creation time. Add a row below whenever a new one is added.

| File | Summary |
|---|---|
| [20260718-091117-init.md](20260718-091117-init.md) | Original brain-dump defining the grill → plan → spec → tickets → implement → code-review workflow, session/context-budget rules (stay under ~120-140K tokens per session), and the progress-tracking requirements this project is built around. |
| [20260718-112153-smart-zone-statusline.md](20260718-112153-smart-zone-statusline.md) | Sets up a Claude Code status line segment showing context usage against a fixed 140,000-token "Smart Zone" (green/yellow/red), independent of the model's actual context window — includes the exact `~/.claude/statusline.sh` script and `settings.json` merge instructions. |
