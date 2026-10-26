import { useEffect, useRef, useState } from "react";
import { isBroken } from "./types";
import type { LetterProps } from "./types";

export const CONFIRM_MS = 900;

export default function Optimistic({ variant }: LetterProps) {
  const [liked, setLiked] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function like() {
    setLiked(true);
    if (isBroken(variant)) {
      timer.current = window.setTimeout(() => setLiked(false), CONFIRM_MS);
    }
  }

  return (
    <div className="letter-widget">
      <p>Photo: Morning in the garden</p>
      <p className="letter-readout">Likes: {liked ? 6 : 5}</p>
      <button type="button" onClick={like} disabled={liked}>
        {liked ? "Liked" : "Like"}
      </button>
    </div>
  );
}
