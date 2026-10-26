import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildRows } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { STATE_WORDS } from "../data/readings";
import type { GlyphState } from "../data/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
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

export default function ChartPage() {
  const { letters } = useLetters();
  const { file, ready } = useReadings();
  const reduced = usePrefersReducedMotion();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const lensParam = params.get("lens") ?? "";

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
      })),
    [withLens, lensOn],
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
  const readCount = all.filter((g) => g.state === "read").length;
  const taken = file ? formatDate(file.takenAt) : "";

  let summary = "Not read yet.";
  if (!ready) summary = "Loading the readings.";
  else if (file && all.length > 0) {
    const lensWords =
      lensOn.size === 0 ? "" : lensOn.size === 1 ? "With 1 lens on. " : `With ${lensOn.size} lenses on. `;
    summary = `${lensWords}Read correctly: ${readCount} of ${all.length} letters${taken ? `, measured ${taken}` : ""}.`;
  }

  const flatFallback = <div className="chart-flat" data-testid="chart-flat" />;

  return (
    <div className="room" data-testid="chart-page">
      <TopBar />
      <main className="room-main">
        <section className="room-head">
          <h1 className="display" data-testid="heading">
            Eye Chart
          </h1>
          <p className="lead" data-testid="tagline">
            An eye exam for TestSprite&rsquo;s AI tester. Every letter is a live widget, built
            twice: once working, once broken.
          </p>
          <p className="summary" data-testid="reading-summary">
            {summary}
          </p>
        </section>
        <section className="room-key" aria-label="Chart key">
          <ul className="legend" aria-label="How to read the chart" data-testid="legend">
            {LEGEND.map((s) => (
              <li key={s}>
                <GlyphMark glyph="E" state={s} />
                <span>{STATE_WORDS[s]}</span>
              </li>
            ))}
          </ul>
          <ChartKey rows={rows} activeId={activeId} onActive={setActiveId} />
        </section>
        <section
          className="room-chart"
          aria-label="Lit eye chart"
          data-testid="scene"
          data-reduced={String(reduced)}
        >
          <SceneBoundary fallback={flatFallback}>
            <Suspense fallback={flatFallback}>
              <ChartScene
                rows={rows}
                activeId={activeId}
                reduced={reduced}
                onActive={setActiveId}
                onOpen={(id) => navigate(`/letter/${id}`)}
                dials={dials}
                onToggleLens={toggleLens}
              />
            </Suspense>
          </SceneBoundary>
          <LensDials
            dials={dials}
            activeId={activeId}
            onToggle={toggleLens}
            onReset={() => setLenses(new Set())}
            onActive={setActiveId}
          />
        </section>
      </main>
    </div>
  );
}
