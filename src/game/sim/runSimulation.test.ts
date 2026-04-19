import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import { evaluateVertexParabola } from '../math/parabola';
import { runLevelTwoSimulation, runSimulation } from './runSimulation';

describe('runSimulation', () => {
  it('starts from the fixed launch platform, lands on the track, and finishes on the fixed goal platform for a viable value', () => {
    const result = runSimulation({ a: 0.8 });

    expect(result.outcome).toBe('success');
    expect(result.messageKey).toBe('simulation.success');
    expect(result.frames[0]).toMatchObject({
      index: 0,
      progress: 0,
      state: {
        motion: 'drop',
        mathPosition: levelOneConfig.platforms.start,
        slope: 0,
      },
    });
    expect(result.frames.some((frame) => frame.state.motion === 'ride')).toBe(true);
    expect(result.frames.at(-1)).toMatchObject({
      index: result.frames.length - 1,
      progress: 1,
      state: {
        motion: 'jump',
        mathPosition: levelOneConfig.platforms.goal,
        slope: 0,
      },
    });
  });

  it('does not let an opens-down parabola reach the goal platform', () => {
    const result = runSimulation({ a: -0.2 });

    expect(result.outcome).toBe('opens-down');
    expect(result.messageKey).toBe('simulation.opens-down');
    expect(result.frames.some((frame) => frame.state.motion === 'ride')).toBe(true);
    expect(result.frames.at(-1)?.state.motion).toBe('crash');
    expect(result.frames.at(-1)?.state.mathPosition.x).toBeLessThan(
      levelOneConfig.platforms.goal.x - 0.5,
    );
  });

  it('treats missing the track after launch as a dedicated failure case', () => {
    const result = runSimulation({ a: 1.5 });

    expect(result.outcome).toBe('misses-track');
    expect(result.messageKey).toBe('simulation.misses-track');
    expect(result.frames.every((frame) => frame.state.motion !== 'ride')).toBe(true);
    expect(result.frames.at(-1)?.state.mathPosition.x).toBeCloseTo(
      levelOneConfig.platforms.start.x,
      4,
    );
  });

  it('classifies shallow upward parabolas as too-flat', () => {
    const result = runSimulation({
      a: levelOneConfig.thresholds.success.min - levelOneConfig.slider.step,
    });

    expect(result.outcome).toBe('too-flat');
    expect(result.messageKey).toBe('simulation.too-flat');
    expect(result.frames.at(-1)?.state.mathPosition.x).toBeLessThan(
      levelOneConfig.platforms.goal.x,
    );
  });

  it('classifies steep but reachable upward parabolas as too-steep', () => {
    const result = runSimulation({
      a: levelOneConfig.thresholds.success.max + levelOneConfig.slider.step,
    });

    expect(result.outcome).toBe('too-steep');
    expect(result.messageKey).toBe('simulation.too-steep');
    expect(result.frames.some((frame) => frame.state.motion === 'ride')).toBe(true);
    expect(result.frames.at(-1)?.state.mathPosition.x).toBeLessThanOrEqual(
      levelOneConfig.platforms.goal.x,
    );
  });

  it('rejects non-finite a inputs', () => {
    expect(() => runSimulation({ a: Number.NaN })).toThrow(/finite/i);
    expect(() => runSimulation({ a: Number.POSITIVE_INFINITY })).toThrow(/finite/i);
  });
});

describe('runLevelTwoSimulation', () => {
  it('succeeds for the target vertex parameters', () => {
    const result = runLevelTwoSimulation(levelTwoConfig.targetParameters);

    expect(result.levelId).toBe('level-two');
    expect(result.outcome).toBe('success');
    expect(result.messageKey).toBe('simulation.success');
    expect(result.summary).toBe('顶点已经进入目标圆，左右平台也对齐了。');
    expect(result.diagnostics).toEqual([]);
    expect(result.frames[0]).toMatchObject({
      index: 0,
      progress: 0,
      state: {
        motion: 'drop',
        mathPosition: levelTwoConfig.platforms.start,
        slope: 0,
      },
    });
    expect(result.frames.some((frame) => frame.state.motion === 'ride')).toBe(true);
    expect(result.frames.at(-1)).toMatchObject({
      index: result.frames.length - 1,
      progress: 1,
      state: {
        motion: 'jump',
        mathPosition: levelTwoConfig.platforms.goal,
        slope: 0,
      },
    });
  });

  it('allows a near-miss solution inside the relaxed vertex and platform tolerances', () => {
    const result = runLevelTwoSimulation({ a: 0.4, h: 1.7, k: 1.15 });

    expect(result.outcome).toBe('success');
    expect(result.diagnostics).toEqual([]);
  });

  it('returns steep, left-shifted, high diagnostics without exposing target values', () => {
    const result = runLevelTwoSimulation({ a: 1.15, h: -0.35, k: 1.85 });

    expect(result.outcome).toBe('level-two-diagnostics');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'a-too-steep', message: expect.stringContaining('陡') }),
        expect.objectContaining({ code: 'vertex-left', message: expect.stringContaining('左') }),
        expect.objectContaining({ code: 'vertex-above', message: expect.stringContaining('高') }),
        expect.objectContaining({
          code: 'left-contact-low',
          message: expect.stringContaining('低'),
        }),
        expect.objectContaining({
          code: 'right-contact-high',
          message: expect.stringContaining('高'),
        }),
      ]),
    );

    const diagnosticCopy = result.diagnostics.map((diagnostic) => diagnostic.message).join(' ');
    expect(diagnosticCopy).not.toContain(String(levelTwoConfig.targetParameters.a));
    expect(diagnosticCopy).not.toContain(String(levelTwoConfig.targetParameters.h));
    expect(diagnosticCopy).not.toContain(String(levelTwoConfig.targetParameters.k));
  });

  it('returns low diagnostics when the vertex sits too low under the right-side target', () => {
    const result = runLevelTwoSimulation({ a: 0.4, h: -1.1, k: 0.55 });

    expect(result.outcome).toBe('level-two-diagnostics');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'vertex-left', message: expect.stringContaining('左') }),
        expect.objectContaining({ code: 'vertex-below', message: expect.stringContaining('低') }),
        expect.objectContaining({
          code: 'left-contact-low',
          message: expect.stringContaining('低'),
        }),
        expect.objectContaining({
          code: 'right-contact-high',
          message: expect.stringContaining('高'),
        }),
      ]),
    );
  });

  it('keeps the crash segment moving forward from the ride endpoint on failing runs', () => {
    const result = runLevelTwoSimulation({ a: 1.15, h: -0.35, k: 1.85 });
    const lastRideIndex = result.frames.reduce(
      (lastIndex, frame, index) => (frame.state.motion === 'ride' ? index : lastIndex),
      -1,
    );
    const firstCrashIndex = result.frames.findIndex((frame) => frame.state.motion === 'crash');

    expect(result.outcome).toBe('level-two-diagnostics');
    expect(lastRideIndex).toBeGreaterThanOrEqual(0);
    expect(firstCrashIndex).toBeGreaterThan(lastRideIndex);

    const lastRideFrame = result.frames[lastRideIndex];
    const firstCrashFrame = result.frames[firstCrashIndex];

    expect(firstCrashFrame.state.mathPosition.x).toBeGreaterThanOrEqual(
      lastRideFrame.state.mathPosition.x,
    );
  });

  it('keeps negative-a diagnostics exclusive to opens-down', () => {
    const result = runLevelTwoSimulation({ a: -0.2, h: 1.4, k: 0.9 });

    expect(result.outcome).toBe('level-two-diagnostics');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'a-opens-down' })]),
    );
    expect(result.diagnostics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'a-too-flat' })]),
    );
  });

  it('rejects non-finite h and k inputs', () => {
    expect(() => runLevelTwoSimulation({ a: 0.55, h: Number.NaN, k: 0.9 })).toThrow(/finite/i);
    expect(() =>
      runLevelTwoSimulation({ a: 0.55, h: 1.4, k: Number.POSITIVE_INFINITY }),
    ).toThrow(/finite/i);
  });

  it('matches the platform heights at the configured contact points', () => {
    const leftY = evaluateVertexParabola(
      levelTwoConfig.targetParameters,
      levelTwoConfig.geometry.leftContactX,
    );
    const rightY = evaluateVertexParabola(
      levelTwoConfig.targetParameters,
      levelTwoConfig.geometry.rightContactX,
    );

    expect(leftY).toBeCloseTo(levelTwoConfig.platforms.start.y, 4);
    expect(rightY).toBeCloseTo(levelTwoConfig.platforms.goal.y, 4);
  });

  it('keeps the target parameters reachable within the level-two slider ranges', () => {
    expect(levelTwoConfig.targetParameters.a).toBeGreaterThanOrEqual(levelTwoConfig.sliders.a.min);
    expect(levelTwoConfig.targetParameters.a).toBeLessThanOrEqual(levelTwoConfig.sliders.a.max);
    expect(levelTwoConfig.targetParameters.h).toBeGreaterThanOrEqual(levelTwoConfig.sliders.h.min);
    expect(levelTwoConfig.targetParameters.h).toBeLessThanOrEqual(levelTwoConfig.sliders.h.max);
    expect(levelTwoConfig.targetParameters.k).toBeGreaterThanOrEqual(levelTwoConfig.sliders.k.min);
    expect(levelTwoConfig.targetParameters.k).toBeLessThanOrEqual(levelTwoConfig.sliders.k.max);
  });
});
