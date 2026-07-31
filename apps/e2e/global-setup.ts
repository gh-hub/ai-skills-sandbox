import { execFileSync } from "node:child_process";
import path from "node:path";
import { wasAlreadyRunning } from "./playwright.config";
import { COMPOSE_ARGS, COMPOSE_ENV, POSTGRES_DB, POSTGRES_USER } from "./e2e.config";

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
      ...COMPOSE_ARGS,
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      POSTGRES_USER,
      "-d",
      POSTGRES_DB,
      "-c",
      "TRUNCATE TABLE likes CASCADE;",
    ],
    { cwd: REPO_ROOT, env: COMPOSE_ENV, stdio: "pipe" }
  );
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      truncateLikesTable();
      break;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Failed to reset the likes table after ${MAX_ATTEMPTS} attempts (api migrations may not have run): ${error}`
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }

  return async () => {
    if (wasAlreadyRunning) {
      return;
    }
    execFileSync("docker", [...COMPOSE_ARGS, "down"], { cwd: REPO_ROOT, env: COMPOSE_ENV, stdio: "pipe" });
  };
}
