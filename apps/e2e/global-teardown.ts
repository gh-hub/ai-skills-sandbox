import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");

export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_STACK_WAS_ALREADY_RUNNING === "true") {
    return;
  }
  execFileSync("docker", ["compose", "down"], { cwd: REPO_ROOT, stdio: "pipe" });
}
