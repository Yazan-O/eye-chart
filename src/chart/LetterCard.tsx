import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { findReading, isCorrect, letterState, STATE_WORDS } from "../data/readings";
import type { GlyphState, Letter, Reading, Truth, Variant } from "../data/types";
import GlyphMark from "../components/GlyphMark";
import Diff from "../station/Diff";

export const CARD_HOLD_MS = import.meta.env.MODE === "test" ? 700 : 4800;

export interface KeyRow {
  name: string;
  truth: string;
  said: string;
  mark: "right" | "wrong" | "blocked" | "unread";
  word: string;
}

interface Step {
  kind: "works" | "broken" | "verdict" | "lens" | "after";
  title: string;
  line: string;
  variant?: Variant;
  reading: Reading | null;
  diff?: string;
  rows?: KeyRow[];
  bold?: string;
}

function said(r: Reading): string {
  return { passed: "passed", failed: "failed", blocked: "blocked" }[r.verdict];
}

function keyRow(name: string, truth: Truth, r: Reading | null): KeyRow {
  const base = { name, truth: truth === "pass" ? "should pass" : "should fail" };
  if (!r) return { ...base, said: "not read yet", mark: "unread", word: "" };
  if (r.verdict === "blocked") return { ...base, said: "could not test it", mark: "blocked", word: "" };
  if (isCorrect(r)) return { ...base, said: `TestSprite said ${said(r)}`, mark: "right", word: "right" };
  return {
    ...base,
    said: `TestSprite said ${said(r)}`,
    mark: "wrong",
    word: truth === "fail" ? "missed the bug" : "wrong",
  };
}

function boldFor(state: GlyphState): string {
  return {
    read: "TestSprite read this letter right.",
    misread: "TestSprite read this letter wrong.",
    blocked: "TestSprite could not test this letter.",
    unread: "TestSprite has not read this letter yet.",
  }[state];
}

export function buildSteps(letter: Letter, results: Reading[], state: GlyphState): Step[] {
  const works = findReading(results, letter.id, "works");
  const broken = findReading(results, letter.id, "broken");
  const steps: Step[] = [
    { kind: "works", title: "Works", line: `This version works. ${letter.howToUse}`, variant: "works", reading: works },
    {
      kind: "broken",
      title: "Broken",
      line: `This version is broken. ${letter.brokenBehaviour}`,
      variant: "broken",
      reading: broken,
    },
    {
      kind: "verdict",
      title: "Verdict",
      line: "Every letter on the chart is scored this way.",
      reading: null,
      rows: [keyRow("Working version", "pass", works), keyRow("Broken version", "fail", broken)],
      bold: boldFor(state),
    },
  ];
  if (!letter.lens || state === "read") return steps;
  const lens = findReading(results, letter.id, "lens");
  const lensBroken = findReading(results, letter.id, "lens-broken");
  steps.push({
    kind: "lens",
    title: "The fix",
    line: "Can we help it see? Yes: a lens, a tiny code change that lets the AI see the widget. The widget itself does not change.",
    reading: null,
    diff: letter.lens.diff,
  });
  const after = lens ?? lensBroken;
  const fixedRows = [
    keyRow("Working version, with the lens", "pass", lens),
    keyRow("Broken version, with the lens", "fail", lensBroken ?? (lens?.truth === "fail" ? lens : broken)),
  ];
  const fixed = letterState(letter, results, true) === "read";
  steps.push({
    kind: "after",
    title: "Result",
    line: after ? "Same test, same agent, lens on." : "The lens has not been measured yet.",
    variant: after?.variant ?? "lens",
    reading: after,
    rows: after ? fixedRows : undefined,
    bold: after ? (fixed ? "Fixed with the lens." : "Still wrong with the lens.") : undefined,
  });
  return steps;
}

export default function LetterCard({
  letter,
  state,
  results,
  playing,
  onStop,
  onLens,
  onMark,
}: {
  letter: Letter;
  state: GlyphState;
  results: Reading[];
  playing: boolean;
  onStop: () => void;
  onLens: (on: boolean) => void;
  onMark: (id: string) => void;
}) {
  const steps = useMemo(() => buildSteps(letter, results, state), [letter, results, state]);
  const [at, setAt] = useState(0);
  const screen = useRef<HTMLDivElement>(null);
  const swipe = useRef<number | null>(null);
  const last = steps.length - 1;
  const step = steps[Math.min(at, last)] ?? steps[0]!;
  const { Component } = letter;

  useEffect(() => {
    if (!playing || at >= last) return;
    const id = window.setTimeout(() => setAt((s) => Math.min(last, s + 1)), CARD_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [playing, at, last]);

  useEffect(() => {
    if (!step.variant) return;
    const id = window.setTimeout(() => screen.current?.querySelector<HTMLButtonElement>("button")?.click(), 500);
    return () => window.clearTimeout(id);
  }, [step]);

  const lensOn = step.kind === "lens" || step.kind === "after";
  useEffect(() => {
    onLens(lensOn);
  }, [onLens, lensOn]);
  useEffect(() => () => onLens(false), [onLens]);
  useEffect(() => {
    if (step.kind === "verdict" || step.kind === "after") onMark(letter.id);
  }, [step.kind, letter.id, onMark]);

  const go = useCallback(
    (to: number) => {
      onStop();
      setAt(Math.max(0, Math.min(last, to)));
    },
    [last, onStop],
  );

  const onKey = (e: ReactKeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "ArrowRight") go(at + 1);
    else if (e.key === "ArrowLeft") go(at - 1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };
  const onDown = (e: ReactPointerEvent) => {
    onStop();
    swipe.current = e.pointerType === "mouse" ? null : e.clientX;
  };
  const onUp = (e: ReactPointerEvent) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (dx < -40) go(at + 1);
    else if (dx > 40) go(at - 1);
  };

  const fixed = step.kind === "after" && step.reading !== null && letterState(letter, results, true) === "read";
  const headState: GlyphState = fixed ? "read" : state;

  return (
    <section
      className="card"
      aria-label={`${letter.name}, step by step`}
      data-testid="letter-card"
      data-letter-id={letter.id}
      data-step={step.kind}
      data-at={at}
      data-playing={playing && at < last ? "true" : "false"}
      tabIndex={-1}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      <header className="card-head">
        <GlyphMark glyph={letter.glyph} state={headState} />
        <div className="card-titles">
          <h2 className="card-name" data-testid="card-name">
            {letter.name}
          </h2>
          <p className="card-trap">{letter.trap}</p>
        </div>
        <p className="card-state" data-kind={fixed ? "fixed" : state} data-testid="card-state">
          {fixed ? "Fixed with lens" : STATE_WORDS[state]}
        </p>
      </header>

      <div className="card-tabs" role="tablist" aria-label="Steps">
        {steps.map((s, i) => (
          <button
            key={s.kind}
            type="button"
            role="tab"
            className="card-tab"
            aria-selected={i === at}
            aria-current={i === at ? "step" : undefined}
            onClick={() => go(i)}
            data-testid={`card-tab-${s.kind}`}
          >
            {s.title}
          </button>
        ))}
      </div>
      {step.diff ? (
        <div className="card-diff" data-testid="card-lens">
          <Diff diff={step.diff} />
        </div>
      ) : step.rows ? (
        <div className="card-key" data-testid="card-key">
          {step.rows.map((r) => (
            <div className="card-key-row" key={r.name} data-mark={r.mark}>
              <span className="card-key-name">{r.name}</span>
              <span className="card-key-truth">{r.truth}</span>
              <span className="card-key-said">{r.said}</span>
              <span className="card-key-mark">
                {r.mark === "right" ? "✓ " : r.mark === "wrong" ? "✗ " : ""}
                {r.word}
              </span>
            </div>
          ))}
          {step.bold && (
            <p className="card-bold" data-testid="card-verdict">
              {step.bold}
            </p>
          )}
        </div>
      ) : (
        <div className="card-screen" data-ui ref={screen}>
          <Component key={step.variant} variant={step.variant ?? "works"} />
        </div>
      )}
      <p className="card-line" data-testid="card-line">
        {step.line}
      </p>

      <footer className="card-bar">
        <button type="button" className="card-arrow" aria-label="Back" disabled={at === 0} onClick={() => go(at - 1)} data-testid="card-back">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="card-arrow" aria-label="Next" disabled={at >= last} onClick={() => go(at + 1)} data-testid="card-next">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="card-where">
          {at + 1} of {steps.length}
        </span>
        <Link to={`/letter/${letter.id}`} className="card-details" data-testid="card-details">
          Details
        </Link>
      </footer>
    </section>
  );
}
