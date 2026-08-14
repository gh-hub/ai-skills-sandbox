import { expect, test } from "@playwright/test";

// The global SiteHeader (mounted in layout.tsx, present on every route) is always
// mounted on home too — HeaderAuthControl's visibility there is animated via
// opacity/transform, not mount/unmount — so Playwright's toBeVisible(), which only
// checks display/visibility and bounding box (not opacity), would report it
// "visible" even while faded out. Asserting on the computed opacity directly is
// what actually reflects whether it's shown to the user.
//
// Scoped to page.getByTestId("site-header") throughout: the home page's hero card
// renders its own separate, always-shown HeaderAuthControl copy in its title bar,
// unaffected by scroll — a bare role/testid query would match both.
test("the global header's login control fades in once the hero card scrolls past, and hides again on scroll back up", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const siteHeader = page.getByTestId("site-header");

  await expect(siteHeader.getByText("Thanks, Claude")).toBeVisible();
  await expect(siteHeader.getByRole("link", { name: "Awards" })).toBeVisible();
  await expect(
    siteHeader.getByRole("button", { name: "Toggle theme" })
  ).toBeVisible();

  const authFadeWrapper = siteHeader.getByTestId("header-auth-fade");
  await expect(authFadeWrapper).toHaveCSS("opacity", "0");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(authFadeWrapper).toHaveCSS("opacity", "1");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(authFadeWrapper).toHaveCSS("opacity", "0");
});
