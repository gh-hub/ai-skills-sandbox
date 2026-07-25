# e2e-locator-anchoring-scope

## Finding
The e2e locator-anchoring fix (`/\d+ likes/` → `/^\d+ likes$/`) touched 4 files (`helpers.ts`, `like-flow.spec.ts`, `story-feed.spec.ts`, `story-form-flow.spec.ts`) beyond what the spec's Testing Decisions section named (only `smoke.spec.ts`) — necessary fallout from the new hero stats line, not unrelated feature work, but exceeds the letter of the spec. (Spec)

## Source
- Plan: plans/done/20260725_135937-cli-hero-and-backend-restructure/
- Round: round-1
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25
