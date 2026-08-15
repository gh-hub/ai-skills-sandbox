import { expect, test, type Page } from "@playwright/test";

type LikesStats = {
  totalLikes: number;
  likesWithHoursReported: number;
  reportedHoursSaved: number;
  percentWithoutHoursReported: number;
  averageHoursPerReport: number;
  estimatedTotalHoursSaved: number;
};

async function getStats(page: Page): Promise<LikesStats> {
  const response = await page.request.get("/api/likes/stats");
  return response.json();
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

test("stats band reflects a submitted story's hours saved without a page reload", async ({
  page,
}) => {
  await page.goto("/");

  const before = await getStats(page);

  await page.getByRole("button", { name: "Share a story" }).click();
  await page
    .getByLabel("Story (optional)")
    .fill("Claude helped me automate a report.");
  await page.getByLabel("Hours saved (optional)").fill("6");
  await page.getByRole("button", { name: "Submit" }).click();

  // Modal closing confirms the submission succeeded, without reloading the page.
  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  const after = await getStats(page);
  expect(after.totalLikes).toBe(before.totalLikes + 1);
  expect(after.reportedHoursSaved).toBe(before.reportedHoursSaved + 6);

  const totalLikesTile = page.getByRole("group", { name: "Total likes" });
  const reportedTile = page.getByRole("group", { name: "Reported hours saved" });
  const estimatedTile = page.getByRole("group", {
    name: "Estimated total hours saved",
  });
  const percentTile = page.getByRole("group", { name: "Didn't report hours" });

  await expect(totalLikesTile).toContainText(formatNumber(after.totalLikes));
  await expect(reportedTile).toContainText(formatNumber(after.reportedHoursSaved));
  await expect(estimatedTile).toContainText(
    formatNumber(after.estimatedTotalHoursSaved)
  );
  await expect(percentTile).toContainText(
    `${formatNumber(after.percentWithoutHoursReported)}%`
  );
});

test("reported and estimated hours-saved figures are shown with equal visual weight", async ({
  page,
}) => {
  await page.goto("/");

  const reportedValue = page
    .getByRole("group", { name: "Reported hours saved" })
    .locator("span")
    .first();
  const estimatedValue = page
    .getByRole("group", { name: "Estimated total hours saved" })
    .locator("span")
    .first();

  await expect(reportedValue).toBeVisible();
  await expect(estimatedValue).toBeVisible();

  expect(await reportedValue.getAttribute("class")).toBe(
    await estimatedValue.getAttribute("class")
  );
});
