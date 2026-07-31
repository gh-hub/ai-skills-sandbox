import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { COMPOSE_ARGS, COMPOSE_ENV, WEB_PORT } from "./e2e.config";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const isCI = Boolean(process.env.CI);
const REQUIRED_SERVICES = ["web", "api", "postgres"];

function isStackAlreadyRunning(): boolean {
  // Docker not being reachable here (daemon down, CLI missing) is not an error condition for this
  // check — it just means the stack isn't up, so global setup should proceed to start it normally.
  let output: string;
  try {
    output = execFileSync(
      "docker",
      [...COMPOSE_ARGS, "ps", "--status", "running", "--format", "json"],
      { cwd: REPO_ROOT, env: COMPOSE_ENV, stdio: ["ignore", "pipe", "ignore"] }
    ).toString();
  } catch {
    return false;
  }

  const runningServices = new Set(
    output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => (JSON.parse(line) as { Service: string }).Service)
  );
  return REQUIRED_SERVICES.every((service) => runningServices.has(service));
}

// Playwright runs the webServer plugin's setup (which invokes `docker compose up --build`) before
// the globalSetup task, so by the time global-setup.ts would run, this run's own webServer has
// already started the stack it would be checking for. Config module evaluation happens before any
// task runs, so this is the only point where the probe reflects state from *before* this invocation.
// global-setup.ts imports this value directly instead of recomputing it too late (and instead of the
// process.env round-trip the previous global-teardown.ts design used).
export const wasAlreadyRunning = !isCI && isStackAlreadyRunning();

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  globalSetup: require.resolve("./global-setup"),
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
  },
  webServer: {
    command: `docker ${COMPOSE_ARGS.join(" ")} up --build`,
    cwd: REPO_ROOT,
    env: COMPOSE_ENV,
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: !isCI,
    timeout: 300_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
