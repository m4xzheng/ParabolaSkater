import type { MathPoint } from '../math/parabola';

export type RunOutcome =
  | 'success'
  | 'opens-down'
  | 'too-flat'
  | 'too-steep'
  | 'misses-track';
export type OutcomeMessageKey = `simulation.${RunOutcome}`;

export type FrameMotion = 'drop' | 'ride' | 'jump' | 'crash';

export type FrameState = {
  mathPosition: MathPoint;
  slope: number;
  motion: FrameMotion;
};

export type SimulationFrame = {
  index: number;
  progress: number;
  state: FrameState;
};

export type SimulationSampling = {
  domainSampleStep: number;
  frameSampleStride: number;
  frameStep: number;
};

export type SimulationResult = {
  a: number;
  outcome: RunOutcome;
  messageKey: OutcomeMessageKey;
  summary: string;
  sampling: SimulationSampling;
  frames: SimulationFrame[];
};
