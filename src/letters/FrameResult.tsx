import { useState } from "react";
import { isBroken } from "./types";
import type { LetterProps } from "./types";

function frameDoc(result: string) {
  return `<!doctype html><html><body style="margin:0;font:20px system-ui,sans-serif;background:#f4f6fb;color:#111;display:flex;align-items:center;justify-content:center;height:100vh">
<div><div style="font-size:14px;color:#555">Document check</div><div style="font-size:28px;font-weight:600">${result}</div></div></body></html>`;
}

export default function FrameResult({ variant }: LetterProps) {
  const [checked, setChecked] = useState(false);
  const result = isBroken(variant) ? "Declined" : "Approved";

  return (
    <div className="letter-widget">
      <div className="letter-row-gap">
        <button type="button" onClick={() => setChecked(true)}>
          Run check
        </button>
        <span className="letter-readout">Status: {checked ? "Approved" : "waiting"}</span>
      </div>
      {checked ? (
        <iframe
          className="letter-frame"
          sandbox=""
          srcDoc={frameDoc(result)}
          width={360}
          height={140}
        />
      ) : null}
    </div>
  );
}
