# drizzle-kit-runtime-dependency-sharpened

## Finding
Sharpens the round-1 devDependencies item: `apps/api/entrypoint.sh` runs `pnpm exec drizzle-kit migrate` at container *runtime*, so `drizzle-kit` (a devDependency) is load-bearing in production, not just extra image weight. A naive `--prod`/prune fix to the round-1 item would break migrations — remediation needs to either move `drizzle-kit` to `dependencies` or run migrations as a separate build/init step. (Standards)

## Source
- Plan: plans/done/20260718_115923-thanks-claude/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18
