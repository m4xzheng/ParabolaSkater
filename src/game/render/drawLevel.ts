import { levelOneConfig } from '../config/levelOne';
import { createCoordinateMapper } from '../math/coordinates';
import { evaluateParabola, sampleParabolaPoints, type MathPoint } from '../math/parabola';
import type { FrameMotion, SimulationFrame, SimulationResult } from '../sim/types';
import type { SessionPhase } from '../state/feedback';

const CANVAS_PADDING = 40;
const PLATFORM_HALF_WIDTH = 0.92;

type RiderPose = 'idle' | 'drop' | 'ride' | 'success' | 'crash';

type RiderState = {
  mathPosition: MathPoint;
  slope: number;
  pose: RiderPose;
};

type MathBounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type Segment = {
  start: MathPoint;
  end: MathPoint;
};

type RiderSilhouette = {
  torso: Segment;
  arms: [Segment, Segment];
  legs: [Segment, Segment];
  hands: [MathPoint, MathPoint];
  feet: [MathPoint, MathPoint];
  headCenter: MathPoint;
  headRadius: number;
};

export function drawLevel(
  context: CanvasRenderingContext2D,
  input: {
    width: number;
    height: number;
    a: number;
    ghostResults: SimulationResult[];
    playbackProgress: number;
    phase: SessionPhase;
    showGhostTrails: boolean;
    simulationResult: SimulationResult | null;
  },
): void {
  const {
    width,
    height,
    a,
    ghostResults,
    playbackProgress,
    phase,
    showGhostTrails,
    simulationResult,
  } = input;

  const bounds = getSceneMathBounds(a);
  const mapper = createSceneMapper({ width, height, bounds });

  context.clearRect(0, 0, width, height);

  drawBackdrop(context, width, height);
  drawSceneDecorations(context, width, height);
  drawGrid(context, width, height, mapper, bounds);
  drawPlatforms(context, mapper, bounds);

  if (showGhostTrails) {
    drawGhostTrails(context, mapper, ghostResults);
  }

  drawParabola(context, mapper, a);
  drawMarkers(context, mapper);
  drawRider(context, mapper, getRiderState({ playbackProgress, phase, simulationResult }));
}

export function getPlatformAnchorPoints(): {
  start: MathPoint;
  goal: MathPoint;
} {
  return {
    start: levelOneConfig.platforms.start,
    goal: levelOneConfig.platforms.goal,
  };
}

export function getTrackAnchorPoints(a: number): {
  start: MathPoint;
  goal: MathPoint;
} {
  return {
    start: {
      x: levelOneConfig.geometry.spawnX,
      y: evaluateParabola(a, levelOneConfig.geometry.spawnX),
    },
    goal: {
      x: levelOneConfig.geometry.landingX,
      y: evaluateParabola(a, levelOneConfig.geometry.landingX),
    },
  };
}

export function getSceneMathBounds(a: number): MathBounds {
  const trackAnchors = getTrackAnchorPoints(a);
  const platformAnchors = getPlatformAnchorPoints();
  const points = sampleParabolaPoints({
    a,
    xMin: levelOneConfig.domain.xMin,
    xMax: levelOneConfig.domain.xMax,
    step: levelOneConfig.domain.sampleStep,
  });
  const yValues = points.map((point) => point.y);
  const yMin =
    Math.min(...yValues, trackAnchors.start.y, trackAnchors.goal.y, platformAnchors.goal.y, 0) -
    3;
  const yMax =
    Math.max(...yValues, trackAnchors.start.y, trackAnchors.goal.y, platformAnchors.start.y, 0) +
    4.5;

  return {
    xMin: levelOneConfig.domain.xMin,
    xMax: levelOneConfig.domain.xMax,
    yMin: round(yMin),
    yMax: round(yMax),
  };
}

export function createRiderSilhouette(pose: RiderPose): RiderSilhouette {
  if (pose === 'success') {
    return {
      torso: {
        start: { x: -1, y: -7 },
        end: { x: 2, y: -29 },
      },
      arms: [
        {
          start: { x: 1, y: -23 },
          end: { x: -12, y: -16 },
        },
        {
          start: { x: 2, y: -24 },
          end: { x: 15, y: -32 },
        },
      ],
      legs: [
        {
          start: { x: -1, y: -7 },
          end: { x: -12, y: 2 },
        },
        {
          start: { x: 4, y: -7 },
          end: { x: 11, y: 2 },
        },
      ],
      hands: [
        { x: -12, y: -16 },
        { x: 15, y: -32 },
      ],
      feet: [
        { x: -12, y: 2 },
        { x: 11, y: 2 },
      ],
      headCenter: { x: 5, y: -40 },
      headRadius: 8,
    };
  }

  if (pose === 'crash') {
    return {
      torso: {
        start: { x: -4, y: -6 },
        end: { x: 1, y: -26 },
      },
      arms: [
        {
          start: { x: 0, y: -21 },
          end: { x: -14, y: -9 },
        },
        {
          start: { x: 1, y: -22 },
          end: { x: 18, y: -15 },
        },
      ],
      legs: [
        {
          start: { x: -4, y: -6 },
          end: { x: -17, y: 7 },
        },
        {
          start: { x: 1, y: -6 },
          end: { x: 7, y: 10 },
        },
      ],
      hands: [
        { x: -14, y: -9 },
        { x: 18, y: -15 },
      ],
      feet: [
        { x: -17, y: 7 },
        { x: 7, y: 10 },
      ],
      headCenter: { x: 6, y: -34 },
      headRadius: 8,
    };
  }

  if (pose === 'drop') {
    return {
      torso: {
        start: { x: 0, y: -6 },
        end: { x: 0, y: -29 },
      },
      arms: [
        {
          start: { x: 0, y: -23 },
          end: { x: -10, y: -13 },
        },
        {
          start: { x: 0, y: -23 },
          end: { x: 10, y: -13 },
        },
      ],
      legs: [
        {
          start: { x: -1, y: -6 },
          end: { x: -9, y: 3 },
        },
        {
          start: { x: 1, y: -6 },
          end: { x: 9, y: 3 },
        },
      ],
      hands: [
        { x: -10, y: -13 },
        { x: 10, y: -13 },
      ],
      feet: [
        { x: -9, y: 3 },
        { x: 9, y: 3 },
      ],
      headCenter: { x: 0, y: -40 },
      headRadius: 8,
    };
  }

  if (pose === 'idle') {
    return {
      torso: {
        start: { x: -1, y: -7 },
        end: { x: 1, y: -28 },
      },
      arms: [
        {
          start: { x: 0, y: -22 },
          end: { x: -11, y: -18 },
        },
        {
          start: { x: 1, y: -22 },
          end: { x: 11, y: -20 },
        },
      ],
      legs: [
        {
          start: { x: -1, y: -7 },
          end: { x: -10, y: 2 },
        },
        {
          start: { x: 3, y: -7 },
          end: { x: 9, y: 2 },
        },
      ],
      hands: [
        { x: -11, y: -18 },
        { x: 11, y: -20 },
      ],
      feet: [
        { x: -10, y: 2 },
        { x: 9, y: 2 },
      ],
      headCenter: { x: 3, y: -38 },
      headRadius: 8,
    };
  }

  return {
    torso: {
      start: { x: -1, y: -7 },
      end: { x: 2, y: -29 },
    },
    arms: [
      {
        start: { x: 1, y: -23 },
        end: { x: -11, y: -16 },
      },
      {
        start: { x: 2, y: -23 },
        end: { x: 14, y: -18 },
      },
    ],
    legs: [
      {
        start: { x: -1, y: -7 },
        end: { x: -12, y: 2 },
      },
      {
        start: { x: 4, y: -7 },
        end: { x: 11, y: 2 },
      },
    ],
    hands: [
      { x: -11, y: -16 },
      { x: 14, y: -18 },
    ],
    feet: [
      { x: -12, y: 2 },
      { x: 11, y: 2 },
    ],
    headCenter: { x: 4, y: -39 },
    headRadius: 8,
  };
}

function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#dff4ff');
  gradient.addColorStop(0.48, '#f8fdff');
  gradient.addColorStop(1, '#f4ead3');

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawSceneDecorations(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.save();

  context.fillStyle = 'rgba(255, 244, 173, 0.92)';
  context.beginPath();
  context.arc(width - 110, 88, 34, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#c2dcb0';
  context.beginPath();
  context.moveTo(0, height * 0.56);
  context.lineTo(width * 0.18, height * 0.3);
  context.lineTo(width * 0.36, height * 0.56);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(width * 0.18, height * 0.56);
  context.lineTo(width * 0.42, height * 0.24);
  context.lineTo(width * 0.62, height * 0.56);
  context.closePath();
  context.fill();

  context.fillStyle = '#9dc58c';
  context.beginPath();
  context.moveTo(width * 0.45, height * 0.56);
  context.lineTo(width * 0.68, height * 0.28);
  context.lineTo(width, height * 0.56);
  context.closePath();
  context.fill();

  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mapper: ReturnType<typeof createCoordinateMapper>,
  bounds: MathBounds,
): void {
  const yStep = bounds.yMax - bounds.yMin > 14 ? 2 : 1;

  context.save();
  context.strokeStyle = 'rgba(71, 85, 105, 0.12)';
  context.lineWidth = 1;

  for (let x = Math.ceil(bounds.xMin); x <= Math.floor(bounds.xMax); x += 1) {
    const screenPoint = mapper.toScreen({ x, y: 0 });
    context.beginPath();
    context.moveTo(screenPoint.x, CANVAS_PADDING * 0.7);
    context.lineTo(screenPoint.x, height - CANVAS_PADDING * 0.35);
    context.stroke();
  }

  for (let y = Math.ceil(bounds.yMin); y <= Math.floor(bounds.yMax); y += yStep) {
    const screenPoint = mapper.toScreen({ x: 0, y });
    context.beginPath();
    context.moveTo(CANVAS_PADDING * 0.8, screenPoint.y);
    context.lineTo(width - CANVAS_PADDING * 0.8, screenPoint.y);
    context.stroke();
  }

  context.restore();
}

function drawPlatforms(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  bounds: MathBounds,
): void {
  const anchors = getPlatformAnchorPoints();
  const floorY = mapper.toScreen({ x: 0, y: bounds.yMin }).y + 26;

  drawPlatform(context, mapper, anchors.start, floorY, {
    top: '#f97316',
    deck: '#fdba74',
    support: '#7c2d12',
  });

  drawPlatform(context, mapper, anchors.goal, floorY, {
    top: '#22c55e',
    deck: '#86efac',
    support: '#166534',
  });
}

function drawPlatform(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  anchor: MathPoint,
  floorY: number,
  palette: {
    top: string;
    deck: string;
    support: string;
  },
): void {
  const left = mapper.toScreen({ x: anchor.x - PLATFORM_HALF_WIDTH, y: anchor.y }).x;
  const right = mapper.toScreen({ x: anchor.x + PLATFORM_HALF_WIDTH, y: anchor.y }).x;
  const anchorPoint = mapper.toScreen(anchor);
  const deckTop = anchorPoint.y - 12;
  const supportTop = deckTop + 14;

  context.save();

  context.fillStyle = 'rgba(15, 23, 42, 0.12)';
  context.beginPath();
  context.ellipse(anchorPoint.x, deckTop + 18, 56, 10, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = palette.support;
  context.fillRect(anchorPoint.x - 9, supportTop, 18, floorY - supportTop);

  context.fillStyle = palette.deck;
  context.fillRect(left, deckTop, right - left, 16);

  context.fillStyle = palette.top;
  context.fillRect(left, deckTop - 4, right - left, 8);

  context.restore();
}

function drawGhostTrails(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  ghostResults: SimulationResult[],
): void {
  ghostResults.forEach((result, index) => {
    const opacity = Math.min(0.28 + index * 0.12, 0.62);

    context.save();
    context.strokeStyle = `rgba(244, 114, 182, ${opacity.toFixed(2)})`;
    context.lineWidth = 3;
    context.setLineDash([10, 10]);
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.beginPath();

    result.frames.forEach((frame, frameIndex) => {
      const screenPoint = mapper.toScreen(frame.state.mathPosition);

      if (frameIndex === 0) {
        context.moveTo(screenPoint.x, screenPoint.y);
        return;
      }

      context.lineTo(screenPoint.x, screenPoint.y);
    });

    context.stroke();
    context.restore();
  });
}

function drawParabola(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  a: number,
): void {
  const points = sampleParabolaPoints({
    a,
    xMin: levelOneConfig.domain.xMin,
    xMax: levelOneConfig.domain.xMax,
    step: levelOneConfig.domain.sampleStep,
  });

  context.save();
  context.strokeStyle = '#2563eb';
  context.lineWidth = 5;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.beginPath();

  points.forEach((point, index) => {
    const screenPoint = mapper.toScreen(point);

    if (index === 0) {
      context.moveTo(screenPoint.x, screenPoint.y);
      return;
    }

    context.lineTo(screenPoint.x, screenPoint.y);
  });

  context.stroke();
  context.restore();
}

function drawMarkers(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
): void {
  const anchors = getPlatformAnchorPoints();
  const startPoint = mapper.toScreen(anchors.start);
  const goalPoint = mapper.toScreen(anchors.goal);

  context.save();
  context.font = '700 16px "Segoe UI", "Microsoft YaHei", sans-serif';
  context.fillStyle = '#0f172a';

  drawFlag(context, startPoint.x - 14, startPoint.y - 54, '#f97316');
  drawFlag(context, goalPoint.x + 8, goalPoint.y - 54, '#22c55e');

  context.fillText('起点平台', startPoint.x - 32, startPoint.y - 62);
  context.fillText('目标平台', goalPoint.x - 28, goalPoint.y - 62);
  context.restore();
}

function drawFlag(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  context.save();
  context.strokeStyle = '#334155';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x, y + 42);
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 24, y + 7);
  context.lineTo(x, y + 14);
  context.closePath();
  context.fill();
  context.restore();
}

function drawRider(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  rider: RiderState,
): void {
  const screenPoint = mapper.toScreen(rider.mathPosition);
  const boardAngle = rider.pose === 'drop' ? 0 : Math.atan(rider.slope);
  const poseAngle = rider.pose === 'crash' ? boardAngle + 0.58 : boardAngle;
  const silhouette = createRiderSilhouette(rider.pose);
  const boardColor = rider.pose === 'success' ? '#16a34a' : '#0f172a';

  context.save();
  context.translate(screenPoint.x, screenPoint.y - 2);
  context.rotate(poseAngle);

  context.strokeStyle = boardColor;
  context.lineWidth = 6;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-16, 0);
  context.lineTo(16, 0);
  context.stroke();

  context.fillStyle = '#0f172a';
  context.beginPath();
  context.arc(-10, 5, 3, 0, Math.PI * 2);
  context.arc(10, 5, 3, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#111827';
  context.lineWidth = 4;
  drawSegment(context, silhouette.torso);
  silhouette.arms.forEach((arm) => drawSegment(context, arm));
  silhouette.legs.forEach((leg) => drawSegment(context, leg));

  context.fillStyle = '#111827';
  silhouette.hands.forEach((hand) => drawPoint(context, hand, 2.6));
  silhouette.feet.forEach((foot) => drawPoint(context, foot, 2.8));

  context.fillStyle = rider.pose === 'success' ? '#16a34a' : '#111827';
  drawPoint(context, silhouette.headCenter, silhouette.headRadius);

  context.restore();
}

function drawSegment(
  context: CanvasRenderingContext2D,
  segment: Segment,
): void {
  context.beginPath();
  context.moveTo(segment.start.x, segment.start.y);
  context.lineTo(segment.end.x, segment.end.y);
  context.stroke();
}

function drawPoint(
  context: CanvasRenderingContext2D,
  point: MathPoint,
  radius: number,
): void {
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
}

function getRiderState(input: {
  playbackProgress: number;
  phase: SessionPhase;
  simulationResult: SimulationResult | null;
}): RiderState {
  if (input.phase === 'running' && input.simulationResult !== null) {
    const interpolated = interpolateFrame(input.simulationResult.frames, input.playbackProgress);
    return {
      mathPosition: interpolated.mathPosition,
      slope: interpolated.slope,
      pose: mapMotionToPose(interpolated.motion),
    };
  }

  if (input.simulationResult !== null) {
    const finalFrame = input.simulationResult.frames.at(-1);

    if (finalFrame !== undefined) {
      return {
        mathPosition: finalFrame.state.mathPosition,
        slope: finalFrame.state.slope,
        pose: input.simulationResult.outcome === 'success' ? 'success' : 'crash',
      };
    }
  }

  return {
    mathPosition: getPlatformAnchorPoints().start,
    slope: 0,
    pose: 'idle',
  };
}

function interpolateFrame(
  frames: SimulationFrame[],
  progress: number,
): { mathPosition: MathPoint; slope: number; motion: FrameMotion } {
  if (frames.length === 0) {
    return {
      mathPosition: getPlatformAnchorPoints().start,
      slope: 0,
      motion: 'drop',
    };
  }

  if (progress <= 0) {
    return frames[0].state;
  }

  if (progress >= 1) {
    return frames[frames.length - 1].state;
  }

  const nextFrameIndex = frames.findIndex((frame) => frame.progress >= progress);

  if (nextFrameIndex <= 0) {
    return frames[0].state;
  }

  const previousFrame = frames[nextFrameIndex - 1];
  const nextFrame = frames[nextFrameIndex];
  const segmentProgress =
    (progress - previousFrame.progress) / (nextFrame.progress - previousFrame.progress);

  return {
    mathPosition: {
      x:
        previousFrame.state.mathPosition.x +
        (nextFrame.state.mathPosition.x - previousFrame.state.mathPosition.x) *
          segmentProgress,
      y:
        previousFrame.state.mathPosition.y +
        (nextFrame.state.mathPosition.y - previousFrame.state.mathPosition.y) *
          segmentProgress,
    },
    slope:
      previousFrame.state.slope +
      (nextFrame.state.slope - previousFrame.state.slope) * segmentProgress,
    motion: previousFrame.state.motion,
  };
}

function mapMotionToPose(motion: FrameMotion): RiderPose {
  if (motion === 'drop') {
    return 'drop';
  }

  if (motion === 'crash') {
    return 'crash';
  }

  if (motion === 'jump') {
    return 'success';
  }

  return 'ride';
}

function createSceneMapper(input: {
  width: number;
  height: number;
  bounds: MathBounds;
}): ReturnType<typeof createCoordinateMapper> {
  const layout = getSceneLayout(input);

  return createCoordinateMapper({
    width: input.width,
    height: input.height,
    origin: {
      x: layout.leftMargin - input.bounds.xMin * layout.pixelsPerUnit,
      y: input.height - layout.bottomMargin + input.bounds.yMin * layout.pixelsPerUnit,
    },
    pixelsPerUnit: layout.pixelsPerUnit,
  });
}

export function getSceneLayout(input: {
  width: number;
  height: number;
  bounds: MathBounds;
}): {
  pixelsPerUnit: number;
  contentWidth: number;
  contentHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
} {
  const pixelsPerUnit = getPixelsPerUnit(input.width, input.height, input.bounds);
  const contentWidth = (input.bounds.xMax - input.bounds.xMin) * pixelsPerUnit;
  const contentHeight = (input.bounds.yMax - input.bounds.yMin) * pixelsPerUnit;
  const horizontalSlack = Math.max(0, input.width - contentWidth);
  const verticalSlack = Math.max(0, input.height - contentHeight);
  const leftMargin = horizontalSlack / 2;
  const rightMargin = horizontalSlack / 2;
  const topMargin = verticalSlack / 2;
  const bottomMargin = verticalSlack / 2;

  return {
    pixelsPerUnit,
    contentWidth,
    contentHeight,
    leftMargin,
    rightMargin,
    topMargin,
    bottomMargin,
  };
}

function getPixelsPerUnit(
  width: number,
  height: number,
  bounds: MathBounds,
): number {
  const horizontalScale = (width - CANVAS_PADDING * 2) / (bounds.xMax - bounds.xMin);
  const verticalScale = (height - CANVAS_PADDING * 2) / (bounds.yMax - bounds.yMin);

  return Math.min(horizontalScale, verticalScale);
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
