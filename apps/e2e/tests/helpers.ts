import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
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

// Clicks "Log out" and confirms the "Yes, log out" dialog that now gates it
// (ticket 01) — callers that just want to end up logged out should use this
// instead of the bare "Log out" click. Takes the already-scoped "Log out"
// button locator (e.g. `siteHeader(page).getByRole("button", { name: "Log
// out" })`) rather than a bare Page, since some pages render more than one
// HeaderAuthControl at once and a page-wide role query would be a
// strict-mode violation; the confirm button lives in a dialog portal outside
// that scope, so it's located via the locator's owning page instead.
export async function logout(logoutButton: Locator): Promise<void> {
  await logoutButton.click();
  await logoutButton.page().getByRole("button", { name: "Yes, log out" }).click();
}
