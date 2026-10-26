import { describe, expect, it } from "vitest";
import type { AgentNode } from "../agent/accessibility";
import { PixelModel } from "./pixelModel";
import type { SensorEvent } from "./pixelModel";
import { countSensor, samplePoints } from "./sampler";
import { offsetAt, velocityAt } from "./saccade";

const node = (over: Partial<AgentNode>): AgentNode => ({
  kind: "control",
  role: "button",
  name: "Go",
  box: { x: 10, y: 10, w: 60, h: 24 },
  ...over,
});

describe("sampler", () => {
  it("puts edge points round the box with outward normals", () => {
    const pts = samplePoints([node({})]);
    expect(pts.some((p) => p.ny === -1 && p.y === 10)).toBe(true);
    expect(pts.some((p) => p.nx === 1 && p.x === 70)).toBe(true);
    expect(pts.every((p) => p.contrast === 1)).toBe(true);
  });

  it("gives text half contrast, and canvases and unread letters none", () => {
    expect(samplePoints([node({ kind: "text" })])[0]?.contrast).toBe(0.55);
    expect(samplePoints([node({ kind: "void" })])[0]?.contrast).toBe(0);
    expect(samplePoints([node({ letterId: "a", state: "unread" })])[0]?.contrast).toBe(0);
    expect(samplePoints([node({ letterId: "a", state: "read" })])[0]?.code).toBe("read");
  });

  it("counts only letters a canvas exposes in its own content", () => {
    const canvas = document.createElement("canvas");
    canvas.innerHTML = '<a data-letter-id="inner">Inner</a>';
    const counts = countSensor([
      node({ kind: "void", box: { x: 0, y: 0, w: 1000, h: 1000 }, el: canvas }),
      node({ letterId: "a", box: { x: 10, y: 10, w: 40, h: 20 } }),
      node({ kind: "text", letterId: "b", box: { x: 50, y: 50, w: 40, h: 20 } }),
    ]);
    expect(counts).toEqual({ parts: 2, canvases: 1, lettersInside: 1 });
    expect(countSensor([node({ kind: "void", el: document.createElement("canvas") })]).lettersInside).toBe(0);
  });
});

describe("pixel model", () => {
  function run(seed: number) {
    const m = new PixelModel(samplePoints([node({})]), seed, 800, 600);
    const all: SensorEvent[] = [];
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      all.push(...m.step(t, 1 / 30, velocityAt(t)));
    }
    return all;
  }

  it("gives the same events for the same seed", () => {
    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });

  it("sets polarity from the sign of the motion across the edge", () => {
    const top = samplePoints([node({})]).filter((p) => p.ny === -1);
    const m = new PixelModel(top, 1, 1, 1);
    const up = m.step(0, 1, { x: 0, y: -30 });
    expect(up.length).toBeGreaterThan(0);
    expect(up.every((e) => e.on)).toBe(true);
    const down = m.step(0, 1, { x: 0, y: 30 });
    expect(down.length).toBeGreaterThan(0);
    expect(down.every((e) => !e.on)).toBe(true);
  });

  it("flips a misread edge at 2 Hz and keeps a read edge steady", () => {
    const top = (state: string) =>
      samplePoints([node({ letterId: "a", state })]).filter((p) => p.ny === -1);
    const misread = new PixelModel(top("misread"), 1, 1, 1);
    const read = new PixelModel(top("read"), 1, 1, 1);
    const v = { x: 0, y: -30 };
    expect(misread.step(0.1, 1, v).every((e) => e.on)).toBe(true);
    expect(misread.step(0.6, 1, v).every((e) => !e.on)).toBe(true);
    expect(read.step(0.6, 1, v).every((e) => e.on)).toBe(true);
  });

  it("gives only noise with no nodes", () => {
    const m = new PixelModel([], 3, 1000, 1000);
    expect(m.step(0, 10, { x: 20, y: 20 }).length).toBe(400);
  });

  it("keeps the shake tiny and its velocity consistent", () => {
    expect(Math.abs(offsetAt(0.123).x)).toBeLessThanOrEqual(1.5);
    const dt = 1e-5;
    const num = (offsetAt(0.2 + dt).x - offsetAt(0.2).x) / dt;
    expect(Math.abs(num - velocityAt(0.2).x)).toBeLessThan(0.01);
  });
});
