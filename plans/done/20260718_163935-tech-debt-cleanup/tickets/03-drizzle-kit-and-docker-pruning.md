# 03 — apps/api + apps/web: drizzle-kit reclassification + Docker pruning

**What to build:** `drizzle-kit` reclassified as a production dependency in `apps/api` (it runs at container runtime via `entrypoint.sh`), and both Dockerfiles pruned so their final runtime images exclude dev/test/build-only tooling. First confirm whether the `apps/web` prune step is even needed — its final `nginx` stage only copies the static `out/` directory, which may already carry no `node_modules` — and scope the work down if so.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `"drizzle-kit"` moved from `devDependencies` to `dependencies` in `apps/api/package.json`
- [x] `apps/api/Dockerfile` adds a prune/deploy step (`pnpm deploy` or equivalent `--prod` install) after the build step, so the final image installs only production dependencies — added `RUN pnpm prune --prod` scoped to `WORKDIR /repo/apps/api` (running it from the workspace root `/repo` instead incorrectly dropped the `drizzle-kit` symlink alongside the real devDependencies; scoping to the package directory keeps prod deps and drops only dev ones). Also added `ENV CI=true` since `pnpm prune` refuses to run without a TTY unless `CI` is set.
- [x] Manually verified: built `apps/api` image contains `drizzle-kit` but not `jest`, `ts-jest`, `@testcontainers/postgresql`, `@types/*`, `supertest`, `@nestjs/cli`, `@nestjs/testing` — checked via `node -e 'require.resolve(...)'` for each package inside the built image
- [x] Manually verified: `docker compose up` still runs migrations and serves traffic for `apps/api` — logs show "migrations applied successfully" and Nest startup; `/health` returned `{"status":"ok"}` and `/likes/count` returned `{"count":0}`; `web` served `200` on `:8080`
- [x] Investigated whether `apps/web/Dockerfile`'s final `nginx` stage (which copies only the static `out/` directory) ever receives `node_modules`/devDependencies from the build stage
- [x] No leak found: the final stage is `FROM nginx:1.27-alpine` and only ever `COPY`s `nginx.conf` and `--from=build /repo/apps/web/out` — no `node_modules` or devDependencies are copied into it at any point, so no prune step is needed for `apps/web`.
