import { isBroken } from "./types";
import type { LetterProps } from "./types";

export const NOTICE = "Free trial ends today";

export default function ClippedLabel({ variant }: LetterProps) {
  return (
    <div className="letter-widget">
      <div className={`letter-notice${isBroken(variant) ? " letter-notice-clipped" : ""}`}>
        {NOTICE}
      </div>
    </div>
  );
}
