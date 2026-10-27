import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLetters, useReadings } from "../data/hooks";
import { buildRows } from "../data/chart";
import { STATE_WORDS, twinTally } from "../data/readings";
import type { GlyphState } from "../data/types";
import GlyphMark from "./GlyphMark";

export const REPO = "https://github.com/Yazan-O/eye-chart";
const KEY: [GlyphState, string][] = [
  ["read", "TestSprite passed the working twin and failed the broken one."],
  ["misread", "TestSprite got at least one twin wrong. A ghost copy and an orange slash."],
  ["blocked", "TestSprite could not test a twin. Hatched."],
  ["unread", "No reading recorded yet. An outline only."],
];

export function GithubLink() {
  return (
    <a
      className="github-link"
      href={REPO}
      target="_blank"
      rel="noreferrer"
      data-testid="github-link"
    >
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
        />
      </svg>
      Source on GitHub
    </a>
  );
}

function RunFacts() {
  const { letters } = useLetters();
  const { file } = useReadings();
  const measured = new Set(
    (file?.results ?? []).filter((r) => r.variant !== "lens" && r.variant !== "lens-broken").map((r) => r.letterId),
  );
  const count = letters.filter((l) => measured.has(l.id)).length;
  const results = file?.results ?? [];
  const twins = twinTally(letters, results);
  const glyphs = buildRows(letters, results).flatMap((r) => r.glyphs);
  const byState = (s: GlyphState) => glyphs.filter((g) => g.state === s).length;
  const date = file ? new Date(file.takenAt) : null;
  const when =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
      : "";
  return (
    <>
      <p data-testid="about-run">
        {file
          ? `Recorded run: ${file.engine}${when ? `, ${when}` : ""}${file.commit ? `, commit ${file.commit.slice(0, 7)}` : ""}.`
          : "No run recorded yet."}
      </p>
      <p data-testid="about-measured">
        {count} of {letters.length} letters measured.
      </p>
      {file && (
        <>
          <p data-testid="about-totals">
            The readings file holds {results.length} readings: {twins.total} twin readings,{" "}
            {twins.correct} of them correct, and {results.length - twins.total} lens readings.
          </p>
          <p data-testid="about-letters">
            Letters: {byState("read")} read correctly, {byState("misread")} misread,{" "}
            {byState("blocked")} blocked, {byState("unread")} not read yet.
          </p>
        </>
      )}
    </>
  );
}

export default function About({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="about-button"
        aria-label="About"
        title="About"
        aria-expanded={open}
        aria-controls="about-panel"
        onClick={() => setOpen((v) => !v)}
        data-testid="about-open"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9v5.5M10 6.2v.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="about-scrim" onClick={close} data-testid="about-scrim">
          <section
            id="about-panel"
            className="about"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-heading"
            onClick={(e) => e.stopPropagation()}
            data-testid="about-panel"
          >
            <h2 id="about-heading" className="display" tabIndex={-1} ref={heading}>
              An eye exam for an AI tester
            </h2>
            <p>
              TestSprite sends an AI agent to test web pages. Eye Chart checks how well that
              agent sees. Each letter is a real widget, built twice: one copy works, the other is
              broken in a way any person would spot. TestSprite tests both.
            </p>
            {children}
            <RunFacts />
            <h3>What the marks mean</h3>
            <ul className="about-key">
              {KEY.map(([state, text]) => (
                <li key={state}>
                  <GlyphMark glyph="E" state={state} />
                  <span>
                    <strong>{STATE_WORDS[state]}.</strong> {text}
                  </span>
                </li>
              ))}
            </ul>
            <p>
              A reading is correct when TestSprite&rsquo;s verdict matches the twin&rsquo;s truth:
              passed for the working twin, failed for the broken one.
            </p>
            <h3>Lenses</h3>
            <p>
              For each miss there is a lens: a small code change to the twin TestSprite misread,
              tested again. Turn a dial to see the chart with that lens on. A dial with no
              recorded reading says &ldquo;not measured&rdquo; and changes nothing.
            </p>
            <h3>TestSprite vision</h3>
            <p>
              A camera that only sees change, built from the page&rsquo;s own structure. It is
              one half of what an agent reads (it also reads screenshots), and an illustration,
              not TestSprite&rsquo;s internals. Orange and blue dots are the two directions of
              change. A misread letter flickers, a blocked one is dashed, an unread one stays
              silent. Background speckle means nothing.
            </p>
            <h3>Keys</h3>
            <p>
              R switches the view when the chart or the button has focus. Escape leaves it.
              Left and right arrows step through a letter&rsquo;s card.
            </p>
            <p>
              <GithubLink />
            </p>
            <p className="about-credit">
              The mark on the TestSprite vision button is TestSprite&rsquo;s own logo, from
              testsprite.com, used here to name the agent under test.
            </p>
            <p>
              <a href={REPO} target="_blank" rel="noreferrer" data-testid="about-repo">
                Source on GitHub
              </a>
            </p>
            <button type="button" className="button" onClick={close} data-testid="about-close">
              Close
            </button>
          </section>
        </div>
      )}
    </>
  );
}
