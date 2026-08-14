import { expect, test } from "@playwright/test";

// The sticky header is always mounted (visibility is animated via opacity/transform, not
// mount/unmount), so Playwright's toBeVisible() — which only checks display/visibility and
// bounding box, not opacity — would report it "visible" even while faded out. Asserting on
// the computed opacity directly is what actually reflects whether it's shown to the user.
test("sticky header appears once the hero card scrolls past and hides again on scroll back up", async ({
  page,
}) => {
  await page.goto("/");

  const stickyHeader = page.getByTestId("sticky-header");
  await expect(stickyHeader).toHaveCSS("opacity", "0");

  await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();
  await expect(stickyHeader).toHaveCSS("opacity", "1");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stickyHeader).toHaveCSS("opacity", "0");
});
