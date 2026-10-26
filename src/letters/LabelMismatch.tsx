import { useState } from "react";
import type { LetterProps } from "./types";

export const DRAFT = "Agenda: review the garden plan";

export default function LabelMismatch({ variant }: LetterProps) {
  const [draft, setDraft] = useState(DRAFT);
  const [status, setStatus] = useState("");

  function discard() {
    setDraft("");
    setStatus("Discarded");
  }

  return (
    <div className="letter-widget">
      <label htmlFor="draft">Draft</label>
      <textarea
        id="draft"
        className="letter-draft"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
      />
      <div className="letter-row-gap">
        {variant === "broken" ? (
          <button type="button" aria-label="Discard changes" onClick={discard}>
            Save
          </button>
        ) : (
          <button type="button" aria-label="Save draft" onClick={() => setStatus("Saved")}>
            Save
          </button>
        )}
        <button type="button" onClick={discard}>
          Discard
        </button>
      </div>
      <p className="letter-readout" role="status">
        {status}
      </p>
    </div>
  );
}
