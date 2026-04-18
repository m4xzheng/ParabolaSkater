import { levelOneConfig } from '../config/levelOne';
import { createCoordinateMapper } from '../math/coordinates';
import { classifyAValue, evaluateParabola } from '../math/parabola';
import type { RunOutcome, SimulationFrame, SimulationResult } from './types';

const FRAME_COUNT = 25;

const coordinateMapper = createCoordinateMapper({
  width: 800,
  height: 500,
  origin: { x: 400, y: 280 },
  pixelsPerUnit: 60,
});

const outcomeSummary: Record<RunOutcome, string> = {
  success: 'Nice work: this parabola gives a smooth jump arc.',
  'opens-down': 'Try a positive a so the parabola opens upward.',
  'too-flat': 'Increase a a bit so the jump gains more height.',
  'too-steep': 'Lower a a little so the jump is easier to control.',
};

export function runSimulation(input: { a: number }): SimulationResult {
  if (!Number.isFinite(input.a)) {
    throw new TypeError('runSimulation requires a finite numeric a value');
  }

  const outcome = classifyOutcome(input.a);

  return {
    a: input.a,
    outcome,
    summary: outcomeSummary[outcome],
    frames: buildFrames(input.a),
  };
}

function classifyOutcome(a: number): RunOutcome {
  const aValueClass = classifyAValue(a);

  if (aValueClass === 'opens-down') {
    return 'opens-down';
  }

  if (a < levelOneConfig.thresholds.successMin) {
    return 'too-flat';
  }

  if (a > levelOneConfig.thresholds.successMax) {
    return 'too-steep';
  }

  return 'success';
}

function buildFrames(a: number): SimulationFrame[] {
  const { xMin, xMax } = levelOneConfig.domain;
  const xStep = (xMax - xMin) / (FRAME_COUNT - 1);

  return Array.from({ length: FRAME_COUNT }, (_, index) => {
    const progress = round(index / (FRAME_COUNT - 1));
    const mathPosition = {
      x: round(xMin + xStep * index),
      y: round(evaluateParabola(a, xMin + xStep * index)),
    };

    return {
      index,
      progress,
      state: {
        mathPosition,
        screenPosition: coordinateMapper.toScreen(mathPosition),
        slope: round(2 * a * mathPosition.x),
      },
    };
  });
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
