import { useState } from "react";
import type { LetterProps } from "./types";

export default function ConsentScrim({ variant }: LetterProps) {
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState(1);
  const broken = variant === "broken";

  return (
    <div className="letter-widget">
      <p className="letter-readout">Step {step} of 3</p>
      <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}>
        Continue
      </button>
      {!accepted || broken ? (
        <div className={`letter-scrim${accepted ? " letter-scrim-faded" : ""}`}>
          <div className="letter-consent">
            <span>We use cookies to remember your settings.</span>
            <button type="button" onClick={() => setAccepted(true)}>
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
