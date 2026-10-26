import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildRows } from "../data/chart";
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
import TopBar from "../components/TopBar";
import ChartKey from "./ChartKey";
import LensDials from "./LensDials";
import type { LensDial } from "./Phoropter";

const ChartScene = lazy(() => import("./ChartScene"));

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];
const NO_DIALS: LensDial[] = [];
const DEMO_KEY = "eye-chart-lens-demo";
const DEMO_WAIT_MS = 500;
const DEMO_HOLD_MS = 2000;

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

function useWideScreen(): boolean {
  const query = "(min-width: 861px)";
  const [wide, setWide] = useState(
    () => typeof window.matchMedia !== "function" || window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    list.addEventListener("change", on);
    return () => list.removeEventListener("change", on);
  }, []);
  return wide;
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
  const { view, paused, ready: landed } = useUi();
  const [demo, setDemo] = useState<string | null>(null);
  const wide = useWideScreen();
  const navigate = useNavigate();
  const [intro] = useState(() => introMode(still));
  const [skipAt, setSkipAt] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const lensParam = params.get("lens") ?? "";

  useEffect(() => {
    markIntroShown();
    if (ui.get().view === "human") ui.setReady(false);
  }, []);

  useEffect(() => {
    if (intro !== "full" || skipAt !== null) return;
    const skip = () => setSkipAt(performance.now());
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, skip));
  }, [intro, skipAt]);

  const markReady = useCallback(() => {
    if (ui.get().view === "human") ui.setReady(true);
  }, []);

  const withLens = useMemo(() => letters.filter((l) => l.lens), [letters]);
  const lensOn = useMemo(() => {
    const wanted = new Set(lensParam.split(",").filter(Boolean));
    return new Set(withLens.filter((l) => wanted.has(l.id)).map((l) => l.id));
  }, [lensParam, withLens]);
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

  const rows = useMemo(
    () => buildRows(letters, file?.results ?? [], lensOn),
    [letters, file, lensOn],
  );
  const demoId = useMemo(() => {
    const results = file?.results ?? [];
    const lensIds = new Set(withLens.map((l) => l.id));
    for (const g of rows.flatMap((r) => r.glyphs)) {
      if (g.state === "misread" && lensIds.has(g.id) && !lensOn.has(g.id) && lensResult(g.id, results) === "fixed") {
        return g.id;
      }
    }
    return null;
  }, [rows, withLens, lensOn, file]);
  const sceneRows = useMemo(
    () => (demo ? buildRows(letters, file?.results ?? [], new Set([...lensOn, demo])) : rows),
    [demo, rows, letters, file, lensOn],
  );

  useEffect(() => {
    if (!landed || still || view !== "human" || !demoId || demoShown()) return;
    markDemoShown();
    if (lensOn.size > 0) return;
    const timers: number[] = [];
    const stop = () => {
      timers.forEach((t) => window.clearTimeout(t));
      setDemo(null);
    };
    timers.push(window.setTimeout(() => setDemo(demoId), DEMO_WAIT_MS));
    timers.push(window.setTimeout(() => setDemo(null), DEMO_WAIT_MS + DEMO_HOLD_MS));
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      events.forEach((e) => window.removeEventListener(e, stop));
      setDemo(null);
    };
  }, [landed, still, view, demoId, lensOn]);
  const all = rows.flatMap((r) => r.glyphs);
  const count = (s: GlyphState) => all.filter((g) => g.state === s).length;
  const taken = file ? formatDate(file.takenAt) : "";
  const twins = twinTally(letters, file?.results ?? []);

  let summary = "Not read yet.";
  if (!ready) summary = "Loading the readings.";
  else if (file && all.length > 0) {
    const lensWords =
      lensOn.size === 0 ? "" : lensOn.size === 1 ? "With 1 lens on. " : `With ${lensOn.size} lenses on. `;
    summary = `${lensWords}Read correctly: ${count("read")} of ${all.length} letters${taken ? `, measured ${taken}` : ""}.`;
  }
  const plaque = file
    ? `Recorded run of ${taken}${file.commit ? `, commit ${file.commit.slice(0, 7)}` : ""}`
    : "No run recorded yet";

  return (
    <div className="chart" data-testid="chart-page" data-intro={intro}>
      <TopBar />
      <div className="hero">
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
                activeId={activeId}
                still={still}
                frozen={view === "robot"}
                intro={intro}
                skipAt={skipAt}
                shift={wide ? 0.18 : 0}
                onActive={setActiveId}
                onOpen={(id) => navigate(`/letter/${id}`)}
                onReady={markReady}
                dials={NO_DIALS}
                onToggleLens={toggleLens}
              />
            </Suspense>
          </SceneBoundary>
        </section>
        <main className="hud">
          <div className="title-block">
            <RobotMark />
            <h1 className="display" data-testid="heading">
              Eye Chart
            </h1>
          </div>
          <p className="lead" data-testid="tagline">
            Each letter is a real web widget, built once working and once broken. A slash means
            TestSprite&rsquo;s AI tester misread it. Turn a lens to fix it.
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
          <p className="plaque" data-testid="plaque">
            {plaque}
          </p>
        </main>
        <div className="dock">
          <LensDials
            dials={dials}
            activeId={activeId}
            onToggle={toggleLens}
            onReset={() => setLenses(new Set())}
            onActive={setActiveId}
          />
        </div>
      </div>
      <section className="index" aria-label="All letters">
        <div className="index-head">
          <h2>All {all.length} letters</h2>
          <button
            type="button"
            className="quiet-toggle"
            aria-pressed={paused}
            onClick={() => ui.setPaused(!paused)}
            data-testid="motion-toggle"
          >
            {paused ? "Motion paused" : "Pause motion"}
          </button>
        </div>
        <ChartKey rows={rows} activeId={activeId} onActive={setActiveId} />
      </section>
    </div>
  );
}
