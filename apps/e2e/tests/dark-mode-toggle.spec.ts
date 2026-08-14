import { expect, test } from "@playwright/test";

test("toggling dark mode changes the theme and persists across reload", async ({ page }) => {
  await page.goto("/");

  // Scoped to the global SiteHeader (mounted in layout.tsx, present on every
  // route) rather than a bare role query — ticket 01 made this the single
  // source of the theme toggle across the whole app.
  const themeToggle = page
    .getByTestId("site-header")
    .getByRole("button", { name: "Toggle theme" });
  await expect(themeToggle).toBeEnabled();

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await themeToggle.click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);
});
