import { useEffect, useRef } from "react";
import { isBroken } from "./types";
import type { LetterProps } from "./types";

export const BARS = [
  { day: "Mon", value: 40 },
  { day: "Tue", value: 80 },
  { day: "Wed", value: 60 },
] as const;

const W = 480;
const H = 320;
const LEFT = 56;
const BOTTOM = 280;
const TOP = 40;

export function drawnValue(value: number, broken: boolean) {
  return broken && value === 80 ? 20 : value;
}

export default function CanvasChart({ variant }: LetterProps) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const span = BOTTOM - TOP;
    ctx.clearRect(0, 0, W, H);
    ctx.font = "14px system-ui, sans-serif";
    ctx.strokeStyle = "#2a3354";
    ctx.fillStyle = "#c8d0ea";
    ctx.textAlign = "right";
    for (let v = 0; v <= 100; v += 25) {
      const y = BOTTOM - (span * v) / 100;
      ctx.beginPath();
      ctx.moveTo(LEFT, y);
      ctx.lineTo(W - 16, y);
      ctx.stroke();
      ctx.fillText(`${v}%`, LEFT - 8, y + 5);
    }
    ctx.textAlign = "center";
    BARS.forEach((b, i) => {
      const x = LEFT + 40 + i * 130;
      const h = (span * drawnValue(b.value, isBroken(variant))) / 100;
      ctx.fillStyle = "#4f7cff";
      ctx.fillRect(x, BOTTOM - h, 70, h);
      ctx.fillStyle = "#e8ecf8";
      ctx.fillText(`${b.value}%`, x + 35, TOP - 14);
      ctx.fillText(b.day, x + 35, BOTTOM + 24);
    });
  }, [variant]);

  return (
    <div className="letter-widget">
      <canvas ref={canvas} width={W} height={H} className="letter-canvas" />
    </div>
  );
}
