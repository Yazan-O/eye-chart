export type IntroMode = "full" | "lamp" | "none";

const KEY = "eye-chart-intro";

let decided: IntroMode | null = null;
let shown = false;

function firstMode(): IntroMode {
  try {
    if (window.sessionStorage.getItem(KEY) === "1") return "lamp";
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    return "full";
  }
  return "full";
}

export function introMode(still: boolean): IntroMode {
  if (still) return "none";
  decided ??= firstMode();
  return shown ? "lamp" : decided;
}

export function markIntroShown(): void {
  shown = true;
}

export const LAMP_MS = 300;
export const FOCUS_START = 300;
export const FOCUS_MS = 1400;
export const LAND_START = 1700;
export const PLAQUE_AT = 2600;

export function introEnd(mode: IntroMode): number {
  if (mode === "full") return 2900;
  if (mode === "lamp") return 600;
  return 0;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function expoOut(x: number): number {
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
}

export function power2Out(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

export function backOut(x: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
}

export interface IntroClock {
  mode: IntroMode;
  rows: number;
  skipAt: number | null;
}

function stagger(rows: number, cap: number, span: number): number {
  return Math.min(cap, span / Math.max(1, rows));
}

function settle(clock: IntroClock, t: number, p: number): number {
  if (clock.skipAt === null) return p;
  return Math.max(p, clamp01((t - clock.skipAt) / 150));
}

export function lampAt(clock: IntroClock, t: number): number {
  if (clock.mode === "none") return 1;
  const span = clock.mode === "lamp" ? 600 : LAMP_MS;
  return settle(clock, t, power2Out(clamp01(t / span)));
}

export function focusAt(clock: IntroClock, t: number, row: number): number {
  if (clock.mode !== "full") return 0;
  const start = FOCUS_START + row * stagger(clock.rows, 80, 640);
  return 1 - settle(clock, t, expoOut(clamp01((t - start) / FOCUS_MS)));
}

export function landAt(clock: IntroClock, t: number, row: number, ms: number): number {
  if (clock.mode !== "full") return 1;
  const start = LAND_START + row * stagger(clock.rows, 90, 720);
  return settle(clock, t, clamp01((t - start) / ms));
}

export function introDone(clock: IntroClock, t: number): boolean {
  if (clock.skipAt !== null && t - clock.skipAt >= 150) return true;
  return t >= introEnd(clock.mode);
}
