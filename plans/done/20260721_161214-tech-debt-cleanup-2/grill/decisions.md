## Decision: Single combined plan (not split by area)
Decided: One plan folder covers both the API/web fixes and the e2e-suite fixes, with tickets split internally by area rather than across two plan folders.
Why: User preference — simpler to track as one backlog sweep than to coordinate two plans.
Alternatives rejected: Two separate plans (`api-web-tech-debt`, `e2e-tech-debt`) — would let each review independently, but adds coordination overhead for what's fundamentally one cleanup sweep over the same backlog.

## Decision: Skip the two low-value Spec-only e2e items
Decided: `e2e-smoke-spec-out-of-scope` and `e2e-workflow-dispatch-not-in-spec` are left as accepted debt, not carried into this plan.
Why: Both were flagged "harmless"/low-cost in their original findings; user chose not to spend a ticket on them right now.
Alternatives rejected: Fixing all 16 surviving items — rejected in favor of concentrating effort on the higher-value 14.

## Decision: likes-error-no-cause dropped as a duplicate
Decided: The round-1 finding `likes-error-no-cause` was deleted from the backlog during relevance-checking (not carried into any plan), because the round-2 finding `likes-error-console-duplicated` explicitly supersedes it — same root cause (missing `{ cause }` on the thrown error), expanded to cover both call sites instead of one.
Why: Fixing the round-2 finding inherently fixes the round-1 finding; keeping both as separate tickets would double-count the same work.
Alternatives rejected: Carrying both in as separate tickets — rejected, would produce two tickets touching the same lines for the same reason.
