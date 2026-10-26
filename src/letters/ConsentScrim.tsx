import { useEffect, useRef, useState } from "react";
import { isBroken, hasLens } from "./types";
import type { LetterProps } from "./types";

export default function ConsentScrim({ variant }: LetterProps) {
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState(1);
  const page = useRef<HTMLDivElement>(null);
  const lens = hasLens(variant);
  const layerShown = !accepted || isBroken(variant);

  useEffect(() => {
    const el = page.current;
    if (!el) return;
    if (lens && layerShown) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [lens, layerShown]);

  return (
    <div className="letter-widget">
      <div ref={page}>
        <p className="letter-readout">Step {step} of 3</p>
        <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}>
          Continue
        </button>
      </div>
      {layerShown ? (
        <div
          className={`letter-scrim${accepted ? " letter-scrim-faded" : ""}`}
          role={lens ? "dialog" : undefined}
          aria-modal={lens ? true : undefined}
          aria-labelledby={lens ? "consent-text" : undefined}
        >
          <div className="letter-consent">
            <span id={lens ? "consent-text" : undefined}>We use cookies to remember your settings.</span>
            <button type="button" onClick={() => setAccepted(true)}>
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
