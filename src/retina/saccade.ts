export const SHAKE_PX = 1.5;
const FX = 2.3;
const FY = 3.1;
const PHASE = 0.9;

export function offsetAt(t: number): { x: number; y: number } {
  return {
    x: SHAKE_PX * Math.sin(2 * Math.PI * FX * t),
    y: SHAKE_PX * Math.cos(2 * Math.PI * FY * t + PHASE),
  };
}

export function velocityAt(t: number): { x: number; y: number } {
  return {
    x: SHAKE_PX * 2 * Math.PI * FX * Math.cos(2 * Math.PI * FX * t),
    y: -SHAKE_PX * 2 * Math.PI * FY * Math.sin(2 * Math.PI * FY * t + PHASE),
  };
}
