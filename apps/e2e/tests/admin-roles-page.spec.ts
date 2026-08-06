import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { grantRole, loginToRefreshSession } from "./helpers";

const PASSWORD = "hunter22";

function uniqueEmail(prefix: string): string {
  // Kept short deliberately: RFC 5321 caps an email's local part at 64
  // characters, and a longer fixed namespace here (e.g. the full
  // "admin-roles-page-e2e-" prefix used elsewhere in this suite) pushes
  // longer prefixes like "operator" past that limit, which the backend's
  // `@IsEmail()` DTO validation then rejects with a plain 400.
  return `admin-roles-${prefix}-${randomUUID()}@example.com`;
}

// The admin pages have no header auth control of their own (they render
// nothing at all when unauthorized) — sign-up/login only ever happens from
// the home page, exactly like awards-page.spec.ts's own signUp helper.
async function signUp(page: Page, name: string, email: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
}

async function loginAsAdmin(page: Page): Promise<void> {
  const email = uniqueEmail("admin");
  await signUp(page, "Roles Page Admin", email);
  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.goto("/admin/roles");
}

function rolesSection(page: Page) {
  return page.getByRole("region", { name: "Roles list" });
}

async function getRoleId(page: Page, name: string): Promise<string> {
  const response = await page.request.get("/api/roles");
  const roles: { id: string; name: string }[] = await response.json();
  const match = roles.find((role) => role.name === name);
  if (!match) {
    throw new Error(`Expected to find role "${name}"`);
  }
  return match.id;
}

async function grantRoleToUser(
  page: Page,
  userId: string,
  roleId: string
): Promise<void> {
  const response = await page.request.post(`/api/users/${userId}/roles`, {
    data: { roleId },
  });
  if (!response.ok()) {
    throw new Error(`Failed to grant role: ${response.status()}`);
  }
}

test("an anonymous visitor sees nothing at /admin/roles", async ({ page }) => {
  await page.goto("/admin/roles");

  await expect(page.getByRole("heading", { name: "Roles" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).not.toBeVisible();
});

test("a logged-in user with no role sees nothing at /admin/roles", async ({
  page,
}) => {
  await signUp(page, "Roles Page Plain Tester", uniqueEmail("plain"));

  await page.goto("/admin/roles");

  await expect(page.getByRole("heading", { name: "Roles" })).not.toBeVisible();
});

test("a logged-in OPERATOR sees nothing at /admin/roles", async ({ page }) => {
  const email = uniqueEmail("operator");
  await signUp(page, "Roles Page Operator Tester", email);
  grantRole(email, "OPERATOR");
  await loginToRefreshSession(page, email, PASSWORD);

  await page.goto("/admin/roles");

  await expect(page.getByRole("heading", { name: "Roles" })).not.toBeVisible();
});

test("an admin sees the built-in roles with a Built-in indicator and no delete control", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const adminRow = page.locator("li", { hasText: "ADMIN" }).first();
  await expect(adminRow).toContainText("Built-in");
  await expect(
    adminRow.getByRole("button", { name: "Delete ADMIN" })
  ).toHaveCount(0);

  const operatorRow = page.locator("li", { hasText: "OPERATOR" }).first();
  await expect(operatorRow).toContainText("Built-in");
  await expect(
    operatorRow.getByRole("button", { name: "Delete OPERATOR" })
  ).toHaveCount(0);
});

test("an admin can create a custom role and it appears in the list without a page reload", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const roleName = `Marker Role ${Date.now()}`;
  await page.getByLabel("Name").fill(roleName);
  await page.getByRole("button", { name: "Create role" }).click();

  await expect(rolesSection(page)).toContainText(roleName);
  await expect(
    page.getByRole("button", { name: `Delete ${roleName}` })
  ).toBeVisible();
});

test("creating a role with a name that's already taken shows a conflict error", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByLabel("Name").fill("ADMIN");
  await page.getByRole("button", { name: "Create role" }).click();

  // Not `getByRole("alert")` — Next's route announcer also has role="alert"
  // and would make this a strict-mode violation (two matches).
  await expect(page.getByText('Role name "ADMIN" is already in use')).toBeVisible();
});

test("deleting an unused custom role removes it from the list without a page reload", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const roleName = `Delete Marker Role ${Date.now()}`;
  await page.getByLabel("Name").fill(roleName);
  await page.getByRole("button", { name: "Create role" }).click();
  await expect(rolesSection(page)).toContainText(roleName);

  await page.getByRole("button", { name: `Delete ${roleName}` }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(roleName);
  await dialog.getByRole("button", { name: "Yes, delete" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(rolesSection(page)).not.toContainText(roleName);
});

test("deleting a role in use blocks by default, shows the affected users, then force-deletes on confirmation", async ({
  page,
  request,
}) => {
  await loginAsAdmin(page);

  const roleName = `In Use Role ${Date.now()}`;
  await page.getByLabel("Name").fill(roleName);
  await page.getByRole("button", { name: "Create role" }).click();
  await expect(rolesSection(page)).toContainText(roleName);

  // Signed up through a request context isolated from `page`'s cookies —
  // `page.request` shares the page's session cookie, and re-using it here
  // would silently replace the logged-in admin's session with this new
  // member's the moment signup succeeds.
  const memberEmail = uniqueEmail("member");
  const signupResponse = await request.post("/api/auth/signup", {
    data: { name: "In Use Role Member", email: memberEmail, password: PASSWORD },
  });
  const member: { id: string } = await signupResponse.json();

  const roleId = await getRoleId(page, roleName);
  await grantRoleToUser(page, member.id, roleId);

  await page.getByRole("button", { name: `Delete ${roleName}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Yes, delete" }).click();

  await expect(dialog).toContainText("In Use Role Member");
  await expect(dialog).toContainText(memberEmail);
  const forceButton = dialog.getByRole("button", { name: "Delete anyway" });
  await expect(forceButton).toBeVisible();

  await forceButton.click();

  await expect(dialog).not.toBeVisible();
  await expect(rolesSection(page)).not.toContainText(roleName);
});

test("the back link on /admin/roles points at /admin", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByRole("link", { name: /Back/ })).toHaveAttribute(
    "href",
    "/admin"
  );
});
