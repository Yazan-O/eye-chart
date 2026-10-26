import { useEffect, useRef, useState } from "react";

export default function About() {
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
        className="button button--quiet"
        aria-expanded={open}
        aria-controls="about-panel"
        onClick={() => setOpen((v) => !v)}
        data-testid="about-open"
      >
        About
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
              agent sees.
            </p>
            <p>
              Each letter on the chart is a real widget, built twice. One copy works. The other
              is broken in a way any person would spot. TestSprite tests both copies.
            </p>
            <p>
              A letter is lit when TestSprite passes the working copy and fails the broken one.
              It is struck through when TestSprite gets either one wrong, and faded when it could
              not test it. An outline means it has not been tested yet.
            </p>
            <p>
              For each miss there is a lens: a small code change that helps the agent see the
              widget. Turn a dial to see the chart as tested with that lens on.
            </p>
            <p>
              See it like TestSprite shows what a tool that reads page structure gets: drawings
              on a canvas go blank, and only labelled parts remain.
            </p>
            <p>Every verdict on this site comes from a real TestSprite run.</p>
            <button type="button" className="button" onClick={close} data-testid="about-close">
              Close
            </button>
          </section>
        </div>
      )}
    </>
  );
}
