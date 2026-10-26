import { useState } from "react";
import { isBroken } from "./types";
import type { LetterProps } from "./types";

export default function Counter({ variant }: LetterProps) {
  const [count, setCount] = useState(0);
  const step = isBroken(variant) ? 2 : 1;
  return (
    <div className="letter-widget">
      <p className="letter-readout" aria-live="polite">
        Count: {count}
      </p>
      <button type="button" onClick={() => setCount((c) => c + step)}>
        Add one
      </button>
    </div>
  );
}
