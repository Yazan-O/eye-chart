import { describe, expect, it } from "vitest";
import { focusAt, introDone, lampAt, landAt } from "./intro";

describe("load sequence", () => {
  const full = { mode: "full" as const, rows: 7, skipAt: null };

  it("turns the lamp on, pulls focus, then lands verdicts", () => {
    expect(lampAt(full, 0)).toBe(0);
    expect(lampAt(full, 300)).toBe(1);
    expect(focusAt(full, 200, 0)).toBe(1);
    expect(focusAt(full, 3000, 6)).toBeLessThan(0.01);
    expect(landAt(full, 1600, 0, 500)).toBe(0);
    expect(landAt(full, 2600, 0, 500)).toBe(1);
    expect(introDone(full, 2899)).toBe(false);
    expect(introDone(full, 2900)).toBe(true);
  });

  it("settles everything within 150 ms of a skip", () => {
    const skipped = { ...full, skipAt: 400 };
    expect(focusAt(skipped, 550, 6)).toBe(0);
    expect(landAt(skipped, 550, 6, 500)).toBe(1);
    expect(introDone(skipped, 550)).toBe(true);
  });

  it("is at rest at once in the still path", () => {
    const still = { mode: "none" as const, rows: 7, skipAt: null };
    expect(lampAt(still, 0)).toBe(1);
    expect(focusAt(still, 0, 3)).toBe(0);
    expect(landAt(still, 0, 3, 500)).toBe(1);
    expect(introDone(still, 0)).toBe(true);
  });
});
