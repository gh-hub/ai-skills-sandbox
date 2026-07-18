# dockerfiles-ship-devdependencies

## Finding
`apps/api/Dockerfile` and `apps/web/Dockerfile` run `pnpm install --frozen-lockfile` with no prod/prune step, so devDependencies (drizzle-kit, jest, ts-jest, testcontainers) ship in the runtime image. Harmless for local Compose use but unaddressed. (Spec)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-1
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-18
