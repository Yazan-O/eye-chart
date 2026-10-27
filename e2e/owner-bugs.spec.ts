import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const LAYOUT_PROPS = /\b(width|height|margin|padding|top|left|right|bottom|inset|flex|grid|all)\b/;

async function animated(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el);
      const names = style.transitionProperty.split(",").map((n) => n.trim());
      const times = style.transitionDuration.split(",").map((t) => parseFloat(t));
      return names.filter((_, i) => (times[i % times.length] ?? 0) > 0).join(",");
    }),
  );
}

async function openChart(page: Page) {
  await page.goto("/#/");
  await expect(page.locator('a[data-testid^="letter-link-"]')).toHaveCount(24);
}

async function openAbout(page: Page) {
  await page.getByTestId("about-open").click();
  await expect(page.getByTestId("reading-summary")).toHaveText(/Read correctly: \d+ of \d+ letters/);
}

async function closeAbout(page: Page) {
  await page.getByTestId("about-close").click();
  await expect(page.getByTestId("about-panel")).toHaveCount(0);
}

async function readCount(page: Page): Promise<number> {
  await openAbout(page);
  const n = Number(await page.getByTestId("tally-read").locator("dd").innerText());
  await closeAbout(page);
  return n;
}

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
  [375, 812],
] as const) {
  test.describe(`at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test("every lens can be turned on from About and one detail shows", async ({ page }) => {
      await openChart(page);
      await openAbout(page);
      const dials = page.locator('button[data-testid^="lens-dial-"]');
      const n = await dials.count();
      expect(n).toBeGreaterThan(1);
      for (let i = 0; i < n; i++) {
        await dials.nth(i).click();
        await expect(dials.nth(i)).toHaveAttribute("aria-pressed", "true");
      }
      await expect(page.locator('[data-testid^="lens-dial-detail-"]')).toHaveCount(1);
      await expect(page.getByTestId("reading-summary")).toContainText(`With ${n} lenses on.`);
    });

    test("the page has no scrollbars and the chart letters sit inside the stage", async ({ page }) => {
      await openChart(page);
      await page.waitForSelector(".chart-key--placed");
      const fit = await page.evaluate(() => {
        const d = document.documentElement;
        const stage = document.querySelector('[data-testid="scene"]')!.getBoundingClientRect();
        const links = [...document.querySelectorAll('a[data-testid^="letter-link-"]')].map((a) =>
          a.getBoundingClientRect(),
        );
        return {
          noScroll: d.scrollWidth <= d.clientWidth && d.scrollHeight <= d.clientHeight,
          inside: links.every((b) => b.top >= stage.top - 1 && b.bottom <= stage.bottom + 1 && b.width > 4),
        };
      });
      expect(fit).toEqual({ noScroll: true, inside: true });
    });
  });
}

test.describe("at 1440x900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("turning a lens on keeps the other dials under the pointer", async ({ page }) => {
    await openChart(page);
    await openAbout(page);
    const first = page.getByTestId("lens-dial-toast");
    const second = page.getByTestId("lens-dial-hover-menu");
    const box = (await second.boundingBox())!;
    await first.click();
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("lens-dial-detail-hover-menu")).toBeVisible();
    await expect(page.getByTestId("lens-dial-detail-toast")).toHaveCount(0);
  });

  test("lens and twin controls animate only transform and opacity", async ({ page }) => {
    await openChart(page);
    await openAbout(page);
    const dialProps = await animated(page, ".dials .dial, .dials .dial-knob");
    await page.goto("/#/letter/toast");
    await expect(page.getByTestId("lens-exploded")).toBeVisible();
    const explodeProps = await animated(page, ".plate, .plate-joint, .pane-switch button");
    expect(explodeProps.some((p) => p.includes("transform"))).toBe(true);
    for (const p of [...dialProps, ...explodeProps]) expect(p).not.toMatch(LAYOUT_PROPS);
    const explode = page.getByTestId("lens-explode");
    const plate = page.locator(".plate--after");
    await expect(page.getByTestId("lens-exploded")).toHaveAttribute("data-open", "true");
    const open = (await plate.boundingBox())!.x;
    await explode.click();
    await expect(page.getByTestId("lens-exploded")).toHaveAttribute("data-open", "false");
    await expect.poll(async () => (await plate.boundingBox())!.x).toBeLessThan(open - 40);
  });

  test("the card plays by itself on load and stops on a click", async ({ page }) => {
    await openChart(page);
    const card = page.getByTestId("letter-card");
    await expect(card).toHaveAttribute("data-playing", "true", { timeout: 15_000 });
    await expect(card).toHaveAttribute("data-step", "works");
    await page.getByTestId("card-next").click();
    await expect(card).toHaveAttribute("data-playing", "false");
    await expect(card).toHaveAttribute("data-step", "broken");
    await page.waitForTimeout(1200);
    await expect(card).toHaveAttribute("data-step", "broken");
  });
});

for (const width of [1440, 375]) {
  test.describe(`compare at ${width}px`, () => {
    test.use({ viewport: { width, height: width > 800 ? 900 : 812 } });

    test("compare with lenses shows the before and after on the chart", async ({ page }) => {
      await openChart(page);
      const before = await readCount(page);
      await page.getByTestId("agent-toggle").click();
      await expect(page.locator("html")).toHaveAttribute("data-view", "robot");
      const compare = page.getByTestId("compare-toggle");
      await compare.click();
      await expect(compare).toHaveAttribute("aria-pressed", "true");
      const result = page.getByTestId("compare-result");
      await expect(result).toContainText(`up from ${before}`);
      const after = Number((await result.innerText()).match(/lenses: (\d+) of/)?.[1]);
      expect(after).toBeGreaterThan(before);
      await expect.poll(() => readCount(page)).toBe(after);
      await compare.click();
      await expect(compare).toHaveAttribute("aria-pressed", "false");
      await expect(result).toHaveCount(0);
      await expect.poll(() => readCount(page)).toBe(before);
      await page.keyboard.press("Escape");
      await expect(page.locator("html")).toHaveAttribute("data-view", "human");
      await expect.poll(() => readCount(page)).toBe(before);
    });

    test("compare with lenses shows the before and after on a station", async ({ page }) => {
      await page.goto("/#/letter/toast");
      await expect(page.getByTestId("station-heading")).toBeVisible();
      await page.getByTestId("agent-toggle").click();
      const compare = page.getByTestId("compare-toggle");
      await compare.click();
      await expect(page.getByTestId("compare-result")).toContainText(/With the recorded lenses: \d+ of 24 letters read correctly, up from \d+\./);
    });
  });
}
