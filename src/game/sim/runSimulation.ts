import { levelOneConfig } from '../config/levelOne';
import { classifyAValue, evaluateParabola, sampleParabolaPoints, type MathPoint } from '../math/parabola';
import type {
  FrameMotion,
  FrameState,
  OutcomeMessageKey,
  RunOutcome,
  SimulationFrame,
  SimulationResult,
  SimulationSampling,
} from './types';

const LANDING_CLEARANCE = 0.12;

const outcomeSummary: Record<
  RunOutcome,
  { messageKey: OutcomeMessageKey; summary: string }
> = {
  success: {
    messageKey: 'simulation.success',
    summary: '做得不错，这条抛物线刚好形成平稳的谷底滑道。',
  },
  'opens-down': {
    messageKey: 'simulation.opens-down',
    summary: '试着让 a 变成正数，这样抛物线才会向上托成谷底。',
  },
  'too-flat': {
    messageKey: 'simulation.too-flat',
    summary: '把 a 再调大一点，让轨道下探得更明显，速度才带得起来。',
  },
  'too-steep': {
    messageKey: 'simulation.too-steep',
    summary: '把 a 再调小一点，轨道会更顺，也更容易滑过去。',
  },
  'misses-track': {
    messageKey: 'simulation.misses-track',
    summary: '起跳后没有接到滑道，这条抛物线已经抬得太高了。',
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
    frames: buildFrames(input.a, outcome, sampling),
  };
}

function classifyOutcome(a: number): RunOutcome {
  const landingPoint = getTrackStart(a);

  if (landingPoint.y >= levelOneConfig.platforms.start.y - LANDING_CLEARANCE) {
    return 'misses-track';
  }

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

function buildFrames(
  a: number,
  outcome: RunOutcome,
  sampling: SimulationSampling,
): SimulationFrame[] {
  const startPlatform = levelOneConfig.platforms.start;
  const goalPlatform = levelOneConfig.platforms.goal;
  const trackStart = getTrackStart(a);
  const trackGoal = getTrackGoal(a);

  if (outcome === 'misses-track') {
    return finalizeFrames(
      buildLinearStates(
        startPlatform,
        {
          x: startPlatform.x,
          y: startPlatform.y - 4.4,
        },
        7,
        'drop',
      ),
    );
  }

  if (outcome === 'success') {
    return finalizeFrames(
      mergeStateLists(
        buildLinearStates(startPlatform, trackStart, 5, 'drop'),
        buildTrackStates(a, trackStart.x, trackGoal.x, sampling.frameStep),
        buildLinearStates(trackGoal, goalPlatform, 4, 'jump'),
      ),
    );
  }

  if (outcome === 'opens-down') {
    const slipPoint = getTrackPoint(a, -0.6);
    const crashPoint = {
      x: 0.1,
      y: slipPoint.y - 2.6,
    };

    return finalizeFrames(
      mergeStateLists(
        buildLinearStates(startPlatform, trackStart, 5, 'drop'),
        buildTrackStates(a, trackStart.x, slipPoint.x, sampling.frameStep),
        buildLinearStates(slipPoint, crashPoint, 4, 'crash'),
      ),
    );
  }

  if (outcome === 'too-flat') {
    const stallPoint = getTrackPoint(a, 1.2);
    const crashPoint = {
      x: 1.55,
      y: stallPoint.y - 1.8,
    };

    return finalizeFrames(
      mergeStateLists(
        buildLinearStates(startPlatform, trackStart, 5, 'drop'),
        buildTrackStates(a, trackStart.x, stallPoint.x, sampling.frameStep),
        buildLinearStates(stallPoint, crashPoint, 4, 'crash'),
      ),
    );
  }

  const wipeoutPoint = getTrackPoint(a, 1.75);
  const crashPoint = {
    x: 2.05,
    y: wipeoutPoint.y - 1.7,
  };

  return finalizeFrames(
    mergeStateLists(
      buildLinearStates(startPlatform, trackStart, 5, 'drop'),
      buildTrackStates(a, trackStart.x, wipeoutPoint.x, sampling.frameStep),
      buildLinearStates(wipeoutPoint, crashPoint, 4, 'crash'),
    ),
  );
}

function buildTrackStates(
  a: number,
  xMin: number,
  xMax: number,
  step: number,
): FrameState[] {
  return sampleParabolaPoints({
    a,
    xMin,
    xMax,
    step,
  }).map((mathPosition) => ({
    motion: 'ride',
    mathPosition: {
      x: round(mathPosition.x),
      y: round(mathPosition.y),
    },
    slope: round(2 * a * mathPosition.x),
  }));
}

function buildLinearStates(
  from: MathPoint,
  to: MathPoint,
  count: number,
  motion: FrameMotion,
): FrameState[] {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1);

    return {
      motion,
      mathPosition: {
        x: round(from.x + (to.x - from.x) * progress),
        y: round(from.y + (to.y - from.y) * progress),
      },
      slope: 0,
    };
  });
}

function mergeStateLists(...segments: FrameState[][]): FrameState[] {
  return segments.reduce<FrameState[]>((allStates, segment, segmentIndex) => {
    if (segmentIndex === 0) {
      return [...segment];
    }

    return [...allStates, ...segment.slice(1)];
  }, []);
}

function finalizeFrames(states: FrameState[]): SimulationFrame[] {
  return states.map((state, index) => ({
    index,
    progress: states.length === 1 ? 1 : round(index / (states.length - 1)),
    state,
  }));
}

function getTrackStart(a: number): MathPoint {
  return getTrackPoint(a, levelOneConfig.geometry.spawnX);
}

function getTrackGoal(a: number): MathPoint {
  return getTrackPoint(a, levelOneConfig.geometry.landingX);
}

function getTrackPoint(a: number, x: number): MathPoint {
  return {
    x: round(x),
    y: round(evaluateParabola(a, x)),
  };
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
