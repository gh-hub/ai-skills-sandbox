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

function feedSection(page: Page) {
  return page.getByRole("region", { name: "Story feed" });
}

test("selecting awards on the story form shows the resulting badges on the feed", async ({
  page,
}) => {
  const awards = await getAwards(page);
  expect(awards.length).toBeGreaterThanOrEqual(2);
  const [first, second] = awards;

  await page.goto("/");

  const marker = `story-award-picker-e2e-${Date.now()}`;
  const storyText = `Claude helped me a lot. (${marker})`;

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill(storyText);
  await page.getByLabel(first.title).check();
  await page.getByLabel(second.title).check();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  const section = feedSection(page);
  await expect(section).toContainText(storyText);

  const card = section.getByRole("listitem").filter({ hasText: storyText });
  await expect(card).toContainText(first.title);
  await expect(card).toContainText(second.title);
});

test("submitting the story form with no awards selected attaches no badges", async ({
  page,
}) => {
  await page.goto("/");

  const marker = `story-award-picker-e2e-${Date.now()}`;
  const storyText = `Claude helped me a lot, no awards this time. (${marker})`;

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill(storyText);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  const section = feedSection(page);
  await expect(section).toContainText(storyText);

  const card = section.getByRole("listitem").filter({ hasText: storyText });
  await expect(card.getByRole("list", { name: "Awards" })).toHaveCount(0);
});
