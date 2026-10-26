import { describe, expect, it } from "vitest";
import { layoutChart } from "./layout";
import type { ChartRow } from "../data/chart";

const rows: ChartRow[] = [1, 2, 3].map((row, i) => ({
  row,
  fraction: `f${i}`,
  glyphs: Array.from({ length: row }, (_, j) => ({
    id: `${row}-${j}`,
    glyph: "E",
    name: "E",
    state: "unread" as const,
  })),
}));

describe("layoutChart", () => {
  it("recedes harder rows in depth and shrinks them", () => {
    const layout = layoutChart(rows, false);
    const z = layout.slats.map((s) => s.z);
    expect(z[0]).toBe(0);
    expect(z[1]).toBeLessThan(0);
    expect(z[2]).toBeLessThan(z[1] ?? 0);
    const sizes = layout.glyphs.map((g) => g.size);
    expect(sizes[0]).toBeGreaterThan(sizes[sizes.length - 1] ?? 0);
  });

  it("keeps every row on one plane when flat", () => {
    const layout = layoutChart(rows, true);
    expect(layout.slats.every((s) => s.z === 0)).toBe(true);
    expect(layout.depth).toBe(0);
  });
});
