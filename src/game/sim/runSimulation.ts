import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import {
  classifyAValue,
  evaluateParabola,
  evaluateVertexParabola,
  getVertex,
  sampleParabolaPoints,
  sampleVertexParabolaPoints,
  type MathPoint,
} from '../math/parabola';
import type {
  FrameMotion,
  FrameState,
  LevelTwoDiagnostic,
  LevelTwoParameters,
  OutcomeMessageKey,
  RunOutcome,
  SimulationFrame,
  SimulationResult,
  SimulationSampling,
} from './types';

const LANDING_CLEARANCE = 0.12;
const LEVEL_TWO_MESSAGE_KEY = 'simulation.level-two-diagnostics' as OutcomeMessageKey;
type LevelOneOutcome = Exclude<RunOutcome, 'level-two-diagnostics'>;

const outcomeSummary: Record<
  LevelOneOutcome,
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
    levelId: 'level-one',
    parameters: { a: input.a },
    a: input.a,
    outcome,
    messageKey: feedback.messageKey,
    summary: feedback.summary,
    diagnostics: [],
    sampling,
    frames: buildFrames(input.a, outcome, sampling),
  };
}

export function runLevelTwoSimulation(parameters: LevelTwoParameters): SimulationResult {
  validateLevelTwoParameters(parameters);

  const diagnostics = getLevelTwoDiagnostics(parameters);
  const outcome: RunOutcome =
    diagnostics.length === 0 ? 'success' : 'level-two-diagnostics';
  const sampling = getLevelTwoSampling();

  return {
    levelId: 'level-two',
    parameters,
    a: parameters.a,
    outcome,
    messageKey: outcome === 'success' ? 'simulation.success' : LEVEL_TWO_MESSAGE_KEY,
    summary:
      outcome === 'success'
        ? '顶点已经进入目标圆，左右平台也对齐了。'
        : diagnostics.map((diagnostic) => diagnostic.message).join(' '),
    diagnostics,
    sampling,
    frames: buildLevelTwoFrames(parameters, outcome, sampling),
  };
}

function classifyOutcome(a: number): LevelOneOutcome {
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
  outcome: LevelOneOutcome,
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

function validateLevelTwoParameters(parameters: LevelTwoParameters): void {
  if (
    !Number.isFinite(parameters.a) ||
    !Number.isFinite(parameters.h) ||
    !Number.isFinite(parameters.k)
  ) {
    throw new TypeError('runLevelTwoSimulation requires finite numeric a, h, and k values');
  }
}

function getLevelTwoDiagnostics(parameters: LevelTwoParameters): LevelTwoDiagnostic[] {
  const diagnostics: LevelTwoDiagnostic[] = [];

  if (parameters.a <= 0) {
    diagnostics.push({
      code: 'a-opens-down',
      message: '开口方向不对，必须向上打开。',
    });
  } else if (parameters.a < levelTwoConfig.thresholds.a.min) {
    diagnostics.push({
      code: 'a-too-flat',
      message: '开口偏平。',
    });
  } else if (parameters.a > levelTwoConfig.thresholds.a.max) {
    diagnostics.push({
      code: 'a-too-steep',
      message: '开口偏陡。',
    });
  }

  const vertex = getVertex(parameters);
  const target = levelTwoConfig.targetVertex;
  const dx = vertex.x - target.x;
  const dy = vertex.y - target.y;
  const distance = Math.hypot(dx, dy);
  const axisThreshold = target.radius * 0.35;

  if (distance > target.radius) {
    if (dx < -axisThreshold) {
      diagnostics.push({
        code: 'vertex-left',
        message: '顶点偏左。',
      });
    } else if (dx > axisThreshold) {
      diagnostics.push({
        code: 'vertex-right',
        message: '顶点偏右。',
      });
    }

    if (dy < -axisThreshold) {
      diagnostics.push({
        code: 'vertex-below',
        message: '顶点偏低。',
      });
    } else if (dy > axisThreshold) {
      diagnostics.push({
        code: 'vertex-above',
        message: '顶点偏高。',
      });
    }
  }

  addContactDiagnostic(diagnostics, {
    actual: evaluateVertexParabola(parameters, levelTwoConfig.geometry.leftContactX),
    expected: levelTwoConfig.platforms.start.y,
    tolerance: levelTwoConfig.thresholds.platformTolerance,
    highCode: 'left-contact-high',
    highMessage: '左侧接入点偏高。',
    lowCode: 'left-contact-low',
    lowMessage: '左侧接入点偏低。',
  });

  addContactDiagnostic(diagnostics, {
    actual: evaluateVertexParabola(parameters, levelTwoConfig.geometry.rightContactX),
    expected: levelTwoConfig.platforms.goal.y,
    tolerance: levelTwoConfig.thresholds.platformTolerance,
    highCode: 'right-contact-high',
    highMessage: '右侧到达点偏高。',
    lowCode: 'right-contact-low',
    lowMessage: '右侧到达点偏低。',
  });

  return diagnostics;
}

function addContactDiagnostic(
  diagnostics: LevelTwoDiagnostic[],
  input: {
    actual: number;
    expected: number;
    tolerance: number;
    highCode: LevelTwoDiagnostic['code'];
    highMessage: string;
    lowCode: LevelTwoDiagnostic['code'];
    lowMessage: string;
  },
): void {
  const delta = input.actual - input.expected;

  if (delta > input.tolerance) {
    diagnostics.push({
      code: input.highCode,
      message: input.highMessage,
    });
  } else if (delta < -input.tolerance) {
    diagnostics.push({
      code: input.lowCode,
      message: input.lowMessage,
    });
  }
}

function buildLevelTwoFrames(
  parameters: LevelTwoParameters,
  outcome: RunOutcome,
  sampling: SimulationSampling,
): SimulationFrame[] {
  const startPlatform = levelTwoConfig.platforms.start;
  const goalPlatform = levelTwoConfig.platforms.goal;
  const trackStart = getLevelTwoTrackPoint(parameters, levelTwoConfig.geometry.leftContactX);
  const trackGoal = getLevelTwoTrackPoint(parameters, levelTwoConfig.geometry.rightContactX);

  if (outcome === 'success') {
    return finalizeFrames(
      mergeStateLists(
        buildLinearStates(startPlatform, trackStart, 5, 'drop'),
        buildLevelTwoTrackStates(parameters, trackStart.x, trackGoal.x, sampling.frameStep),
        buildLinearStates(trackGoal, goalPlatform, 4, 'jump'),
      ),
    );
  }

  const vertex = getVertex(parameters);
  const rideEndX = Math.min(trackGoal.x, round(vertex.x + 1.2));
  const crashPoint = {
    x: round(Math.min(levelTwoConfig.geometry.rightContactX, vertex.x + 1.4)),
    y: round(vertex.y - 1.8),
  };

  return finalizeFrames(
    mergeStateLists(
      buildLinearStates(startPlatform, trackStart, 5, 'drop'),
      buildLevelTwoTrackStates(parameters, trackStart.x, rideEndX, sampling.frameStep),
      buildLinearStates(getLevelTwoTrackPoint(parameters, vertex.x), crashPoint, 4, 'crash'),
    ),
  );
}

function buildLevelTwoTrackStates(
  parameters: LevelTwoParameters,
  xMin: number,
  xMax: number,
  step: number,
): FrameState[] {
  return sampleVertexParabolaPoints({
    parameters,
    xMin,
    xMax,
    step,
  }).map((mathPosition) => ({
    motion: 'ride',
    mathPosition: {
      x: round(mathPosition.x),
      y: round(mathPosition.y),
    },
    slope: round(2 * parameters.a * (mathPosition.x - parameters.h)),
  }));
}

function getLevelTwoTrackPoint(parameters: LevelTwoParameters, x: number): MathPoint {
  return {
    x: round(x),
    y: round(evaluateVertexParabola(parameters, x)),
  };
}

function getLevelTwoSampling(): SimulationSampling {
  const frameStep = round(
    levelTwoConfig.domain.sampleStep * levelTwoConfig.simulation.frameSampleStride,
  );

  return {
    domainSampleStep: levelTwoConfig.domain.sampleStep,
    frameSampleStride: levelTwoConfig.simulation.frameSampleStride,
    frameStep,
  };
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
