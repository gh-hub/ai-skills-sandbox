# gh-dev-workflow: model/effort map

A step-by-step map of every point in the workflow where a model choice
matters, with a recommendation and the reasoning behind it.

## Status

The five haiku recommendations (rows 1, 4, 7, 12, 13) are wired into the
skill files as of 2026-08-01 — each delegating `Agent` call now carries
`model: haiku` plus a one-line reason inline in `SKILL.md`, `grill.md`,
`tickets.md`, and `review.md`.

The row-10 recommendation (bump the security sub-agent to `opus`) is **not
yet applied** — still open.

## Constraint this map works within

gh-dev-workflow delegates via the plain `Agent` tool (`subagent_type:
general-purpose`), not a `Workflow` script. The `Agent` tool only exposes a
`model` override (`sonnet` / `opus` / `haiku` / `fable`) — there is no
per-call reasoning-*effort* knob on it. Effort control (`low` / `medium` /
`high` / `xhigh` / `max`) only exists inside `Workflow`'s `agent()` calls.

So "level" in the sense of effort isn't available to this skill without
rearchitecting its delegation onto `Workflow` — a much bigger change (fits
poorly with the skill's one-sub-agent-at-a-time, session-by-session design,
and would need explicit user opt-in per the Workflow tool's own rules). This
map therefore recommends **model only**, and treats judgment-heavy steps as
"keep the capable model" rather than "raise the effort," since effort isn't
a lever we have here. If the skill is ever ported onto `Workflow`, the same
judgment-load column below maps directly onto effort tiers (mechanical →
`low`, judgment-heavy → `high`/`xhigh`).

## Principle

Every step falls into one of two buckets:

- **Transcription** — writing already-decided content into files (progress
  tables, notes, tickets whose content was already approved, moving a
  folder). No new decisions get made. A weak model doing this wrong just
  means a re-run, not a wrong decision baked into the plan. → **cheap/fast
  model**.
- **Judgment** — deciding something that the rest of the plan will build on
  (how to slice tickets, whether a security finding is real, how to
  implement a ticket correctly). Getting this wrong here is expensive
  because it propagates. → **keep the capable model** (whatever the session
  would otherwise default to — no downgrade, and consider a deliberate
  upgrade where the cost of a miss is asymmetric, like security review).

## The map

| # | Phase / step | Live or delegated | What happens | Judgment load | Recommended model | Why |
|---|---|---|---|---|---|---|
| 1 | `SKILL.md` — first invocation | Delegated (sub-agent) | Create plan folder + `INDEX.md`/`CONTEXT.md`/`PROGRESS/INDEX.md` from templates | Transcription | **haiku** ✅ applied | Pure template fill-in, no decisions |
| 2 | `grill.md` step 2 — the interview | Live (main session) | Interview the user, recommend answers, walk the decision tree | Judgment (highest in the whole workflow — everything downstream depends on getting this right) | **whatever the user is already running the session on** | Not delegated, so there's no override point here — this is why the model the *user* picks for the live session matters most. Don't suggest downgrading to save cost here. |
| 3 | `grill.md` step 3 — confirm understanding | Live (main session) | Summarize and get explicit sign-off | Judgment (light) | same as step 2 | Same session, same reasoning |
| 4 | `grill.md` step 4 — write-up | Delegated (sub-agent) | Write `requirements.md`/`decisions.md`/`glossary.md`/ADRs from confirmed material | Transcription | **haiku** ✅ applied, with one caveat below | The content was already decided in step 2-3; this is formatting, not deciding |
| 5 | `spec.md` step 2 — synthesis (+ drafted tickets, per the merge doc) | Delegated (sub-agent) | Read grill output, explore codebase, pick test seams, write `spec.md`, draft the ticket breakdown | Judgment (test-seam choice and ticket slicing both have lasting consequences) | **keep default** (no downgrade) | This step *looks* like transcription (grill output → spec) but test-seam selection and ticket slicing are real design calls baked in here, especially once it also drafts tickets |
| 6 | `tickets.md` step 4 — approval checkpoint | Live (main session) | Present ticket breakdown, iterate with the user | Judgment (light — user is doing the judging) | same as grill | Live checkpoint, no override point |
| 7 | `tickets.md` step 5 — write-up | Delegated (sub-agent) | Write ticket files + update progress/context/index from the *approved* list | Transcription | **haiku** ✅ applied | Content already approved by the user in step 4; this is pure formatting |
| 8 | `implement.md` step 2 — implementation | Delegated (sub-agent) | TDD implementation of one ticket: explore, write tests, write code, run suites | Judgment (highest-stakes delegated step — this is the actual product code) | **keep default**; consider **opus** for a ticket you already expect to be gnarly | This is real engineering work, not formatting. A weak model here doesn't just redo work — it can ship a subtly wrong implementation that review might not catch |
| 9 | `review.md` step 3 — spec-match sub-agent | Delegated (sub-agent) | Diff against `spec.md`, report gaps/scope-creep/wrong-but-plausible requirements | Judgment (adversarial — must catch things that *look* done) | **keep default** | False negatives here ship incomplete features silently |
| 10 | `review.md` step 3 — security sub-agent | Delegated (sub-agent) | Diff against a fixed vulnerability-class checklist, report concrete exploitable issues | Judgment (adversarial, asymmetric cost) | **opus** ⏳ open | A missed vulnerability is far more expensive than the marginal cost of a stronger model on this one call. This is the single best place in the whole workflow to spend extra model budget. |
| 11 | `review.md` step 4 — lint/build/test/e2e | Live (main session, plain Bash) | Run project commands, record pass/fail | N/A — not an agent call | N/A | No model involved; nothing to tune |
| 12 | `review.md` step 6a — FAIL write-up | Delegated (sub-agent) | Write `findings.md` + fix tickets from the step-3 sub-agents' already-generated findings | Transcription | **haiku** ✅ applied | The judgment already happened in step 3; this step formats those findings into files and ticket shape |
| 13 | `review.md` step 6b — PASS write-up + archive | Delegated (sub-agent) | Update progress/context/index, move plan folder to `done/` | Transcription | **haiku** ✅ applied | Purely mechanical, no decisions |

## The one caveat on row 4

ADRs (`grill.md` step 4) are the one write-up output that isn't purely
mechanical prose — they're meant to be read months later by someone with no
memory of the interview. If a project leans on ADRs heavily as its
long-term decision record, keep `sonnet` for that specific file's drafting
even while the rest of the write-up (requirements/decisions/glossary) stays
on `haiku`. Not worth a hard rule; a judgment call per project.

## What this doesn't change

- No phase changes what it *does* — this is purely about which model runs
  each existing delegated call.
- Rows 2, 3, and 6 have no lever today because those steps are never
  delegated (they're always live, by design — see `SKILL.md`'s "User
  checkpoints"). The only way to change their model is to change what model
  the user runs the top-level session on.
- If the skill later moves to `Workflow` for other reasons (e.g. to run
  independent implement tickets concurrently safely — see gap #2 in
  `gh-dev-workflow-gaps.md`), this same table's judgment-load column
  converts directly to effort tiers, so the analysis doesn't need to be
  redone.
