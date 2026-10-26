import type { GlyphState } from "../data/types";
import { markFor } from "../core/derive";
import type { LensResult } from "../core/derive";

export default function LensGlyph({
  glyph,
  state,
  lens,
  lensOn,
}: {
  glyph: string;
  state: GlyphState;
  lens: LensResult;
  lensOn: boolean;
}) {
  const { ghost, mark } = markFor(state, lens, lensOn);
  const outlined = lensOn && lens === "notFixed";
  return (
    <span
      className={`lens-glyph lens-glyph--${state}`}
      data-testid="station-glyph"
      data-mark={mark}
      data-ghost={ghost ? "apart" : "fused"}
      data-outline={outlined ? "lens" : undefined}
      aria-hidden="true"
    >
      <span className="lens-glyph-ghost">{glyph}</span>
      <span className="lens-glyph-base">{glyph}</span>
      <svg className="lens-glyph-mark" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g className="lens-glyph-slash">
          <path className="lens-glyph-key" d="M12 84 88 16" />
          <path d="M12 84 88 16" />
        </g>
        <g className="lens-glyph-tick">
          <path className="lens-glyph-key" d="M30 54 44 68 72 34" />
          <path d="M30 54 44 68 72 34" />
        </g>
      </svg>
    </span>
  );
}
