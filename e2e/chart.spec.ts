import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { find, letterIds, STATE_WORDS, stateOf } from "./readings";
import type { State } from "./readings";

const STATES: State[] = ["read", "misread", "blocked", "unread"];
const lensIds = letterIds.filter((id) => find(id, "lens") || find(id, "lens-broken"));

async function openChart(page: Page) {
  await page.goto("/#/");
  await expect(page.getByTestId("reading-summary")).toHaveText(/Read correctly: \d+ of \d+ letters/);
}

async function tally(page: Page): Promise<Record<State, number>> {
  const out = {} as Record<State, number>;
  for (const s of STATES) {
    out[s] = Number(await page.getByTestId(`tally-${s}`).locator("dd").innerText());
  }
  return out;
}

test("the four tally counts add up to 24 and match the readings file", async ({ page }) => {
  await openChart(page);
  const shown = await tally(page);
  const expected = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<State, number>;
  for (const id of letterIds) expected[stateOf(id)] += 1;
  expect(letterIds).toHaveLength(24);
  expect(shown).toEqual(expected);
  expect(STATES.reduce((sum, s) => sum + shown[s], 0)).toBe(24);
});

test("the reading summary repeats the read count and the letter total", async ({ page }) => {
  await openChart(page);
  const shown = await tally(page);
  const text = await page.getByTestId("reading-summary").innerText();
  const [, n, total] = text.match(/Read correctly: (\d+) of (\d+) letters/) ?? [];
  expect(Number(n)).toBe(shown.read);
  expect(Number(total)).toBe(24);
});

test("every letter link shows the state the readings file gives it", async ({ page }) => {
  await openChart(page);
  await expect(page.locator('a[data-testid^="letter-link-"]')).toHaveCount(24);
  for (const id of letterIds) {
    const link = page.getByTestId(`letter-link-${id}`);
    const state = stateOf(id);
    await expect(link, id).toHaveAttribute("data-state", state);
    await expect(link.locator(".chart-key-state"), id).toHaveText(STATE_WORDS[state]);
    await expect(link, id).toBeVisible();
  }
});

test("there is one lens dial for each letter with a lens reading, all off at load", async ({ page }) => {
  await openChart(page);
  const dials = page.locator('button[data-testid^="lens-dial-"]');
  await expect(dials).toHaveCount(lensIds.length);
  for (const id of lensIds) {
    await expect(page.getByTestId(`lens-dial-${id}`)).toHaveAttribute("aria-pressed", "false");
  }
});

for (const id of lensIds) {
  test(`lens dial ${id} switches its letter to the lens reading and back`, async ({ page }) => {
    await openChart(page);
    const dial = page.getByTestId(`lens-dial-${id}`);
    const link = page.getByTestId(`letter-link-${id}`);
    const before = stateOf(id);
    const after = stateOf(id, true);
    await expect(link).toHaveAttribute("data-state", before);
    await dial.click();
    await expect(dial).toHaveAttribute("aria-pressed", "true");
    await expect(link).toHaveAttribute("data-state", after);
    await expect(link).toHaveAttribute("data-lens", "on");
    await expect(link.locator(".chart-key-state")).toHaveText(STATE_WORDS[after]);
    await expect(page).toHaveURL(new RegExp(`lens=${id}`));
    await expect(page.getByTestId("reading-summary")).toContainText("With 1 lens on.");
    await dial.click();
    await expect(dial).toHaveAttribute("aria-pressed", "false");
    await expect(link).toHaveAttribute("data-state", before);
    await expect(link).toHaveAttribute("data-lens", "off");
    await expect(page.getByTestId("reading-summary")).not.toContainText("lens on");
  });
}

test("the sensor view counts real parts, and both Escape and the toggle leave it", async ({ page }) => {
  await openChart(page);
  const toggle = page.getByTestId("agent-toggle");
  const root = page.locator("html");

  await toggle.click();
  await expect(root).toHaveAttribute("data-view", "robot");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const summary = page.getByTestId("agent-summary");
  await expect(summary).toHaveText(/Sensor view\. \d+ parts found\./);
  const parts = Number((await summary.innerText()).match(/(\d+) parts found/)?.[1]);
  expect(parts).toBeGreaterThan(0);
  await expect(page.getByTestId("sensor-count")).toContainText("The chart is one canvas.");

  await page.keyboard.press("Escape");
  await expect(root).toHaveAttribute("data-view", "human");
  await expect(page.getByTestId("agent-overlay")).toHaveCount(0);
  await expect(toggle).toHaveText("See it like TestSprite");

  await toggle.click();
  await expect(root).toHaveAttribute("data-view", "robot");
  await expect(toggle).toHaveText("Back to human eyes");
  await toggle.click();
  await expect(root).toHaveAttribute("data-view", "human");
  await expect(page.getByTestId("agent-overlay")).toHaveCount(0);
});

test("unknown routes show the not-found page and its link goes back to the chart", async ({ page }) => {
  await page.goto("/#/no-such-page");
  await expect(page.getByTestId("not-found-heading")).toHaveText("Page not found");
  await page.getByTestId("home-link").click();
  await expect(page.getByTestId("chart-page")).toBeVisible();
  await expect(page.getByTestId("heading")).toHaveText("Eye Chart");
});

test("the top bar links to the source on GitHub and the landing page says what TestSprite is", async ({ page }) => {
  await openChart(page);
  await expect(page.getByTestId("github-link")).toHaveAttribute("href", "https://github.com/Yazan-O/eye-chart");
  await expect(page.getByTestId("what-testsprite")).toContainText("TestSprite is an AI testing agent");
});
