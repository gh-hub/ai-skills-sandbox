# Review Round 1

## Standards

Ran the diff. Findings below (all against the standards listed; no linter/format nits included).

**apps/e2e/tests/like-flow.spec.ts, story-form-flow.spec.ts** — Duplicated Code / Primitive Obsession (DEBT)
The like-count parsing `Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1])` is repeated 3 times across two files (once in like-flow, twice in story-form-flow). This exceeds the "three similar lines" tolerance threshold and is exactly the kind of repeated shape the smell baseline says to extract (a `getLikeCount(page): Promise<number>` helper). Not blocking — test-only code — but worth extracting if a fourth test needing this shows up.

**apps/e2e/tests/dark-mode-toggle.spec.ts** — judgment call, not a hard violation
`test("toggling dark mode changes the theme and persists across reload", ...)` asserts three things: initial state, post-click state, post-reload state. The name uses "and," which the general rule flags for functions ("if you need 'and,' split it") and "one assertion per test" nominally applies. However this reads as a single coherent user journey (toggle → verify → reload → verify persistence) rather than two independent features, so splitting would just duplicate the toggle step. DEBT at most — reasonable as-is for e2e style.

**apps/e2e/tests/story-form-flow.spec.ts** — same judgment call, both tests
Test 1 asserts form-collapse AND like-count increment; Test 2 asserts error message, "Hide story" visibility, AND unchanged like-count. Multiple assertions per test, same reasoning as above — sequential journey assertions, not independent scenarios crammed together. DEBT, not BLOCK.

**apps/e2e/global-setup.ts, global-teardown.ts, playwright.config.ts** — minor duplication, not flagged
`const REPO_ROOT = path.resolve(__dirname, "..", "..")` appears identically in all three files. This sits right at the "three similar lines is better than a premature abstraction" threshold the standards explicitly carve out, so it is not flagged as a violation — but if a fourth file needs it, extract a shared constant/module.

**global-setup.ts retry loop** — no violation
The catch-and-retry-until-final-attempt pattern (30 attempts × 2s) throws with context on final failure rather than swallowing errors silently, and the boundary (waiting on an external Docker/Postgres process) is a legitimate place for this. Compliant with "only handle errors at boundaries" / "don't swallow silently."

**CI workflow, package.json, tsconfig.json** — no violations found
No Dockerfile is added by this diff (apps/e2e isn't containerized, so the `.dockerignore`/`pnpm prune --prod` rules are N/A), and apps/e2e isn't a NestJS app (`tsconfig.build.json` rule N/A).

**Overall: no BLOCK-tagged findings.** Everything raised is DEBT or an explicit judgment call, consistent with this being test-suite-only code.

## Spec

### Findings

**(c) Requirement implemented but wrong — BLOCK**

Spec: *"`reuseExistingServer: !process.env.CI` so local iteration can reuse an already-running stack while CI always starts clean."*

`apps/e2e/playwright.config.ts` correctly sets `reuseExistingServer: !process.env.CI`, but `apps/e2e/global-teardown.ts` unconditionally runs `docker compose down` after every run, regardless of whether Playwright started the stack or an already-running one was reused. This means the very first local `pnpm test` tears down the stack it (or the developer) started, so there's nothing left to reuse on the next run — the reuse optimization is dead code in practice. This directly contradicts the explicit "local iteration can reuse an already-running stack" decision and partially undermines user story 1 ("so that I don't need to manually manage docker-compose before testing" — every local run now forces a full rebuild/teardown cycle instead of the intended fast-iteration path).

Confirmed by direct inspection of `apps/e2e/global-teardown.ts` (unconditional `execFileSync("docker", ["compose", "down"], ...)`) and `apps/e2e/playwright.config.ts` (`reuseExistingServer: !process.env.CI` with no corresponding conditional in teardown).

**(b) Scope creep — DEBT**

Spec: *"Test files (one seam per file, matching the 3 core flows)"* lists exactly like-flow, story-form-flow, and dark-mode-toggle.

`apps/e2e/tests/smoke.spec.ts` is a 4th test file not called for by this decision. Low-cost and harmless, but it's additional surface beyond the spec'd file structure.

**(b) Scope creep — DEBT (minor)**

Spec: *"CI: new `.github/workflows/e2e.yml`, triggered on `pull_request` and `push` to `main`."*

The workflow also adds a `workflow_dispatch` trigger, not mentioned in the spec. Harmless (enables manual runs) but is an unrequested addition.

### Not issues (verified correct)

- Selectors (`getByRole("button", {name:"Like"})`, `"Toggle theme"` aria-label, `"Share a story"`/`"Hide story"`, `getByLabel("Story (optional)")`/`"Hours saved (optional)"`, validation text `"Hours saved must be zero or greater"`) all match the actual DOM in `apps/web/app/page.tsx` and `apps/web/components/theme-toggle.tsx`.
- `apps/e2e/global-setup.ts` truncates `likes` once per suite with correct DB credentials matching `docker-compose.yml`, with sensible retry/backoff for migration-timing races — matches the baseline-reset decision.
- Delta-assertion pattern (`before`/`before + 1`) is used consistently across like-flow and story-form-flow tests, matching the "Delta assertions, not absolute values" decision.
- `pnpm-workspace.yaml` already covers `apps/*`; no unnecessary changes to `docker-compose.yml`/Dockerfiles/nginx — matches ADR-001 black-box constraint.
- No requirements found missing outright (all 7 user stories have corresponding test/CI coverage).

## Summary
BLOCK findings: 1
DEBT findings: 5
Worst BLOCK: `global-teardown.ts` always runs `docker compose down`, defeating `reuseExistingServer: !process.env.CI` and forcing a full stack teardown/rebuild on every local run instead of the spec'd fast-iteration path.
