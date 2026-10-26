import type { EdgePoint } from "./sampler";

export interface SensorEvent {
  x: number;
  y: number;
  on: boolean;
  at: number;
}

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NOISE_PER_10K = 0.4;
export const FLICKER_HZ = 2;
export const RATE = 12;

export class PixelModel {
  private acc: Float32Array;
  private rand: () => number;
  private noiseDebt = 0;
  private points: EdgePoint[];
  private width: number;
  private height: number;
  private cap: number;

  constructor(points: EdgePoint[], seed: number, width: number, height: number, cap = 1200) {
    this.points = points;
    this.width = width;
    this.height = height;
    this.cap = cap;
    this.acc = new Float32Array(points.length);
    this.rand = seeded(seed);
    for (let i = 0; i < this.acc.length; i++) this.acc[i] = this.rand();
  }

  step(t: number, dt: number, v: { x: number; y: number }, offset = { x: 0, y: 0 }): SensorEvent[] {
    const out: SensorEvent[] = [];
    const flip = Math.floor(t * FLICKER_HZ) % 2 === 1;
    for (let i = 0; i < this.points.length && out.length < this.cap; i++) {
      const p = this.points[i]!;
      if (p.contrast === 0) continue;
      const dot = p.nx * v.x + p.ny * v.y;
      const acc = this.acc[i]! + (p.contrast * Math.abs(dot) * dt) / RATE;
      if (acc >= 1) {
        this.acc[i] = acc - 1;
        let on = dot >= 0;
        if (p.code === "misread" && flip) on = !on;
        out.push({ x: p.x + offset.x, y: p.y + offset.y, on, at: t });
      } else {
        this.acc[i] = acc;
      }
    }
    this.noiseDebt += ((NOISE_PER_10K * this.width * this.height) / 10000) * dt;
    while (this.noiseDebt >= 1) {
      this.noiseDebt -= 1;
      out.push({ x: this.rand() * this.width, y: this.rand() * this.height, on: this.rand() < 0.5, at: t });
    }
    return out;
  }

  burst(nodePoints: EdgePoint[], count: number, t: number): SensorEvent[] {
    const live = nodePoints.filter((p) => p.contrast > 0);
    if (live.length === 0) return [];
    const out: SensorEvent[] = [];
    for (let i = 0; i < count; i++) {
      const p = live[Math.floor(this.rand() * live.length)]!;
      out.push({ x: p.x, y: p.y, on: this.rand() < 0.5, at: t });
    }
    return out;
  }
}
