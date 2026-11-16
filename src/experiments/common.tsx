import { C, text } from '../lib/draw';

/** Clasificación de una sobretensión por el tiempo de frente (µs). */
export function classifyFront(tFront: number, tTail: number): 'atmosférica' | 'maniobra' | 'temporal' {
  if (tTail >= 8000 || tFront >= 3000) return 'temporal';
  if (tFront <= 20) return 'atmosférica';
  return 'maniobra';
}

export const FRONT_COLOR = {
  atmosférica: C.violet,
  maniobra: C.amber,
  temporal: C.bad,
} as const;

/** Etiqueta de esquina reutilizable en las escenas. */
export function corner(ctx: CanvasRenderingContext2D, title: string, sub?: string) {
  text(ctx, title, 14, 20, { size: 12.5, weight: 700, color: C.ink });
  if (sub) text(ctx, sub, 14, 36, { size: 10.5, color: C.muted });
}
