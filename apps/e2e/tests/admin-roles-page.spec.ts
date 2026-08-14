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

// The admin pages render no page content of their own for an unauthorized
// visitor, but the fixed global `SiteHeader` (mounted in layout.tsx) is
// present on every route regardless — sign-up/login still happens from the
// home page, exactly like awards-page.spec.ts's own signUp helper. Scoped to
// the global header throughout: the home page shows two simultaneous
// HeaderAuthControl copies (the hero card's own, unaffected by this ticket,
// and the fixed global header's) — a bare role query would be a strict-mode
// violation.
function siteHeader(page: Page) {
  return page.getByTestId("site-header");
}

// The global header's HeaderAuthControl only fades in on home once the hero
// card has fully scrolled past (see home-header-scroll.spec.ts) — scroll past
// it up front so sign-up can click the global header's copy, independent of
// scroll position.
async function signUp(page: Page, name: string, email: string): Promise<void> {
  await page.goto("/");
  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
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

  // Ticket 01: /admin/roles renders no page content for an anonymous
  // visitor, but the fixed global header still shows its Login control
  // immediately, no scroll interaction required — new behavior vs. today.
  await expect(
    siteHeader(page).getByRole("button", { name: "Login" })
  ).toBeVisible();
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

  // Scoped to the Roles list region, not a page-wide `li` query — since
  // ticket 01, the global header's own `HeaderAuthControl` also renders the
  // logged-in admin's role badges as `<li>ADMIN</li>` (see
  // header-auth-control.tsx), which otherwise matches first and lacks the
  // "Built-in" text this test is asserting on.
  const adminRow = rolesSection(page).locator("li", { hasText: "ADMIN" }).first();
  await expect(adminRow).toContainText("Built-in");
  await expect(
    adminRow.getByRole("button", { name: "Delete ADMIN" })
  ).toHaveCount(0);

  const operatorRow = rolesSection(page)
    .locator("li", { hasText: "OPERATOR" })
    .first();
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
