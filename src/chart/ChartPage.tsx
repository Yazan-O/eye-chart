import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildRows } from "../data/chart";
import { useLetters, useReadings } from "../data/hooks";
import { STATE_WORDS } from "../data/readings";
import type { GlyphState } from "../data/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import GlyphMark from "../components/GlyphMark";
import SceneBoundary from "../components/SceneBoundary";
import TopBar from "../components/TopBar";
import ChartKey from "./ChartKey";

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

  const rows = useMemo(() => buildRows(letters, file?.results ?? []), [letters, file]);
  const all = rows.flatMap((r) => r.glyphs);
  const readCount = all.filter((g) => g.state === "read").length;
  const taken = file ? formatDate(file.takenAt) : "";

  let summary = "Not read yet.";
  if (!ready) summary = "Loading the readings.";
  else if (file && all.length > 0) {
    summary = `Read correctly: ${readCount} of ${all.length} letters${taken ? `, measured ${taken}` : ""}.`;
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
              />
            </Suspense>
          </SceneBoundary>
        </section>
      </main>
    </div>
  );
}
