# docker-compose-postgres-port-exposure

## Finding
`docker-compose.yml` adds `ports: ["5432:5432"]` on the postgres service — not called for by any likes-feed-redesign ticket, unrelated infra change riding along in this plan's diff (may be intentional dev convenience; confirm with author).

## Source
- Plan: .gh-workflows/plans/done/20260725_105431-likes-feed-redesign/
- Round: round-1
- Category: Standards / Spec
- Logged: 2026-07-25
- Moved: 2026-07-25
