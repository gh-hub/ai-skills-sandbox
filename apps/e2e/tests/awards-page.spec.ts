import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type Award = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  givenCount: number;
};

async function getAwards(page: Page): Promise<Award[]> {
  const response = await page.request.get("/api/awards");
  return response.json();
}

function uniqueEmail(): string {
  return `awards-page-e2e-${randomUUID()}@example.com`;
}

function awardsSection(page: Page) {
  return page.getByRole("region", { name: "Awards list" });
}

test("seeded awards are listed with their icon, title, description, and give-count", async ({
  page,
}) => {
  const awards = await getAwards(page);
  expect(awards.length).toBeGreaterThan(0);
  const [award] = awards;

  await page.goto("/awards");

  const section = awardsSection(page);
  await expect(section).toBeVisible();
  await expect(section).toContainText(award.title);
  await expect(section).toContainText(award.description);
  await expect(section).toContainText(`${award.givenCount} given`);
});

test("an anonymous visitor sees a login prompt instead of the create-award form", async ({
  page,
}) => {
  await page.goto("/awards");

  await expect(page.getByText("Log in to create an award.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create an award" })
  ).not.toBeVisible();
});

test("a logged-in user can create an award and sees it appear without a page reload", async ({
  page,
}) => {
  await page.goto("/awards");

  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Award Tester");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByRole("heading", { name: "Create an award" })
  ).toBeVisible();

  const marker = `awards-page-e2e-${Date.now()}`;
  const title = `Marker Award ${marker}`;

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Given out during an e2e test.");
  await page.getByRole("button", { name: "Create award" }).click();

  await expect(awardsSection(page)).toContainText(title);
});
