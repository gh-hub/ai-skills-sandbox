import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateLikesTable(): void {
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "thanks_claude",
      "-d",
      "thanks_claude",
      "-c",
      "TRUNCATE TABLE likes;",
    ],
    { cwd: REPO_ROOT, stdio: "pipe" }
  );
}

export default async function globalSetup(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      truncateLikesTable();
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Failed to reset the likes table after ${MAX_ATTEMPTS} attempts (api migrations may not have run): ${error}`
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}
