import type { Page } from "@playwright/test";

export async function getLikeCount(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+ likes$/).textContent();
  return Number(text?.match(/(\d+) likes/)?.[1]);
}
