import { levelOneConfig } from '../config/levelOne';

export type MathPoint = { x: number; y: number };

export type VertexParameters = { a: number; h: number; k: number };

export type AValueClass = 'opens-down' | 'too-flat' | 'too-steep' | 'viable';

export function evaluateParabola(a: number, x: number): number {
  return a * x * x;
}

export function evaluateVertexParabola(parameters: VertexParameters, x: number): number {
  return parameters.a * (x - parameters.h) * (x - parameters.h) + parameters.k;
}

export function getVertex(parameters: VertexParameters): MathPoint {
  return { x: parameters.h, y: parameters.k };
}

export function sampleParabolaPoints(input: {
  a: number;
  xMin: number;
  xMax: number;
  step: number;
}): MathPoint[] {
  if (
    !Number.isFinite(input.a) ||
    !Number.isFinite(input.xMin) ||
    !Number.isFinite(input.xMax) ||
    !Number.isFinite(input.step)
  ) {
    throw new TypeError('sampleParabolaPoints requires finite numeric inputs');
  }

  if (input.step <= 0) {
    throw new RangeError('sampleParabolaPoints requires step > 0');
  }

  const points: MathPoint[] = [];
  const span = input.xMax - input.xMin;
  const sampleCount = Math.max(0, Math.floor(span / input.step + 1e-12));

  for (let index = 0; index <= sampleCount; index += 1) {
    const x = Number((input.xMin + index * input.step).toFixed(4));
    points.push({
      x,
      y: evaluateParabola(input.a, x),
    });
  }

  return points;
}

export function sampleVertexParabolaPoints(input: {
  parameters: VertexParameters;
  xMin: number;
  xMax: number;
  step: number;
}): MathPoint[] {
  if (
    !Number.isFinite(input.parameters.a) ||
    !Number.isFinite(input.parameters.h) ||
    !Number.isFinite(input.parameters.k) ||
    !Number.isFinite(input.xMin) ||
    !Number.isFinite(input.xMax) ||
    !Number.isFinite(input.step)
  ) {
    throw new TypeError('sampleVertexParabolaPoints requires finite numeric inputs');
  }

  if (input.step <= 0) {
    throw new RangeError('sampleVertexParabolaPoints requires step > 0');
  }

  const points: MathPoint[] = [];
  const span = input.xMax - input.xMin;
  const sampleCount = Math.max(0, Math.floor(span / input.step + 1e-12));

  for (let index = 0; index <= sampleCount; index += 1) {
    const x = Number((input.xMin + index * input.step).toFixed(4));
    points.push({
      x,
      y: evaluateVertexParabola(input.parameters, x),
    });
  }

  return points;
}

export function classifyAValue(a: number): AValueClass {
  if (a < 0) {
    return 'opens-down';
  }

  if (a < levelOneConfig.thresholds.flatMax) {
    return 'too-flat';
  }

  if (a > levelOneConfig.thresholds.steepMin) {
    return 'too-steep';
  }

  return 'viable';
}
