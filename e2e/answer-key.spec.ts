import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Twin = "works" | "broken";

interface DomNode {
  nodeName: string;
  nodeValue?: string;
  backendNodeId: number;
  children?: DomNode[];
  shadowRoots?: DomNode[];
}

function findNode(node: DomNode, match: (n: DomNode) => boolean): DomNode | null {
  if (match(node)) return node;
  for (const child of [...(node.shadowRoots ?? []), ...(node.children ?? [])]) {
    const hit = findNode(child, match);
    if (hit) return hit;
  }
  return null;
}
type Drive = (page: Page, twin: Twin) => Promise<void>;

const readout = (page: Page) => page.locator(".letter-readout");
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

const KEY: Record<string, Drive> = {
  counter: async (page, twin) => {
    for (let i = 0; i < 3; i++) await button(page, "Add one").click();
    if (twin === "works") await expect(readout(page)).toHaveText("Count: 3");
    else await expect(readout(page)).toHaveText("Count: 6");
  },
  toast: async (page, twin) => {
    await button(page, "Save").click();
    const toast = page.locator(".letter-toast");
    if (twin === "works") await expect(toast).toHaveText("Saved");
    else {
      await page.waitForTimeout(500);
      await expect(page.getByRole("status")).toHaveText("");
    }
  },
  optimistic: async (page, twin) => {
    await button(page, "Like").click();
    await page.waitForTimeout(1500);
    await expect(readout(page)).toHaveText(twin === "works" ? "Likes: 6" : "Likes: 5");
  },
  "hover-menu": async (page, twin) => {
    await page.locator(".letter-menu-trigger").hover();
    await button(page, "Settings").click();
    await expect(readout(page)).toHaveText(twin === "works" ? "Current page: Settings" : "Current page: Sign out");
  },
  "custom-select": async (page, twin) => {
    await page.locator(".letter-select-box").click();
    await page.locator(".letter-select-option", { hasText: "Large" }).click();
    await expect(page.locator(".letter-select-box")).toContainText("Size: Large");
    await expect(readout(page)).toHaveText(twin === "works" ? "Serves 4" : "Serves 1");
  },
  autocomplete: async (page, twin) => {
    await page.getByLabel("City").fill("Rochester");
    const suggestion = page.locator(".letter-suggestion", { hasText: "Rochester" });
    if (twin === "works") {
      await suggestion.click();
      await expect(readout(page)).toHaveText("Chosen: Rochester");
    } else {
      await page.waitForTimeout(300);
      await expect(suggestion).toHaveCount(0);
      await expect(readout(page)).toHaveText("Chosen: none");
    }
  },
  "consent-scrim": async (page, twin) => {
    await button(page, "Accept").click();
    const go = button(page, "Continue");
    const box = await go.boundingBox();
    if (!box) throw new Error("Continue button has no box");
    await page.waitForTimeout(500);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(readout(page)).toHaveText(twin === "works" ? "Step 2 of 3" : "Step 1 of 3");
  },
  "animated-total": async (page, twin) => {
    await button(page, "Load total").click();
    await expect(readout(page)).toHaveText(twin === "works" ? "Total: 1,250" : "Total: 1,205", {
      timeout: 6000,
    });
  },
  "virtual-list": async (page, twin) => {
    await page.locator(".letter-list").evaluate((el) => {
      el.scrollTop = 7776 * 32;
      el.dispatchEvent(new Event("scroll"));
    });
    await button(page, "Item 7777").click();
    await expect(page.locator(".letter-readout")).toHaveText(
      twin === "works" ? "Selected: Item 7777" : "Selected: Item 7778",
    );
  },
  "copy-button": async (page, twin) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await button(page, "Copy").click();
    await expect(button(page, "Copied!")).toBeVisible();
    await page.getByLabel("Paste here").click();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(page.getByLabel("Paste here")).toHaveValue(twin === "works" ? "DEMO-4821" : "");
  },
  "shadow-form": async (page, twin) => {
    await expect(page.locator("greet-form")).toBeAttached();
    const cdp = await page.context().newCDPSession(page);
    const tree = async () =>
      ((await cdp.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode }).root;
    const input = findNode(await tree(), (n) => n.nodeName === "INPUT");
    if (!input) throw new Error("no input inside the closed shadow root");
    const { model } = (await cdp.send("DOM.getBoxModel", { backendNodeId: input.backendNodeId })) as {
      model: { content: number[] };
    };
    const [x1 = 0, y1 = 0, , , x3 = 0, y3 = 0] = model.content;
    await page.mouse.click((x1 + x3) / 2, (y1 + y3) / 2);
    await page.keyboard.type("Ada");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    const greeting = async () => {
      const output = findNode(await tree(), (n) => n.nodeName === "OUTPUT");
      return output?.children?.map((c) => c.nodeValue ?? "").join("") ?? "";
    };
    await expect.poll(greeting).toBe(twin === "works" ? "Hello, Ada!" : "Hello, !");
  },
  iframe: async (page, twin) => {
    await button(page, "Run check").click();
    await expect(readout(page)).toHaveText("Status: Approved");
    const inside = page.frameLocator("iframe.letter-frame").locator("body");
    await expect(inside).toContainText(twin === "works" ? "Approved" : "Declined");
  },
  "label-mismatch": async (page, twin) => {
    await page.getByText("Save", { exact: true }).click();
    const draft = page.locator("#draft");
    if (twin === "works") {
      await expect(draft).toHaveValue("Agenda: review the garden plan");
      await expect(page.getByRole("status")).toHaveText("Saved");
    } else {
      await expect(draft).toHaveValue("");
      await expect(page.getByRole("status")).toHaveText("Discarded");
    }
  },
  "pseudo-chip": async (page, twin) => {
    const line = await readout(page).innerText();
    const chip = await page
      .locator(".letter-chip")
      .evaluate((el) => getComputedStyle(el, "::after").content.replace(/"/g, ""));
    expect(chip).toBe("Done");
    expect(line === "Setup: 3 of 3 steps").toBe(twin === "works");
  },
  "icon-status": async (page, twin) => {
    const rows = await page.locator(".letter-row-gap").evaluateAll((els) =>
      els.map((el) => ({
        tick: el.querySelector("circle")?.getAttribute("fill") === "#1f8f4e",
        full: /3\/3 checks/.test(el.textContent ?? ""),
      })),
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.tick === r.full)).toBe(twin === "works");
  },
  "clipped-label": async (page, twin) => {
    const notice = page.locator(".letter-notice");
    await expect(notice).toHaveText("Free trial ends today");
    const fits = await notice.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(twin === "works");
  },
  "hidden-note": async (page, twin) => {
    await page.getByLabel("Project name").fill("Garden");
    await button(page, "Create").click();
    await expect(page.locator(".letter-readout")).toHaveText(
      twin === "works" ? "Created: Garden" : "Something went wrong. Try again.",
    );
  },
  "comment-note": async (page, twin) => {
    await page.getByLabel("Task").fill("Water plants");
    await button(page, "Add").click();
    const items = page.locator(".letter-list-plain li");
    if (twin === "works") await expect(items).toHaveText(["Water plants"]);
    else {
      await expect(items).toHaveCount(0);
      await expect(page.getByText("No tasks yet.")).toBeVisible();
    }
  },
  "ghost-text": async (page, twin) => {
    await button(page, "Upload").click();
    await page.waitForTimeout(2500);
    const progress = page.locator(".letter-readout", { hasText: "Progress:" });
    const done = page.locator(".letter-readout.letter-ok");
    if (twin === "works") {
      await expect(progress).toHaveText("Progress: 100%");
      await expect(done).toHaveText("Upload complete");
    } else {
      await expect(progress).toHaveText("Progress: 80%");
      await expect(done).toHaveCount(0);
    }
  },
  "leftover-error": async (page, twin) => {
    await button(page, "Save").click();
    const last = page.locator(".letter-readout", { hasText: "Last saved:" });
    const error = page.locator(".letter-error");
    if (twin === "works") {
      await expect(last).toHaveText("Last saved: just now");
      await expect(error).toHaveCount(0);
    } else {
      await expect(last).toHaveText("Last saved: never");
      await expect(error).toHaveText("Error: save failed");
    }
  },
  "zero-width-code": async (page, twin) => {
    const shown = await page.locator(".letter-readout", { hasText: "Your access code:" }).textContent();
    const code = (shown ?? "").replace("Your access code:", "").trim();
    await page.getByLabel("Enter code").fill(code);
    await button(page, "Apply").click();
    await expect(page.locator(".letter-readout").last()).toHaveText(
      twin === "works" ? "Trial: 7 days added" : "Code not recognised",
    );
  },
};

for (const [id, drive] of Object.entries(KEY)) {
  for (const twin of ["works", "broken"] as const) {
    test(`answer key: ${id} ${twin} twin gives its ${twin === "works" ? "pass" : "fail"} outcome`, async ({ page }) => {
      await page.goto(`/#/l/${id}/${twin}`);
      await expect(page.locator("main.letter-page h1")).toBeVisible();
      await drive(page, twin);
    });
  }
}
