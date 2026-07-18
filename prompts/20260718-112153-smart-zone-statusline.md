Set up a Claude Code status line segment that shows context usage relative to a fixed 140,000-token "Smart Zone" (separate from the model's actual context window limit).

Do this:

1. Create ~/.claude/statusline.sh with exactly this content, then chmod +x it:

```bash
#!/bin/bash
# Smart Zone context indicator for the Claude Code status line.
# Reads context_window.total_input_tokens from stdin JSON and shows
# progress toward a 140,000-token "Smart Zone", independent of the
# model's actual context window size.

input=$(cat)

tokens=$(printf '%s' "$input" | grep -o '"total_input_tokens"[[:space:]]*:[[:space:]]*[0-9]*' | head -n1 | grep -o '[0-9]*$')

# No data yet (early in session, or right after /compact) -> stay silent.
if [ -z "$tokens" ]; then
  exit 0
fi

awk -v tokens="$tokens" 'BEGIN {
  limit = 140000

  if (tokens < 100000) {
    color = "\033[32m"          # green
    zone  = "Smart Zone"
  } else if (tokens <= limit) {
    color = "\033[33m"          # yellow
    zone  = "Smart Zone"
  } else {
    color = "\033[31m"          # red
    zone  = "Not-So-Smart Zone"
  }
  reset = "\033[0m"

  pct     = int((tokens / limit) * 100 + 0.5)
  compact = int((tokens + 500) / 1000)

  printf "%sContext: %dK · %d%% · %s%s\n", color, compact, pct, zone, reset
}'
```

2. Add a `statusLine` key to `~/.claude/settings.json` pointing at that script:

```json
"statusLine": {
  "type": "command",
  "command": "~/.claude/statusline.sh"
}
```

Read the existing `~/.claude/settings.json` first and merge this key in — do NOT overwrite any other keys already present (e.g. `theme`, permissions, etc.). If the file doesn't exist yet, create it with just this key.

3. Verify the script works before finishing, by piping test JSON into it directly (don't rely on a live session):

```bash
echo '{"context_window":{"total_input_tokens":70000}}'  | ~/.claude/statusline.sh   # expect Context: 70K · 50% · Smart Zone (green)
echo '{"context_window":{"total_input_tokens":126000}}' | ~/.claude/statusline.sh   # expect Context: 126K · 90% · Smart Zone (yellow)
echo '{"context_window":{"total_input_tokens":151000}}' | ~/.claude/statusline.sh   # expect Context: 151K · 108% · Not-So-Smart Zone (red)
echo '{"context_window":null}' | ~/.claude/statusline.sh                           # expect no output, no error
```

Notes on why it's built this way (don't deviate from these without flagging it):
- Zone/color is based on raw tokens used, not the model's own context window size: <100K = green Smart Zone, 100K-140K inclusive = yellow Smart Zone, >140K = red Not-So-Smart Zone. Exactly 140K stays yellow.
- The percentage is always `(tokens / 140000) * 100`, rounded to the nearest integer — never based on the model's actual max context window.
- No `jq` dependency — parsing is done with grep/awk only, since jq may not be installed.
- This is purely additive: Claude Code renders the custom status line in its own row above the built-in footer badges (things like "accept edits on (shift+tab to cycle)"), so it does not remove or replace any existing status text.
- If `context_window.total_input_tokens` is missing or null (e.g. brand-new conversation, or right after `/compact`), the script must print nothing and must not error.
- Do not modify Claude Code's installed package/source — this is entirely a `~/.claude/settings.json` + `~/.claude/statusline.sh` change.
- Do not commit anything — this isn't part of any git repo.
