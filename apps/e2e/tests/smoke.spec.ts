import { expect, test } from "@playwright/test";

test("loads the app and shows the heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Thanks, Claude" })).toBeVisible();
});
