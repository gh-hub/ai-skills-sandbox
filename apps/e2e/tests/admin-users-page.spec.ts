import { randomUUID } from "node:crypto";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { grantRole, loginToRefreshSession } from "./helpers";

const PASSWORD = "hunter22";

// Kept short deliberately: RFC 5321 caps an email's local part at 64
// characters. A full 36-char randomUUID combined with this file's longer
// marker prefixes (e.g. "page-marker-<timestamp>-<index>") pushed several
// tests past that limit, and the backend's `@IsEmail()` DTO correctly
// 400'd them (not simulated — hit live). A short base plus an 8-char id
// keeps every combination well under the limit.
function uniqueEmail(prefix: string): string {
  return `au-${prefix}-${randomUUID().slice(0, 8)}@example.com`;
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

// The default name carries a random suffix (not just a fixed literal) because
// this suite's e2e Postgres volume persists across separate test runs/sessions
// (global-setup.ts only truncates the `likes` table). A fixed literal name
// accumulates one row per historical run, and once enough runs have piled up,
// `li.filter({ hasText: admin.name })` (used to scope assertions to just this
// test's own admin row) becomes a strict-mode violation against every
// same-named row ever created, not just this run's.
async function loginAsAdmin(
  page: Page,
  name = `Users Page Admin ${randomUUID().slice(0, 8)}`
): Promise<{ name: string; email: string }> {
  const email = uniqueEmail("admin");
  await signUp(page, name, email);
  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.goto("/admin/users");
  return { name, email };
}

function usersSection(page: Page) {
  return page.getByRole("region", { name: "Users list" });
}

// Signed up through the isolated `request` fixture, not `page.request` —
// `page.request` shares the page's session cookie, and a signup response
// sets a fresh session cookie for the *new* user, which would silently log
// the logged-in admin out from under the test (every later assertion on
// this page would then see 401/403s from the users list, not the intended
// data). Mirrors the same precaution already documented in
// admin-roles-page.spec.ts's in-use-role test.
async function createUserViaApi(
  request: APIRequestContext,
  name: string,
  email: string
): Promise<string> {
  const response = await request.post("/api/auth/signup", {
    data: { name, email, password: PASSWORD },
  });
  if (!response.ok()) {
    throw new Error(`Failed to sign up user: ${response.status()}`);
  }
  const body: { id: string } = await response.json();
  return body.id;
}

test("an anonymous visitor sees nothing at /admin/users", async ({ page }) => {
  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible();
});

test("a logged-in user with no role sees nothing at /admin/users", async ({
  page,
}) => {
  await signUp(page, "Users Page Plain Tester", uniqueEmail("plain"));

  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible();
});

test("a logged-in OPERATOR sees nothing at /admin/users", async ({ page }) => {
  const email = uniqueEmail("operator");
  await signUp(page, "Users Page Operator Tester", email);
  grantRole(email, "OPERATOR");
  await loginToRefreshSession(page, email, PASSWORD);

  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible();
});

test("an admin sees a non-interactive ADMIN badge on their own row and ADMIN is never a checkbox", async ({
  page,
}) => {
  const admin = await loginAsAdmin(page);

  await page.getByLabel("Search users").fill(admin.name);

  const adminRow = usersSection(page).locator("li", { hasText: admin.name });
  await expect(adminRow).toContainText("ADMIN");

  // Not scoped to the row: ADMIN must never appear as a checkbox anywhere on
  // the page, for any user, per spec user story 17.
  await expect(
    page.getByRole("checkbox", { name: `ADMIN for ${admin.name}` })
  ).toHaveCount(0);
});

test("searching filters the user list by name and by email", async ({
  page,
  request,
}) => {
  const admin = await loginAsAdmin(page);
  const marker = `search-marker-${Date.now()}`;
  const name = `Findable ${marker}`;
  const email = uniqueEmail(marker);
  await createUserViaApi(request, name, email);

  await page.getByLabel("Search users").fill(marker);

  const section = usersSection(page);
  await expect(section).toContainText(name);
  await expect(section).not.toContainText(admin.name);

  await page.getByLabel("Search users").fill("");
  await page.getByLabel("Search users").fill(email);
  await expect(section).toContainText(name);
});

test("paging through search results shows a different set of users on each page", async ({
  page,
  request,
}) => {
  await loginAsAdmin(page);
  const marker = `page-marker-${Date.now()}`;
  for (let index = 0; index < 15; index++) {
    await createUserViaApi(
      request,
      `${marker} User ${index + 1}`,
      uniqueEmail(`${marker}-${index}`)
    );
  }

  await page.getByLabel("Search users").fill(marker);

  const section = usersSection(page);
  await expect(section.getByRole("listitem")).toHaveCount(10);
  const page1Items = await section.getByRole("listitem").allTextContents();

  await page.getByRole("button", { name: "2", exact: true }).click();

  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute(
    "aria-current",
    "page"
  );
  const page2Items = await section.getByRole("listitem").allTextContents();

  expect(page2Items).not.toEqual(page1Items);
  expect(page1Items.some((text) => page2Items.includes(text))).toBe(false);
});

test("toggling a non-ADMIN role checkbox grants then revokes it, reflected without a page reload", async ({
  page,
  request,
}) => {
  await loginAsAdmin(page);
  const name = `Toggle Target ${Date.now()}`;
  await createUserViaApi(request, name, uniqueEmail("toggle"));

  await page.getByLabel("Search users").fill(name);

  const checkbox = page.getByRole("checkbox", { name: `OPERATOR for ${name}` });
  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();

  await checkbox.click();
  await expect(checkbox).toBeChecked();

  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
});

test("a role created elsewhere while the page stays open appears as a togglable checkbox once the tab regains focus", async ({
  page,
  context,
  request,
}) => {
  const targetName = `Live Role Target ${Date.now()}`;
  await loginAsAdmin(page);
  await createUserViaApi(request, targetName, uniqueEmail("live-role"));
  await page.getByLabel("Search users").fill(targetName);
  await expect(usersSection(page)).toContainText(targetName);

  const roleName = `Live Marker Role ${Date.now()}`;
  await expect(
    page.getByRole("checkbox", { name: `${roleName} for ${targetName}` })
  ).toHaveCount(0);

  // A second tab in the same browser context shares the admin's session
  // cookie, simulating the role being created elsewhere (another admin, or
  // this same admin in another tab) while this page's /admin/users tab
  // never navigates or reloads.
  const page2 = await context.newPage();
  await page2.bringToFront();
  await page2.goto("/admin/roles");
  await page2.getByLabel("Name").fill(roleName);
  await page2.getByRole("button", { name: "Create role" }).click();
  await expect(page2.getByRole("region", { name: "Roles list" })).toContainText(
    roleName
  );
  await page2.close();

  // Regaining focus — not a navigation or a reload — fires React Query's
  // refetchOnWindowFocus, which re-fetches the roles query this page already
  // has mounted (shared query key with the roles list page), satisfying the
  // "without requiring reload or navigation away" acceptance criterion.
  //
  // `page.bringToFront()` alone was found (live, twice) not to reliably
  // toggle `document.visibilityState` across separate Playwright `Page`
  // targets in headless Chromium, so the "visibilitychange" event React
  // Query's focusManager listens for (see
  // @tanstack/query-core's focusManager.ts) never fires and the query never
  // refetches — a harness/headless-mode limitation, not an app bug (the
  // mechanism itself was already traced correct by reading providers.tsx's
  // unconfigured, default-`refetchOnWindowFocus: true` QueryClient). Firing
  // the event explicitly exercises the exact listener the app relies on
  // deterministically, independent of the browser's real tab-activation
  // behavior under automation.
  await page.bringToFront();
  await page.evaluate(() => {
    window.dispatchEvent(new Event("visibilitychange"));
  });

  await expect(
    page.getByRole("checkbox", { name: `${roleName} for ${targetName}` })
  ).toBeVisible();
});

test("the back link on /admin/users points at /admin", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByRole("link", { name: /Back/ })).toHaveAttribute(
    "href",
    "/admin"
  );
});
