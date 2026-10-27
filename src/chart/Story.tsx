import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { Link } from "react-router-dom";
import GlyphMark from "../components/GlyphMark";
import type { LensResult } from "../core/derive";
import type { ChartGlyph } from "../data/chart";
import { findReading, isCorrect, STATE_WORDS } from "../data/readings";
import type { GlyphState, Letter, Reading, Truth, Variant } from "../data/types";

export const STEP_LABELS = ["What this is", "A letter", "A lens", "Results"];
export const STEP_COUNT = STEP_LABELS.length;

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];
const TRUTH_WORDS: Record<Truth, string> = { pass: "Should pass", fail: "Should fail" };
const VERDICT_WORDS: Record<Reading["verdict"], string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
};
const SWIPE_PX = 48;

export interface StoryProps {
  step: number;
  onStep: (step: number) => void;
  ready: boolean;
  total: number;
  counts: Record<GlyphState, number>;
  misses: ChartGlyph[];
  subject: Letter | null;
  fraction: string | null;
  results: Reading[];
  subjectState: GlyphState;
  subjectLensState: GlyphState;
  lens: LensResult;
  lensOn: boolean;
  demoLens: boolean;
  onToggleLens: () => void;
  running: boolean;
  canRun: boolean;
  onDemo: (run: boolean) => void;
  paused: boolean;
  onPause: () => void;
}

function twinUrl(id: string, variant: Variant): string {
  return `${import.meta.env.BASE_URL}#/l/${id}/${variant}`;
}

function TwinMini({
  letter,
  variant,
  title,
  truth,
  results,
  live,
}: {
  letter: Letter;
  variant: Variant;
  title: string;
  truth: Truth;
  results: Reading[];
  live: boolean;
}) {
  const reading = findReading(results, letter.id, variant);
  let judgement = "Not read yet";
  let kind = "unread";
  if (reading) {
    if (reading.verdict === "blocked") {
      judgement = "Could not test it";
      kind = "blocked";
    } else if (isCorrect(reading)) {
      judgement = "Read correctly";
      kind = "read";
    } else {
      judgement = "Misread";
      kind = "misread";
    }
  }
  return (
    <figure className={`twin-mini twin-mini--${variant}`} data-testid={`story-twin-${variant}`}>
      <figcaption>
        <strong>{title}</strong>
        <span>{TRUTH_WORDS[truth]}</span>
      </figcaption>
      <div className="twin-mini-frame">
        {live && (
          <iframe
            src={twinUrl(letter.id, variant)}
            title={`${letter.name}, ${title.toLowerCase()} twin`}
            tabIndex={-1}
          />
        )}
      </div>
      <p className="twin-mini-verdict" data-judgement={kind} data-testid={`story-twin-${variant}-verdict`}>
        {reading ? (
          <>
            TestSprite: {VERDICT_WORDS[reading.verdict]}. <b>{judgement}</b>
          </>
        ) : (
          <b>{judgement}</b>
        )}
      </p>
    </figure>
  );
}

export default function Story(p: StoryProps) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [twinsLive, setTwinsLive] = useState(false);
  useEffect(() => {
    if (p.step !== 1 || twinsLive) return;
    const timer = window.setTimeout(() => setTwinsLive(true), 0);
    return () => window.clearTimeout(timer);
  }, [p.step, twinsLive]);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    const t = e.changedTouches[0];
    touch.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    p.onStep(Math.min(STEP_COUNT - 1, Math.max(0, p.step + (dx < 0 ? 1 : -1))));
  };

  const state = (i: number) => (i === p.step ? "active" : i < p.step ? "before" : "after");
  const s = p.subject;
  const missWords = `${p.counts.misread} misread, ${p.counts.blocked} blocked, ${p.counts.unread} not read yet.`;

  return (
    <section className="story" aria-label="The exam in four steps" data-step={p.step + 1}>
      <div className="story-bar">
        <ol className="story-dots" aria-label="Steps">
          {STEP_LABELS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                aria-current={i === p.step ? "step" : undefined}
                onClick={() => p.onStep(i)}
                data-testid={`step-dot-${i + 1}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="story-panels" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <article className="story-panel" data-state={state(0)} data-testid="step-1">
          <p className="story-kicker">What this is</p>
          <h2 className="story-head display">An eye exam for an AI tester</h2>
          <p className="story-line" data-testid="tagline">
            We built {p.total} web widgets twice: one works, one is broken. TestSprite&rsquo;s AI
            tester checks both. The chart shows what it saw right and what it missed.
          </p>
          <p className="story-line story-line--quiet" data-testid="what-testsprite">
            TestSprite is an AI testing agent: it opens a web page, uses it like a person would,
            and reports pass or fail.
          </p>
          <ul className="legend" aria-label="What the marks mean">
            {LEGEND.map((st) => (
              <li key={st}>
                <GlyphMark glyph="E" state={st} />
                {STATE_WORDS[st]}
              </li>
            ))}
          </ul>
        </article>

        <article className="story-panel" data-state={state(1)} data-testid="step-2">
          {s ? (
            <>
              <p className="story-kicker">
                Letter {s.glyph}{p.fraction ? `, row ${p.fraction}` : ""}: {s.name}
              </p>
              <h2 className="story-head display">One letter, two twins</h2>
              <p className="story-line">{s.trap}</p>
              <div className="twin-pair" data-testid="story-twins">
                <TwinMini letter={s} variant="works" title="Works" truth="pass" results={p.results} live={twinsLive} />
                <TwinMini letter={s} variant="broken" title="Broken" truth="fail" results={p.results} live={twinsLive} />
              </div>
              <Link to={`/letter/${s.id}`} className="story-link" data-testid="story-open-station">
                TestSprite&rsquo;s own words on {s.name}
              </Link>
            </>
          ) : (
            <p className="story-line">No letters on the chart yet.</p>
          )}
        </article>

        <article className="story-panel" data-state={state(2)} data-testid="step-3">
          {s?.lens ? (
            <>
              <p className="story-kicker">
                Lens on {s.glyph}: {s.lens.name}
              </p>
              <h2 className="story-head display">A lens is a small code change</h2>
              <p className="story-line">{s.lens.summary}</p>
              <div
                className="lens-proof"
                data-on={String(p.lensOn || p.demoLens)}
                data-testid="story-lens"
              >
                <span className="lens-proof-side">
                  <GlyphMark glyph={s.glyph} state={p.subjectState} />
                  {STATE_WORDS[p.subjectState]}
                </span>
                <span className="lens-arrow" aria-hidden="true">
                  &rarr;
                </span>
                <span className="lens-proof-side lens-proof-after">
                  <GlyphMark glyph={s.glyph} state={p.subjectLensState} />
                  {p.lens === "none" ? "Not measured" : STATE_WORDS[p.subjectLensState]}
                </span>
              </div>
              <div className="story-actions">
                <button
                  type="button"
                  className="button"
                  aria-pressed={p.lensOn}
                  onClick={p.onToggleLens}
                  data-testid="story-lens-toggle"
                >
                  {p.lensOn ? "Lens is on" : "Turn the lens on"}
                </button>
                <Link
                  to={`/letter/${s.id}?pane=lens&focus=lens`}
                  className="story-link"
                  data-testid="story-lens-code"
                >
                  See the code change
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="story-head display">A lens is a small code change</h2>
              <p className="story-line">
                For a misread letter we change a few lines of the twin TestSprite got wrong and test
                it again. {s ? `${s.name} has no lens yet.` : ""}
              </p>
            </>
          )}
        </article>

        <article className="story-panel" data-state={state(3)} data-testid="step-4">
          <p className="story-kicker">The recorded run</p>
          <h2 className="story-head display" data-testid="story-score">
            {p.ready ? `${p.counts.read} of ${p.total} read correctly` : "Loading the readings"}
          </h2>
          <p className="story-line">
            {p.ready ? missWords : ""} Every number on this page comes from one recorded run.
          </p>
          {p.misses.length > 0 && (
            <ul className="miss-list" aria-label="Letters TestSprite missed" data-testid="story-misses">
              {p.misses.map((g) => (
                <li key={g.id}>
                  <Link to={`/letter/${g.id}`} data-testid={`miss-link-${g.id}`}>
                    <GlyphMark glyph={g.glyph} state={g.state} />
                    {g.name}
                    <span className="miss-state">{STATE_WORDS[g.state]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="story-line story-line--quiet">
            Turn a lens under the chart to see what each fix changes. Click any letter for
            TestSprite&rsquo;s own words.
          </p>
        </article>
      </div>
      <nav className="story-nav" aria-label="Step navigation">
        <button
          type="button"
          onClick={() => p.onStep(Math.max(0, p.step - 1))}
          disabled={p.step === 0}
          data-testid="step-prev"
        >
          Back
        </button>
        <span className="story-count" data-testid="step-count">
          {p.step + 1} of {STEP_COUNT}
        </span>
        <button
          type="button"
          onClick={() => p.onStep(Math.min(STEP_COUNT - 1, p.step + 1))}
          disabled={p.step === STEP_COUNT - 1}
          data-testid="step-next"
        >
          Next
        </button>
        <span className="story-tools">
          {p.canRun && (
            <button
              type="button"
              className="quiet-toggle"
              aria-pressed={p.running}
              onClick={() => p.onDemo(!p.running)}
              data-testid="demo-toggle"
            >
              {p.running ? "Stop the demo" : "Replay the demo"}
            </button>
          )}
          <button
            type="button"
            className="quiet-toggle"
            aria-pressed={p.paused}
            onClick={p.onPause}
            data-testid="motion-toggle"
          >
            {p.paused ? "Motion paused" : "Pause motion"}
          </button>
        </span>
      </nav>
    </section>
  );
}
