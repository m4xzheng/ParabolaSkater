import type { ScreenPoint } from '../math/coordinates';
import type { MathPoint } from '../math/parabola';

export type RunOutcome = 'success' | 'opens-down' | 'too-flat' | 'too-steep';

export type FrameState = {
  mathPosition: MathPoint;
  screenPosition: ScreenPoint;
  slope: number;
};

export type SimulationFrame = {
  index: number;
  progress: number;
  state: FrameState;
};

export type SimulationResult = {
  a: number;
  outcome: RunOutcome;
  summary: string;
  frames: SimulationFrame[];
};
