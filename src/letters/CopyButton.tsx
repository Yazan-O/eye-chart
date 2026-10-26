import { useState } from "react";
import type { LetterProps } from "./types";

export const DEMO_CODE = "DEMO-4821";

export default function CopyButton({ variant }: LetterProps) {
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");

  async function copy() {
    if (variant !== "broken") await navigator.clipboard.writeText(DEMO_CODE);
    setCopied(true);
  }

  return (
    <div className="letter-widget">
      <p className="letter-readout">Invite code: {DEMO_CODE}</p>
      <div className="letter-row-gap">
        <button type="button" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="letter-row-gap">
        <label htmlFor="paste-box">Paste here</label>
        <input
          id="paste-box"
          className="letter-field"
          value={pasted}
          onChange={(e) => setPasted(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
