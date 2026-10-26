import type { AgentNode } from "../agent/accessibility";

export type EdgeCode = "plain" | "read" | "misread" | "blocked" | "unread" | "fixed";

export interface EdgePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  contrast: number;
  code: EdgeCode;
  node: number;
}

export const SPACING = 6;

const CONTRAST = { control: 1, text: 0.55, void: 0 } as const;

export function codeOf(node: AgentNode, fixed: ReadonlySet<string> = new Set()): EdgeCode {
  if (!node.letterId) return "plain";
  if (node.state === "misread" && fixed.has(node.letterId)) return "fixed";
  if (node.state === "read" || node.state === "misread" || node.state === "blocked") return node.state;
  return "unread";
}

export function contrastOf(node: AgentNode, code: EdgeCode): number {
  if (code === "unread" || code === "blocked") return 0;
  return CONTRAST[node.kind];
}

export function samplePoints(nodes: AgentNode[], fixed: ReadonlySet<string> = new Set()): EdgePoint[] {
  const out: EdgePoint[] = [];
  nodes.forEach((node, index) => {
    const code = codeOf(node, fixed);
    const contrast = contrastOf(node, code);
    const { x, y, w, h } = node.box;
    const push = (px: number, py: number, nx: number, ny: number) =>
      out.push({ x: px, y: py, nx, ny, contrast, code, node: index });
    for (let d = 0; d <= w; d += SPACING) {
      push(x + d, y, 0, -1);
      push(x + d, y + h, 0, 1);
    }
    for (let d = SPACING; d < h; d += SPACING) {
      push(x, y + d, -1, 0);
      push(x + w, y + d, 1, 0);
    }
  });
  return out;
}

export function perimeter(node: AgentNode): number {
  return 2 * (node.box.w + node.box.h);
}

export interface SensorCounts {
  parts: number;
  canvases: number;
  lettersInside: number;
}

export function countSensor(nodes: AgentNode[]): SensorCounts {
  const voids = nodes.filter((n) => n.kind === "void");
  const letters = new Set<string>();
  voids.forEach((v) => {
    v.el?.querySelectorAll("[data-letter-id]").forEach((el) => {
      const id = el.getAttribute("data-letter-id");
      if (id) letters.add(id);
    });
  });
  return {
    parts: nodes.length - voids.length,
    canvases: voids.length,
    lettersInside: letters.size,
  };
}
