import { describe, expect, it } from 'vitest';
import {
  classifyAValue,
  evaluateParabola,
  sampleParabolaPoints,
} from './parabola';
import { createCoordinateMapper } from './coordinates';

describe('parabola math', () => {
  it('samples a y = ax^2 track across a domain', () => {
    const points = sampleParabolaPoints({
      a: 0.5,
      xMin: -4,
      xMax: 4,
      step: 2,
    });

    expect(points).toEqual([
      { x: -4, y: 8 },
      { x: -2, y: 2 },
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 4, y: 8 },
    ]);
  });

  it('classifies a values for teaching feedback', () => {
    expect(classifyAValue(-0.2)).toBe('opens-down');
    expect(classifyAValue(0.15)).toBe('too-flat');
    expect(classifyAValue(1.8)).toBe('too-steep');
    expect(classifyAValue(0.8)).toBe('viable');
  });

  it('maps cartesian coordinates into screen space', () => {
    const mapper = createCoordinateMapper({
      width: 800,
      height: 500,
      origin: { x: 400, y: 280 },
      pixelsPerUnit: 60,
    });

    expect(mapper.toScreen({ x: 2, y: 3 })).toEqual({ x: 520, y: 100 });
    expect(mapper.toMath({ x: 280, y: 340 })).toEqual({ x: -2, y: -1 });
  });

  it('evaluates y = ax^2 directly', () => {
    expect(evaluateParabola(0.75, -2)).toBe(3);
  });
});
