export type Solved = { stars: number; attempts: number; hint: boolean; at: number };

export type Progress = {
  xp: number;
  solved: Record<string, Solved>;
  quiz: Record<string, string>;
  visits: string[];
  version: 2;
};

const KEY = 'labca.v2.progress';
const BACKUP = 'labca.v2.progress.backup';

export const emptyProgress = (): Progress => ({ xp: 0, solved: {}, quiz: {}, visits: [], version: 2 });

function safeParse(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<Progress>;
    if (!o || typeof o !== 'object' || o.version !== 2) return null;
    return {
      xp: Number(o.xp) || 0,
      solved: (o.solved && typeof o.solved === 'object' ? o.solved : {}) as Record<string, Solved>,
      quiz: (o.quiz && typeof o.quiz === 'object' ? o.quiz : {}) as Record<string, string>,
      visits: Array.isArray(o.visits) ? (o.visits as string[]) : [],
      version: 2,
    };
  } catch {
    return null;
  }
}

export function loadProgress(): { progress: Progress; recovered: boolean } {
  try {
    const main = safeParse(localStorage.getItem(KEY));
    if (main) return { progress: main, recovered: false };
    const backup = safeParse(localStorage.getItem(BACKUP));
    if (backup) return { progress: backup, recovered: true };
  } catch {
    /* almacenamiento bloqueado: se juega sin guardar */
  }
  return { progress: emptyProgress(), recovered: false };
}

export function saveProgress(p: Progress): void {
  try {
    const raw = JSON.stringify(p);
    localStorage.setItem(KEY, raw);
    localStorage.setItem(BACKUP, raw);
  } catch {
    /* modo privado o iframe: no se guarda */
  }
}

export function resetProgress(): Progress {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP);
  } catch {
    /* nada */
  }
  return emptyProgress();
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2);
}

export function importProgress(text: string): Progress | null {
  const p = safeParse(text);
  if (!p) return null;
  return p;
}

export function starsFor(attempts: number, hint: boolean): number {
  if (hint) return attempts <= 2 ? 2 : 1;
  if (attempts <= 0) return 3;
  if (attempts <= 2) return 2;
  return 1;
}

export const RANKS = [
  { min: 0, name: 'Aprendiz de campo' },
  { min: 120, name: 'Auxiliar de diseño' },
  { min: 260, name: 'Analista de aislamiento' },
  { min: 420, name: 'Ingeniero de coordinación' },
  { min: 600, name: 'Especialista en sobretensiones' },
];

export function rankFor(xp: number): { name: string; next?: number; pct: number; index: number } {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const span = next ? next.min - current.min : 1;
  const pct = next ? Math.min(100, ((xp - current.min) / span) * 100) : 100;
  return { name: current.name, next: next?.min, pct, index };
}
