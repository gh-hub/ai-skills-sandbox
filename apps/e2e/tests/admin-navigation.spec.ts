import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { grantRole, loginToRefreshSession } from "./helpers";

const PASSWORD = "hunter22";

// Kept short deliberately: RFC 5321 caps an email's local part at 64
// characters. admin-roles-page.spec.ts hit this limit with a longer fixed
// prefix, so this spec uses a short "e2e-nav-" namespace instead.
function uniqueEmail(prefix: string): string {
  return `e2e-nav-${prefix}-${randomUUID()}@example.com`;
}

// Scoped to the global SiteHeader throughout: the home page shows two
// simultaneous HeaderAuthControl copies (the hero card's own, unaffected by
// this ticket, and the fixed global header's) — a bare role query would be a
// strict-mode violation.
function siteHeader(page: Page) {
  return page.getByTestId("site-header");
}

// The global header's HeaderAuthControl only fades in on home once the hero
// card has fully scrolled past (see home-header-scroll.spec.ts) — scroll past
// it up front so this file's navigation assertions can interact with (click)
// the global header's copy, independent of scroll position.
async function gotoHomeWithHeaderAuthVisible(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();
}

async function signUp(page: Page, name: string, email: string): Promise<void> {
  await gotoHomeWithHeaderAuthVisible(page);
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

async function loginAsAdmin(page: Page, name = "Nav Admin"): Promise<void> {
  const email = uniqueEmail("admin");
  await signUp(page, name, email);
  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await gotoHomeWithHeaderAuthVisible(page);
}

function headerAdminLink(page: Page) {
  return siteHeader(page).getByRole("link", { name: "Admin" });
}

test("the header Admin link is visible for a logged-in ADMIN and points at /admin", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await expect(headerAdminLink(page)).toBeVisible();
  await expect(headerAdminLink(page)).toHaveAttribute("href", "/admin");
});

test("the header Admin link is absent for an anonymous visitor", async ({
  page,
}) => {
  await page.goto("/");

  await expect(headerAdminLink(page)).toHaveCount(0);
});

test("the header Admin link is absent for a logged-in user with no role", async ({
  page,
}) => {
  await signUp(page, "Nav Plain Tester", uniqueEmail("plain"));

  await expect(headerAdminLink(page)).toHaveCount(0);
});

test("the header Admin link is absent for a logged-in OPERATOR", async ({
  page,
}) => {
  const email = uniqueEmail("operator");
  await signUp(page, "Nav Operator Tester", email);
  grantRole(email, "OPERATOR");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.goto("/");

  await expect(headerAdminLink(page)).toHaveCount(0);
});

test("an anonymous visitor sees nothing at /admin", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Admin" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Roles" })).not.toBeVisible();

  // Ticket 01: /admin renders no page content for an anonymous visitor, but
  // the fixed global header still shows its Login control immediately.
  await expect(
    siteHeader(page).getByRole("button", { name: "Login" })
  ).toBeVisible();
});

test("a logged-in user with no role sees nothing at /admin", async ({
  page,
}) => {
  await signUp(page, "Nav Plain Hub Tester", uniqueEmail("plain-hub"));
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Admin" })).not.toBeVisible();
});

test("an admin can navigate from home through the header link to /admin, and the hub links to Users, Roles, and home", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await headerAdminLink(page).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

  await expect(page.getByRole("link", { name: "Users" })).toHaveAttribute(
    "href",
    "/admin/users"
  );
  await expect(page.getByRole("link", { name: "Roles" })).toHaveAttribute(
    "href",
    "/admin/roles"
  );
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    "/"
  );
});

test("home → /admin (via header) → /admin/users → back to /admin", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await headerAdminLink(page).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Users" }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await page.getByRole("link", { name: /Back/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
});

test("home → /admin (via header) → /admin/roles → back to /admin", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await headerAdminLink(page).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Roles" }).click();
  await expect(page).toHaveURL(/\/admin\/roles$/);
  await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();

  await page.getByRole("link", { name: /Back/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
});
