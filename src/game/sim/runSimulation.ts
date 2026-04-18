import { levelOneConfig } from '../config/levelOne';
import { classifyAValue, sampleParabolaPoints } from '../math/parabola';
import type {
  OutcomeMessageKey,
  RunOutcome,
  SimulationFrame,
  SimulationResult,
  SimulationSampling,
} from './types';

const outcomeSummary: Record<
  RunOutcome,
  { messageKey: OutcomeMessageKey; summary: string }
> = {
  success: {
    messageKey: 'simulation.success',
    summary: 'Nice work: this parabola makes a smooth valley track.',
  },
  'opens-down': {
    messageKey: 'simulation.opens-down',
    summary: 'Try a positive a so the parabola opens upward into a valley.',
  },
  'too-flat': {
    messageKey: 'simulation.too-flat',
    summary: 'Increase a a bit so the track dips enough to build speed.',
  },
  'too-steep': {
    messageKey: 'simulation.too-steep',
    summary: 'Lower a a little so the track is easier to ride.',
  },
};

export function runSimulation(input: { a: number }): SimulationResult {
  if (!Number.isFinite(input.a)) {
    throw new TypeError('runSimulation requires a finite numeric a value');
  }

  const outcome = classifyOutcome(input.a);
  const sampling = getSampling();
  const feedback = outcomeSummary[outcome];

  return {
    a: input.a,
    outcome,
    messageKey: feedback.messageKey,
    summary: feedback.summary,
    sampling,
    frames: buildFrames(input.a, sampling),
  };
}

function classifyOutcome(a: number): RunOutcome {
  const aValueClass = classifyAValue(a);

  if (aValueClass === 'opens-down') {
    return 'opens-down';
  }

  if (aValueClass === 'too-flat') {
    return 'too-flat';
  }

  if (aValueClass === 'too-steep') {
    return 'too-steep';
  }

  if (a < levelOneConfig.thresholds.success.min) {
    return 'too-flat';
  }

  if (a > levelOneConfig.thresholds.success.max) {
    return 'too-steep';
  }

  return 'success';
}

function buildFrames(a: number, sampling: SimulationSampling): SimulationFrame[] {
  const mathPoints = sampleParabolaPoints({
    a,
    xMin: levelOneConfig.geometry.spawnX,
    xMax: levelOneConfig.geometry.landingX,
    step: sampling.frameStep,
  });

  return mathPoints.map((mathPosition, index) => {
    const progress = round(index / (mathPoints.length - 1));

    return {
      index,
      progress,
      state: {
        mathPosition: {
          x: round(mathPosition.x),
          y: round(mathPosition.y),
        },
        slope: round(2 * a * mathPosition.x),
      },
    };
  });
}

function getSampling(): SimulationSampling {
  const frameStep = round(
    levelOneConfig.domain.sampleStep * levelOneConfig.simulation.frameSampleStride,
  );

  return {
    domainSampleStep: levelOneConfig.domain.sampleStep,
    frameSampleStride: levelOneConfig.simulation.frameSampleStride,
    frameStep,
  };
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
