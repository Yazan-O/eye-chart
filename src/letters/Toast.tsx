import { useEffect, useRef, useState } from "react";
import type { LetterProps } from "./types";

export const TOAST_MS = 1500;

export default function Toast({ variant }: LetterProps) {
  const [shown, setShown] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function save() {
    if (variant === "broken") return;
    window.clearTimeout(timer.current);
    setShown(true);
    setSaved(true);
    timer.current = window.setTimeout(() => setShown(false), TOAST_MS);
  }

  return (
    <div className="letter-widget">
      <p>Draft: Quarterly notes</p>
      <button type="button" onClick={save}>
        Save
      </button>
      <div className="letter-toast-slot" role="status">
        {shown ? <span className="letter-toast">Saved</span> : null}
        {variant === "lens" && saved && !shown ? <span className="letter-sr">Saved</span> : null}
      </div>
    </div>
  );
}
