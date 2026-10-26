import { useEffect, useRef, useState } from "react";
import type { LetterProps } from "./types";

export const TOTAL = 1250;
export const ANIMATION_MS = 3000;

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function AnimatedTotal({ variant }: LetterProps) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const target = variant === "broken" ? 1205 : TOTAL;

  useEffect(() => () => cancelAnimationFrame(frame.current ?? 0), []);

  function load() {
    cancelAnimationFrame(frame.current ?? 0);
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  return (
    <div className="letter-widget">
      <p className="letter-readout letter-big">
        Total: {value.toLocaleString("en-US")}
      </p>
      <button type="button" onClick={load}>
        Load total
      </button>
    </div>
  );
}
