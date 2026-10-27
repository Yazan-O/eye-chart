import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildRows, fractionOfLetter } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { letterState, STATE_WORDS, twinTally } from "../data/readings";
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
import Story, { STEP_COUNT } from "./Story";

const ChartScene = lazy(() => import("./ChartScene"));

const LEGEND: GlyphState[] = ["read", "misread", "blocked", "unread"];
const NO_DIALS: LensDial[] = [];
const DEMO_KEY = "eye-chart-lens-demo";

interface DemoPhase {
  step: number;
  focus: boolean;
  lens: boolean;
  ms: number;
}

export const DEMO_PHASES: DemoPhase[] = [
  { step: 0, focus: false, lens: false, ms: 2600 },
  { step: 1, focus: true, lens: false, ms: 4200 },
  { step: 2, focus: true, lens: false, ms: 700 },
  { step: 2, focus: true, lens: true, ms: 3800 },
  { step: 3, focus: false, lens: false, ms: 4200 },
];

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

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest("input, textarea, select, [contenteditable], .about-scrim") !== null;
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
  const wide = useWideScreen();
  const navigate = useNavigate();
  const [intro] = useState(() => introMode(still));
  const [skipAt, setSkipAt] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [wantRun, setWantRun] = useState(false);
  const [demoLens, setDemoLens] = useState(false);
  const [params, setParams] = useSearchParams();
  const lensParam = params.get("lens") ?? "";
  const chartParam = useDeferredValue(lensParam);
  const chartActive = useDeferredValue(activeId);
  const comparing = compare && view === "robot";
  const results = useMemo(() => file?.results ?? [], [file]);

  useEffect(() => {
    markIntroShown();
    if (ui.get().view === "human") ui.setReady(false);
  }, []);

  const touched = useRef(false);
  useEffect(() => {
    const touch = () => {
      touched.current = true;
    };
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, touch));
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
  const chartLens = useMemo(() => {
    const wanted = new Set(chartParam.split(",").filter(Boolean));
    return new Set(
      letters
        .filter((l) => (l.lens && wanted.has(l.id)) || (comparing && lensResult(l.id, results) === "fixed"))
        .map((l) => l.id),
    );
  }, [chartParam, letters, comparing, results]);

  const rows = useMemo(() => buildRows(letters, results, chartLens), [letters, results, chartLens]);
  const all = useMemo(() => rows.flatMap((r) => r.glyphs), [rows]);
  const subject = useMemo(() => {
    const lensIds = new Set(withLens.map((l) => l.id));
    const fixed = all.find(
      (g) => g.state === "misread" && lensIds.has(g.id) && lensResult(g.id, results) === "fixed",
    );
    const pick =
      fixed ?? all.find((g) => g.state === "misread" && lensIds.has(g.id)) ?? all.find((g) => g.state === "misread") ?? all[0];
    return pick ? (letters.find((l) => l.id === pick.id) ?? null) : null;
  }, [all, withLens, results, letters]);
  const subjectId = subject?.id ?? null;
  const subjectState = subject ? letterState(subject, results, false) : "unread";
  const subjectLensState = subject ? letterState(subject, results, true) : "unread";
  const subjectLens = subjectId ? lensResult(subjectId, results) : "none";

  const previewId = demoLens && subject?.lens ? subject.id : null;
  const sceneRows = useMemo(
    () => (previewId ? buildRows(letters, results, new Set([...chartLens, previewId])) : rows),
    [previewId, rows, letters, results, chartLens],
  );
  const dials: LensDial[] = useMemo(
    () =>
      withLens.map((l) => ({
        id: l.id,
        glyph: l.glyph,
        name: l.lens?.name ?? "",
        on: lensOn.has(l.id),
        demo: previewId === l.id,
        measured: lensResult(l.id, results) !== "none",
        without: STATE_WORDS[letterState(l, results, false)],
        with: STATE_WORDS[letterState(l, results, true)],
        summary: l.lens?.summary ?? "",
        letter: l.name,
      })),
    [withLens, lensOn, results, previewId],
  );

  const canRun = !still && view === "human" && subjectId !== null;
  const running = wantRun && canRun;

  useEffect(() => {
    if (!landed || !canRun || touched.current || demoShown() || lensOn.size > 0) return;
    markDemoShown();
    const timer = window.setTimeout(() => setWantRun(true), 0);
    return () => window.clearTimeout(timer);
  }, [landed, canRun, lensOn]);

  useEffect(() => {
    if (!running) return;
    let i = 0;
    let timer = 0;
    const play = () => {
      const phase = DEMO_PHASES[i];
      if (!phase) {
        setWantRun(false);
        return;
      }
      setStep(phase.step);
      setActiveId(phase.focus ? subjectId : null);
      setDemoLens(phase.lens);
      i += 1;
      timer = window.setTimeout(play, phase.ms);
    };
    timer = window.setTimeout(play, 0);
    const stop = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-testid="demo-toggle"]')) return;
      setWantRun(false);
    };
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, stop));
      setDemoLens(false);
      setActiveId(null);
    };
  }, [running, subjectId]);

  const move = useCallback((by: number) => {
    setStep((s) => Math.min(STEP_COUNT - 1, Math.max(0, s + by)));
  }, []);
  const lastWheel = useRef({ at: 0, moved: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || typing(e.target) || ui.get().view === "robot") return;
      const vertical = wide && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "PageDown" || e.key === "PageUp");
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        if (e.key === "ArrowRight" || vertical) {
          e.preventDefault();
          move(1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        if (e.key === "ArrowLeft" || vertical) {
          e.preventDefault();
          move(-1);
        }
      } else if (wide && e.key === "Home") {
        setStep(0);
      } else if (wide && e.key === "End") {
        setStep(STEP_COUNT - 1);
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!wide || typing(e.target) || ui.get().view === "robot" || Math.abs(e.deltaY) < 12) return;
      const t = performance.now();
      const w = lastWheel.current;
      const gap = t - w.at;
      w.at = t;
      if (gap < 250 || t - w.moved < 650) return;
      w.moved = t;
      move(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [wide, move]);

  const count = (s: GlyphState) => all.filter((g) => g.state === s).length;
  const counts = { read: count("read"), misread: count("misread"), blocked: count("blocked"), unread: count("unread") };
  const misses = all.filter((g) => g.state === "misread" || g.state === "blocked");
  const taken = file ? formatDate(file.takenAt) : "";
  const twins = twinTally(letters, results);

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
  const active = activeId ? all.find((g) => g.id === activeId) : undefined;
  const hint = active
    ? `${active.name}: ${STATE_WORDS[active.state]}. Click to open its test.`
    : "Hover a letter. Click one to see what TestSprite did with it.";

  return (
    <div className="exam" data-testid="chart-page" data-intro={intro}>
      <TopBar home />
      <div className="scene">
        <div className="story-col">
          <Story
            step={step}
            onStep={setStep}
            ready={ready}
            total={all.length}
            counts={counts}
            misses={misses}
            subject={subject}
            fraction={subjectId ? fractionOfLetter(rows, subjectId) : null}
            results={results}
            subjectState={subjectState}
            subjectLensState={subjectLensState}
            lens={subjectLens}
            lensOn={subjectId !== null && lensOn.has(subjectId)}
            demoLens={previewId !== null}
            onToggleLens={() => subjectId && toggleLens(subjectId)}
            running={running}
            canRun={canRun}
            onDemo={setWantRun}
            paused={paused}
            onPause={() => ui.setPaused(!paused)}
          />
          <section className="sheet" aria-label="All letters">
            <div className="sheet-head">
              <h2>Answer sheet, {all.length} letters</h2>
              <span>Click a letter</span>
            </div>
            <ChartKey rows={rows} activeId={chartActive} onActive={setActiveId} />
          </section>
        </div>
        <div className="stage-col">
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
                  onActive={setActiveId}
                  onOpen={openLetter}
                  onReady={markReady}
                  dials={NO_DIALS}
                  onToggleLens={sceneToggle}
                />
              </Suspense>
            </SceneBoundary>
          </section>
          <div className="plaque-block">
            <p className="chart-hint" data-active={String(Boolean(active))} data-testid="chart-hint">
              {hint}
            </p>
            <div className="readout">
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
            </div>
          </div>
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
      </div>
    </div>
  );
}
