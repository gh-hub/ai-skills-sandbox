#!/usr/bin/env python3
"""Auto mode driver for the dev-workflow skill (Windows counterpart of auto.sh).

Loops headless `claude -p` calls across fresh sessions so you don't have to
manually /clear + rerun /dev-workflow between phases and tickets. Stops and
prompts you in this terminal at the two checkpoints dev-workflow defines:
ticket-list approval and the review-round decision.

Behavior must stay identical to auto.sh — if you change one, change the other.

Usage: python auto.py <plan-name-or-path>
"""

import glob
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

MAX_ITER = 60

# dev-workflow resolves plan paths against the project's repository root —
# plans/ always lives there, even in a monorepo where the ticket work itself
# touches a subdirectory (e.g. apps/web/). Run this script from that root.


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def resolve_plan_dir(plan_arg):
    if Path(plan_arg).is_dir():
        return plan_arg

    matches = sorted(glob.glob(f"plans/*{plan_arg}*"))
    if not matches or not Path(matches[0]).is_dir():
        if glob.glob(f"plans/done/*{plan_arg}*"):
            print(f"Plan '{plan_arg}' is already archived under plans/done/ — nothing to do.")
            sys.exit(0)
        fail(f"No plan folder matching '{plan_arg}' under plans/.")
    if len(matches) > 1:
        print(f"Multiple plans match '{plan_arg}':", file=sys.stderr)
        for m in matches:
            print(f"  {m}", file=sys.stderr)
        sys.exit(1)
    return matches[0]


def current_phase(progress_file):
    lines = Path(progress_file).read_text().splitlines()
    for i, line in enumerate(lines):
        if line.startswith("## Current phase"):
            if i + 1 < len(lines):
                return re.sub(r"\s+", "", lines[i + 1])
            return ""
    return ""


def run_claude(args, disallowed):
    cmd = ["claude", *args, "--output-format", "json", "--permission-mode", "auto", *disallowed]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        fail(f"claude exited with status {result.returncode}")
    return json.loads(result.stdout)


def main():
    if len(sys.argv) < 2:
        fail(f"Usage: {Path(sys.argv[0]).name} <plan-name-or-path>")
    plan_arg = sys.argv[1]

    if shutil.which("claude") is None:
        fail("auto.py requires the claude CLI on PATH")

    plan_dir = resolve_plan_dir(plan_arg)
    progress_file = Path(plan_dir) / "PROGRESS.md"
    if not progress_file.is_file():
        fail(f"No PROGRESS.md found at {progress_file}")

    # Belt-and-suspenders on top of dev-workflow's own "do not commit" rule —
    # the user commits, headless runs never do.
    disallowed = ["--disallowedTools", "Bash(git commit *)", "Bash(git push *)"]

    phase = current_phase(progress_file)
    if phase == "grill":
        print("Plan is still in the grill phase — that needs a live interview, no one is here to answer headless.")
        print(f"Run this interactively first: open claude, then run /dev-workflow {plan_arg}")
        print("Re-run auto.py once grill is complete.")
        sys.exit(1)

    print("== dev-workflow auto mode ==")
    print(f"Plan: {plan_dir}")
    print(f"Starting phase: {phase}")
    print()

    session_id = ""
    resuming = False
    pending_reply = ""
    total_cost = 0.0
    it = 0

    while True:
        it += 1
        if it > MAX_ITER:
            fail(f"Hit the safety cap of {MAX_ITER} calls — stopping. Check {progress_file} and resume manually.")

        phase_before = current_phase(progress_file)

        if resuming:
            args = ["-p", pending_reply, "--resume", session_id]
        else:
            args = ["-p", f"/dev-workflow --auto {plan_dir}"]

        print(f"--- call {it} (phase: {phase_before}) ---")
        response = run_claude(args, disallowed)

        is_error = response.get("is_error")
        session_id = response.get("session_id", "")
        result_text = response.get("result", "")
        cost = response.get("total_cost_usd") or 0
        total_cost += cost

        print(result_text)
        print(f"(cost: ${cost} · running total: ${total_cost:.4f})")
        print()

        if is_error:
            fail(f"Call reported an error — stopping. Session: {session_id}")

        # Archived = review phase moved the plan folder out from under us.
        if not Path(plan_dir).is_dir():
            print(f"Plan folder moved (archived). Done. Total cost: ${total_cost:.4f}")
            sys.exit(0)

        phase_after = current_phase(progress_file)

        if phase_after != phase_before:
            # Progress was made — next call starts a brand-new session.
            resuming = False
            pending_reply = ""
            continue

        # "stop" at a review checkpoint intentionally leaves phase == review
        # with no archive — that's a deliberate pause, not "still waiting for
        # a reply".
        progress_text = progress_file.read_text()
        if phase_after == "review" and "review paused" in progress_text.lower():
            print(f"Review paused by your decision. Plan left in-progress at {plan_dir}.")
            print(f"Total cost: ${total_cost:.4f}")
            sys.exit(0)

        # Phase didn't move otherwise. Expected at the two checkpoints
        # (waiting on you); anywhere else it means something is stuck.
        if phase_after in ("tickets", "review"):
            print("-- checkpoint: dev-workflow is waiting on your reply above --")
            pending_reply = input("> ")
            resuming = True
            continue

        print(f"Phase '{phase_after}' did not advance and this isn't a known checkpoint — stopping.", file=sys.stderr)
        print(f"Session {session_id} left open; inspect {progress_file}, then resume manually with: claude -r {session_id}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
