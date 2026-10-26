import { useEffect, useRef } from "react";
import type { AgentNode } from "../agent/accessibility";
import { PixelModel } from "./pixelModel";
import { codeOf, perimeter, samplePoints } from "./sampler";
import type { EdgePoint } from "./sampler";
import { offsetAt, velocityAt } from "./saccade";

const CAP = 12000;
const LIFE = 0.26;
const BUCKETS = 5;
const ON = "#ff6a2b";
const OFF = "#2fc8ff";
const BLOCKED = "#8fa3b5";
const SCAN_START = 0.42;
const SCAN_SPAN = 0.88;

function ease(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

export function scanY(t: number, height: number): number {
  const k = Math.min(1, Math.max(0, (t - SCAN_START) / SCAN_SPAN));
  return ease(k) * height;
}

function outline(ctx: CanvasRenderingContext2D, n: AgentNode, dash: number[], color: string) {
  ctx.strokeStyle = color;
  ctx.setLineDash(dash);
  ctx.strokeRect(n.box.x + 0.5, n.box.y + 0.5, n.box.w - 1, n.box.h - 1);
}

export function drawStill(ctx: CanvasRenderingContext2D, nodes: AgentNode[], fixed: ReadonlySet<string>) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 1.5;
  nodes.forEach((n) => {
    if (n.kind === "void") return;
    const code = codeOf(n, fixed);
    if (code === "read" || code === "fixed") outline(ctx, n, [], OFF);
    else if (code === "blocked") outline(ctx, n, [6, 4], BLOCKED);
    else if (code === "unread") outline(ctx, n, [1.5, 4], BLOCKED);
    else if (code === "misread") {
      outline(ctx, n, [], ON);
      ctx.strokeRect(n.box.x + 3.5, n.box.y + 3.5, n.box.w - 7, n.box.h - 7);
    } else outline(ctx, n, [], n.kind === "control" ? OFF : "rgba(207, 230, 247, 0.45)");
  });
  ctx.setLineDash([]);
}

export default function EventField({
  nodes,
  still,
  fixed,
  onFrame,
}: {
  nodes: AgentNode[];
  still: boolean;
  fixed: ReadonlySet<string>;
  onFrame?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef(nodes);
  const fixedRef = useRef(fixed);
  const bornRef = useRef<number | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
    fixedRef.current = fixed;
  }, [nodes, fixed]);

  useEffect(() => {
    if (!still) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawStill(ctx, nodesRef.current, fixedRef.current);
    onFrame?.();
  }, [still, nodes, fixed, onFrame]);

  useEffect(() => {
    if (still) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = Math.ceil(vw / 2);
    canvas.height = Math.ceil(vh / 2);
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const xs = new Float32Array(CAP);
    const ys = new Float32Array(CAP);
    const ats = new Float32Array(CAP);
    const ons = new Uint8Array(CAP);
    let head = 0;
    let count = 0;
    const onPaths: number[][] = Array.from({ length: BUCKETS }, () => []);
    const offPaths: number[][] = Array.from({ length: BUCKETS }, () => []);
    const push = (x: number, y: number, on: boolean, at: number) => {
      xs[head] = x;
      ys[head] = y;
      ons[head] = on ? 1 : 0;
      ats[head] = at;
      head = (head + 1) % CAP;
      count = Math.min(CAP, count + 1);
    };

    let built: AgentNode[] | null = null;
    let builtFixed: ReadonlySet<string> | null = null;
    let model: PixelModel | null = null;
    let byNode: EdgePoint[][] = [];
    let lastScan = 0;
    let last = 0;
    let frame = 0;

    const rebuild = () => {
      built = nodesRef.current;
      builtFixed = fixedRef.current;
      const points = samplePoints(built, builtFixed);
      model = new PixelModel(points, 1, vw, vh, vw < 768 ? 300 : 600);
      byNode = built.map(() => []);
      points.forEach((p) => byNode[p.node]?.push(p));
    };

    const tick = (stamp: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (bornRef.current === null) bornRef.current = stamp;
      const t = (stamp - bornRef.current) / 1000;
      const dt = last === 0 ? 1 / 60 : Math.min(0.05, (stamp - last) / 1000);
      last = stamp;
      if (built !== nodesRef.current || builtFixed !== fixedRef.current) rebuild();
      if (!model || !built) return;

      const scan = scanY(t, vh);
      if (scan > lastScan) {
        built.forEach((n, i) => {
          if (n.box.y > lastScan && n.box.y <= scan) {
            model!.burst(byNode[i] ?? [], Math.min(220, Math.round(perimeter(n) / 3)), t).forEach((e) =>
              push(e.x, e.y, e.on, e.at),
            );
          }
        });
        lastScan = scan;
      }
      model.step(t, dt, velocityAt(t), offsetAt(t)).forEach((e) => push(e.x, e.y, e.on, e.at));

      ctx.clearRect(0, 0, vw, vh);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = BLOCKED;
      built.forEach((n) => {
        if (codeOf(n, builtFixed ?? undefined) === "blocked") {
          ctx.strokeRect(n.box.x + 0.5, n.box.y + 0.5, n.box.w - 1, n.box.h - 1);
        }
      });
      ctx.setLineDash([]);
      for (let pass = 0; pass < 2; pass++) {
        const size = pass === 0 ? 6 : 2;
        const half = size / 2;
        for (let b = 0; b < BUCKETS; b++) onPaths[b]!.length = offPaths[b]!.length = 0;
        for (let i = 0; i < count; i++) {
          const age = t - ats[i]!;
          if (age < 0 || age > (pass === 0 ? LIFE : LIFE * 3)) continue;
          const b = Math.min(BUCKETS - 1, Math.floor((1 - Math.exp(-age / LIFE)) * BUCKETS));
          (ons[i] ? onPaths : offPaths)[b]!.push(i);
        }
        for (let b = 0; b < BUCKETS; b++) {
          const alpha = Math.exp(-((b + 0.5) / BUCKETS) * 3) * (pass === 0 ? 0.12 : 1);
          ctx.globalAlpha = alpha;
          for (const [list, color] of [
            [onPaths[b]!, ON],
            [offPaths[b]!, OFF],
          ] as const) {
            if (list.length === 0) continue;
            ctx.fillStyle = color;
            for (const i of list) {
              ctx.fillRect(Math.round(xs[i]! / 2) * 2 - half, Math.round(ys[i]! / 2) * 2 - half, size, size);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
      onFrame?.();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [still, onFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="event-field"
      aria-hidden="true"
      data-sensor-ignore=""
      data-testid="event-field"
    />
  );
}
