# Coding Rules Index

Load this file at the start of every implement and review session. Then load only the rule files that apply to the current ticket's tech stack — do not load files that don't apply.

## Rule files

| File | Load when |
|---|---|
| [general.md](general.md) | Always |
| [python.md](python.md) | Ticket touches Python code |
| [nextjs.md](nextjs.md) | Ticket touches Next.js / React |
| [nestjs.md](nestjs.md) | Ticket touches NestJS |
| [electron.md](electron.md) | Ticket touches Electron |

## Repo-specific overrides

| File | Load when |
|---|---|
| [repos/](repos/) | Check this folder for a file matching the current repo name |

Repo-specific rules override general rules where they conflict. Always load the matching repo file if one exists.

## Adding rules

Add rules to the relevant file as you discover them during implementation or review. Keep rules short — one clear sentence, not a paragraph. If a rule needs explanation, add a one-line "Why:" under it.

New tech stacks: create a new file and add a row to this index.
