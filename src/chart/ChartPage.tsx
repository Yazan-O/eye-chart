import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildRows } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { STATE_WORDS } from "../data/readings";
import type { GlyphState } from "../data/types";
import { lensResult } from "../core/derive";
import { introMode, markIntroShown } from "../core/intro";
import { useStillMotion } from "../core/motion";
import { ui, useUi } from "../core/store";
import GlyphMark from "../components/GlyphMark";
import SceneBoundary from "../components/SceneBoundary";
import TopBar from "../components/TopBar";
import ChartKey from "./ChartKey";
import LensDials from "./LensDials";
import type { LensDial } from "./Phoropter";

const ChartScene = lazy(() => import("./ChartScene"));

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];

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
  const { view, paused } = useUi();
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
        measured: lensResult(l.id, file?.results ?? []) !== "none",
      })),
    [withLens, lensOn, file],
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
  const all = rows.flatMap((r) => r.glyphs);
  const count = (s: GlyphState) => all.filter((g) => g.state === s).length;
  const taken = file ? formatDate(file.takenAt) : "";

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
      <section
        className="stage"
        aria-label="Lit eye chart"
        data-testid="scene"
        data-reduced={String(still)}
      >
        <SceneBoundary fallback={<Fallback onReady={markReady} />}>
          <Suspense fallback={<div className="chart-flat" data-testid="chart-flat" />}>
            <ChartScene
              rows={rows}
              activeId={activeId}
              still={still}
              frozen={view === "robot"}
              intro={intro}
              skipAt={skipAt}
              shift={wide ? 0.36 : 0}
              onActive={setActiveId}
              onOpen={(id) => navigate(`/letter/${id}`)}
              onReady={markReady}
              dials={dials}
              onToggleLens={toggleLens}
            />
          </Suspense>
        </SceneBoundary>
      </section>
      <TopBar />
      <main className="rail">
        <h1 className="display" data-testid="heading">
          Eye Chart.
        </h1>
        <p className="lead" data-testid="tagline">
          An eye exam for TestSprite&rsquo;s AI tester. Every letter is a real widget, built once
          working and once broken.
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
        <ChartKey rows={rows} activeId={activeId} onActive={setActiveId} />
        <LensDials
          dials={dials}
          activeId={activeId}
          onToggle={toggleLens}
          onReset={() => setLenses(new Set())}
          onActive={setActiveId}
        />
      </main>
    </div>
  );
}
