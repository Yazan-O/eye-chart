import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { buildRows, fractionOfLetter } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { letterState, STATE_WORDS, twinTally } from "../data/readings";
import type { GlyphState } from "../data/types";
import { lensResult } from "../core/derive";
import { introMode, markIntroShown } from "../core/intro";
import { useStillMotion } from "../core/motion";
import { ui, useUi } from "../core/store";
import GlyphMark from "../components/GlyphMark";
import { RobotMark } from "../components/Marks";
import SceneBoundary from "../components/SceneBoundary";
import { TopBarActions } from "../components/TopBar";
import ChartKey from "./ChartKey";
import Demo from "./Demo";
import type { ScreenBox } from "./layout";
import LensDials from "./LensDials";
import type { LensDial } from "./Phoropter";

const ChartScene = lazy(() => import("./ChartScene"));

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];
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
  const [demoLens, setDemoLens] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [boxes, setBoxes] = useState<Record<string, ScreenBox> | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const navigate = useNavigate();
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
    const id = fixable?.id ?? withLens[0]?.id;
    return withLens.find((l) => l.id === id) ?? null;
  }, [letters, withLens, file]);
  const demo = demoLens && demoLetter ? demoLetter.id : null;
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
  const openLetter = useCallback((id: string) => navigate(`/letter/${id}`), [navigate]);
  const focusLetter = useCallback((id: string) => setFocusId(id), []);
  const onPlaced = useCallback((next: Record<string, ScreenBox>) => setBoxes(next), []);

  useEffect(() => {
    if (!landed || still || view !== "human" || !demoLetter || !ready || demoShown()) return;
    markDemoShown();
    if (lensOn.size > 0) return;
    const id = window.setTimeout(() => setAutoplay(true), 300);
    return () => window.clearTimeout(id);
  }, [landed, still, view, demoLetter, ready, lensOn]);

  const all = rows.flatMap((r) => r.glyphs);
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
    <div className="chart" data-testid="chart-page" data-intro={intro} data-leaving={focusId ? "true" : undefined}>
      <header className="topbar" data-testid="topbar">
        <h1 className="brand" data-testid="heading">
          <Link to="/" className="wordmark" data-testid="wordmark" aria-label="Eye Chart, home">
            <RobotMark />
            <span className="wordmark-text">Eye Chart</span>
          </Link>
        </h1>
        <TopBarActions />
      </header>

      <div className="chart-left">
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
              activeId={chartActive}
              still={still}
              frozen={view === "robot"}
              intro={intro}
              skipAt={skipAt}
              shift={0}
              focusId={focusId}
              onActive={setActiveId}
              onOpen={openLetter}
              onReady={markReady}
              onPlaced={onPlaced}
              dials={NO_DIALS}
              onToggleLens={sceneToggle}
            />
          </Suspense>
        </SceneBoundary>
        <ChartKey rows={rows} boxes={boxes} activeId={chartActive} onActive={setActiveId} onOpen={focusLetter} />
      </section>

      <div className="dock">
        <p className="dock-hint">Click a letter to open it. Turn a dial to add its lens.</p>
        <LensDials
          dials={dials}
          activeId={activeId}
          onToggle={toggleLens}
          onReset={() => setLenses(new Set())}
          onActive={setActiveId}
        />
      </div>
      </div>

      <main className="panel-top">
        <p className="what" data-testid="what-testsprite">
          An eye exam for TestSprite, the AI agent that tests web pages.
        </p>
        <p className="tagline" data-testid="tagline">
          Each letter is a real widget, built once working and once broken.
        </p>
        <dl className="tally" data-testid="tally" aria-label="Letters by result">
          {LEGEND.map((s) => (
            <div key={s} data-state={s} data-testid={`tally-${s}`}>
              <dt>
                <GlyphMark glyph="E" state={s} />
                {STATE_WORDS[s]}
              </dt>
              <dd>{ready && file ? count(s) : 0}</dd>
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
      </main>

      <div className="panel-demo">
        {demoLetter && (
          <Demo
            letter={demoLetter}
            fraction={fractionOfLetter(rows, demoLetter.id)}
            state={letterState(demoLetter, results, chartLens.has(demoLetter.id))}
            results={results}
            autoplay={autoplay}
            halt={lensOn.size > 0 || view === "robot"}
            still={still}
            onLens={setDemoLens}
          />
        )}
      </div>

      <footer className="panel-foot">
        <p className="plaque" data-testid="plaque">
          {plaque}
        </p>
        <button
          type="button"
          className="quiet-toggle"
          aria-pressed={paused}
          onClick={() => ui.setPaused(!paused)}
          data-testid="motion-toggle"
        >
          {paused ? "Motion paused" : "Pause motion"}
        </button>
      </footer>
    </div>
  );
}
