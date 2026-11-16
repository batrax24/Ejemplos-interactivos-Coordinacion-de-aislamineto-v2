import type { Experiment } from './types';
import { overvoltageExperiments } from './defs/overvoltages';
import { lightningExperiments } from './defs/lightning';
import { insulationExperiments } from './defs/insulation';
import { protectionExperiments } from './defs/protection';
import { protection2Experiments } from './defs/protection2';

export const EXPERIMENTS: Experiment[] = [
  ...overvoltageExperiments,
  ...lightningExperiments,
  ...insulationExperiments,
  ...protectionExperiments,
  ...protection2Experiments,
];

export const EXPERIMENT_BY_ID = new Map(EXPERIMENTS.map((e) => [e.id, e]));

export function getExperiment(id: string): Experiment | undefined {
  return EXPERIMENT_BY_ID.get(id);
}

export function experimentsFor(ids: string[]): Experiment[] {
  return ids.map((id) => EXPERIMENT_BY_ID.get(id)).filter((e): e is Experiment => Boolean(e));
}
