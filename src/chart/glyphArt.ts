import type { GlyphState } from "../data/types";

export const INK = "#0e1822";
export const ACCENT = "#ff5a1f";
export const GLYPH_FONT = '"Albert Sans", "Helvetica Neue", Arial, sans-serif';

export function drawGlyph(
  canvas: HTMLCanvasElement,
  glyph: string,
  state: GlyphState,
  active: boolean,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  let fontSize = size * 0.78;
  ctx.font = `700 ${fontSize}px ${GLYPH_FONT}`;
  const width = ctx.measureText(glyph).width;
  if (width > size * 0.82) {
    fontSize *= (size * 0.82) / width;
    ctx.font = `700 ${fontSize}px ${GLYPH_FONT}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = size / 2;
  const cy = size * 0.5;

  if (state === "unread") {
    ctx.lineWidth = size * 0.022;
    ctx.strokeStyle = INK;
    ctx.strokeText(glyph, cx, cy);
  } else {
    ctx.globalAlpha = state === "blocked" ? 0.2 : 1;
    ctx.fillStyle = INK;
    ctx.fillText(glyph, cx, cy);
    ctx.globalAlpha = 1;
  }

  if (state === "misread") {
    ctx.strokeStyle = ACCENT;
    ctx.lineCap = "butt";
    ctx.lineWidth = size * 0.07;
    ctx.beginPath();
    ctx.moveTo(size * 0.06, cy + size * 0.04);
    ctx.lineTo(size * 0.94, cy - size * 0.04);
    ctx.stroke();
  }

  if (state === "blocked") {
    const r = size * 0.11;
    const mx = size * 0.82;
    const my = size * 0.18;
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.moveTo(mx - r * 0.7, my + r * 0.7);
    ctx.lineTo(mx + r * 0.7, my - r * 0.7);
    ctx.stroke();
  }

  if (active) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(size * 0.2, size * 0.93, size * 0.6, size * 0.05);
  }
}

export function drawLabel(
  canvas: HTMLCanvasElement,
  text: string,
  color: string,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `500 ${canvas.height * 0.62}px ${GLYPH_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width - 4, canvas.height / 2);
}
