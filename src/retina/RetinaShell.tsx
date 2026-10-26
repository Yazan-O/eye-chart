import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { readPage } from "../agent/accessibility";
import type { AgentNode } from "../agent/accessibility";
import { lensResult } from "../core/derive";
import { useStillMotion } from "../core/motion";
import { ui, useUi } from "../core/store";
import { useLetters, useReadings } from "../data/hooks";
import EventField from "./EventField";
import { leaveSensor, OVERLAY } from "./control";
import { countSensor } from "./sampler";

const SCAN_END_MS = 1300;

export const CAPTION =
  "A camera that only sees change. Built from this page’s own structure, one half of what an agent reads (it also reads screenshots); an illustration, not TestSprite’s internals.";

function skip(el: Element): boolean {
  return el.hasAttribute(OVERLAY) || el.hasAttribute("data-sensor-ignore");
}

function useSensorNodes(): AgentNode[] {
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const { pathname } = useLocation();
  useEffect(() => {
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setNodes(readPage(document.body, { skip })));
    };
    read();
    const timer = window.setInterval(read, 1000);
    const observer = new ResizeObserver(read);
    observer.observe(document.body);
    window.addEventListener("scroll", read, { capture: true, passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("scroll", read, { capture: true });
      window.removeEventListener("resize", read);
    };
  }, [pathname]);
  return nodes;
}

function useAppearDelays(nodes: AgentNode[], still: boolean) {
  const first = useRef(true);
  const marked = useRef(new Set<HTMLElement>());
  useEffect(() => {
    const height = window.innerHeight || 1;
    nodes.forEach((n) => {
      const el = n.el;
      if (n.kind === "void" || !(el instanceof HTMLElement) || marked.current.has(el)) return;
      const delay = still || !first.current ? 0 : 420 + Math.min(1, Math.max(0, n.box.y / height)) * 880;
      el.style.setProperty("--appear", `${Math.round(delay)}ms`);
      el.setAttribute("data-sensed", "");
      marked.current.add(el);
    });
    if (nodes.length > 0) first.current = false;
  }, [nodes, still]);
  useEffect(() => {
    const set = marked.current;
    return () => {
      set.forEach((el) => {
        el.removeAttribute("data-sensed");
        el.style.removeProperty("--appear");
      });
      set.clear();
    };
  }, []);
}

export default function Sensor() {
  const nodes = useSensorNodes();
  const still = useStillMotion();
  const { compare } = useUi();
  const { letters } = useLetters();
  const { file } = useReadings();
  useAppearDelays(nodes, still);

  useEffect(() => {
    if (still) {
      ui.setReady(true);
      return;
    }
    const id = window.setTimeout(() => ui.setReady(true), SCAN_END_MS);
    return () => window.clearTimeout(id);
  }, [still]);

  const results = useMemo(() => file?.results ?? [], [file]);
  const lensRows = useMemo(
    () => letters.filter((l) => lensResult(l.id, results) !== "none"),
    [letters, results],
  );
  const fixed = useMemo(
    () =>
      new Set(compare ? lensRows.filter((l) => lensResult(l.id, results) === "fixed").map((l) => l.id) : []),
    [compare, lensRows, results],
  );

  const counts = countSensor(nodes);
  const total = letters.length;
  const canvasWord = counts.canvases === 1 ? "1 canvas" : `${counts.canvases} canvases`;
  const line = `${canvasWord}. ${counts.lettersInside} of ${total} letters inside ${counts.canvases === 1 ? "it" : "them"}.`;

  return (
    <div className="retina" {...{ [OVERLAY]: "" }} data-testid="agent-overlay">
      <EventField nodes={nodes} still={still} fixed={fixed} />
      {!still && <div className="scanline" aria-hidden="true" />}
      <div className="retina-panel">
        <p className="retina-count" data-testid="sensor-count" style={{ ["--chars" as string]: line.length }}>
          {line}
        </p>
        <p className="retina-caption" data-testid="sensor-caption">
          {CAPTION}
        </p>
        <div className="retina-actions">
          <button type="button" className="button" onClick={leaveSensor} data-testid="agent-exit">
            Back to human eyes
          </button>
          {lensRows.length > 0 && (
            <button
              type="button"
              className="button button--quiet"
              aria-pressed={compare}
              onClick={() => ui.setCompare(!compare)}
              data-testid="compare-toggle"
            >
              Compare with lenses (recorded results)
            </button>
          )}
        </div>
      </div>
      <p className="visually-hidden" role="status" aria-live="polite" data-testid="agent-summary">
        Sensor view. {counts.parts} parts found. {canvasWord}, {counts.lettersInside} of {total} letters
        inside {counts.canvases === 1 ? "it" : "them"}.
      </p>
    </div>
  );
}

