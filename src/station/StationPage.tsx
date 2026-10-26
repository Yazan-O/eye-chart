import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { buildRows, fractionOfLetter } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { findLetter } from "../data/letters";
import { findReading, letterState, STATE_WORDS } from "../data/readings";
import type { Truth, Variant } from "../data/types";
import TopBar from "../components/TopBar";
import { lensResult, stateWord } from "../core/derive";
import { useStillMotion } from "../core/motion";
import NotFound from "../pages/NotFound";
import LensExploded from "./LensExploded";
import LensGlyph from "./LensGlyph";
import ReadingCard from "./ReadingCard";

type Pane = "works" | "broken" | "lens";

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
  active,
  testId,
  openId = `open-${variant}`,
  reading = true,
}: {
  id: string;
  name: string;
  variant: Variant;
  title: string;
  note: string;
  expected?: Truth;
  active: boolean;
  testId: string;
  openId?: string;
  reading?: boolean;
}) {
  const { file } = useReadings();
  return (
    <section
      className={`twin-column twin-column--${variant}`}
      data-testid={testId}
      data-active={active || undefined}
    >
      <div className="twin-head">
        <h2>{title}</h2>
        <a
          href={twinUrl(id, variant)}
          target="_blank"
          rel="noreferrer"
          data-testid={openId}
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
      {reading && (
        <ReadingCard
          letterId={id}
          variant={variant}
          expected={expected}
          results={file?.results ?? []}
        />
      )}
    </section>
  );
}

export default function StationPage() {
  const { id = "" } = useParams();
  const { letters, ready } = useLetters();
  const { file } = useReadings();
  const rows = useMemo(() => buildRows(letters, file?.results ?? []), [letters, file]);
  const order = rows.flatMap((r) => r.glyphs.map((g) => g.id));
  const still = useStillMotion();
  const [params, setParams] = useSearchParams();

  if (!ready) return null;
  const letter = findLetter(letters, id);
  if (!letter) return <NotFound />;

  const results = file?.results ?? [];
  const state = letterState(letter, results);
  const wanted = params.get("pane");
  const pane: Pane =
    wanted === "broken" || (wanted === "lens" && letter.lens) ? wanted : "works";
  const lensOn = pane === "lens";
  const lens = lensResult(letter.id, results);
  const word = lensOn && lens !== "none" ? stateWord(state, lens, true) : STATE_WORDS[state];
  const lensFor = findReading(results, letter.id, "lens")?.truth === "fail" ? "broken" : "works";
  const lensTwin = letter.lens && (
    <Twin
      id={letter.id}
      name={letter.name}
      variant="lens"
      title="Lens"
      note={letter.lens.summary}
      active
      testId="station-lens-twin"
      openId="open-lens-pane"
      reading={false}
    />
  );
  const choose = (next: Pane) => setParams(next === "works" ? {} : { pane: next }, { replace: true });
  const choices: [Pane, string][] = letter.lens
    ? [["works", "Works"], ["broken", "Broken"], ["lens", "Lens"]]
    : [["works", "Works"], ["broken", "Broken"]];
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
          <LensGlyph glyph={letter.glyph} state={state} lens={lens} lensOn={lensOn} />
          <div className="station-title">
            <h1 className="display" data-testid="station-heading">
              {letter.name}
            </h1>
            <p className="station-meta" data-testid="station-state" data-lens={lensOn ? "on" : "off"}>
              {fraction ? `Row ${fraction}. ` : ""}
              {word.charAt(0).toUpperCase() + word.slice(1)}.
            </p>
            <p className="station-trap" data-testid="station-trap">
              {letter.trap}
            </p>
          </div>
        </header>

        <div className="pane-switch" role="group" aria-label="Which twin to show" data-testid="pane-switch">
          {choices.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={pane === value}
              onClick={() => choose(value)}
              data-testid={`pane-${value}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="twins" data-pane={pane}>
          {lensOn && lensFor === "works" ? lensTwin : (
            <Twin
              id={letter.id}
              name={letter.name}
              variant="works"
              title="Works"
              note={letter.howToUse}
              expected="pass"
              active={pane === "works"}
              testId="station-works"
            />
          )}
          {lensOn && lensFor === "broken" ? lensTwin : (
            <Twin
              id={letter.id}
              name={letter.name}
              variant="broken"
              title="Broken"
              note={letter.brokenBehaviour}
              expected="fail"
              active={pane === "broken"}
              testId="station-broken"
            />
          )}
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
              <LensExploded
                letterId={letter.id}
                lens={letter.lens}
                results={results}
                still={still}
                lensUrl={twinUrl(letter.id, "lens")}
                replaces={lensFor}
              />
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
