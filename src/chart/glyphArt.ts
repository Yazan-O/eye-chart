export const INK = "#0e1822";
export const ACCENT = "#ff5a1f";
export const LAMP = "#ffc95c";
export const LAMP_INK = "#8a5a00";
export const BLOCKED_INK = "#5b7084";
export const SKY = "#6bb4ee";
export const PANEL = "#f6fbff";
export const GLYPH_FONT = '"Albert Sans", "Helvetica Neue", Arial, sans-serif';

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

export function drawGlyph(canvas: HTMLCanvasElement, glyph: string): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const size = canvas.width;
  let fontSize = size * 0.74;
  ctx.font = `700 ${fontSize}px ${GLYPH_FONT}`;
  const width = ctx.measureText(glyph).width;
  if (width > size * 0.7) {
    fontSize *= (size * 0.7) / width;
    ctx.font = `700 ${fontSize}px ${GLYPH_FONT}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.fillText(glyph, size / 2, size * 0.53);
}

export function drawGlow(canvas: HTMLCanvasElement): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const c = canvas.width / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, "rgba(255, 201, 92, 0.85)");
  g.addColorStop(0.45, "rgba(255, 201, 92, 0.32)");
  g.addColorStop(1, "rgba(255, 201, 92, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawHatch(canvas: HTMLCanvasElement): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const s = canvas.width;
  ctx.strokeStyle = BLOCKED_INK;
  ctx.lineWidth = s * 0.018;
  for (let x = -s; x < s * 2; x += s * 0.09) {
    ctx.beginPath();
    ctx.moveTo(x, s);
    ctx.lineTo(x + s, 0);
    ctx.stroke();
  }
  ctx.setLineDash([s * 0.06, s * 0.04]);
  ctx.lineWidth = s * 0.03;
  ctx.strokeRect(s * 0.03, s * 0.03, s * 0.94, s * 0.94);
}

export function drawGrain(canvas: HTMLCanvasElement): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const { width, height } = canvas;
  const img = ctx.createImageData(width, height);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = 236 + ((seed % 1000) / 1000) * 19;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function drawLabel(canvas: HTMLCanvasElement, text: string, color: string): void {
  const ctx = context(canvas);
  if (!ctx) return;
  ctx.font = `500 ${canvas.height * 0.62}px ${GLYPH_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width - 4, canvas.height / 2);
}
