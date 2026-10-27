import { expect, test } from "@playwright/test";

test("the story moves through four steps by button, arrow key and dot, and the demo stops on input", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.getByTestId("heading")).toHaveText("Eye Chart");
  await expect(page.getByTestId("step-count")).toHaveText("1 of 4");
  await expect(page.getByTestId("step-1")).toHaveAttribute("data-state", "active");
  await expect(page.getByTestId("tagline")).toContainText("one works, one is broken");

  await page.getByTestId("step-next").click();
  await expect(page.getByTestId("step-count")).toHaveText("2 of 4");
  await expect(page.getByTestId("demo-toggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("story-twin-works")).toBeVisible();
  await expect(page.getByTestId("story-twin-broken")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("step-count")).toHaveText("3 of 4");
  await expect(page.getByTestId("step-3")).toHaveAttribute("data-state", "active");

  await page.getByTestId("step-dot-4").click();
  await expect(page.getByTestId("step-count")).toHaveText("4 of 4");
  await expect(page.getByTestId("story-score")).toHaveText(/\d+ of 24 read correctly/);
  await expect(page.getByTestId("step-next")).toBeDisabled();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("step-count")).toHaveText("3 of 4");
  await page.getByTestId("step-prev").click();
  await expect(page.getByTestId("step-count")).toHaveText("2 of 4");

  const scroll = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
  expect(scroll).toBeLessThanOrEqual(0);
});

test("the demo plays by itself on first load and turns the subject lens on without pressing its dial", async ({ page }) => {
  await page.goto("/#/");
  const toggle = page.getByTestId("demo-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 20_000 });
  await expect(page.getByTestId("step-count")).toHaveText("2 of 4", { timeout: 10_000 });
  await expect(page.getByTestId("step-count")).toHaveText("3 of 4", { timeout: 10_000 });
  await expect(page.getByTestId("story-lens")).toHaveAttribute("data-on", "true", { timeout: 5_000 });
  const dials = page.locator('button[data-testid^="lens-dial-"][aria-pressed="true"]');
  await expect(dials).toHaveCount(0);
  await expect(page.getByTestId("reading-summary")).not.toContainText("lens on");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("story-lens")).toHaveAttribute("data-on", "false");
});

test("hovering a letter on the answer sheet names it in the chart hint", async ({ page }) => {
  await page.goto("/#/?still=1");
  await expect(page.getByTestId("chart-hint")).toContainText("Hover a letter");
  await page.getByTestId("letter-link-counter").hover();
  await expect(page.getByTestId("chart-hint")).toHaveText(/^Counter: .+ Click to open its test\.$/);
  await page.getByTestId("letter-link-counter").click();
  await expect(page.getByTestId("station-heading")).toHaveText("Counter");
});
