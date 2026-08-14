import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { grantRole, loginToRefreshSession } from "./helpers";

const PASSWORD = "hunter22";

function uniqueEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

// Scoped to the global SiteHeader (mounted in layout.tsx, present on every
// route) throughout this file: the home page shows two simultaneous
// HeaderAuthControl copies (the hero card's own, unaffected by this ticket,
// and the fixed global header's) — a bare role query for "Login"/"Log
// out"/the Roles list would be a strict-mode violation.
function siteHeader(page: Page) {
  return page.getByTestId("site-header");
}

// The global header's HeaderAuthControl only fades in on home once the hero
// card has fully scrolled past (see home-header-scroll.spec.ts) — scroll past
// it up front so this file's generic auth-flow assertions can interact with
// the global header's copy throughout, independent of scroll position.
async function gotoHomeWithHeaderAuthVisible(page: Page) {
  await page.goto("/");
  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();
}

test("signing up through the modal logs the visitor in and updates the header", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
  await expect(
    siteHeader(page).getByRole("button", { name: "Login" })
  ).not.toBeVisible();
});

test("a signup with a password under 6 characters is rejected client-side", async ({
  page,
}) => {
  await gotoHomeWithHeaderAuthVisible(page);

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("abc");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Password must be at least 6 characters")
  ).toBeVisible();
});

test("logging in with an existing account, then logging out, restores the Login button", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Grace Hopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();

  await siteHeader(page).getByRole("button", { name: "Log out" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Login" })
  ).toBeVisible();

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
});

test("logging in with the wrong password shows a generic error", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Katherine Johnson");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
  await siteHeader(page).getByRole("button", { name: "Log out" }).click();

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("signing up with an already-registered email shows a conflict error", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Radia Perlman");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
  await siteHeader(page).getByRole("button", { name: "Log out" }).click();

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Radia Perlman");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Email already in use")).toBeVisible();
});

test("a logged-in session survives a page reload", async ({ page }) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Margaret Hamilton");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();

  await page.reload();

  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();
});

test("a user with no role sees no role badges in the header", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Plain Header Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();

  await expect(
    siteHeader(page).getByRole("list", { name: "Roles" })
  ).not.toBeVisible();
});

test("a user granted ADMIN sees an ADMIN badge next to their name in the header", async ({
  page,
}) => {
  const email = uniqueEmail();

  await gotoHomeWithHeaderAuthVisible(page);
  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Admin Header Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();

  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.reload();

  // Scoped to the global header's own Roles list, not a page-wide
  // getByText("ADMIN") — the header also has an "Admin" link (visible to
  // this same ADMIN user) whose case-insensitive substring match against
  // this role badge's "ADMIN" text would otherwise be a strict-mode
  // violation, and the home page's hero card renders its own separate
  // HeaderAuthControl/Roles-list copy too (ticket 01 leaves it unchanged).
  const rolesList = siteHeader(page).getByRole("list", { name: "Roles" });
  await expect(rolesList).toBeVisible();
  await expect(rolesList.getByText("ADMIN")).toBeVisible();
});
