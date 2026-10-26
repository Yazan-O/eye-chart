import { useState } from "react";
import type { LetterProps } from "./types";

export default function LeftoverError({ variant }: LetterProps) {
  const [saved, setSaved] = useState(false);
  const broken = variant === "broken";

  return (
    <div className="letter-widget">
      <p>Profile: display name and time zone</p>
      {broken ? (
        <p className="letter-readout letter-error" style={{ opacity: 0 }}>
          Error: save failed
        </p>
      ) : null}
      <p className="letter-readout">Last saved: {saved ? "just now" : "never"}</p>
      <button type="button" onClick={() => setSaved(!broken)}>
        Save
      </button>
    </div>
  );
}
