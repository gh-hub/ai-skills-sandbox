# Context: CLI Hero and Backend Restructure

## What we're building
A Claude-Code-CLI-styled bordered hero box for the "Thanks, Claude" site's homepage, plus a restructure of the API's `likes` feature into `src/apps/likes/` with a repository/service/controller split — two unrelated pieces of work bundled into one plan at the user's request.

## Key decisions
- CSS-built box, not Unicode box-drawing characters — see grill/ADR-001-hero-box-architecture.md
- Title-bar text is the page's single `<h1>` ("Thanks, Claude (code)") — see grill/ADR-001-hero-box-architecture.md
- Two-column box content stacks vertically below `sm`, divider reorients — see grill/ADR-001-hero-box-architecture.md
- Old subtitle paragraph removed; Like button/story form unchanged, stay below the box
- e2e smoke test heading assertion updates to "Thanks, Claude (code)"
- Only `likes` moves to `src/apps/likes/`; root bootstrap files stay at `src/` root — see grill/ADR-002-service-repository-layering.md
- Repository (DB-only) / service (business logic) / thin controller (HTTP-only) split — see grill/ADR-002-service-repository-layering.md
- Integration test relocates as-is; new isolated unit tests added for service and repository — see grill/ADR-002-service-repository-layering.md
- Only `likes` is restructured now; this establishes the pattern for future feature apps

## Tickets
- 01 — hero-terminal-box (apps/web) — blocked by: none — done
- 02 — relocate-likes-to-apps-folder (apps/api) — blocked by: none — done
- 03 — likes-repository-service-split (apps/api) — blocked by: 02 — done

## Current state
Phase: complete
Completed tickets: 01-hero-terminal-box, 02-relocate-likes-to-apps-folder, 03-likes-repository-service-split
Current ticket: none

## Round 1 review findings
BLOCK: 0, DEBT: 4 — see [review/round-1/report.md](review/round-1/report.md) for full detail. DEBT exported to .gh-workflows/plans/tech-debt/. No BLOCK tickets written.

Plan complete.

## Load this session
- .gh-workflows/plans/20260725_135937-cli-hero-and-backend-restructure/spec.md
- .gh-workflows/plans/20260725_135937-cli-hero-and-backend-restructure/tickets/

## Spec
[spec.md](spec.md)

## Gotchas
- This plan covers two unrelated pieces of work (a frontend hero redesign and a backend restructure) bundled together at the user's explicit request — keep them separate in spec/tickets rather than conflating them, but both live under this one plan folder.
