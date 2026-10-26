import { useState } from "react";
import type { LetterProps } from "./types";

export const CODE = "TRIAL7";

export function clean(s: string) {
  return s.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

export default function ZeroWidthCode({ variant }: LetterProps) {
  const broken = variant === "broken";
  const shown = broken ? "TRIAL\u200B7" : CODE;
  const [entry, setEntry] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function apply() {
    const value = broken ? entry.trim() : clean(entry);
    setResult(
      value === CODE
        ? { ok: true, text: "Trial: 7 days added" }
        : { ok: false, text: "Code not recognised" },
    );
  }

  return (
    <div className="letter-widget">
      <p className="letter-readout">Your access code: {shown}</p>
      <div className="letter-row-gap">
        <label htmlFor="access-code">Enter code</label>
        <input
          id="access-code"
          className="letter-field"
          value={entry}
          onChange={(e) => setEntry(e.currentTarget.value)}
        />
        <button type="button" onClick={apply}>
          Apply
        </button>
      </div>
      <p className={`letter-readout ${result?.ok ? "letter-ok" : "letter-error"}`}>
        {result?.text ?? ""}
      </p>
    </div>
  );
}
