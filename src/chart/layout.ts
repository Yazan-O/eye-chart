import type { ChartRow } from "../data/chart";

export interface PlacedGlyph {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
}

export interface PlacedSlat {
  fraction: string;
  y: number;
  z: number;
  width: number;
  height: number;
}

export interface ChartLayout {
  glyphs: PlacedGlyph[];
  slats: PlacedSlat[];
  width: number;
  top: number;
  bottom: number;
  depth: number;
}

const FIRST_SIZE = 1.15;
const SHRINK = 0.88;
const MIN_SIZE = 0.5;
const STEP_BACK = 0.78;
const MAX_DEPTH = 1.8;

export function layoutChart(rows: ChartRow[], flat: boolean): ChartLayout {
  const sizes = rows.map((_, i) => Math.max(MIN_SIZE, FIRST_SIZE * SHRINK ** i));
  const width = Math.max(
    2.6,
    ...rows.map((r, i) => (sizes[i] ?? MIN_SIZE) * (r.glyphs.length * 1.5 + 0.8)),
  );
  const glyphs: PlacedGlyph[] = [];
  const slats: PlacedSlat[] = [];
  const step = Math.min(STEP_BACK, MAX_DEPTH / Math.max(1, rows.length - 1));
  let y = 0;
  rows.forEach((row, i) => {
    const size = sizes[i] ?? MIN_SIZE;
    const height = size * 1.38;
    const prev = slats[slats.length - 1];
    y = prev ? prev.y - prev.height / 2 - height / 2 - (flat ? 0 : 0.05) : 0;
    const z = flat ? 0 : 0 - i * step;
    slats.push({ fraction: row.fraction, y, z, width, height });
    const pitch = size * 1.5;
    const start = -((row.glyphs.length - 1) * pitch) / 2;
    row.glyphs.forEach((g, j) => {
      glyphs.push({ id: g.id, x: start + j * pitch, y, z: z + 0.04, size });
    });
  });
  const first = slats[0];
  const last = slats[slats.length - 1];
  return {
    glyphs,
    slats,
    width,
    top: first ? first.y + first.height / 2 : 0,
    bottom: last ? last.y - last.height / 2 : 0,
    depth: last ? 0 - last.z : 0,
  };
}
