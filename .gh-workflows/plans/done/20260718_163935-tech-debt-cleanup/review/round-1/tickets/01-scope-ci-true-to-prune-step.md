# 01 — apps/api: scope `ENV CI=true` to the prune step only

**What to build:** `apps/api/Dockerfile` is single-stage (`FROM node:22-alpine` all the way through `ENTRYPOINT`), so the `ENV CI=true` added at line 3 persists into the actual running container, not just the `pnpm prune --prod` step it was added for. `entrypoint.sh` runs `pnpm exec drizzle-kit migrate` then `exec node dist/main.js` at container start, so both now execute with `CI=true` in the environment — an unintended runtime behavior change the spec never asked for (spec only requires excluding dev tooling from the image, not altering runtime env vars). Remove the Dockerfile-wide `ENV CI=true` and instead scope `CI=true` to only the prune command, e.g. `RUN CI=true pnpm prune --prod`.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `apps/api/Dockerfile` no longer has a bare `ENV CI=true` line
- [x] `pnpm prune --prod` still succeeds inside the `apps/api` Dockerfile build (scoped `CI=true` prefix on that one `RUN` line)
- [x] `CI` is not set in the environment of the final running container (verify: `docker compose up --build`, then `docker compose exec api env` or equivalent shows no `CI` var, or inspect the built image's runtime env)
- [x] `docker compose up --build` still runs migrations via `entrypoint.sh` and serves traffic (`GET /health` returns 200) — confirms the prune/migrate/runtime path still works with the narrower scoping
