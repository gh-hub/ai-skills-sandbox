import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { grantRole, loginToRefreshSession } from "./helpers";

type Award = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  givenCount: number;
};

const PASSWORD = "hunter22";

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

// The awards page has no header auth control (that only lives on the home
// page) — the login/signup dialog is opened from `LoginPrompt` instead, and
// a successful signup is signalled by the dialog closing itself.
async function signUp(page: Page, name: string, email: string): Promise<void> {
  await page.goto("/awards");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
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

test("a logged-in user with no role sees neither the create form nor edit/delete icons", async ({
  page,
}) => {
  const [award] = await getAwards(page);
  const email = uniqueEmail();

  await signUp(page, "Plain Tester", email);

  await expect(
    page.getByRole("heading", { name: "Create an award" })
  ).not.toBeVisible();
  await expect(page.getByText("Log in to create an award.")).not.toBeVisible();

  await expect(
    page.getByRole("button", { name: `Edit ${award.title}` })
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: `Delete ${award.title}` })
  ).not.toBeVisible();
});

test("a user granted ADMIN sees the create form and edit/delete icons, and can create an award without a page reload", async ({
  page,
}) => {
  const email = uniqueEmail();

  await signUp(page, "Award Tester", email);
  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Create an award" })
  ).toBeVisible();

  const [award] = await getAwards(page);
  await expect(
    page.getByRole("button", { name: `Edit ${award.title}` })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Delete ${award.title}` })
  ).toBeVisible();

  const marker = `awards-page-e2e-${Date.now()}`;
  const title = `Marker Award ${marker}`;

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Given out during an e2e test.");
  await page.getByRole("button", { name: "Create award" }).click();

  await expect(awardsSection(page)).toContainText(title);
});

test("the back link on the awards page navigates to the home page", async ({
  page,
}) => {
  await page.goto("/awards");

  await page.getByRole("link", { name: /Back/ }).click();

  await expect(page).toHaveURL("/");
});

async function loginAsManager(page: Page): Promise<void> {
  const email = uniqueEmail();
  await signUp(page, "Award Editor", email);
  grantRole(email, "ADMIN");
  await loginToRefreshSession(page, email, PASSWORD);
  await page.reload();
}

test("editing an award opens a pre-filled modal and requires a second confirmation before saving", async ({
  page,
}) => {
  await loginAsManager(page);
  const [award] = await getAwards(page);

  const patchRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes(`/awards/${award.id}`)) {
      patchRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: `Edit ${award.title}` }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Title")).toHaveValue(award.title);
  await expect(dialog.getByLabel("Description")).toHaveValue(award.description);

  const marker = `edited-${Date.now()}`;
  const newTitle = `Edited Award ${marker}`;
  await dialog.getByLabel("Title").fill(newTitle);
  await dialog.getByRole("button", { name: "Save changes" }).click();

  // First submit only opens the confirmation step — no PATCH yet.
  await expect(dialog.getByText("Are you sure you want to save these changes?")).toBeVisible();
  expect(patchRequests).toHaveLength(0);

  await dialog.getByRole("button", { name: "Yes, save changes" }).click();

  await expect(dialog).not.toBeVisible();
  expect(patchRequests).toHaveLength(1);
  await expect(awardsSection(page)).toContainText(newTitle);
});

test("canceling the edit form makes no request and leaves the award unchanged", async ({
  page,
}) => {
  await loginAsManager(page);
  const [award] = await getAwards(page);

  const patchRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes(`/awards/${award.id}`)) {
      patchRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: `Edit ${award.title}` }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(`Should not save ${Date.now()}`);
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  expect(patchRequests).toHaveLength(0);
  await expect(awardsSection(page)).toContainText(award.title);
});

test("canceling the confirmation step makes no request and leaves the award unchanged", async ({
  page,
}) => {
  await loginAsManager(page);
  const [award] = await getAwards(page);

  const patchRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes(`/awards/${award.id}`)) {
      patchRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: `Edit ${award.title}` }).click();

  const dialog = page.getByRole("dialog");
  const newTitle = `Should not persist ${Date.now()}`;
  await dialog.getByLabel("Title").fill(newTitle);
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(dialog.getByText("Are you sure you want to save these changes?")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  expect(patchRequests).toHaveLength(0);
  await expect(awardsSection(page)).not.toContainText(newTitle);
  await expect(awardsSection(page)).toContainText(award.title);
});

test("deleting an award requires confirmation and removes it from the list without a page reload", async ({
  page,
}) => {
  await loginAsManager(page);

  // Create a disposable award via the UI rather than deleting one of the
  // migration-seeded fixture awards, which the running Postgres volume
  // otherwise carries forever across e2e runs (migrations only seed once).
  const marker = `awards-page-e2e-delete-${Date.now()}`;
  const title = `Delete Marker Award ${marker}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Created for an e2e delete test.");
  await page.getByRole("button", { name: "Create award" }).click();
  await expect(awardsSection(page)).toContainText(title);

  const createdAwards = await getAwards(page);
  const award = createdAwards.find((candidate) => candidate.title === title);
  if (!award) {
    throw new Error(`Expected to find created award titled "${title}"`);
  }

  const deleteRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "DELETE" && request.url().includes(`/awards/${award.id}`)) {
      deleteRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: `Delete ${award.title}` }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(award.title);
  await expect(
    dialog.getByText("Are you sure you want to delete")
  ).toBeVisible();

  // Nothing has been sent before the confirm button is clicked.
  expect(deleteRequests).toHaveLength(0);

  await dialog.getByRole("button", { name: "Yes, delete" }).click();

  await expect(dialog).not.toBeVisible();
  expect(deleteRequests).toHaveLength(1);
  await expect(awardsSection(page)).not.toContainText(award.title);
});

test("canceling the delete confirmation makes no request and leaves the award in the list", async ({
  page,
}) => {
  await loginAsManager(page);
  const [award] = await getAwards(page);

  const deleteRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "DELETE" && request.url().includes(`/awards/${award.id}`)) {
      deleteRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: `Delete ${award.title}` }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  expect(deleteRequests).toHaveLength(0);
  await expect(awardsSection(page)).toContainText(award.title);
});
