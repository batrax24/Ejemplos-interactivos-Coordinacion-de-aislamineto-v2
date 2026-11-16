/* Primitivas de dibujo compartidas por las escenas (canvas 2D). */

export const C = {
  bg: '#071019',
  panel: '#0b1824',
  grid: 'rgba(120,190,220,0.10)',
  ink: '#e6f1f5',
  muted: '#8fb0bf',
  accent: '#38e1c6',
  amber: '#ffc857',
  bad: '#ff6b6b',
  ok: '#56e08b',
  steel: '#9fb8c6',
  phase: '#7fc8ff',
  guard: '#ffd479',
  earth: '#a8896a',
  violet: '#b79bff',
};

export function fitCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } {
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(320, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d no disponible');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

export function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#08131f');
  g.addColorStop(1, '#061019');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  const step = 28;
  ctx.beginPath();
  for (let x = 0; x < w; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y < h; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { color?: string; size?: number; align?: CanvasTextAlign; mono?: boolean; weight?: number; alpha?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color ?? C.ink;
  ctx.font = `${o.weight ?? 500} ${o.size ?? 12}px ${o.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'system-ui, -apple-system, Segoe UI, sans-serif'}`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: { color?: string; width?: number; dash?: number[]; alpha?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? C.steel;
  ctx.lineWidth = o.width ?? 1.5;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, o: { fill?: string; stroke?: string; width?: number; alpha?: number } = {}) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.width ?? 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = C.accent, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.accent, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(ctx, x1, y1, x2, y2, { color, width });
  const s = 6 + width;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
  ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Cota con extremos y etiqueta centrada. */
export function dimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  color = C.amber,
) {
  line(ctx, x1, y1, x2, y2, { color, width: 1.2 });
  const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const tick = 5;
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ]) {
    line(ctx, x - tick * Math.cos(a), y - tick * Math.sin(a), x + tick * Math.cos(a), y + tick * Math.sin(a), { color, width: 1.2 });
  }
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const flip = Math.abs(ang) > Math.PI / 2;
  const off = 12;
  text(ctx, label, mx + off * Math.cos(a) * (flip ? -1 : 1), my + off * Math.sin(a) * (flip ? -1 : 1), {
    color,
    size: 11,
    mono: true,
    align: 'center',
  });
}

/** Torre esquemática de celosía. */
export function tower(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  height: number,
  o: { width?: number; crossarms?: { y: number; half: number }[]; color?: string; alpha?: number } = {},
) {
  const color = o.color ?? C.steel;
  const w = o.width ?? Math.max(10, height * 0.13);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // patas
  ctx.moveTo(x - w, groundY);
  ctx.lineTo(x - w * 0.34, groundY - height * 0.62);
  ctx.lineTo(x - w * 0.2, groundY - height);
  ctx.moveTo(x + w, groundY);
  ctx.lineTo(x + w * 0.34, groundY - height * 0.62);
  ctx.lineTo(x + w * 0.2, groundY - height);
  // cruces
  ctx.moveTo(x - w * 0.2, groundY - height);
  ctx.lineTo(x + w * 0.2, groundY - height);
  for (let i = 0; i < 5; i++) {
    const y1 = groundY - (height * i) / 5;
    const y2 = groundY - (height * (i + 0.5)) / 5;
    ctx.moveTo(x - w * (1 - 0.62 * (i / 5)), y1);
    ctx.lineTo(x + w * (1 - 0.62 * ((i + 0.5) / 5)), y2);
    ctx.moveTo(x + w * (1 - 0.62 * (i / 5)), y1);
    ctx.lineTo(x - w * (1 - 0.62 * ((i + 0.5) / 5)), y2);
  }
  for (const arm of o.crossarms ?? []) {
    ctx.moveTo(x - arm.half, groundY - arm.y);
    ctx.lineTo(x + arm.half, groundY - arm.y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Cadena de aisladores inclinada. */
export function insulatorChain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  step: number,
  angleDeg: number,
  o: { color?: string; disc?: string; flash?: number; highlightPath?: boolean } = {},
) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const shown = Math.max(2, Math.min(n, 16));
  const st = step * (n / shown);
  for (let i = 0; i < shown; i++) {
    const cx = x + dx * st * (i + 0.5);
    const cy = y + dy * st * (i + 0.5);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-a);
    ctx.strokeStyle = o.color ?? C.steel;
    ctx.fillStyle = o.disc ?? 'rgba(180,205,220,0.30)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, step * 0.32, step * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  line(ctx, x, y, x + dx * step * n, y + dy * step * n, { color: o.color ?? C.steel, width: 1.2, alpha: 0.8 });
  if (o.flash !== undefined && o.flash > 0.2) {
    const mid = 0.5;
    glow(ctx, x + dx * step * n * mid, y + dy * step * n * mid, 22, C.accent, o.flash * 0.8);
    // arco
    ctx.save();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n2 = 6;
    for (let i = 0; i <= n2; i++) {
      const p = i / n2;
      const px = x + dx * step * n * p + Math.sin(p * 12) * 4;
      const py = y + dy * step * n * p + Math.cos(p * 9) * 3;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function rayo(ctx: CanvasRenderingContext2D, x: number, yTop: number, yBottom: number, seed = 3, color = C.violet, width = 2.2) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  const seg = 9;
  for (let i = 1; i <= seg; i++) {
    const p = i / seg;
    const xj = x + (rnd() - 0.5) * 22;
    ctx.lineTo(xj, yTop + (yBottom - yTop) * p);
  }
  ctx.stroke();
  ctx.restore();
}

export function person(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color = C.amber) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y - h, h * 0.18, 0, Math.PI * 2);
  ctx.moveTo(x, y - h * 0.82);
  ctx.lineTo(x, y - h * 0.42);
  ctx.moveTo(x - h * 0.28, y - h * 0.70);
  ctx.lineTo(x + h * 0.28, y - h * 0.70);
  ctx.moveTo(x, y - h * 0.42);
  ctx.lineTo(x - h * 0.24, y);
  ctx.moveTo(x, y - h * 0.42);
  ctx.lineTo(x + h * 0.24, y);
  ctx.stroke();
  ctx.restore();
}

/** Suelo con estratos y electrodos. */
export function soil(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, layers = 3) {
  const cols = ['rgba(120,86,58,0.55)', 'rgba(96,70,48,0.55)', 'rgba(72,54,40,0.55)', 'rgba(52,42,34,0.55)'];
  for (let i = 0; i < layers; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(x, y + (h * i) / layers, w, h / layers);
  }
  line(ctx, x, y, x + w, y, { color: C.earth, width: 2 });
}

/** Onda en coordenadas de datos, útil para mini trazas dentro de la escena. */
export function trace(
  ctx: CanvasRenderingContext2D,
  fn: (u: number) => number,
  x: number,
  y: number,
  w: number,
  h: number,
  color = C.accent,
  samples = 140,
  width = 1.8,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const v = fn(u);
    const px = x + u * w;
    const py = y + h - Math.max(-1.1, Math.min(1.1, v)) * h * 0.46;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

export function badge(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = C.accent) {
  ctx.save();
  ctx.font = '600 10px ui-monospace, monospace';
  const w = ctx.measureText(s).width + 12;
  ctx.fillStyle = 'rgba(6,16,25,0.72)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y - 8, w, 16, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x + 6, y + 0.5);
  ctx.restore();
}
