import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildRows } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { letterState, STATE_WORDS, twinTally } from "../data/readings";
import type { GlyphState } from "../data/types";
import { lensResult } from "../core/derive";
import { introMode, markIntroShown } from "../core/intro";
import { useStillMotion } from "../core/motion";
import { ui, useUi } from "../core/store";
import { AgentToggle } from "../agent/AgentView";
import About from "../components/About";
import GlyphMark from "../components/GlyphMark";
import { RobotMark } from "../components/Marks";
import SceneBoundary from "../components/SceneBoundary";
import ChartKey from "./ChartKey";
import type { ScreenBox } from "./layout";
import LensDials from "./LensDials";
import LetterCard from "./LetterCard";
import type { LensDial } from "./Phoropter";

const ChartScene = lazy(() => import("./ChartScene"));

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];
const MEANING: Record<GlyphState, (n: number) => string> = {
  read: (n) => `${n === 1 ? "letter" : "letters"} TestSprite read right`,
  misread: (n) => `${n === 1 ? "letter" : "letters"} it misread`,
  blocked: (n) => `${n === 1 ? "letter" : "letters"} it could not test`,
  unread: (n) => `${n === 1 ? "letter" : "letters"} not read yet`,
};
const NO_DIALS: LensDial[] = [];
const DEMO_KEY = "eye-chart-lens-demo";

function demoShown(): boolean {
  try {
    return sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return true;
  }
}

function markDemoShown() {
  try {
    sessionStorage.setItem(DEMO_KEY, "1");
  } catch {
    return;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Fallback({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return <div className="chart-flat" data-testid="chart-flat" />;
}

export default function ChartPage() {
  const { letters } = useLetters();
  const { file, ready } = useReadings();
  const still = useStillMotion();
  const { view, paused, ready: landed, compare } = useUi();
  const [card, setCard] = useState<{ id: string; playing: boolean } | null>(null);
  const [cardLens, setCardLens] = useState(false);
  const [pulse, setPulse] = useState<{ id: string; at: number } | null>(null);
  const onMark = useCallback((id: string) => setPulse({ id, at: performance.now() }), []);
  const [boxes, setBoxes] = useState<Record<string, ScreenBox> | null>(null);
  const [intro] = useState(() => introMode(still));
  const [skipAt, setSkipAt] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const lensParam = params.get("lens") ?? "";
  const chartParam = useDeferredValue(lensParam);
  const chartActive = useDeferredValue(activeId);
  const comparing = compare && view === "robot";

  useEffect(() => {
    markIntroShown();
    if (ui.get().view === "human") ui.setReady(false);
  }, []);

  useEffect(() => {
    if (intro !== "full" || skipAt !== null || landed) return;
    const skip = () => setSkipAt(performance.now());
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, skip));
  }, [intro, skipAt, landed]);

  const markReady = useCallback(() => {
    if (ui.get().view === "human") ui.setReady(true);
  }, []);

  const withLens = useMemo(() => letters.filter((l) => l.lens), [letters]);
  const lensOn = useMemo(() => {
    const wanted = new Set(lensParam.split(",").filter(Boolean));
    return new Set(withLens.filter((l) => wanted.has(l.id)).map((l) => l.id));
  }, [lensParam, withLens]);
  const chartLens = useMemo(() => {
    const wanted = new Set(chartParam.split(",").filter(Boolean));
    const results = file?.results ?? [];
    return new Set(
      letters
        .filter((l) => (l.lens && wanted.has(l.id)) || (comparing && lensResult(l.id, results) === "fixed"))
        .map((l) => l.id),
    );
  }, [chartParam, letters, comparing, file]);

  const rows = useMemo(
    () => buildRows(letters, file?.results ?? [], chartLens),
    [letters, file, chartLens],
  );
  const demoLetter = useMemo(() => {
    const results = file?.results ?? [];
    const order = buildRows(letters, results).flatMap((r) => r.glyphs);
    const fixable = order.find((g) => g.state === "misread" && lensResult(g.id, results) === "fixed");
    const first = letters.find((l) => l.lens);
    const id = fixable?.id ?? first?.id;
    return letters.find((l) => l.id === id && l.lens) ?? null;
  }, [letters, file]);
  const cardId = card?.id ?? demoLetter?.id ?? null;
  const cardLetter = useMemo(
    () => (cardId ? (letters.find((l) => l.id === cardId) ?? null) : null),
    [cardId, letters],
  );
  const demo = cardLens && cardLetter?.lens ? cardLetter.id : null;
  const sceneRows = useMemo(
    () => (demo ? buildRows(letters, file?.results ?? [], new Set([...chartLens, demo])) : rows),
    [demo, rows, letters, file, chartLens],
  );

  const dials: LensDial[] = useMemo(
    () =>
      withLens.map((l) => ({
        id: l.id,
        glyph: l.glyph,
        name: l.lens?.name ?? "",
        on: lensOn.has(l.id),
        demo: demo === l.id,
        measured: lensResult(l.id, file?.results ?? []) !== "none",
        without: STATE_WORDS[letterState(l, file?.results ?? [], false)],
        with: STATE_WORDS[letterState(l, file?.results ?? [], true)],
        summary: l.lens?.summary ?? "",
        letter: l.name,
      })),
    [withLens, lensOn, file, demo],
  );

  const setLenses = useCallback(
    (next: Set<string>) => {
      const value = [...next].sort().join(",");
      setParams(value ? { lens: value } : {}, { replace: true });
    },
    [setParams],
  );
  const toggleLens = useCallback(
    (id: string) => {
      const next = new Set(lensOn);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setLenses(next);
    },
    [lensOn, setLenses],
  );
  const toggleRef = useRef(toggleLens);
  useEffect(() => {
    toggleRef.current = toggleLens;
  }, [toggleLens]);
  const sceneToggle = useCallback((id: string) => toggleRef.current(id), []);
  const openCard = useCallback((id: string) => setCard({ id, playing: false }), []);
  const stopCard = useCallback(() => setCard((c) => (c && c.playing ? { ...c, playing: false } : c)), []);
  const onPlaced = useCallback((next: Record<string, ScreenBox>) => setBoxes(next), []);

  useEffect(() => {
    if (!landed || still || view !== "human" || !demoLetter || !ready || demoShown()) return;
    markDemoShown();
    if (lensOn.size > 0) return;
    const id = demoLetter.id;
    const timer = window.setTimeout(() => setCard((c) => c ?? { id, playing: true }), 300);
    return () => window.clearTimeout(timer);
  }, [landed, still, view, demoLetter, ready, lensOn]);

  useEffect(() => {
    if (!card?.playing) return;
    const stop = () => stopCard();
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [card?.playing, stopCard]);

  if (card?.playing && (view === "robot" || lensOn.size > 0)) setCard({ ...card, playing: false });

  const all = rows.slice(1).flatMap((r) => r.glyphs);
  const count = (s: GlyphState) => all.filter((g) => g.state === s).length;
  const taken = file ? formatDate(file.takenAt) : "";
  const twins = twinTally(letters, file?.results ?? []);
  const results = file?.results ?? [];

  let summary = "Not read yet.";
  if (!ready) summary = "Loading the readings.";
  else if (file && all.length > 0) {
    const lensWords =
      chartLens.size === 0 ? "" : chartLens.size === 1 ? "With 1 lens on. " : `With ${chartLens.size} lenses on. `;
    summary = `${lensWords}Read correctly: ${count("read")} of ${all.length} letters${taken ? `, measured ${taken}` : ""}.`;
  }
  const plaque = file
    ? `Recorded run of ${taken}${file.commit ? `, commit ${file.commit.slice(0, 7)}` : ""}`
    : "No run recorded yet";

  return (
    <div className="chart" data-testid="chart-page" data-intro={intro}>
      <header className="topbar" data-testid="topbar">
        <h1 className="brand" data-testid="heading">
          <Link to="/" className="wordmark" data-testid="wordmark" aria-label="Eye Chart, home">
            <RobotMark />
            <span className="wordmark-text">Eye Chart</span>
          </Link>
        </h1>
        <div className="topbar-actions">
          <AgentToggle />
          <About>
            <h3>The result</h3>
            <dl className="tally" data-testid="tally" aria-label="Letters by result">
              {LEGEND.map((s) => (
                <div key={s} data-state={s} data-testid={`tally-${s}`}>
                  <dt>
                    <GlyphMark glyph="E" state={s} />
                    {STATE_WORDS[s]}
                  </dt>
                  <dd>{ready && file ? count(s) : 0}</dd>
                  <span className="tally-meaning">{MEANING[s](ready && file ? count(s) : 0)}</span>
                </div>
              ))}
            </dl>
            <p className="summary" data-testid="reading-summary">
              {summary}
            </p>
            {ready && file && (
              <p className="summary" data-testid="twin-summary">
                Twin readings correct: {twins.correct} of {twins.total}.
              </p>
            )}
            <p className="plaque" data-testid="plaque">
              {plaque}
            </p>
            <h3>Lenses</h3>
            <LensDials
              dials={dials}
              activeId={activeId}
              onToggle={toggleLens}
              onReset={() => setLenses(new Set())}
              onActive={setActiveId}
            />
            <h3>Motion</h3>
            <p>
              <button
                type="button"
                className="quiet-toggle"
                aria-pressed={paused}
                onClick={() => ui.setPaused(!paused)}
                data-testid="motion-toggle"
              >
                {paused ? "Motion paused" : "Pause motion"}
              </button>
            </p>
          </About>
        </div>
      </header>

      <div className="chart-intro">
        <p className="what" data-testid="what-testsprite">
          An eye exam for TestSprite, the AI agent that tests web pages.
        </p>
        <p className="tagline" data-testid="tagline">
          Each letter is a real widget, built once working and once broken. Click one.
        </p>
      </div>

      <section
        className="stage"
        aria-label="Lit eye chart"
        data-testid="scene"
        data-reduced={String(still)}
      >
        <SceneBoundary fallback={<Fallback onReady={markReady} />}>
          <Suspense fallback={<div className="chart-flat" data-testid="chart-flat" />}>
            <ChartScene
              rows={sceneRows}
              activeId={chartActive ?? card?.id ?? null}
              still={still}
              frozen={view === "robot"}
              intro={intro}
              skipAt={skipAt}
              shift={0}
              pulse={pulse}
              onActive={setActiveId}
              onOpen={openCard}
              onReady={markReady}
              onPlaced={onPlaced}
              dials={NO_DIALS}
              onToggleLens={sceneToggle}
            />
          </Suspense>
        </SceneBoundary>
        <ChartKey rows={rows} boxes={boxes} activeId={chartActive ?? card?.id ?? null} onActive={setActiveId} onOpen={openCard} />
      </section>

      {cardLetter && (
        <div className="card-dock">
          <LetterCard
            key={cardLetter.id}
            letter={cardLetter}
            state={letterState(cardLetter, results, chartLens.has(cardLetter.id))}
            results={results}
            playing={card?.playing ?? false}
            onStop={stopCard}
            onLens={setCardLens}
            onMark={onMark}
          />
        </div>
      )}
    </div>
  );
}
