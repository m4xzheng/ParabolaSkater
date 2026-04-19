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

export type LevelOneOutcome =
  | 'success'
  | 'opens-down'
  | 'too-flat'
  | 'too-steep'
  | 'misses-track';

export type LevelTwoOutcome = 'success' | 'level-two-diagnostics';

export type RunOutcome = LevelOneOutcome | LevelTwoOutcome;
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

export type LevelOneSimulationResult = {
  levelId: 'level-one';
  parameters: LevelOneParameters;
  a: number;
  outcome: LevelOneOutcome;
  messageKey: OutcomeMessageKey;
  summary: string;
  diagnostics: [];
  sampling: SimulationSampling;
  frames: SimulationFrame[];
};

export type LevelTwoSimulationResult = {
  levelId: 'level-two';
  parameters: LevelTwoParameters;
  a: number;
  outcome: LevelTwoOutcome;
  messageKey: OutcomeMessageKey;
  summary: string;
  diagnostics: LevelTwoDiagnostic[];
  sampling: SimulationSampling;
  frames: SimulationFrame[];
};

export type SimulationResult =
  | LevelOneSimulationResult
  | LevelTwoSimulationResult;
