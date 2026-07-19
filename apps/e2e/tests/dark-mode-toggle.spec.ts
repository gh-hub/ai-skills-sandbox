import { expect, test } from "@playwright/test";

test("toggling dark mode changes the theme and persists across reload", async ({ page }) => {
  await page.goto("/");

  const themeToggle = page.getByRole("button", { name: "Toggle theme" });
  await expect(themeToggle).toBeEnabled();

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await themeToggle.click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);
});
