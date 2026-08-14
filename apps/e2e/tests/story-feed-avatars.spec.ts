import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-avatar-${randomUUID()}@example.com`;
}

function feedSection(page: Page) {
  return page.getByRole("region", { name: "Story feed" });
}

// Scoped to the global SiteHeader (mounted in layout.tsx, present on every
// route): the home page shows two simultaneous HeaderAuthControl copies (the
// hero card's own, unaffected by this ticket, and the fixed global header's),
// so a bare role query for "Login"/"Log out" is a strict-mode violation.
function siteHeader(page: Page) {
  return page.getByTestId("site-header");
}

test("a story submitted while logged in shows the attributing user's initials avatar and name in the feed", async ({
  page,
}) => {
  const email = uniqueEmail();
  const name = "Hedy Lamarr";
  const marker = `attributed-e2e-${Date.now()}`;
  const storyText = `Claude helped me a lot. (${marker})`;

  await page.goto("/");
  // The global header's HeaderAuthControl only fades in on home once the hero
  // card has fully scrolled past (see home-header-scroll.spec.ts) — scroll
  // past it so this click reaches the global header's copy.
  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();

  await siteHeader(page).getByRole("button", { name: "Login" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("hunter22");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    siteHeader(page).getByRole("button", { name: "Log out" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill(storyText);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("button", { name: "Share a story" })).toBeVisible();

  const section = feedSection(page);
  await expect(section).toContainText(storyText);

  const card = section.getByRole("listitem").filter({ hasText: marker });
  await expect(card.getByText(name)).toBeVisible();
  await expect(card.getByTitle(name)).toBeVisible();
});

test("a story submitted while logged out shows an anonymous icon in the feed, with no attributed name", async ({
  page,
}) => {
  const marker = `anonymous-e2e-${Date.now()}`;
  const storyText = `Claude helped me a lot. (${marker})`;

  await page.goto("/");
  // The global header's HeaderAuthControl only fades in on home once the hero
  // card has fully scrolled past (see home-header-scroll.spec.ts) — scroll
  // past it so this assertion targets the global header's copy.
  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();

  await expect(
    siteHeader(page).getByRole("button", { name: "Login" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill(storyText);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("button", { name: "Share a story" })).toBeVisible();

  const section = feedSection(page);
  await expect(section).toContainText(storyText);

  const card = section.getByRole("listitem").filter({ hasText: marker });
  await expect(card.getByText("Anonymous", { exact: true })).toBeVisible();
});
