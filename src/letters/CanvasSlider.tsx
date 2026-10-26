import { useEffect, useRef, useState } from "react";
import type { LetterProps } from "./types";

const WIDTH = 640;
const HEIGHT = 120;
const LEFT = 20;
const TRACK = 600;
const TRACK_Y = 50;

const STEP_KEYS: Record<string, number | "min" | "max"> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
  PageUp: 10,
  PageDown: -10,
  Home: "min",
  End: "max",
};

export function valueAt(x: number) {
  return Math.max(0, Math.min(100, Math.round(((x - LEFT) / TRACK) * 100)));
}

function draw(ctx: CanvasRenderingContext2D, value: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#2a3354";
  ctx.fillRect(LEFT, TRACK_Y - 4, TRACK, 8);
  ctx.fillStyle = "#4f7cff";
  ctx.fillRect(LEFT, TRACK_Y - 4, (TRACK * value) / 100, 8);
  ctx.fillStyle = "#c8d0ea";
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let v = 0; v <= 100; v += 10) {
    const x = LEFT + (TRACK * v) / 100;
    ctx.fillRect(x - 1, TRACK_Y + 10, 2, 8);
    ctx.fillText(String(v), x, TRACK_Y + 36);
  }
  ctx.beginPath();
  ctx.arc(LEFT + (TRACK * value) / 100, TRACK_Y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#4f7cff";
  ctx.stroke();
}

export default function CanvasSlider({ variant }: LetterProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [value, setValue] = useState(50);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) draw(ctx, value);
  }, [value]);

  function update(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setValue(valueAt(((e.clientX - rect.left) * WIDTH) / rect.width));
  }

  const shown = variant === "broken" ? 100 - value : value;
  const lens = variant === "lens";

  function key(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const step = STEP_KEYS[e.key];
    if (step === undefined) return;
    e.preventDefault();
    setValue((v) => Math.max(0, Math.min(100, step === "min" ? 0 : step === "max" ? 100 : v + step)));
  }

  return (
    <div className="letter-widget">
      <canvas
        ref={canvas}
        width={WIDTH}
        height={HEIGHT}
        className="letter-canvas"
        tabIndex={lens ? 0 : undefined}
        role={lens ? "slider" : undefined}
        aria-label={lens ? "Value" : undefined}
        aria-valuemin={lens ? 0 : undefined}
        aria-valuemax={lens ? 100 : undefined}
        aria-valuenow={lens ? value : undefined}
        onKeyDown={lens ? key : undefined}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (dragging.current) update(e);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      />
      {lens ? (
        <label className="letter-sr">
          Value slider
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.currentTarget.value))}
          />
        </label>
      ) : null}
      <p className="letter-readout">Value: {shown}</p>
    </div>
  );
}
