# Review Round 2

## Standards

# Round-2 Review: apps/e2e Playwright Suite

## Round-1 BLOCK — verified fixed
`global-teardown.ts` now gates `docker compose down` on `E2E_STACK_WAS_ALREADY_RUNNING === "true"`, correctly respecting `reuseExistingServer`. No remaining BLOCK.

## `apps/e2e/playwright.config.ts` (new in this round's fix)

- **DEBT (judgment call) — implicit global-state coupling.** `E2E_STACK_WAS_ALREADY_RUNNING` is set as a top-level module side effect during config load, then read by `global-teardown.ts` in a completely separate function invocation later. This is a hidden, order-dependent channel (config must load before teardown runs) rather than an explicit passed value — a global-state smell. The inline WHY-comment mitigates it, but it's fragile: any future refactor that reorders config/teardown loading silently breaks it.

- **DEBT (minor, Duplicated Code)** — `!process.env.CI` appears twice: once gating `isStackAlreadyRunning()`, once in `reuseExistingServer: !process.env.CI`. Same "are we local" knowledge encoded in two places (Shotgun Surgery risk if CI detection logic ever changes).

- **DEBT (judgment call) — unguarded boundary call.** `isStackAlreadyRunning()` runs `execFileSync("docker", ["compose","ps",...])` synchronously at config-load with no try/catch. If Docker isn't running locally, this throws a raw child_process error before any test output — not a silent swallow (compliant with the error-handling rule), but noticeably less helpful than `global-setup.ts`'s retry-with-clear-message pattern for the same kind of failure.

- Naming and error-handling otherwise comply: `isStackAlreadyRunning` is correctly `is`-prefixed; the comment explains WHY (cross-file dependency), not WHAT — compliant with the comments standard.

## `apps/e2e/global-teardown.ts`
No violations. Single responsibility, boundary-only error handling (uncaught `execFileSync` failure propagates, not swallowed).

## `apps/e2e/tests/*.spec.ts`
- Duplicated like-count parsing and multi-assertion tests already logged as DEBT from round 1 — unchanged in this round, not re-flagged.

## `.github/workflows/e2e.yml`, `package.json`, `tsconfig.json`, `pnpm-lock.yaml`
No standards violations found.

**Net verdict:** round-1 BLOCK is correctly resolved; no new BLOCK introduced. The fix itself introduces new DEBT-level judgment calls (global env-var coupling, duplicated CI check, unguarded docker probe).

## Spec

## Review findings

**Round-1 BLOCK — genuinely fixed.** The `isStackAlreadyRunning()` probe runs `docker compose ps --status running --format json` at config-load time (before `webServer` starts), stores the result gated on `!process.env.CI` in `E2E_STACK_WAS_ALREADY_RUNNING`, and `global-teardown.ts` skips `docker compose down` when that's `"true"`. This correctly restores the spec's intent: *"reuseExistingServer: !process.env.CI so local iteration can reuse an already-running stack ... CI always starts clean."* In CI, `!process.env.CI` short-circuits to `false` before the docker call even runs, so teardown always tears down there — matches spec. Locally, a pre-existing stack is detected and preserved; a freshly-started-by-Playwright stack is torn down. No timing bug — the probe happens before Playwright's own webServer logic touches the stack.

**(c) Wrong-but-looks-right — partial-stack false positive (DEBT).** `isStackAlreadyRunning()` returns true if *any* container is running (`output.trim().length > 0`), not that the full `web`/`api`/`postgres` set is up. A stale single leftover container (e.g. only `postgres` from a crashed prior run) makes teardown skip `docker compose down` even though `docker compose up --build` just started fresh `web`/`api` containers that arguably should be cleaned up too. Spec's phrase *"reuse an already-running stack"* implies the whole stack, not one container.

**(b) Scope creep — `smoke.spec.ts` and `workflow_dispatch` trigger** — already logged as DEBT from round 1, unchanged in this round.

**(b) Minor — `fullyParallel: true` + `workers: 1` (DEBT, style).** These are contradictory/redundant together — `workers: 1` already forces serial execution needed for the shared, non-isolated DB (`Out of Scope: per-test DB isolation/reset`), making `fullyParallel: true` dead config. Not a spec violation, just confusing.

Everything else checked out against spec and against the real app: baseURL/webServer URL (`8080`) matches `docker-compose.yml`'s `web` port mapping; `global-setup.ts` truncates `likes` via `docker compose exec ... psql` (no API/DB-reset-endpoint change, retries for migration lag) matching "DB-reset mechanism ... must not require adding a reset endpoint"; all four test files use accessible role/label locators that match `apps/web/app/page.tsx` and `components/theme-toggle.tsx` verbatim; delta-based assertions throughout; Chromium-only project; no changes to `docker-compose.yml`/Dockerfiles/nginx or `apps/web`/`apps/api` source.

## Summary
BLOCK findings: 0
DEBT findings: 4 new (2 Standards + 1 Standards judgment call + 1 Spec: env-var global-state coupling, duplicated CI check, unguarded docker probe, partial-stack false positive; plus 1 minor Spec style item: redundant fullyParallel+workers config). Round-1's already-logged DEBT items (like-count duplication, multi-assertion tests, smoke.spec.ts, workflow_dispatch) remain unchanged, not re-counted here.
Worst BLOCK: none — round 1's BLOCK is confirmed fixed.
