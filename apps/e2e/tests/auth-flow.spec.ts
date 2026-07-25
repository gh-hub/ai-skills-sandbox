import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

test("signing up through the modal logs the visitor in and updates the header", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/");

  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).not.toBeVisible();
});

test("a signup with a password under 6 characters is rejected client-side", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Login" }).click();
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

  await page.goto("/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Grace Hopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("logging in with the wrong password shows a generic error", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Katherine Johnson");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();

  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("signing up with an already-registered email shows a conflict error", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Radia Perlman");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();

  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Radia Perlman");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Email already in use")).toBeVisible();
});

test("a logged-in session survives a page reload", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Margaret Hamilton");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});
