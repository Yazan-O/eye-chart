import { findReading, isCorrect } from "../data/readings";
import type { Reading, Truth, Variant } from "../data/types";

const VERDICT_WORDS: Record<Reading["verdict"], string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
};

const TRUTH_WORDS: Record<Truth, string> = {
  pass: "Should pass",
  fail: "Should fail",
};

function judgement(reading: Reading): { word: string; kind: string } {
  if (reading.verdict === "blocked") return { word: "Could not test it", kind: "blocked" };
  return isCorrect(reading)
    ? { word: "Read correctly", kind: "read" }
    : { word: "Misread", kind: "misread" };
}

export default function ReadingCard({
  letterId,
  variant,
  expected,
  results,
}: {
  letterId: string;
  variant: Variant;
  expected?: Truth;
  results: Reading[];
}) {
  const reading = findReading(results, letterId, variant);
  const base = `${import.meta.env.BASE_URL}`;
  const prefix = `reading-${variant}`;

  if (!reading) {
    return (
      <div className="reading" data-testid={prefix}>
        <dl className="reading-facts">
          {expected && (
            <div>
              <dt>Truth</dt>
              <dd data-testid={`${prefix}-truth`}>{TRUTH_WORDS[expected]}</dd>
            </div>
          )}
          <div>
            <dt>TestSprite</dt>
            <dd data-testid={`${prefix}-verdict`}>Not read yet</dd>
          </div>
        </dl>
      </div>
    );
  }

  const j = judgement(reading);
  return (
    <div className="reading" data-testid={prefix} data-judgement={j.kind}>
      <dl className="reading-facts">
        <div>
          <dt>Truth</dt>
          <dd data-testid={`${prefix}-truth`}>{TRUTH_WORDS[reading.truth]}</dd>
        </div>
        <div>
          <dt>TestSprite</dt>
          <dd data-testid={`${prefix}-verdict`}>{VERDICT_WORDS[reading.verdict]}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd className={`judgement judgement--${j.kind}`} data-testid={`${prefix}-judgement`}>
            {j.word}
          </dd>
        </div>
      </dl>
      {reading.reason && (
        <figure className="reason">
          <blockquote data-testid={`${prefix}-reason`}>{reading.reason}</blockquote>
          <figcaption>TestSprite&rsquo;s own words</figcaption>
        </figure>
      )}
      {reading.screenshot && (
        <a
          className="shot"
          href={`${base}${reading.screenshot}`}
          target="_blank"
          rel="noreferrer"
          data-testid={`${prefix}-screenshot`}
        >
          <img
            src={`${base}${reading.screenshot}`}
            alt={`What TestSprite saw on the ${variant} twin`}
            loading="lazy"
          />
        </a>
      )}
    </div>
  );
}
