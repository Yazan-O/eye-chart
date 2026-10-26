import { expect, test } from "@playwright/test";
import { letterIds } from "./readings";

for (const id of letterIds) {
  test(`twins of ${id} render alone, without the chart shell`, async ({ page }) => {
    const names: string[] = [];
    for (const variant of ["works", "broken"] as const) {
      await page.goto(`/#/l/${id}/${variant}`);
      const heading = page.locator("main.letter-page h1");
      await expect(heading).toBeVisible();
      await expect(heading).not.toHaveText("Unknown widget");
      names.push(await heading.innerText());
      await expect(page.getByTestId("chart-page")).toHaveCount(0);
      await expect(page.getByTestId("topbar")).toHaveCount(0);
      await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
    }
    expect(names[0]).toBe(names[1]);
  });
}

test("the counter twin counts three clicks right when it works and wrong when broken", async ({ page }) => {
  await page.goto("/#/l/counter/works");
  const add = page.getByRole("button", { name: "Add one" });
  for (let i = 0; i < 3; i++) await add.click();
  await expect(page.locator(".letter-readout")).toHaveText("Count: 3");

  await page.goto("/#/l/counter/broken");
  const addBroken = page.getByRole("button", { name: "Add one" });
  for (let i = 0; i < 3; i++) await addBroken.click();
  const readout = page.locator(".letter-readout");
  await expect(readout).toHaveText(/Count: \d+/);
  await expect(readout).not.toHaveText("Count: 3");
});
