import type { GlyphState } from "../data/types";

export default function GlyphMark({
  glyph,
  state,
  large = false,
}: {
  glyph: string;
  state: GlyphState;
  large?: boolean;
}) {
  return (
    <span
      className={`glyph glyph--${state}${large ? " glyph--large" : ""}`}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
