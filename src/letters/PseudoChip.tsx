import { isBroken } from "./types";
import type { LetterProps } from "./types";

export default function PseudoChip({ variant }: LetterProps) {
  const done = isBroken(variant) ? 2 : 3;
  return (
    <div className="letter-widget">
      <div className="letter-row-gap">
        <span className="letter-readout">Setup: {done} of 3 steps</span>
        <span className="letter-chip letter-chip-done" />
      </div>
    </div>
  );
}
