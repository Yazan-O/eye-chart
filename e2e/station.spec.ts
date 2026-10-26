import { expect, test } from "@playwright/test";
import { find, letterIds, STATE_WORDS, stateOf, TRUTH_WORDS, VERDICT_WORDS } from "./readings";

for (const id of letterIds) {
  test(`station ${id} shows truth, verdict and reason for both twins`, async ({ page }) => {
    await page.goto(`/#/letter/${id}`);
    await expect(page.getByTestId("station-state")).toContainText(`${STATE_WORDS[stateOf(id)]}.`);
    for (const variant of ["works", "broken"] as const) {
      const reading = find(id, variant);
      const prefix = `reading-${variant}`;
      if (!reading) {
        await expect(page.getByTestId(`${prefix}-verdict`)).toHaveText("Not read yet");
        continue;
      }
      await expect(page.getByTestId(`${prefix}-truth`)).toHaveText(TRUTH_WORDS[reading.truth]);
      await expect(page.getByTestId(`${prefix}-verdict`)).toHaveText(VERDICT_WORDS[reading.verdict]);
      if (reading.reason) {
        await expect(page.getByTestId(`${prefix}-reason`)).toHaveText(reading.reason.trim());
      }
    }
    await expect(page.getByTestId("frame-works")).toHaveAttribute("src", new RegExp(`#/l/${id}/works$`));
    await expect(page.getByTestId("frame-broken")).toHaveAttribute("src", new RegExp(`#/l/${id}/broken$`));
  });
}

test("next walks every station in chart order and previous walks back", async ({ page }) => {
  await page.goto("/#/");
  const links = page.locator('a[data-testid^="letter-link-"]');
  await expect(links).toHaveCount(24);
  const order = await links.evaluateAll((els) => els.map((el) => el.getAttribute("data-letter-id") ?? ""));
  expect([...order].sort()).toEqual([...letterIds].sort());

  await page.goto(`/#/letter/${order[0]}`);
  await expect(page.getByTestId("prev-letter")).toHaveCount(0);
  const seen = [order[0]];
  for (let i = 1; i < order.length; i++) {
    await page.getByTestId("next-letter").click();
    await expect(page).toHaveURL(new RegExp(`#/letter/${order[i]}$`));
    seen.push(order[i]);
  }
  await expect(page.getByTestId("next-letter")).toHaveCount(0);
  expect(seen).toEqual(order);

  for (let i = order.length - 2; i >= 0; i--) {
    await page.getByTestId("prev-letter").click();
    await expect(page).toHaveURL(new RegExp(`#/letter/${order[i]}$`));
  }
  await expect(page.getByTestId("prev-letter")).toHaveCount(0);
});
