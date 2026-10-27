import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { findReading, isCorrect, STATE_WORDS } from "../data/readings";
import type { GlyphState, Letter, Reading, Truth, Variant } from "../data/types";
import GlyphMark from "../components/GlyphMark";
import Diff from "../station/Diff";

export const DEMO_STEPS = ["Twins", "Press", "Verdict", "Lens", "Fixed"] as const;
export const DEMO_HOLD_MS = [900, 1700, 1500, 1400, 2500] as const;
const END = DEMO_STEPS.length;

interface Run {
  started: boolean;
  phase: number;
  running: boolean;
}

const TRUTH_WORDS: Record<Truth, string> = { pass: "Should pass", fail: "Should fail" };
const VERDICT_WORDS: Record<Reading["verdict"], string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
};

function judge(r: Reading | null): { word: string; kind: string } {
  if (!r) return { word: "Not read yet", kind: "unread" };
  if (r.verdict === "blocked") return { word: "Could not test it", kind: "blocked" };
  return isCorrect(r) ? { word: "Read correctly", kind: "read" } : { word: "Misread", kind: "misread" };
}

export function shortReason(reason: string): string {
  const m = reason.match(/TEST (?:FAILURE|BLOCKED)\s*\n+\s*([^\n]+)/);
  const line = (m?.[1] ?? reason.split(/(?<=[.!?])\s/)[0] ?? "").trim();
  return line.length > 150 ? `${line.slice(0, 147).trimEnd()}…` : line;
}

function TwinCard({
  letter,
  side,
  phase,
  results,
}: {
  letter: Letter;
  side: "works" | "broken";
  phase: number;
  results: Reading[];
}) {
  const plain = findReading(results, letter.id, side);
  const lens = findReading(results, letter.id, "lens");
  const lensBroken = findReading(results, letter.id, "lens-broken");
  const lensed: Reading | null =
    side === "works" ? (lens?.truth === "pass" ? lens : null) : (lensBroken ?? (lens?.truth === "fail" ? lens : null));
  const withLens = phase >= 3 && lensed !== null;
  const reading = withLens ? lensed : plain;
  const variant: Variant = withLens ? lensed.variant : side;
  const truth: Truth = side === "works" ? "pass" : "fail";
  const j = judge(reading);
  const screen = useRef<HTMLDivElement>(null);
  const { Component } = letter;

  useEffect(() => {
    if (phase !== 1 && phase !== 4) return;
    const id = window.setTimeout(() => screen.current?.querySelector<HTMLButtonElement>("button")?.click(), 260);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div
      className={`demo-twin demo-twin--${side}`}
      data-pressing={phase === 1 || undefined}
      data-lens={withLens || undefined}
      data-testid={`demo-${side}`}
    >
      <h3 className="demo-twin-title">
        {side === "works" ? "Works" : "Broken"}
        {withLens ? " + lens" : ""}
      </h3>
      <div className="demo-screen" data-ui ref={screen}>
        <Component key={variant} variant={variant} />
      </div>
      <dl className="demo-reading" data-shown={phase >= 2 || undefined} data-kind={j.kind}>
        <div className="demo-truth">
          <dt>Truth</dt>
          <dd>{TRUTH_WORDS[truth]}</dd>
        </div>
        <div className="demo-verdict">
          <dt>TestSprite</dt>
          <dd>{reading ? VERDICT_WORDS[reading.verdict] : "Not read yet"}</dd>
        </div>
        <div className="demo-verdict">
          <dt>Result</dt>
          <dd className={`judgement judgement--${j.kind}`} data-testid={`demo-${side}-judgement`}>
            {j.word}
          </dd>
        </div>
      </dl>
      {reading?.reason && (
        <p className="demo-quote" data-shown={phase >= 2 || undefined}>
          “{shortReason(reading.reason)}”
        </p>
      )}
    </div>
  );
}

export default function Demo({
  letter,
  fraction,
  state,
  results,
  autoplay,
  halt,
  still,
  onLens,
}: {
  letter: Letter;
  fraction: string | null;
  state: GlyphState;
  results: Reading[];
  autoplay: boolean;
  halt: boolean;
  still: boolean;
  onLens: (on: boolean) => void;
}) {
  const [run, setRun] = useState<Run>({ started: false, phase: still ? END : 0, running: false });
  const swipe = useRef<number | null>(null);
  const lens = letter.lens;

  if (autoplay && !still && !run.started) setRun({ started: true, phase: 0, running: true });
  if (halt && run.running) setRun({ ...run, running: false });

  const { phase } = run;
  const playing = run.running && !halt && phase < END;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(
      () =>
        setRun((r) => {
          const next = Math.min(END, r.phase + 1);
          return { ...r, phase: next, running: next < END };
        }),
      DEMO_HOLD_MS[phase],
    );
    return () => window.clearTimeout(id);
  }, [playing, phase]);

  useEffect(() => {
    onLens(playing && (phase === 3 || phase === 4));
  }, [onLens, playing, phase]);

  useEffect(() => () => onLens(false), [onLens]);

  const stop = useCallback(() => setRun({ started: true, phase: END, running: false }), []);
  const replay = useCallback(
    () => setRun({ started: true, phase: still ? END : 0, running: !still }),
    [still],
  );
  const step = useCallback(
    (to: number) => setRun({ started: true, phase: Math.max(0, Math.min(END, to)), running: false }),
    [],
  );

  const onKey = (e: ReactKeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "ArrowRight") step(phase + 1);
    else if (e.key === "ArrowLeft") step(phase - 1);
    else if (e.key === "Escape" && playing) stop();
    else return;
    e.preventDefault();
  };
  const onDown = (e: ReactPointerEvent) => {
    swipe.current = e.pointerType === "mouse" ? null : e.clientX;
  };
  const onUp = (e: ReactPointerEvent) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (dx < -40) step(phase + 1);
    else if (dx > 40) step(phase - 1);
  };

  const shownState: GlyphState = phase >= 4 && letter.lens ? "read" : state;
  const fixed = phase >= 4 && findReading(results, letter.id, "lens") !== null;

  return (
    <section
      className="demo"
      aria-label="How one letter is read"
      data-testid="demo"
      data-phase={phase}
      data-playing={playing ? "true" : "false"}
      tabIndex={-1}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      <header className="demo-head">
        <GlyphMark glyph={letter.glyph} state={shownState} />
        <div className="demo-titles">
          <h2 className="demo-title">
            <Link to={`/letter/${letter.id}`} data-testid="demo-open">
              {letter.name}
            </Link>
          </h2>
          <p className="demo-meta">
            {fraction ? `Row ${fraction}. ` : ""}
            {letter.trap}
          </p>
        </div>
        <p className="demo-word" data-kind={fixed ? "fixed" : state} data-testid="demo-state">
          {fixed ? "Fixed with lens" : STATE_WORDS[state]}
        </p>
      </header>
      <div className="demo-twins">
        <TwinCard letter={letter} side="works" phase={phase} results={results} />
        <TwinCard letter={letter} side="broken" phase={phase} results={results} />
      </div>
      {lens && (
        <div className="demo-lens" data-shown={phase >= 3 || undefined} data-testid="demo-lens">
          <p className="demo-lens-name">
            Lens: {lens.name}
            <Link to={`/letter/${letter.id}?pane=lens&focus=lens`} data-testid="demo-lens-open">
              Open the lens
            </Link>
          </p>
          <Diff diff={lens.diff} />
        </div>
      )}
      <footer className="demo-bar">
        <div className="demo-steps" role="group" aria-label="Steps">
          {DEMO_STEPS.map((name, i) => (
            <button
              key={name}
              type="button"
              className="demo-step"
              aria-label={name}
              aria-current={phase === i || (phase >= END && i === END - 1) ? "step" : undefined}
              data-done={phase > i || undefined}
              onClick={() => step(i)}
            />
          ))}
        </div>
        {playing ? (
          <button type="button" className="demo-control" onClick={stop} data-testid="demo-stop">
            Stop
          </button>
        ) : (
          <button type="button" className="demo-control" onClick={replay} data-testid="demo-replay">
            Replay
          </button>
        )}
      </footer>
    </section>
  );
}
