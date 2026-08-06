import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Page } from "@playwright/test";
import { COMPOSE_ARGS, COMPOSE_ENV, POSTGRES_DB, POSTGRES_USER } from "../e2e.config";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

export async function getLikeCount(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+ likes$/).textContent();
  return Number(text?.match(/(\d+) likes/)?.[1]);
}

// Grants a role to an already-signed-up user by inserting directly into
// `user_roles`, mirroring global-setup.ts's docker-compose-exec-psql pattern.
// Roles only get baked into a session JWT when it's issued (signup/login), so
// callers must follow this with a fresh login before the grant takes effect
// in the browser's session cookie — see `loginToRefreshSession` below.
export function grantRole(email: string, role: "ADMIN" | "OPERATOR"): void {
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
      `INSERT INTO user_roles (user_id, role_id) SELECT users.id, roles.id FROM users, roles WHERE users.email = '${email}' AND roles.name = '${role}';`,
    ],
    { cwd: REPO_ROOT, env: COMPOSE_ENV, stdio: "pipe" }
  );
}

// Re-issues the session cookie via the API directly (no UI round-trip),
// picking up any role granted since the last login/signup.
export async function loginToRefreshSession(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.request.post("/api/auth/login", { data: { email, password } });
}
