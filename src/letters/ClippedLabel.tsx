import type { LetterProps } from "./types";

export const NOTICE = "Free trial ends today";

export default function ClippedLabel({ variant }: LetterProps) {
  return (
    <div className="letter-widget">
      <div className={`letter-notice${variant === "broken" ? " letter-notice-clipped" : ""}`}>
        {NOTICE}
      </div>
    </div>
  );
}
