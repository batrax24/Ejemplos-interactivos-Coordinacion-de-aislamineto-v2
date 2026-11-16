import type { ComponentType } from 'react';
import type { SourceKey } from '../content/bibliography';

export type Params = Record<string, number>;
export type Derived = Record<string, number>;
export type Tone = 'neutral' | 'ok' | 'warn' | 'bad';

export type Reading = { label: string; value: string; sub?: string; tone?: Tone };

/** `info` marca un límite del modelo o una advertencia: se muestra sin ✓/✕. */
export type CheckItem = { label: string; ok: boolean; detail?: string; info?: boolean };

export type ParamDef = {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  def: number;
  decimals?: number;
  help?: string;
  options?: { value: number; label: string }[];
};

export type Preset = { id: string; label: string; note?: string; values: Params };

export type Goal = {
  id: string;
  /**
   * 'requisito' (por defecto): debe cumplirse en el estado actual al validar.
   * 'exploracion': hito que debe haberse alcanzado alguna vez durante la sesión
   * (reproducir el ejemplo, ver el caso opuesto, etc.).
   */
  kind?: 'requisito' | 'exploracion';
  label: string;
  test: (p: Params, d: Derived) => boolean;
  detail: (p: Params, d: Derived) => string;
};

export type Quiz = {
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
};

export type Learn = {
  /** Qué fenómeno físico se está mirando. */
  phenomenon: string;
  /** Qué debe el estudiante poder explicar al terminar el experimento. */
  objective: string;
  /** Dónde mirar para convencerse: escena, gráfica o lectura. */
  watch: string[];
  /** Error clásico que el juego desactiva. */
  misconception: string;
  /** Límite del modelo, dicho sin rodeos. */
  model?: string;
};

export type SceneProps = { p: Params; d: Derived; t: number };
export type PlotProps = { p: Params; d: Derived };

export type Experiment = {
  id: string;
  topicId: number;
  title: string;
  tagline: string;
  why: string;
  params: ParamDef[];
  presets: Preset[];
  compute: (p: Params) => Derived;
  readings: (d: Derived, p: Params) => Reading[];
  equations: (p: Params, d: Derived) => string[];
  checks?: (p: Params, d: Derived) => CheckItem[];
  goals: Goal[];
  quiz?: Quiz;
  learn: Learn;
  sources: SourceKey[];
  notes?: string[];
  scene: ComponentType<SceneProps>;
  plot: ComponentType<PlotProps>;
};

export const defaults = (e: Experiment): Params =>
  Object.fromEntries(e.params.map((p) => [p.id, p.def])) as Params;

export const presetParams = (e: Experiment, presetId: string): Params => {
  const base = defaults(e);
  const preset = e.presets.find((x) => x.id === presetId);
  return preset ? { ...base, ...preset.values } : base;
};
