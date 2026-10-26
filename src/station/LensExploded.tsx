import { useEffect, useState } from "react";
import { findReading, isCorrect } from "../data/readings";
import type { Lens, Reading } from "../data/types";
import Diff from "./Diff";
import ReadingCard from "./ReadingCard";

function verdictLine(reading: Reading | null): { word: string; kind: string } {
  if (!reading) return { word: "Not read yet", kind: "unread" };
  if (reading.verdict === "blocked") return { word: "Could not test it", kind: "blocked" };
  return isCorrect(reading) ? { word: "Read correctly", kind: "read" } : { word: "Misread", kind: "misread" };
}

export default function LensExploded({
  letterId,
  lens,
  results,
  still,
  lensUrl,
  replaces,
}: {
  letterId: string;
  lens: Lens;
  results: Reading[];
  still: boolean;
  lensUrl: string;
  replaces: "works" | "broken";
}) {
  const [open, setOpen] = useState(still);
  useEffect(() => {
    if (still) return;
    const id = window.setTimeout(() => setOpen(true), 300);
    return () => window.clearTimeout(id);
  }, [still]);
  const before = verdictLine(findReading(results, letterId, replaces));
  const shown = open;
  const twinName = replaces === "works" ? "Works twin" : "Broken twin";

  return (
    <div className="explode" data-open={shown} data-testid="lens-exploded">
      <div className="explode-head">
        <p className="explode-equation">
          {twinName} <span>+</span> lens <span>=</span> lens twin
        </p>
        <button
          type="button"
          className="explode-toggle"
          aria-pressed={shown}
          onClick={() => setOpen(!shown)}
          data-testid="lens-explode"
        >
          {shown ? "Assemble the lens" : "Explode the lens"}
        </button>
      </div>
      <div className="explode-plates">
        <section className="plate plate--before" aria-label="Before the lens">
          <h3 className="plate-label">{twinName}, as read</h3>
          <p className={`plate-verdict judgement--${before.kind}`} data-testid="lens-before">
            TestSprite: {before.word}
          </p>
        </section>
        <span className="plate-joint" aria-hidden="true">
          +
        </span>
        <section className="plate plate--lens" aria-label="The code change">
          <h3 className="plate-label">The lens, its real code change</h3>
          <Diff diff={lens.diff} />
        </section>
        <span className="plate-joint" aria-hidden="true">
          =
        </span>
        <section className="plate plate--after" aria-label="After the lens">
          <div className="twin-head">
            <h3 className="plate-label">Lens twin</h3>
            <a href={lensUrl} target="_blank" rel="noreferrer" data-testid="open-lens">
              Open alone
            </a>
          </div>
          <ReadingCard letterId={letterId} variant="lens" results={results} />
        </section>
      </div>
    </div>
  );
}
