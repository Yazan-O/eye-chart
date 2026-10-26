import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function noSideScroll(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByTestId("topbar")).toBeVisible();
  await page.waitForTimeout(500);
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    view: document.documentElement.clientWidth,
  }));
  expect(widths.scroll, path).toBeLessThanOrEqual(widths.view);
}

test.describe("at 375 px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the chart and three stations have no horizontal scroll", async ({ page }) => {
    await noSideScroll(page, "/#/");
    await expect(page.getByTestId("letter-link-counter")).toBeVisible();
    for (const id of ["counter", "toast", "canvas-slider"]) {
      await noSideScroll(page, `/#/letter/${id}`);
      await expect(page.getByTestId("station-heading")).toBeVisible();
    }
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the chart settles and then requests no animation frames", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __frames: number };
      w.__frames = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__frames += 1;
        return original(cb);
      };
    });
    await page.goto("/#/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
    await expect(page.locator("html")).toHaveAttribute("data-ready", "true", { timeout: 20_000 });
    await expect(page.getByTestId("scene")).toHaveAttribute("data-reduced", "true");
    await page.waitForTimeout(1000);
    const settled = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
    await page.waitForTimeout(2000);
    const later = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
    expect(later - settled).toBe(0);
  });
});
