import type { MathPoint, VertexParameters } from '../math/parabola';

export type LevelId = 'level-one' | 'level-two';
export type LevelOneParameters = { a: number };
export type LevelTwoParameters = VertexParameters;

export type LevelTwoDiagnosticCode =
  | 'a-opens-down'
  | 'a-too-flat'
  | 'a-too-steep'
  | 'vertex-left'
  | 'vertex-right'
  | 'vertex-above'
  | 'vertex-below'
  | 'left-contact-high'
  | 'left-contact-low'
  | 'right-contact-high'
  | 'right-contact-low';

export type LevelTwoDiagnostic = {
  code: LevelTwoDiagnosticCode;
  message: string;
};

export type RunOutcome =
  | 'success'
  | 'opens-down'
  | 'too-flat'
  | 'too-steep'
  | 'misses-track'
  | 'level-two-diagnostics';
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
  levelId: LevelId;
  parameters: LevelOneParameters | LevelTwoParameters;
  a: number;
  outcome: RunOutcome;
  messageKey: OutcomeMessageKey;
  summary: string;
  diagnostics: LevelTwoDiagnostic[];
  sampling: SimulationSampling;
  frames: SimulationFrame[];
};
