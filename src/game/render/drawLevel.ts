import { levelOneConfig } from '../config/levelOne';
import { createCoordinateMapper } from '../math/coordinates';
import { sampleParabolaPoints } from '../math/parabola';
import type { SimulationResult } from '../sim/types';

const CANVAS_PADDING = 40;
const RIDER_RADIUS = 9;

export function drawLevel(
  context: CanvasRenderingContext2D,
  input: {
    width: number;
    height: number;
    a: number;
    simulationResult: SimulationResult | null;
  },
): void {
  const { width, height, a, simulationResult } = input;
  const mapper = createCoordinateMapper({
    width,
    height,
    origin: {
      x: width / 2,
      y: height - CANVAS_PADDING,
    },
    pixelsPerUnit: getPixelsPerUnit(width, height),
  });

  context.clearRect(0, 0, width, height);

  drawBackdrop(context, width, height);
  drawGrid(context, width, height, mapper);
  drawGround(context, width, height, mapper);
  drawParabola(context, mapper, a);
  drawTargets(context, mapper);
  drawRider(context, mapper, simulationResult);
}

function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#fff8db');
  gradient.addColorStop(0.45, '#dbeafe');
  gradient.addColorStop(1, '#f8fafc');

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mapper: ReturnType<typeof createCoordinateMapper>,
): void {
  context.save();
  context.strokeStyle = 'rgba(71, 85, 105, 0.18)';
  context.lineWidth = 1;

  for (let x = Math.ceil(levelOneConfig.domain.xMin); x <= levelOneConfig.domain.xMax; x += 1) {
    const screenPoint = mapper.toScreen({ x, y: 0 });
    context.beginPath();
    context.moveTo(screenPoint.x, CANVAS_PADDING * 0.5);
    context.lineTo(screenPoint.x, height - CANVAS_PADDING * 0.3);
    context.stroke();
  }

  for (let y = 0; y <= 20; y += 2) {
    const screenPoint = mapper.toScreen({ x: 0, y });
    if (screenPoint.y < CANVAS_PADDING * 0.4) {
      continue;
    }

    context.beginPath();
    context.moveTo(CANVAS_PADDING * 0.6, screenPoint.y);
    context.lineTo(width - CANVAS_PADDING * 0.6, screenPoint.y);
    context.stroke();
  }

  context.restore();
}

function drawGround(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mapper: ReturnType<typeof createCoordinateMapper>,
): void {
  const leftEdge = mapper.toScreen({ x: levelOneConfig.domain.xMin, y: 0 }).x;
  const rightEdge = mapper.toScreen({ x: levelOneConfig.domain.xMax, y: 0 }).x;
  const gapLeft = mapper.toScreen({ x: -0.85, y: 0 }).x;
  const gapRight = mapper.toScreen({ x: 0.85, y: 0 }).x;
  const groundY = mapper.toScreen({ x: 0, y: 0 }).y;

  context.save();
  context.fillStyle = '#14532d';
  context.strokeStyle = '#166534';
  context.lineWidth = 6;

  context.beginPath();
  context.moveTo(leftEdge, groundY);
  context.lineTo(gapLeft, groundY);
  context.stroke();

  context.beginPath();
  context.moveTo(gapRight, groundY);
  context.lineTo(rightEdge, groundY);
  context.stroke();

  context.fillStyle = '#0f172a';
  context.fillRect(gapLeft, groundY - 4, gapRight - gapLeft, height - groundY + 8);
  context.restore();
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
  context.lineWidth = 4;
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

function drawTargets(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
): void {
  const startPoint = mapper.toScreen({ x: -2.5, y: levelOneConfig.slider.initial * 6.25 });
  const landingPoint = mapper.toScreen({ x: 2.5, y: levelOneConfig.slider.initial * 6.25 });

  context.save();
  context.fillStyle = '#f97316';

  [startPoint, landingPoint].forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 6, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}

function drawRider(
  context: CanvasRenderingContext2D,
  mapper: ReturnType<typeof createCoordinateMapper>,
  simulationResult: SimulationResult | null,
): void {
  const riderPoint =
    simulationResult?.frames[simulationResult.frames.length - 1]?.state.mathPosition ??
    {
      x: -2.5,
      y: simulationResult === null ? levelOneConfig.slider.initial * 6.25 : 0,
    };
  const screenPoint = mapper.toScreen(riderPoint);

  context.save();
  context.fillStyle = simulationResult?.outcome === 'success' ? '#16a34a' : '#0f172a';
  context.beginPath();
  context.arc(screenPoint.x, screenPoint.y, RIDER_RADIUS, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function getPixelsPerUnit(width: number, height: number): number {
  const horizontalScale =
    (width - CANVAS_PADDING * 2) /
    (levelOneConfig.domain.xMax - levelOneConfig.domain.xMin);
  const verticalScale = (height - CANVAS_PADDING * 2) / 22;

  return Math.min(horizontalScale, verticalScale);
}
