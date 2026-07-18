#!/usr/bin/env bash
# Auto mode driver for the dev-workflow skill.
#
# Loops headless `claude -p` calls across fresh sessions so you don't have to
# manually /clear + rerun /dev-workflow between phases and tickets. Stops and
# prompts you in this terminal at the two checkpoints dev-workflow defines:
# ticket-list approval and the review-round decision.
#
# Usage: auto.sh <plan-name-or-path>

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "auto.sh requires jq (brew install jq)" >&2
  exit 1
fi
if ! command -v claude >/dev/null 2>&1; then
  echo "auto.sh requires the claude CLI on PATH" >&2
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "Usage: $(basename "$0") <plan-name-or-path>" >&2
  exit 1
fi
PLAN_ARG="$1"

# dev-workflow resolves plan paths against the project's repository root —
# plans/ always lives there, even in a monorepo where the ticket work itself
# touches a subdirectory (e.g. apps/web/). Run this script from that root.

# Resolve the plan folder (accept a bare name or a full/relative path).
if [ -d "$PLAN_ARG" ]; then
  PLAN_DIR="$PLAN_ARG"
else
  MATCHES=(plans/*"$PLAN_ARG"*)
  if [ ! -d "${MATCHES[0]:-}" ]; then
    if compgen -G "plans/done/*${PLAN_ARG}*" >/dev/null 2>&1; then
      echo "Plan '$PLAN_ARG' is already archived under plans/done/ — nothing to do."
      exit 0
    fi
    echo "No plan folder matching '$PLAN_ARG' under plans/." >&2
    exit 1
  fi
  if [ "${#MATCHES[@]}" -gt 1 ]; then
    echo "Multiple plans match '$PLAN_ARG':" >&2
    printf '  %s\n' "${MATCHES[@]}" >&2
    exit 1
  fi
  PLAN_DIR="${MATCHES[0]}"
fi

PROGRESS_FILE="$PLAN_DIR/PROGRESS.md"
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "No PROGRESS.md found at $PROGRESS_FILE" >&2
  exit 1
fi

current_phase() {
  awk '/^## Current phase/{getline; print; exit}' "$PROGRESS_FILE" | tr -d '[:space:]'
}

# Belt-and-suspenders on top of dev-workflow's own "do not commit" rule —
# the user commits, headless runs never do.
DISALLOWED=(--disallowedTools "Bash(git commit *)" "Bash(git push *)")

PHASE="$(current_phase)"
if [ "$PHASE" = "grill" ]; then
  echo "Plan is still in the grill phase — that needs a live interview, no one is here to answer headless."
  echo "Run this interactively first: open claude, then run /dev-workflow $PLAN_ARG"
  echo "Re-run auto.sh once grill is complete."
  exit 1
fi

echo "== dev-workflow auto mode =="
echo "Plan: $PLAN_DIR"
echo "Starting phase: $PHASE"
echo

SESSION_ID=""
RESUMING=false
PENDING_REPLY=""
TOTAL_COST="0"
ITER=0
MAX_ITER=60

while true; do
  ITER=$((ITER + 1))
  if [ "$ITER" -gt "$MAX_ITER" ]; then
    echo "Hit the safety cap of $MAX_ITER calls — stopping. Check $PROGRESS_FILE and resume manually." >&2
    exit 1
  fi

  PHASE_BEFORE="$(current_phase)"

  if [ "$RESUMING" = true ]; then
    ARGS=(-p "$PENDING_REPLY" --resume "$SESSION_ID")
  else
    ARGS=(-p "/dev-workflow --auto $PLAN_DIR")
  fi

  echo "--- call $ITER (phase: $PHASE_BEFORE) ---"
  RESPONSE="$(claude "${ARGS[@]}" --output-format json --permission-mode auto "${DISALLOWED[@]}")"

  IS_ERROR="$(printf '%s' "$RESPONSE" | jq -r '.is_error')"
  SESSION_ID="$(printf '%s' "$RESPONSE" | jq -r '.session_id')"
  RESULT_TEXT="$(printf '%s' "$RESPONSE" | jq -r '.result')"
  COST="$(printf '%s' "$RESPONSE" | jq -r '.total_cost_usd // 0')"
  TOTAL_COST="$(awk -v a="$TOTAL_COST" -v b="$COST" 'BEGIN{printf "%.4f", a+b}')"

  echo "$RESULT_TEXT"
  echo "(cost: \$$COST · running total: \$$TOTAL_COST)"
  echo

  if [ "$IS_ERROR" = "true" ]; then
    echo "Call reported an error — stopping. Session: $SESSION_ID" >&2
    exit 1
  fi

  # Archived = review phase moved the plan folder out from under us.
  if [ ! -d "$PLAN_DIR" ]; then
    echo "Plan folder moved (archived). Done. Total cost: \$$TOTAL_COST"
    exit 0
  fi

  PHASE_AFTER="$(current_phase)"

  if [ "$PHASE_AFTER" != "$PHASE_BEFORE" ]; then
    # Progress was made — next call starts a brand-new session.
    RESUMING=false
    PENDING_REPLY=""
    continue
  fi

  # "stop" at a review checkpoint intentionally leaves phase == review with
  # no archive — that's a deliberate pause, not "still waiting for a reply".
  if [ "$PHASE_AFTER" = "review" ] && grep -qi "review paused" "$PROGRESS_FILE"; then
    echo "Review paused by your decision. Plan left in-progress at $PLAN_DIR."
    echo "Total cost: \$$TOTAL_COST"
    exit 0
  fi

  # Phase didn't move otherwise. Expected at the two checkpoints (waiting on
  # you); anywhere else it means something is stuck.
  if [ "$PHASE_AFTER" = "tickets" ] || [ "$PHASE_AFTER" = "review" ]; then
    echo "-- checkpoint: dev-workflow is waiting on your reply above --"
    read -r -p "> " PENDING_REPLY
    RESUMING=true
    continue
  fi

  echo "Phase '$PHASE_AFTER' did not advance and this isn't a known checkpoint — stopping." >&2
  echo "Session $SESSION_ID left open; inspect $PROGRESS_FILE, then resume manually with: claude -r $SESSION_ID" >&2
  exit 1
done
