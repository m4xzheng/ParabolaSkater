import { describe, expect, it } from 'vitest';
import {
  classifyAValue,
  evaluateParabola,
  evaluateVertexParabola,
  getVertex,
  sampleParabolaPoints,
  sampleVertexParabolaPoints,
} from './parabola';
import { createCoordinateMapper } from './coordinates';
import { levelTwoConfig } from '../config/levelTwo';

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

  it('stops sampling at xMax when the step does not divide the range evenly', () => {
    const points = sampleParabolaPoints({
      a: 1,
      xMin: 0,
      xMax: 1,
      step: 0.3,
    });

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 0.3, y: 0.09 },
      { x: 0.6, y: 0.36 },
      { x: 0.9, y: 0.81 },
    ]);
  });

  it('rejects invalid sampling inputs', () => {
    expect(() =>
      sampleParabolaPoints({ a: 1, xMin: 0, xMax: 1, step: 0 }),
    ).toThrow(/step/i);
    expect(() =>
      sampleParabolaPoints({ a: Number.NaN, xMin: 0, xMax: 1, step: 0.5 }),
    ).toThrow(/finite/i);
  });

  it('classifies a values for teaching feedback', () => {
    expect(classifyAValue(-0.2)).toBe('opens-down');
    expect(classifyAValue(0.15)).toBe('too-flat');
    expect(classifyAValue(1.8)).toBe('too-steep');
    expect(classifyAValue(0.8)).toBe('viable');
  });

  it('treats threshold boundaries as viable', () => {
    expect(classifyAValue(0.25)).toBe('viable');
    expect(classifyAValue(1.35)).toBe('viable');
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

  it('round-trips coordinates through screen space', () => {
    const mapper = createCoordinateMapper({
      width: 800,
      height: 500,
      origin: { x: 400, y: 280 },
      pixelsPerUnit: 60,
    });

    expect(mapper.toMath(mapper.toScreen({ x: 1.25, y: -0.75 }))).toEqual({
      x: 1.25,
      y: -0.75,
    });
  });

  it('evaluates y = ax^2 directly', () => {
    expect(evaluateParabola(0.75, -2)).toBe(3);
  });

  it('evaluates vertex-form parabolas directly', () => {
    expect(
      evaluateVertexParabola({ a: 0.5, h: -1, k: 1.25 }, -3),
    ).toBe(3.25);
    expect(
      evaluateVertexParabola({ a: 0.5, h: -1, k: 1.25 }, -1),
    ).toBe(1.25);
  });

  it('gets the vertex from vertex-form parameters', () => {
    expect(getVertex({ a: 0.65, h: -1.1, k: 1.15 })).toEqual({
      x: -1.1,
      y: 1.15,
    });
  });

  it('keeps level two vertex and platform invariants aligned', () => {
    expect(getVertex(levelTwoConfig.targetParameters)).toEqual({
      x: levelTwoConfig.targetVertex.x,
      y: levelTwoConfig.targetVertex.y,
    });
    expect(
      evaluateVertexParabola(
        levelTwoConfig.targetParameters,
        levelTwoConfig.geometry.leftContactX,
      ),
    ).toBeCloseTo(levelTwoConfig.platforms.start.y);
    expect(
      evaluateVertexParabola(
        levelTwoConfig.targetParameters,
        levelTwoConfig.geometry.rightContactX,
      ),
    ).toBeCloseTo(levelTwoConfig.platforms.goal.y);
  });

  it('samples a vertex-form parabola across a domain', () => {
    expect(
      sampleVertexParabolaPoints({
        parameters: { a: 1, h: 1, k: -2 },
        xMin: -1,
        xMax: 3,
        step: 2,
      }),
    ).toEqual([
      { x: -1, y: 2 },
      { x: 1, y: -2 },
      { x: 3, y: 2 },
    ]);
  });

  it('rejects invalid vertex-form sampling inputs', () => {
    expect(() =>
      sampleVertexParabolaPoints({
        parameters: { a: Number.NaN, h: 0, k: 0 },
        xMin: -1,
        xMax: 1,
        step: 1,
      }),
    ).toThrow(/finite/i);
    expect(() =>
      sampleVertexParabolaPoints({
        parameters: { a: 1, h: 0, k: 0 },
        xMin: Number.NaN,
        xMax: 1,
        step: 1,
      }),
    ).toThrow(/finite/i);
    expect(() =>
      sampleVertexParabolaPoints({
        parameters: { a: 1, h: 0, k: 0 },
        xMin: -1,
        xMax: 1,
        step: 0,
      }),
    ).toThrow(/step/i);
  });
});
