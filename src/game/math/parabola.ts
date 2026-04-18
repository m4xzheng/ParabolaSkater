import { levelOneConfig } from '../config/levelOne';

export type MathPoint = { x: number; y: number };

export type AValueClass = 'opens-down' | 'too-flat' | 'too-steep' | 'viable';

export function evaluateParabola(a: number, x: number): number {
  return a * x * x;
}

export function sampleParabolaPoints(input: {
  a: number;
  xMin: number;
  xMax: number;
  step: number;
}): MathPoint[] {
  const points: MathPoint[] = [];

  for (let x = input.xMin; x <= input.xMax + input.step / 2; x += input.step) {
    const roundedX = Number(x.toFixed(4));
    points.push({
      x: roundedX,
      y: evaluateParabola(input.a, roundedX),
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
