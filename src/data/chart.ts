import { letterState } from "./readings";
import type { GlyphState, Letter, Reading } from "./types";

export interface ChartGlyph {
  id: string;
  glyph: string;
  name: string;
  state: GlyphState;
  lens?: "on" | "off";
}

export interface ChartRow {
  row: number;
  fraction: string;
  glyphs: ChartGlyph[];
}

const FRACTIONS = [
  "20/200",
  "20/100",
  "20/70",
  "20/50",
  "20/40",
  "20/30",
  "20/25",
  "20/20",
  "20/15",
  "20/10",
];

export function fractionFor(index: number): string {
  return FRACTIONS[Math.min(index, FRACTIONS.length - 1)] ?? "20/10";
}

export function buildRows(
  letters: Letter[],
  results: Reading[],
  lensOn: ReadonlySet<string> = new Set(),
): ChartRow[] {
  const byRow = new Map<number, Letter[]>();
  for (const letter of letters) {
    const list = byRow.get(letter.row) ?? [];
    list.push(letter);
    byRow.set(letter.row, list);
  }
  return [...byRow.keys()]
    .sort((a, b) => a - b)
    .map((row, index) => ({
      row,
      fraction: fractionFor(index),
      glyphs: (byRow.get(row) ?? []).map((l) => ({
        id: l.id,
        glyph: l.glyph,
        name: l.name,
        state: letterState(l, results, lensOn.has(l.id)),
        lens: l.lens ? (lensOn.has(l.id) ? ("on" as const) : ("off" as const)) : undefined,
      })),
    }));
}

export function fractionOfLetter(rows: ChartRow[], id: string): string | null {
  for (const r of rows) {
    if (r.glyphs.some((g) => g.id === id)) return r.fraction;
  }
  return null;
}
