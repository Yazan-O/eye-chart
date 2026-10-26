import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { buildRows, fractionOfLetter } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { findLetter } from "../data/letters";
import { letterState, STATE_WORDS } from "../data/readings";
import type { Truth, Variant } from "../data/types";
import GlyphMark from "../components/GlyphMark";
import TopBar from "../components/TopBar";
import NotFound from "../pages/NotFound";
import Diff from "./Diff";
import ReadingCard from "./ReadingCard";

function twinUrl(id: string, variant: Variant): string {
  return `${import.meta.env.BASE_URL}#/l/${id}/${variant}`;
}

function Twin({
  id,
  name,
  variant,
  title,
  note,
  expected,
}: {
  id: string;
  name: string;
  variant: Variant;
  title: string;
  note: string;
  expected: Truth;
}) {
  const { file } = useReadings();
  return (
    <section className={`twin-column twin-column--${variant}`} data-testid={`station-${variant}`}>
      <div className="twin-head">
        <h2>{title}</h2>
        <a
          href={twinUrl(id, variant)}
          target="_blank"
          rel="noreferrer"
          data-testid={`open-${variant}`}
        >
          Open alone
        </a>
      </div>
      <p className="twin-note">{note}</p>
      <iframe
        className="twin-frame"
        src={twinUrl(id, variant)}
        title={`${name}, ${title.toLowerCase()} twin`}
        data-testid={`frame-${variant}`}
      />
      <ReadingCard
        letterId={id}
        variant={variant}
        expected={expected}
        results={file?.results ?? []}
      />
    </section>
  );
}

export default function StationPage() {
  const { id = "" } = useParams();
  const { letters, ready } = useLetters();
  const { file } = useReadings();
  const rows = useMemo(() => buildRows(letters, file?.results ?? []), [letters, file]);
  const order = rows.flatMap((r) => r.glyphs.map((g) => g.id));

  if (!ready) return null;
  const letter = findLetter(letters, id);
  if (!letter) return <NotFound />;

  const results = file?.results ?? [];
  const state = letterState(letter, results);
  const fraction = fractionOfLetter(rows, letter.id);
  const at = order.indexOf(letter.id);
  const prev = at > 0 ? order[at - 1] : undefined;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : undefined;

  return (
    <div className="station" data-testid="station-page">
      <TopBar>
        <Link to="/" className="button button--ink" data-testid="back-to-chart">
          Back to the chart
        </Link>
      </TopBar>
      <main>
        <header className="station-head">
          <GlyphMark glyph={letter.glyph} state={state} large />
          <div className="station-title">
            <h1 className="display" data-testid="station-heading">
              {letter.name}
            </h1>
            <p className="station-meta" data-testid="station-state">
              {fraction ? `Row ${fraction}. ` : ""}
              {STATE_WORDS[state]}.
            </p>
            <p className="station-trap" data-testid="station-trap">
              {letter.trap}
            </p>
          </div>
        </header>

        <div className="twins">
          <Twin
            id={letter.id}
            name={letter.name}
            variant="works"
            title="Works"
            note={letter.howToUse}
            expected="pass"
          />
          <Twin
            id={letter.id}
            name={letter.name}
            variant="broken"
            title="Broken"
            note={letter.brokenBehaviour}
            expected="fail"
          />
        </div>

        <section className="lens" data-testid="station-lens">
          {letter.lens ? (
            <>
              <h2 className="lens-title" data-testid="lens-name">
                Lens: {letter.lens.name}
              </h2>
              <p className="lens-summary" data-testid="lens-summary">
                {letter.lens.summary}
              </p>
              <div className="lens-body">
                <Diff diff={letter.lens.diff} />
                <div className="lens-after">
                  <div className="twin-head">
                    <h3>Reading with the lens on</h3>
                    <a
                      href={twinUrl(letter.id, "lens")}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="open-lens"
                    >
                      Open alone
                    </a>
                  </div>
                  <ReadingCard
                    letterId={letter.id}
                    variant="lens"
                    results={results}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="lens-none" data-testid="lens-none">
              No lens for this letter.
            </p>
          )}
        </section>

        <nav className="station-steps" aria-label="Other letters">
          {prev ? (
            <Link to={`/letter/${prev}`} data-testid="prev-letter">
              Previous letter
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/letter/${next}`} data-testid="next-letter">
              Next letter
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
