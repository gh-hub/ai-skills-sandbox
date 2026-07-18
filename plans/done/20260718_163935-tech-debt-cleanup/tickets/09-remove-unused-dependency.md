# 09 — apps/web: Remove unused shared-types dependency

**What to build:** `"@thanks-claude/shared-types": "workspace:*"` is removed from `apps/web/package.json` after confirming it has no remaining references anywhere in `apps/web`, so the dependency list reflects what's actually used.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] Confirmed no references to `@thanks-claude/shared-types` anywhere in `apps/web` — including config files (e.g. `next.config`, `tsconfig.json` path aliases), not just `.ts`/`.tsx` source
- [ ] `"@thanks-claude/shared-types": "workspace:*"` removed from `apps/web/package.json` dependencies
- [ ] `pnpm install` succeeds
- [ ] `pnpm --filter @thanks-claude/web build` succeeds
