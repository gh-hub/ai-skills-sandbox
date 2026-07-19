import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const REPO_ROOT = path.resolve(__dirname, "..", "..");

function isStackAlreadyRunning(): boolean {
  const output = execFileSync("docker", ["compose", "ps", "--status", "running", "--format", "json"], {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "ignore"],
  }).toString();
  return output.trim().length > 0;
}

// reuseExistingServer only reuses locally, so a stack found running here is the one it will reuse —
// global-teardown.ts reads this to decide whether it's safe to tear down.
process.env.E2E_STACK_WAS_ALREADY_RUNNING = String(!process.env.CI && isStackAlreadyRunning());

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 1,
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./global-teardown"),
  use: {
    baseURL: "http://localhost:8080",
  },
  webServer: {
    command: "docker compose up --build",
    cwd: REPO_ROOT,
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
