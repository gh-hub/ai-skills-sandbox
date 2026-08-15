import { expect, test, type Page } from "@playwright/test";

type LikesPage = {
  items: { id: string; story: string | null; hoursSaved: number | null }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function getFeedPage(page: Page, pageNumber: number): Promise<LikesPage> {
  const response = await page.request.get(
    `/api/likes?page=${pageNumber}&limit=10`
  );
  return response.json();
}

async function seedStoryViaApi(
  page: Page,
  story: string,
  hoursSaved?: number
): Promise<void> {
  const response = await page.request.post("/api/likes", {
    data: { story, ...(hoursSaved !== undefined ? { hoursSaved } : {}) },
  });
  expect(response.ok()).toBeTruthy();
}

function feedSection(page: Page) {
  return page.getByRole("region", { name: "Story feed" });
}

test("submitting a story makes it appear in the feed, and a plain like with no story does not", async ({
  page,
}) => {
  await page.goto("/");

  const before = await getFeedPage(page, 1);

  const marker = `story-feed-e2e-${Date.now()}`;
  const storyText = `Claude helped me a lot. (${marker})`;

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill(storyText);
  await page.getByLabel("Hours saved (optional)").fill("4");
  await page.getByRole("button", { name: "Submit" }).click();

  // Modal closing confirms the submission succeeded.
  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  await expect(feedSection(page)).toContainText(storyText);
  await expect(feedSection(page)).toContainText("4 hours saved");

  const afterStory = await getFeedPage(page, 1);
  expect(afterStory.total).toBe(before.total + 1);

  // A plain like (no story) should not add anything to the story feed.
  await page.getByRole("button", { name: "Like" }).click();
  await expect(page.getByText(/^\d+ likes$/)).toBeVisible();

  const afterLike = await getFeedPage(page, 1);
  expect(afterLike.total).toBe(afterStory.total);
});

test("navigating between pages via pagination controls shows different sets of stories", async ({
  page,
}) => {
  const marker = `pagination-e2e-${Date.now()}`;
  const seededStories = Array.from(
    { length: 15 },
    (_, index) => `${marker} story ${index + 1}`
  );

  for (const story of seededStories) {
    await seedStoryViaApi(page, story);
  }

  await page.goto("/");

  const section = feedSection(page);
  await expect(section).toBeVisible();

  const page1Items = await section.getByRole("listitem").allTextContents();

  // Newest-first: the last-seeded stories land on page 1.
  await expect(section).toContainText(`${marker} story 15`);

  await page
    .getByRole("navigation", { name: "Story feed pages" })
    .getByRole("button", { name: "2", exact: true })
    .click();

  await expect(
    page
      .getByRole("navigation", { name: "Story feed pages" })
      .getByRole("button", { name: "2", exact: true })
  ).toHaveAttribute("aria-current", "page");

  const page2Items = await section.getByRole("listitem").allTextContents();

  expect(page2Items).not.toEqual(page1Items);
  expect(page1Items.some((text) => page2Items.includes(text))).toBe(false);
});
