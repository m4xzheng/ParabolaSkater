import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { runSimulation } from './runSimulation';

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
