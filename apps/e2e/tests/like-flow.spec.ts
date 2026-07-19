import { expect, test } from "@playwright/test";

test("clicking Like increases the displayed count by exactly one", async ({ page }) => {
  await page.goto("/");

  const likeCount = page.getByText(/\d+ likes/);
  await expect(likeCount).toBeVisible();

  const before = Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1]);

  await page.getByRole("button", { name: "Like" }).click();

  await expect(likeCount).toContainText(`${before + 1} likes`);
});
