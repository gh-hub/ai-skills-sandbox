import { expect, test } from "@playwright/test";
import { getLikeCount } from "./helpers";

test("clicking Like increases the displayed count by exactly one", async ({ page }) => {
  await page.goto("/");

  const likeCount = page.getByText(/^\d+ likes$/);
  await expect(likeCount).toBeVisible();

  const before = await getLikeCount(page);

  await page.getByRole("button", { name: "Like" }).click();

  await expect(likeCount).toContainText(`${before + 1} likes`);
});
